# backend/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from urllib.parse import urlencode
import os
import pyotp
import qrcode
import io
from base64 import b64encode
from datetime import datetime
from bson import ObjectId

from backend.schemas.auth import (
    RegisterIn, RegisterOut, LoginIn, LoginOut, MfaVerifyIn, MfaSetupOut, 
    MfaSetupIn, RefreshOut, EmailTokenIn, EmailVerifyRequestOut,
    ForgotPasswordIn, ForgotPasswordOut, ResetPasswordIn, ResetPasswordOut,
    UserProfileOut, LogoutOut
)
from backend.core.security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    verify_refresh, create_email_token, verify_email_token, hash_refresh
)
from backend.core.email import get_email_service, get_verification_email_template, get_password_reset_email_template
from backend.models.user import UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])

# Cookie settings
COOKIE_NAME = "refresh_token"
COOKIE_SETTINGS = {
    "httponly": True,
    "secure": os.getenv("COOKIE_SECURE", "false").lower() == "true",  # False for local dev
    "samesite": "lax",
    "path": "/auth",
}

APP_URL = os.getenv("APP_URL", "http://localhost:3000")
APP_NAME = os.getenv("APP_NAME", "AI Learning Platform")

def _users():
    """Get users collection"""
    from backend.db import database
    return database["users"]

def _oid(user_id):
    """Coerce a user id (typically a string from a JWT `sub` claim) into the
    value stored as `_id` in MongoDB. Documents inserted by this router use an
    auto-generated ObjectId, so string ids must be converted before querying."""
    if isinstance(user_id, ObjectId):
        return user_id
    return ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id

# Registration
@router.post("/register", response_model=RegisterOut)
async def register(data: RegisterIn):
    """Register a new user"""
    email = data.email.lower()
    
    # Check if user already exists
    if await _users().find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Self-registration must never grant elevated privileges. Any client-supplied
    # role is ignored and every new account is created as a plain "user".
    # Admin roles must be assigned out-of-band (trusted admin tooling / DB).
    role = "user"
    
    # Create user document
    user_doc = {
        "email": email,
        "password_hash": hash_password(data.password),
        "is_email_verified": False,
        "roles": [role],
        "mfa": {"enabled": False, "type": None, "secret": None, "phone_e164": None},
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    # Create unique index on email (ignore if already exists)
    try:
        await _users().create_index("email", unique=True)
    except Exception:
        pass  # Index already exists
    
    result = await _users().insert_one(user_doc)
    
    # Send verification email
    token = create_email_token(str(result.inserted_id), "verify-email", minutes=60)
    link = f"{APP_URL}/verify-email?{urlencode({'token': token})}"
    
    email_service = get_email_service()
    text, html = get_verification_email_template(link, APP_NAME)
    email_service.send(email, "Verify your email", html=html, text=text)
    
    return RegisterOut(
        ok=True,
        user_id=str(result.inserted_id),
        message="User registered successfully. Please check your email to verify your account."
    )

# Login
@router.post("/login", response_model=LoginOut)
async def login(data: LoginIn, response: Response):
    """Login user"""
    user = await _users().find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # Check if MFA is enabled
    if user.get("mfa", {}).get("enabled"):
        challenge_id = str(user["_id"])
        return LoginOut(mfa_required=True, challenge_id=challenge_id)
    
    # Create tokens
    access = create_access_token(str(user["_id"]), user["email"], user.get("roles", []))
    refresh, meta = create_refresh_token(str(user["_id"]))
    
    # Store refresh token hash in database
    await _users().update_one(
        {"_id": user["_id"]},
        {"$set": {
            "refresh_token_hash": hash_refresh(refresh),
            "refresh_token_exp": meta["exp"],
            "refresh_jti": meta["jti"]
        }}
    )
    
    # Set refresh token cookie
    response.set_cookie(COOKIE_NAME, refresh, **COOKIE_SETTINGS)
    
    # Return user info (without sensitive data)
    user_public = UserPublic.from_user_db(user)
    
    return LoginOut(
        access_token=access,
        user=user_public.dict()
    )

# MFA Setup
@router.post("/mfa/setup", response_model=MfaSetupOut)
async def mfa_setup(request: Request):
    """Setup MFA for user"""
    # Get user from Authorization header (simplified for demo)
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = auth_header.split(" ")[1]
    from backend.core.security import verify_access
    payload = verify_access(token)
    user_id = payload["sub"]
    
    user = await _users().find_one({"_id": _oid(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Generate TOTP secret
    secret = pyotp.random_base32()
    label = f"{APP_NAME}:{user['email']}"
    otpauth_url = pyotp.totp.TOTP(secret).provisioning_uri(name=label, issuer_name=APP_NAME)
    
    # Generate QR code
    img = qrcode.make(otpauth_url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_b64 = b64encode(buf.getvalue()).decode()
    
    # Store secret (but don't enable MFA yet)
    await _users().update_one(
        {"_id": user["_id"]},
        {"$set": {"mfa.secret": secret, "mfa.type": "totp"}}
    )
    
    return MfaSetupOut(
        otpauth_url=otpauth_url,
        qr_png_base64=qr_b64,
        secret=secret
    )

# MFA Verify
@router.post("/mfa/verify", response_model=LoginOut)
async def mfa_verify(data: MfaVerifyIn, response: Response):
    """Verify MFA code"""
    user = await _users().find_one({"_id": _oid(data.challenge_id)})
    if not user or not user.get("mfa", {}).get("secret"):
        raise HTTPException(status_code=400, detail="Invalid challenge")
    
    # Verify TOTP code
    totp = pyotp.TOTP(user["mfa"]["secret"])
    if not totp.verify(data.code, valid_window=1):
        raise HTTPException(status_code=401, detail="Invalid code")
    
    # Enable MFA and create tokens
    await _users().update_one(
        {"_id": user["_id"]},
        {"$set": {"mfa.enabled": True}}
    )
    
    access = create_access_token(str(user["_id"]), user["email"], user.get("roles", []))
    refresh, meta = create_refresh_token(str(user["_id"]))
    
    # Store refresh token hash
    await _users().update_one(
        {"_id": user["_id"]},
        {"$set": {
            "refresh_token_hash": hash_refresh(refresh),
            "refresh_token_exp": meta["exp"],
            "refresh_jti": meta["jti"]
        }}
    )
    
    response.set_cookie(COOKIE_NAME, refresh, **COOKIE_SETTINGS)
    
    user_public = UserPublic.from_user_db(user)
    
    return LoginOut(
        access_token=access,
        user=user_public.dict()
    )

# Token Refresh
@router.post("/refresh", response_model=RefreshOut)
async def refresh(request: Request, response: Response):
    """Refresh access token"""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    
    try:
        payload = verify_refresh(token)
        user_id = payload["sub"]
        jti = payload.get("jti")
        
        user = await _users().find_one({"_id": _oid(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Check stored hash/jti match (prevents reuse)
        if (user.get("refresh_token_hash") != hash_refresh(token) or 
            user.get("refresh_jti") != jti):
            # Revoke everything if mismatch (token reuse detected)
            await _users().update_one(
                {"_id": user["_id"]},
                {"$unset": {"refresh_token_hash": "", "refresh_jti": "", "refresh_token_exp": ""}}
            )
            raise HTTPException(status_code=401, detail="Refresh token invalidated")
        
        # Rotate refresh token
        new_refresh, meta = create_refresh_token(user_id)
        await _users().update_one(
            {"_id": user["_id"]},
            {"$set": {
                "refresh_token_hash": hash_refresh(new_refresh),
                "refresh_token_exp": meta["exp"],
                "refresh_jti": meta["jti"]
            }}
        )
        
        response.set_cookie(COOKIE_NAME, new_refresh, **COOKIE_SETTINGS)
        access = create_access_token(user_id, user["email"], user.get("roles", []))
        
        return RefreshOut(access_token=access)
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token refresh failed: {str(e)}")

# Email Verification
@router.post("/verify-email/request", response_model=EmailVerifyRequestOut)
async def request_email_verify(request: Request):
    """Request email verification"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = auth_header.split(" ")[1]
    from backend.core.security import verify_access
    payload = verify_access(token)
    user_id = payload["sub"]
    
    user = await _users().find_one({"_id": _oid(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    token = create_email_token(str(user["_id"]), "verify-email", minutes=60)
    link = f"{APP_URL}/verify-email?{urlencode({'token': token})}"
    
    email_service = get_email_service()
    text, html = get_verification_email_template(link, APP_NAME)
    email_service.send(user["email"], "Verify your email", html=html, text=text)
    
    return EmailVerifyRequestOut(ok=True, message="Verification email sent")

@router.post("/verify-email/confirm")
async def confirm_email_verify(data: EmailTokenIn):
    """Confirm email verification"""
    try:
        payload = verify_email_token(data.token, "verify-email")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    user_id = payload["sub"]
    await _users().update_one(
        {"_id": _oid(user_id)},
        {"$set": {"is_email_verified": True}}
    )
    
    return {"ok": True, "message": "Email verified successfully"}

# Password Reset
@router.post("/password/forgot", response_model=ForgotPasswordOut)
async def password_forgot(data: ForgotPasswordIn):
    """Request password reset"""
    user = await _users().find_one({"email": data.email.lower()})
    # Always return ok (avoid user enumeration)
    if user:
        token = create_email_token(str(user["_id"]), "reset-password", minutes=30)
        link = f"{APP_URL}/reset-password?{urlencode({'token': token})}"
        
        email_service = get_email_service()
        text, html = get_password_reset_email_template(link, APP_NAME)
        email_service.send(data.email, "Reset your password", html=html, text=text)
    
    return ForgotPasswordOut(ok=True, message="Password reset email sent")

@router.post("/password/reset", response_model=ResetPasswordOut)
async def password_reset(data: ResetPasswordIn):
    """Reset password"""
    try:
        payload = verify_email_token(data.token, "reset-password")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    user_id = payload["sub"]
    new_hash = hash_password(data.new_password)
    await _users().update_one(
        {"_id": _oid(user_id)},
        {"$set": {"password_hash": new_hash}}
    )
    
    return ResetPasswordOut(ok=True, message="Password reset successfully")

# User Profile
@router.get("/me", response_model=UserProfileOut)
async def get_user_profile(request: Request):
    """Get current user profile"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = auth_header.split(" ")[1]
    from backend.core.security import verify_access
    payload = verify_access(token)
    user_id = payload["sub"]
    
    user = await _users().find_one({"_id": _oid(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    user_public = UserPublic.from_user_db(user)
    return user_public

# Logout
@router.post("/logout", response_model=LogoutOut)
async def logout(response: Response, request: Request):
    """Logout user"""
    token = request.cookies.get(COOKIE_NAME)
    response.delete_cookie(COOKIE_NAME, path="/auth")
    
    if token:
        try:
            payload = verify_refresh(token)
            await _users().update_one(
                {"_id": _oid(payload["sub"])},
                {"$unset": {"refresh_token_hash": "", "refresh_jti": "", "refresh_token_exp": ""}}
            )
        except Exception:
            pass
    
    return LogoutOut(ok=True, message="Logged out successfully")


# Test endpoint to verify MongoDB connection and auth router
@router.get("/test")
async def test_mongodb():
    """Test MongoDB connection and auth router functionality"""
    try:
        # Test basic connection
        users_collection = _users()
        count = await users_collection.count_documents({})
        return {
            "status": "ok", 
            "message": "MongoDB connection working",
            "users_count": count,
            "router": "auth router is working"
        }
    except Exception as e:
        return {
            "status": "error", 
            "message": f"MongoDB connection failed: {str(e)}"
        }

# Simple test endpoint without MongoDB dependency
@router.get("/test-simple")
async def test_simple():
    """Simple test endpoint without MongoDB dependency"""
    return {
        "status": "ok",
        "message": "Simple test endpoint working",
        "router": "auth router is working"
    }
