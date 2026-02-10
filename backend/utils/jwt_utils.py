"""
JWT token generation and validation utilities.
"""
import os
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

# Secret key for JWT signing - should be set via environment variable in production
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "change-me-in-prod-jwt-secret")
ALGORITHM = "HS256"
# Token expires in 24 hours
TOKEN_EXPIRATION_HOURS = 24


def generate_token(user_id: int, username: str) -> str:
    """
    Generate a JWT token for a user.
    
    Args:
        user_id: User's database ID
        username: User's username
        
    Returns:
        JWT token string
    """
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded payload dict if valid, None if invalid/expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        # Token has expired
        return None
    except jwt.InvalidTokenError:
        # Token is invalid
        return None


def extract_token_from_header(auth_header: Optional[str]) -> Optional[str]:
    """
    Extract JWT token from Authorization header.
    
    Args:
        auth_header: Authorization header value (e.g., "Bearer <token>")
        
    Returns:
        Token string if valid format, None otherwise
    """
    if not auth_header:
        return None
    
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    return parts[1]
