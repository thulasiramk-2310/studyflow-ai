import os
import uuid
import shutil
import logging
import PyPDF2
from typing import List
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.resource import Resource, ResourceStatus
from app.schemas.resource import ResourceResponse, ResourceCreate
from app.schemas.common import SuccessResponse
from app.repositories import resource_repo, group_repo
from app.models.group import GroupRole
from app.core.config import settings
from app.services.indexing_service import request_index
from app.services import notification_service
from app.models.notification import NotificationType
from pydantic import BaseModel
from app.services.storage import storage

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/upload", response_model=SuccessResponse[ResourceResponse], status_code=status.HTTP_201_CREATED)
def upload_resource(
    background_tasks: BackgroundTasks,
    group_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    
    # 1. Verify membership
    member = group_repo.get_member(db=db, group_id=group_id, user_id=user_id)
    if not member:
        raise HTTPException(status_code=403, detail="Only members can upload resources")
    
    # 2. Check supported file types precisely
    valid_extensions = {
        "application/pdf": ".pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
        "text/markdown": ".md"
    }
    
    ext = os.path.splitext(file.filename)[1].lower()
    if file.content_type not in valid_extensions or valid_extensions[file.content_type] != ext:
        raise HTTPException(status_code=400, detail="Unsupported file type or extension mismatch")

    # Save to memory/disk and check size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty")
        
    if file_size > 25 * 1024 * 1024:  # 25 MB max size
        raise HTTPException(status_code=400, detail="File exceeds maximum size of 25MB")
        
    # Check PDF integrity if it's a PDF
    if ext == ".pdf":
        try:
            reader = PyPDF2.PdfReader(file.file)
            if reader.is_encrypted:
                raise HTTPException(status_code=400, detail="Password-protected PDFs are not supported")
            _ = len(reader.pages) # Simple read check to verify corruption
        except PyPDF2.errors.PdfReadError:
            raise HTTPException(status_code=400, detail="PDF is corrupted or invalid")
        finally:
            file.file.seek(0)

    file_uuid = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    new_filename = f"{file_uuid}{ext}"
    key = f"groups/{group_id}/{new_filename}"
    
    file.file.seek(0)
    storage.upload(
        key=key, 
        content=file.file.read(), 
        content_type=file.content_type,
        metadata={"groupId": group_id, "originalFilename": file.filename}
    )
        
    # Save to database
    resource = Resource(
        group_id=group_id,
        uploaded_by=user_id,
        filename=new_filename,
        original_filename=file.filename,
        mime_type=file.content_type,
        size=file_size,
        storage_path=key,
        status=ResourceStatus.UPLOADED.value
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    
    # Trigger AI indexing in background
    request_index(background_tasks, resource.id, group_id, key, file.filename)
    
    # Notify group members
    notification_service.notify_group_members(
        db=db,
        group_id=group_id,
        title="New Resource Uploaded",
        message=f"{current_user.get('name', 'A user')} uploaded a new resource: {file.filename}",
        type=NotificationType.RESOURCE_UPLOADED,
        exclude_user_id=current_user.get("userId"),
        entity_type="RESOURCE",
        entity_id=resource.id
    )
    
    return {"success": True, "data": resource}


from app.clients import auth_client

@router.get("/", response_model=SuccessResponse[List[ResourceResponse]])
async def get_resources(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    member = group_repo.get_member(db=db, group_id=group_id, user_id=user_id)
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    resources = resource_repo.get_resources_by_group(db=db, group_id=group_id)
    
    # Fetch uploader names
    user_ids = list({r.uploaded_by for r in resources})
    users = await auth_client.get_users_batch(user_ids)
    user_map = {u["id"]: u["name"] for u in users}
    
    # Hydrate resources with uploader name
    hydrated_resources = []
    for r in resources:
        r_dict = {c.name: getattr(r, c.name) for c in r.__table__.columns}
        r_dict["uploader_name"] = user_map.get(r.uploaded_by, f"User {r.uploaded_by}")
        hydrated_resources.append(r_dict)
        
    return {"success": True, "data": hydrated_resources}

@router.get("/{resource_id}", response_model=SuccessResponse[ResourceResponse])
async def get_resource(
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
        
    # Hydrate uploader name
    users = await auth_client.get_users_batch([resource.uploaded_by])
    uploader_name = users[0]["name"] if users else f"User {resource.uploaded_by}"
    
    r_dict = {c.name: getattr(resource, c.name) for c in resource.__table__.columns}
    r_dict["uploader_name"] = uploader_name
    
    return {"success": True, "data": r_dict}


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
        
    if not storage.exists(resource.storage_path):
        raise HTTPException(status_code=404, detail="File missing on server")
        
    url = storage.get_download_url(resource.storage_path)
    if url.startswith("http"):
        return RedirectResponse(url=url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)
    else:
        return FileResponse(
            path=url, 
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
    if group.created_by != current_user["userId"] and resource.uploaded_by != current_user["userId"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this resource")
        
    user_id = current_user.get("userId")
    member = group_repo.get_member(db=db, group_id=resource.group_id, user_id=user_id)
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    # Delete file from storage
    storage.delete(resource.storage_path)
        
    db.delete(resource)
    db.commit()
    
    # Notify group members
    notification_service.notify_group_members(
        db=db,
        group_id=resource.group_id,
        title="Resource Deleted",
        message=f"'{resource.original_filename}' was deleted.",
        type=NotificationType.RESOURCE_DELETED,
        exclude_user_id=current_user["userId"],
        entity_type="GROUP",
        entity_id=resource.group_id
    )
    
    return {"success": True}

class StatusUpdateRequest(BaseModel):
    status: str

@router.put("/{resource_id}/status", response_model=ResourceResponse)
def update_resource_status(
    resource_id: int,
    request: StatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    resource = resource_repo.get_resource_by_id(db, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    user_id = current_user.get("userId")
    member = group_repo.get_member(db=db, group_id=resource.group_id, user_id=user_id)
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    valid_statuses = [s.value for s in ResourceStatus]
    if request.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    resource.status = request.status
    db.commit()
    db.refresh(resource)
    return resource
