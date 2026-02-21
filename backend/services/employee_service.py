from backend.models.employee import Employee, EmployeeCreate
from datetime import datetime, timezone
import uuid
from typing import List

async def list_employees(db, tenant_slug: str):
    tenant = await db.tenants.find_one({"slug": tenant_slug}, {"_id": 0})
    if not tenant:
        return []
    employees = await db.employees.find(
        {"tenant_id": tenant["tenant_id"], "is_active": True},
        {"_id": 0}
    ).to_list(100)
    return employees

async def list_all_employees(db, tenant_id: str):
    employees = await db.employees.find(
        {"tenant_id": tenant_id},
        {"_id": 0}
    ).to_list(100)
    return employees

async def create_employee(db, tenant_id: str, data: EmployeeCreate):
    employee_id = f"emp_{uuid.uuid4().hex[:12]}"
    employee = {
        "employee_id": employee_id,
        "tenant_id": tenant_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.employees.insert_one(employee)
    return Employee(**{k: v for k, v in employee.items() if k != "_id"})

async def update_employee(db, tenant_id: str, employee_id: str, data: EmployeeCreate):
    result = await db.employees.update_one(
        {"employee_id": employee_id, "tenant_id": tenant_id},
        {"$set": data.model_dump()}
    )
    if result.matched_count == 0:
        raise Exception("Funcionário não encontrado")
    employee = await db.employees.find_one({"employee_id": employee_id}, {"_id": 0})
    return Employee(**employee)

async def delete_employee(db, tenant_id: str, employee_id: str):
    result = await db.employees.delete_one(
        {"employee_id": employee_id, "tenant_id": tenant_id}
    )
    if result.deleted_count == 0:
        raise Exception("Funcionário não encontrado")
    return {"message": "Funcionário removido com sucesso"}
