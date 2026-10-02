from datetime import datetime, timezone
from typing import Annotated, Any, Generic, TypeVar

from pydantic import AfterValidator, BaseModel


def _assume_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


# Columns filled with datetime.utcnow() come back naive. Mark them as UTC so the
# JSON carries an offset; otherwise browsers read them as local time.
UTCDateTime = Annotated[datetime, AfterValidator(_assume_utc)]

T = TypeVar('T')

class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
