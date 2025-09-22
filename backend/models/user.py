# backend/models/user.py
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr

class UserInDB(BaseModel):
    """User model for MongoDB storage"""
    id: str | None = None
    email: EmailStr
    password_hash: str
    is_email_verified: bool = False
    roles: List[str] = Field(default_factory=lambda: ["user"])
    mfa: dict = Field(default_factory=lambda: {
        "enabled": False, 
        "type": None, 
        "secret": None, 
        "phone_e164": None
    })
    refresh_token_hash: Optional[str] = None
    refresh_token_exp: Optional[int] = None
    refresh_jti: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserPublic(BaseModel):
    """Public user model (without sensitive data)"""
    id: str
    email: str
    is_email_verified: bool
    roles: List[str]
    mfa_enabled: bool
    created_at: datetime

    @classmethod
    def from_user_db(cls, user_db: dict) -> "UserPublic":
        """Create UserPublic from UserInDB"""
        return cls(
            id=str(user_db["_id"]),
            email=user_db["email"],
            is_email_verified=user_db.get("is_email_verified", False),
            roles=user_db.get("roles", ["user"]),
            mfa_enabled=user_db.get("mfa", {}).get("enabled", False),
            created_at=user_db.get("created_at", datetime.utcnow())
        )
