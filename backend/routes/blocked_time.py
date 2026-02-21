from fastapi import APIRouter, Request, HTTPException
from backend.models.blocked_time import BlockedTime, BlockedTimeCreate
from backend.services.blocked_time_service import (
    list_blocked_times, create_blocked_time, delete_blocked_time
)
from backend.utils.auth import require_admin, get_tenant_from_host
from typing import List

router = APIRouter(prefix="/blocked-times")

@router.get("/", response_model=List[BlockedTime])
async def list_blocked_times_route(request: Request):
    db = request.app.state.db
    tenant_slug = get_tenant_from_host(request)
    return await list_blocked_times(db, tenant_slug)

@router.post("/", response_model=BlockedTime)
async def create_blocked_time_route(request: Request, data: BlockedTimeCreate):
    db = request.app.state.db
    user = await require_admin(request, db)
    return await create_blocked_time(db, user.tenant_id, data)

@router.delete("/{blocked_id}")
async def delete_blocked_time_route(request: Request, blocked_id: str):
    db = request.app.state.db
    user = await require_admin(request, db)
    return await delete_blocked_time(db, user.tenant_id, blocked_id)
