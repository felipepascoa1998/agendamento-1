from fastapi import Request, HTTPException
from datetime import datetime, timezone
from typing import Optional
from backend.models.user import User

# Helpers de autenticação e sessão

async def get_session_from_cookie(request: Request, db) -> Optional[dict]:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if not session_token:
        return None
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        return None
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    return session

async def get_current_user(request: Request, db) -> Optional[User]:
    session = await get_session_from_cookie(request, db)
    if not session:
        return None
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if user:
        return User(**user)
    return None

async def require_auth(request: Request, db) -> User:
    user = await get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Não autenticado")
    return user

async def require_admin(request: Request, db) -> User:
    user = await require_auth(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    return user

def get_tenant_from_host(request: Request) -> str:
    host = request.headers.get("host", "")
    host = host.split(":")[0]
    parts = host.split(".")
    if len(parts) >= 2:
        return parts[0]
    return "demo"
