from fastapi import APIRouter, Request, HTTPException
from backend.models.tenant import TenantBase
from backend.services.tenant_service import get_tenant_info, update_tenant_info
from backend.utils.auth import require_admin, get_tenant_from_host

router = APIRouter(prefix="/tenant")

@router.get("/")
async def get_tenant_route(request: Request):
    db = request.app.state.db
    tenant_slug = get_tenant_from_host(request)
    tenant = await get_tenant_info(db, tenant_slug)
    return tenant

@router.put("/")
async def update_tenant_route(request: Request, data: TenantBase):
    db = request.app.state.db
    user = await require_admin(request, db)
    tenant = await update_tenant_info(db, user.tenant_id, data)
    return tenant
