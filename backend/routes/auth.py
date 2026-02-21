from fastapi import APIRouter, Request, Response, HTTPException
from backend.utils.auth import get_current_user, require_admin, get_tenant_from_host
from backend.models.user import User
import httpx, uuid
from datetime import datetime, timezone, timedelta
import os

router = APIRouter(prefix="/auth")

@router.get("/me")
async def get_current_user_route(request: Request):
    db = request.app.state.db
    user = await get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Não autenticado")
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "role": user.role,
        "tenant_id": user.tenant_id
    }

@router.post("/session")
async def create_session_route(request: Request, response: Response):
    db = request.app.state.db
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id é obrigatório")
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Sessão inválida")
            auth_data = auth_response.json()
        except Exception:
            raise HTTPException(status_code=401, detail="Erro de autenticação")
    email = auth_data["email"]
    name = auth_data["name"]
    picture = auth_data.get("picture", "")
    session_token = auth_data["session_token"]
    tenant_slug = get_tenant_from_host(request)
    tenant = await db.tenants.find_one({"slug": tenant_slug}, {"_id": 0})
    if not tenant:
        tenant_id = f"tenant_{uuid.uuid4().hex[:12]}"
        tenant = {
            "tenant_id": tenant_id,
            "name": tenant_slug.replace("-", " ").title(),
            "slug": tenant_slug,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True
        }
        await db.tenants.insert_one(tenant)
    else:
        tenant_id = tenant["tenant_id"]
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
        role = existing_user.get("role", "client")
    else:
        user_count = await db.users.count_documents({"tenant_id": tenant_id})
        role = "admin" if user_count == 0 else "client"
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "tenant_id": tenant_id,
            "role": role,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one(session_doc)
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "role": role,
        "tenant_id": tenant_id
    }

@router.post("/logout")
async def logout_route(request: Request, response: Response):
    db = request.app.state.db
    session = await db.user_sessions.find_one({"session_token": request.cookies.get("session_token")})
    if session:
        await db.user_sessions.delete_one({"session_token": session["session_token"]})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logout realizado com sucesso"}
