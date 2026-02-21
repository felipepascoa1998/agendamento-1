from backend.models.tenant import TenantBase
from datetime import datetime, timezone
import uuid

async def get_tenant_info(db, tenant_slug: str):
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
    return tenant

async def update_tenant_info(db, tenant_id: str, data: TenantBase):
    await db.tenants.update_one(
        {"tenant_id": tenant_id},
        {"$set": data.model_dump(exclude_none=True)}
    )
    tenant = await db.tenants.find_one({"tenant_id": tenant_id}, {"_id": 0})
    return tenant
