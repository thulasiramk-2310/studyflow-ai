from pydantic import BaseModel
from typing import TypeVar, Generic, Any

T = TypeVar('T')

class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
