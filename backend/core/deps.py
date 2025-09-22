# backend/core/deps.py
from fastapi import Depends, HTTPException, Header
from backend.core.security import verify_access

async def current_user(authorization: str = Header(None)):
    """Get current user from JWT token"""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split(" ", 1)[1]
    try:
        payload = verify_access(token)
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def require_role(role: str):
    """Require specific role"""
    async def _guard(user=Depends(current_user)):
        if role not in user.get("roles", []):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return _guard

def require_admin():
    """Require admin role"""
    return require_role("admin")

def require_user():
    """Require user role (admin or user)"""
    async def _guard(user=Depends(current_user)):
        roles = user.get("roles", [])
        if not any(role in roles for role in ["admin", "user"]):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return _guard
