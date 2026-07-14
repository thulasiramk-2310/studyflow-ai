from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from app.models.group import GroupRole

class GroupMemberBase(BaseModel):
    user_id: int
    role: GroupRole

    class Config:
        from_attributes = True
    
class GroupMemberResponse(GroupMemberBase):
    id: int
    group_id: int
    joined_at: datetime
    name: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None
    
    class Config:
        from_attributes = True

class StudyGroupBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None

    @field_validator('name')
    @classmethod
    def name_must_not_be_empty_and_strip(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError('Name must be at least 2 characters after stripping whitespace')
        return v

class StudyGroupCreate(StudyGroupBase):
    pass

class StudyGroupUpdate(StudyGroupBase):
    pass

class StudyGroupResponse(StudyGroupBase):
    id: int
    invite_code: str
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    members: List[GroupMemberBase]
    
    class Config:
        from_attributes = True

class StudyGroupDetailResponse(StudyGroupResponse):
    members: List[GroupMemberResponse] = []

class JoinGroupRequest(BaseModel):
    inviteCode: str
