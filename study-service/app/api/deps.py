from fastapi import Request, HTTPException, status
import jwt
from app.core.config import settings

def get_current_user(request: Request):
    token = request.cookies.get("jwt")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS512"])
        user_id: int = payload.get("userId")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token does not contain userId",
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
