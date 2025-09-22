# backend/core/security.py
import os
import hashlib
import uuid
from datetime import datetime, timedelta, timezone
import jwt
from passlib.hash import argon2

# Configuration from environment
JWT_SECRET = os.getenv("JWT_SECRET", "dev_secret_change_in_production")
JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET", "dev_refresh_change_in_production")
ACCESS_TTL_MIN = int(os.getenv("ACCESS_TTL_MIN", "15"))
REFRESH_TTL_DAYS = int(os.getenv("REFRESH_TTL_DAYS", "14"))

# Password hashing
def hash_password(password: str) -> str:
    """Hash password using Argon2"""
    return argon2.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    try:
        return argon2.verify(password, password_hash)
    except Exception:
        return False

# JWT token creation
def _jwt(now: datetime, ttl: timedelta, secret: str, subject: str, extra: dict = None) -> str:
    """Create JWT token"""
    payload = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + ttl).timestamp())
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, secret, algorithm="HS256")

def create_access_token(user_id: str, email: str, roles: list = None) -> str:
    """Create access token (short-lived)"""
    now = datetime.now(tz=timezone.utc)
    return _jwt(
        now, 
        timedelta(minutes=ACCESS_TTL_MIN), 
        JWT_SECRET, 
        user_id, 
        {"email": email, "roles": roles or []}
    )

def create_refresh_token(user_id: str) -> tuple[str, dict]:
    """Create refresh token with rotation support"""
    now = datetime.now(tz=timezone.utc)
    jti = str(uuid.uuid4())
    ttl = timedelta(days=REFRESH_TTL_DAYS)
    payload_extra = {"typ": "refresh", "jti": jti}
    token = _jwt(now, ttl, JWT_REFRESH_SECRET, user_id, payload_extra)
    decoded = {"jti": jti, "exp": int((now + ttl).timestamp())}
    return token, decoded

def create_email_token(user_id: str, purpose: str, minutes: int = 30) -> str:
    """Create email verification/reset token"""
    now = datetime.now(tz=timezone.utc)
    return _jwt(
        now, 
        timedelta(minutes=minutes), 
        JWT_SECRET, 
        user_id, 
        {"typ": purpose}
    )

# JWT token verification
def verify_access(token: str) -> dict:
    """Verify access token"""
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

def verify_refresh(token: str) -> dict:
    """Verify refresh token"""
    return jwt.decode(token, JWT_REFRESH_SECRET, algorithms=["HS256"])

def verify_email_token(token: str, expected_purpose: str) -> dict:
    """Verify email token"""
    payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    if payload.get("typ") != expected_purpose:
        raise jwt.InvalidTokenError("Wrong token purpose")
    return payload

# Refresh token hashing for rotation
def _sha256(s: str) -> str:
    """Create SHA256 hash"""
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def hash_refresh(token: str) -> str:
    """Hash refresh token for storage"""
    return _sha256(token)
