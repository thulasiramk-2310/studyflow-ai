import os
import uuid
import shutil
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.resource import ResourceResponse, ResourceCreate
from app.schemas.common import SuccessResponse
from app.repositories import resource_repo, group_repo
from app.models.group import GroupRole
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = settings.UPLOAD_PATH
os.makedirs(UPLOAD_DIR, exist_ok=True)

def index_document_task(file_path: str, resource_id: int):
    """
    Placeholder task for Document Indexing Workflow (RAG)
    This will eventually run Document Loader -> Chunking -> Embedding -> FAISS.
    """
    logger.info(f"[RAG Background Task] Started indexing for resource {resource_id}")
    logger.info(f"[RAG Background Task] Loading file from {file_path}")
    logger.info(f"[RAG Background Task] Chunking and embedding mock vectors...")
    logger.info(f"[RAG Background Task] Stored in FAISS index.")
    logger.info(f"[RAG Background Task] Completed indexing for resource {resource_id}")


@router.post("/upload", response_model=SuccessResponse[ResourceResponse], status_code=status.HTTP_201_CREATED)
def upload_resource(
    background_tasks: BackgroundTasks,
    group_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    
    # 1. Verify membership and ORGANIZER role
    member = group_repo.get_member(db=db, group_id=group_id, user_id=user_id)
    if not member or member.role != GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Only organizers can upload resources")
    
    # 2. Check supported file types
    allowed_types = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "text/markdown"]
    if file.content_type not in allowed_types and not file.filename.endswith((".pdf", ".docx", ".pptx", ".md")):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    # Save to memory/disk and check size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum size of {settings.MAX_FILE_SIZE} bytes")

    # 3. Save to local filesystem
    group_dir = os.path.join(UPLOAD_DIR, str(group_id))
    os.makedirs(group_dir, exist_ok=True)
    
    file_uuid = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{file_uuid}{ext}"
    file_path = os.path.join(group_dir, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 4. Save metadata to DB
    resource_in = ResourceCreate(
        filename=safe_filename,
        original_filename=file.filename,
        mime_type=file.content_type,
        size=file_size,
        storage_path=file_path
    )
    db_resource = resource_repo.create_resource(db=db, resource_in=resource_in, group_id=group_id, user_id=user_id)
    
    # 5. Trigger background task for RAG indexing
    background_tasks.add_task(index_document_task, file_path, db_resource.id)
    
    return {"success": True, "data": db_resource}


@router.get("/", response_model=SuccessResponse[List[ResourceResponse]])
def get_resources(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    member = group_repo.get_member(db=db, group_id=group_id, user_id=user_id)
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    return {"success": True, "data": resource_repo.get_resources_by_group(db=db, group_id=group_id)}


@router.get("/{resource_id}", response_model=SuccessResponse[ResourceResponse])
def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    resource = resource_repo.get_resource_by_id(db=db, resource_id=resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    member = group_repo.get_member(db=db, group_id=resource.group_id, user_id=user_id)
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    return {"success": True, "data": resource}


@router.get("/download/{resource_id}")
def download_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    resource = resource_repo.get_resource_by_id(db=db, resource_id=resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    member = group_repo.get_member(db=db, group_id=resource.group_id, user_id=user_id)
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    if not os.path.exists(resource.storage_path):
        raise HTTPException(status_code=404, detail="File missing on server")
        
    return FileResponse(
        path=resource.storage_path, 
        filename=resource.original_filename,
        media_type=resource.mime_type
    )


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    resource = resource_repo.get_resource_by_id(db=db, resource_id=resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    member = group_repo.get_member(db=db, group_id=resource.group_id, user_id=user_id)
    # Only organizer can delete
    if not member or member.role != GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Only organizers can delete resources")
        
    # Delete from filesystem
    if os.path.exists(resource.storage_path):
        os.remove(resource.storage_path)
        
    # Delete from DB
    resource_repo.delete_resource(db=db, db_resource=resource)
    return None
