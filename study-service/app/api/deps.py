import logging

from fastapi import Request, HTTPException, status
import jwt
from app.core.config import settings

logger = logging.getLogger(__name__)

# Tokens are issued by auth-service; allow for small clock differences between
# containers so a token used in the same second it was issued is not rejected.
CLOCK_SKEW_LEEWAY_SECONDS = 10

def get_current_user(request: Request):
    token = request.cookies.get("jwt")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS512"], leeway=CLOCK_SKEW_LEEWAY_SECONDS)
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
    except jwt.InvalidTokenError as e:
        logger.warning("Rejected token: %s: %s", type(e).__name__, e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
