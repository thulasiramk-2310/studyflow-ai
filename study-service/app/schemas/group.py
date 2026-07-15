from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from app.models.group import GroupRole, LearningPlanItemStatus

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
    goal: Optional[str] = None

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
    
    progress_percent: int = 0
    completed_items_count: int = 0
    total_items_count: int = 0
    
    class Config:
        from_attributes = True

class LearningPlanItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    parent_id: Optional[int] = None
    estimated_sessions: Optional[int] = None

class LearningPlanItemCreate(LearningPlanItemBase):
    pass

class LearningPlanItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[LearningPlanItemStatus] = None
    estimated_sessions: Optional[int] = None

class LearningPlanReorderRequestItem(BaseModel):
    id: int
    order: int

class LearningPlanItemResponse(LearningPlanItemBase):
    id: int
    group_id: int
    order_index: int
    status: LearningPlanItemStatus
    is_ai_generated: bool
    created_by: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StudyGroupDetailResponse(StudyGroupResponse):
    members: List[GroupMemberResponse] = []
    learning_plan: List[LearningPlanItemResponse] = []
    next_item: Optional[LearningPlanItemResponse] = None

class JoinGroupRequest(BaseModel):
    inviteCode: str
