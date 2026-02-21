from backend.models.service import Service, ServiceCreate
from datetime import datetime, timezone
import uuid
from typing import List

async def list_services(db, tenant_slug: str):
    tenant = await db.tenants.find_one({"slug": tenant_slug}, {"_id": 0})
    if not tenant:
        return []
    services = await db.services.find(
        {"tenant_id": tenant["tenant_id"], "is_active": True},
        {"_id": 0}
    ).to_list(100)
    return services

async def list_all_services(db, tenant_id: str):
    services = await db.services.find(
        {"tenant_id": tenant_id},
        {"_id": 0}
    ).to_list(100)
    return services

async def create_service(db, tenant_id: str, data: ServiceCreate):
    service_id = f"svc_{uuid.uuid4().hex[:12]}"
    service = {
        "service_id": service_id,
        "tenant_id": tenant_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.services.insert_one(service)
    return Service(**{k: v for k, v in service.items() if k != "_id"})

async def update_service(db, tenant_id: str, service_id: str, data: ServiceCreate):
    result = await db.services.update_one(
        {"service_id": service_id, "tenant_id": tenant_id},
        {"$set": data.model_dump()}
    )
    if result.matched_count == 0:
        raise Exception("Serviço não encontrado")
    service = await db.services.find_one({"service_id": service_id}, {"_id": 0})
    return Service(**service)

async def delete_service(db, tenant_id: str, service_id: str):
    result = await db.services.delete_one(
        {"service_id": service_id, "tenant_id": tenant_id}
    )
    if result.deleted_count == 0:
        raise Exception("Serviço não encontrado")
    return {"message": "Serviço removido com sucesso"}
