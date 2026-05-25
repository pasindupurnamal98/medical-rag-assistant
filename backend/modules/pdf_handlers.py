import os
import shutil
from fastapi import UploadFile
import tempfile

UPLOAD_DIR = "./uploaded_docs"

def save_uploaded_files(uploaded_files: list[UploadFile]) -> list[str]:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    saved_file_paths = []

    for file in uploaded_files:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        saved_file_paths.append(file_path)

    return saved_file_paths