from fastapi import APIRouter, Request, HTTPException
from backend.models.service import Service, ServiceCreate
from backend.services.service_service import (
    list_services, list_all_services, create_service, update_service, delete_service
)
from backend.utils.auth import require_admin, get_tenant_from_host
from typing import List

router = APIRouter(prefix="/services")

@router.get("/", response_model=List[Service])
async def list_services_route(request: Request):
    db = request.app.state.db
    user = await require_admin(request, db)
    return await list_all_services(db, user.tenant_id)

@router.get("/all", response_model=List[Service])
async def list_all_services_route(request: Request):
    db = request.app.state.db
    user = await require_admin(request, db)
    return await list_all_services(db, user.tenant_id)

@router.post("/", response_model=Service)
async def create_service_route(request: Request, data: ServiceCreate):
    db = request.app.state.db
    user = await require_admin(request, db)
    return await create_service(db, user.tenant_id, data)

@router.put("/{service_id}", response_model=Service)
async def update_service_route(request: Request, service_id: str, data: ServiceCreate):
    db = request.app.state.db
    user = await require_admin(request, db)
    return await update_service(db, user.tenant_id, service_id, data)

@router.delete("/{service_id}")
async def delete_service_route(request: Request, service_id: str):
    db = request.app.state.db
    user = await require_admin(request, db)
    return await delete_service(db, user.tenant_id, service_id)
