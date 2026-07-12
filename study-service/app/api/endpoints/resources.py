import os
import uuid
import shutil
import logging
from typing import List
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.resource import Resource, ResourceStatus
from app.schemas.resource import ResourceResponse, ResourceCreate
from app.schemas.common import SuccessResponse
from app.repositories import resource_repo, group_repo
from app.repositories.resource_repo import ResourceRepository
from app.repositories.group_repo import GroupRepository
from app.models.group import GroupRole
from app.core.config import settings
from app.services.indexing_service import request_index
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = settings.UPLOAD_PATH
os.makedirs(UPLOAD_DIR, exist_ok=True)

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
    new_filename = f"{file_uuid}{ext}"
    file_path = os.path.join(group_dir, new_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Save to database
    resource = Resource(
        group_id=group_id,
        uploaded_by=user_id,
        filename=new_filename,
        original_filename=file.filename,
        mime_type=file.content_type,
        size=file_size,
        storage_path=str(file_path),
        status=ResourceStatus.UPLOADED.value
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    
    # Trigger AI indexing in background
    request_index(background_tasks, resource.id, group_id, str(file_path))
    
    return {"success": True, "data": resource}


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


@router.delete("/{resource_id}")
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    resource = resource_repo.get_resource_by_id(db, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    group = group_repo.get_group_by_id(db, resource.group_id)
    if group.organizer_id != current_user["userId"] and resource.uploaded_by != current_user["userId"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this resource")
        
    # Delete file from disk
    file_path = Path(resource.storage_path)
    if file_path.exists():
        os.remove(file_path)
        
    db.delete(resource)
    db.commit()
    return {"success": True}

class StatusUpdateRequest(BaseModel):
    status: str

@router.put("/{resource_id}/status", response_model=ResourceResponse)
def update_resource_status(
    resource_id: int,
    request: StatusUpdateRequest,
    db: Session = Depends(get_db)
):
    resource = resource_repo.get_resource_by_id(db, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    valid_statuses = [s.value for s in ResourceStatus]
    if request.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    resource.status = request.status
    db.commit()
    db.refresh(resource)
    return resource
