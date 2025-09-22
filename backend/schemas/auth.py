# backend/schemas/auth.py
from pydantic import BaseModel, EmailStr
from typing import Literal, Optional

# Registration schemas
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    role: Literal["admin", "user"] = "user"

class RegisterOut(BaseModel):
    ok: bool
    user_id: str
    message: str = "User registered successfully"

# Login schemas
class LoginIn(BaseModel):
    email: EmailStr
    password: str

class LoginOut(BaseModel):
    access_token: Optional[str] = None
    token_type: str = "bearer"
    mfa_required: bool = False
    challenge_id: Optional[str] = None
    user: Optional[dict] = None

# MFA schemas
class MfaVerifyIn(BaseModel):
    challenge_id: str
    code: str

class MfaSetupOut(BaseModel):
    otpauth_url: str
    qr_png_base64: str
    secret: str

class MfaSetupIn(BaseModel):
    code: str

# Token refresh schemas
class RefreshOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Email verification schemas
class EmailTokenIn(BaseModel):
    token: str

class EmailVerifyRequestOut(BaseModel):
    ok: bool
    message: str = "Verification email sent"

# Password reset schemas
class ForgotPasswordIn(BaseModel):
    email: EmailStr

class ForgotPasswordOut(BaseModel):
    ok: bool
    message: str = "Password reset email sent"

class ResetPasswordIn(BaseModel):
    token: str
    new_password: str

class ResetPasswordOut(BaseModel):
    ok: bool
    message: str = "Password reset successfully"

# User profile schemas
class UserProfileOut(BaseModel):
    id: str
    email: str
    is_email_verified: bool
    roles: list[str]
    mfa_enabled: bool
    created_at: str

# Logout schema
class LogoutOut(BaseModel):
    ok: bool
    message: str = "Logged out successfully"
