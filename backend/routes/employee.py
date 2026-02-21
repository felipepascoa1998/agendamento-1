from fastapi import APIRouter, Request, HTTPException
from backend.models.employee import Employee, EmployeeCreate
from backend.services.employee_service import (
    list_employees, list_all_employees, create_employee, update_employee, delete_employee
)
from backend.utils.auth import require_admin, get_tenant_from_host
from typing import List

router = APIRouter(prefix="/employees")

@router.get("/", response_model=List[Employee])
async def list_employees_route(request: Request):
    db = request.app.state.db
    tenant_slug = get_tenant_from_host(request)
    return await list_employees(db, tenant_slug)

@router.get("/all", response_model=List[Employee])
async def list_all_employees_route(request: Request):
    db = request.app.state.db
    user = await require_admin(request, db)
    return await list_all_employees(db, user.tenant_id)

@router.post("/", response_model=Employee)
async def create_employee_route(request: Request, data: EmployeeCreate):
    db = request.app.state.db
    user = await require_admin(request, db)
    return await create_employee(db, user.tenant_id, data)

@router.put("/{employee_id}", response_model=Employee)
async def update_employee_route(request: Request, employee_id: str, data: EmployeeCreate):
    db = request.app.state.db
    user = await require_admin(request, db)
    return await update_employee(db, user.tenant_id, employee_id, data)

@router.delete("/{employee_id}")
async def delete_employee_route(request: Request, employee_id: str):
    db = request.app.state.db
    user = await require_admin(request, db)
    return await delete_employee(db, user.tenant_id, employee_id)
