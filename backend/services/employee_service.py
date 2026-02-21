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
    # Garante que todos os campos obrigatórios existam
    for emp in employees:
        if "created_at" not in emp:
            emp["created_at"] = datetime.now(timezone.utc).isoformat()
        if "service_ids" not in emp:
            emp["service_ids"] = []
    return employees

async def list_all_employees(db, tenant_id: str):
    employees = await db.employees.find(
        {"tenant_id": tenant_id},
        {"_id": 0}
    ).to_list(100)
    for emp in employees:
        if emp.get("tenant_id") != tenant_id:
            print(f"[SECURITY] Tentativa de acesso cruzado de tenant em funcionário: {emp}")
        if "created_at" not in emp:
            emp["created_at"] = datetime.now(timezone.utc).isoformat()
        if "service_ids" not in emp:
            emp["service_ids"] = []
        if "tenant_id" not in emp:
            print(f"[SECURITY] Funcionário sem tenant_id detectado: {emp}")
    return employees

async def create_employee(db, tenant_id: str, data: EmployeeCreate):
    if not tenant_id:
        raise Exception("tenant_id obrigatório para criar funcionário")
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
    if not tenant_id:
        raise Exception("tenant_id obrigatório para atualizar funcionário")
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
