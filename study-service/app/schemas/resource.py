from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ResourceBase(BaseModel):
    filename: str
    original_filename: str
    mime_type: str
    size: int
    storage_path: str

class ResourceCreate(ResourceBase):
    pass

class ResourceResponse(ResourceBase):
    id: int
    group_id: int
    uploaded_by: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
