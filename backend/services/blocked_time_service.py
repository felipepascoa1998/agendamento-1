async def update_blocked_time(db, tenant_id: str, blocked_id: str, data: BlockedTimeCreate):
    if not tenant_id:
        raise Exception("tenant_id obrigatório para atualizar bloqueio")
    result = await db.blocked_times.update_one(
        {"blocked_id": blocked_id, "tenant_id": tenant_id},
        {"$set": {
            "employee_id": data.employee_id,
            "date": data.date,
            "start_time": data.start_time,
            "end_time": data.end_time,
            "reason": data.reason,
            "is_whole_day": data.start_time is None and data.end_time is None
        }}
    )
    if result.matched_count == 0:
        raise Exception("Bloqueio não encontrado")
    blocked_time = await db.blocked_times.find_one({"blocked_id": blocked_id, "tenant_id": tenant_id}, {"_id": 0})
    return BlockedTime(**blocked_time)
from backend.models.blocked_time import BlockedTime, BlockedTimeCreate
from datetime import datetime, timezone
import uuid
from typing import List

async def list_blocked_times(db, tenant_id: str):
    print(f"[DEBUG] tenant_id recebido da sessão: {tenant_id}")
    blocked_times = await db.blocked_times.find(
        {"tenant_id": tenant_id},
        {"_id": 0}
    ).to_list(100)
    for bt in blocked_times:
        if bt.get("tenant_id") != tenant_id:
            print(f"[SECURITY] Tentativa de acesso cruzado de tenant em bloqueio: {bt}")
        if "created_at" not in bt:
            bt["created_at"] = datetime.now(timezone.utc).isoformat()
        if "is_whole_day" not in bt:
            bt["is_whole_day"] = bt.get("start_time") is None and bt.get("end_time") is None
        if "tenant_id" not in bt:
            print(f"[SECURITY] Bloqueio sem tenant_id detectado: {bt}")
    return blocked_times

async def create_blocked_time(db, tenant_id: str, data: BlockedTimeCreate):
    if not tenant_id:
        raise Exception("tenant_id obrigatório para criar bloqueio")
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
