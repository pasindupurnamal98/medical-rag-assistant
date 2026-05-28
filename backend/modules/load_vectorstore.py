import os
import time
from pathlib import Path
from dotenv import load_dotenv
from tqdm.auto import tqdm
from pinecone import Pinecone, ServerlessSpec
from langchain_community.document_loaders import PyPDFLoader
# from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

GOOGLE_API_KEY=os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY=os.getenv("PINECONE_API_KEY")
PINECONE_ENV="us-east-1"
PINECONE_INDEX_NAME="medicalindex"

os.environ["GOOGLE_API_KEY"]=GOOGLE_API_KEY

UPLOAD_DIR = Path("./uploaded_docs")
os.makedirs(UPLOAD_DIR, exist_ok=True)

#initialize Pinecone
pc=Pinecone(api_key=PINECONE_API_KEY)
spec=ServerlessSpec(cloud="aws", region=PINECONE_ENV)
existing_indexes=[i["name"] for i in pc.list_indexes()]

# create index if not exists
if PINECONE_INDEX_NAME not in existing_indexes:
    pc.create_index(
        name=PINECONE_INDEX_NAME, 
        dimension=768, 
        metric="cosine", #dotproduct or euclidean
        spec=spec
    )

    while not pc.describe_index(PINECONE_INDEX_NAME).status["ready"]:
        time.sleep(1)
# ✅ ALWAYS define index (outside)
index=pc.Index(PINECONE_INDEX_NAME)

    #load,split and embed documents

# ✅ ✅ MOVE FUNCTION OUTSIDE (IMPORTANT)
def load_vectorstore(uploaded_files):

    #embed_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    embed_model = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001",
    output_dimensionality=768
    )
    file_paths = []

    # 1. Upload files
    for file in uploaded_files:
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        file_paths.append(file_path)

    # 2. Process files (FIXED BUG HERE)
    for file_path in file_paths:
        loader = PyPDFLoader(file_path)
        documents = loader.load()

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=100
        )
        chunks = splitter.split_documents(documents)

        texts = [chunk.page_content for chunk in chunks]
        #metadatas = [chunk.metadata for chunk in chunks]
        metadatas = [
            {**chunk.metadata, "source": str(file_path), "text": chunk.page_content}  # ✅ Include text content in metadata
            for chunk in chunks
        ]
        ids = [f"{file_path.stem}.{i}" for i in range(len(chunks))]

        print("Embedding chunks...")
        embeddings = embed_model.embed_documents(texts)

        print("Upserting embeddings...")
        with tqdm(total=len(embeddings)) as progress:
            index.upsert(vectors=list(zip(ids, embeddings, metadatas)))
            progress.update(len(embeddings))

        print(f"Upload complete for {file_path.name}")

