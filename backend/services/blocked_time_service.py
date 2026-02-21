from backend.models.blocked_time import BlockedTime, BlockedTimeCreate
from datetime import datetime, timezone
import uuid
from typing import List

async def list_blocked_times(db, tenant_slug: str):
    tenant = await db.tenants.find_one({"slug": tenant_slug}, {"_id": 0})
    if not tenant:
        return []
    blocked_times = await db.blocked_times.find(
        {"tenant_id": tenant["tenant_id"]},
        {"_id": 0}
    ).to_list(100)
    return blocked_times

async def create_blocked_time(db, tenant_id: str, data: BlockedTimeCreate):
    blocked_id = f"blocked_{uuid.uuid4().hex[:12]}"
    blocked_time = {
        "blocked_id": blocked_id,
        "tenant_id": tenant_id,
        **data.model_dump(),
        "is_whole_day": data.start_time is None and data.end_time is None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.blocked_times.insert_one(blocked_time)
    return BlockedTime(**{k: v for k, v in blocked_time.items() if k != "_id"})

async def delete_blocked_time(db, tenant_id: str, blocked_id: str):
    result = await db.blocked_times.delete_one(
        {"blocked_id": blocked_id, "tenant_id": tenant_id}
    )
    if result.deleted_count == 0:
        raise Exception("Bloqueio não encontrado")
    return {"message": "Bloqueio removido com sucesso"}
