from fastapi import APIRouter, UploadFile, File
from typing import List
from modules.load_vectorstore import load_vectorstore
from fastapi.responses import JSONResponse
from logger import logger
from pathlib import Path
import os


router=APIRouter()

UPLOAD_DIR = Path("./uploaded_docs")

@router.post("/upload_pdfs/")
async def upload_pdfs(files:List[UploadFile] = File(...)):
    try:
        logger.info("Recieved uploaded files")
        load_vectorstore(files)
        logger.info("Document added to vectorstore")
        #return {"messages":"Files processed and vectorstore updated"}
        return {
            "uploaded_files":[file.filename for file in files]
        }
    except Exception as e:
        logger.exception("Error during PDF upload")
        return JSONResponse(status_code=500,content={"error":str(e)})

@router.get("/list_documents/")
async def list_documents():
    """Get list of all uploaded PDF documents"""
    try:
        if not UPLOAD_DIR.exists():
            return {"documents": []}
        
        # Get all PDF files from uploaded_docs folder
        pdf_files = [f.name for f in UPLOAD_DIR.glob("*.pdf")]
        pdf_files.sort()  # Sort alphabetically
        
        return {"documents": pdf_files}
    except Exception as e:
        logger.exception("Error listing documents")
        return JSONResponse(status_code=500, content={"error": str(e)})