
from fastapi import APIRouter, Request, HTTPException, Depends
from backend.services.appointment_service import create_appointment, send_reminder_emails
from backend.utils.auth import require_admin, get_tenant_from_host, get_current_user
from backend.models.appointment import AppointmentBase
from typing import Optional


router = APIRouter(prefix="/appointments")


# GET /appointments - lista agendamentos
@router.get("/")
async def list_appointments_route(request: Request, status: Optional[str] = None, date_from: Optional[str] = None, date_to: Optional[str] = None, employee_id: Optional[str] = None):
    db = request.app.state.db
    user = await require_admin(request, db)
    query = {"tenant_id": user.tenant_id}
    if user and getattr(user, "role", None) != "admin":
        query["client_user_id"] = user.user_id
    if status:
        query["status"] = status
    if date_from:
        query["date"] = {"$gte": date_from}
    if date_to:
        if "date" in query:
            query["date"]["$lte"] = date_to
        else:
            query["date"] = {"$lte": date_to}
    if employee_id:
        query["employee_id"] = employee_id
    appointments = await db.appointments.find(query, {"_id": 0}).sort("date", 1).to_list(500)
    return appointments


@router.post("/{appointment_id}/send-reminder")
async def send_reminder_route(request: Request, appointment_id: str, send_to_client: bool = True, send_to_employee: bool = True):
    db = request.app.state.db
    user = await require_admin(request, db)
    tenant_name = ""  # Obtenha o nome do tenant conforme sua lógica
    result = await send_reminder_emails(db, appointment_id, tenant_name, send_to_client, send_to_employee)
    if not result:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    return {"status": "ok", "result": result}

# GET /appointments/available-slots
@router.get("/available-slots")
async def get_available_slots_route(request: Request, employee_id: str, date: str, service_id: str):
    db = request.app.state.db
    tenant_slug = get_tenant_from_host(request)
    tenant = await db.tenants.find_one({"slug": tenant_slug}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    service = await db.services.find_one({"service_id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    duration = service.get("duration", 30)
    blocked = await db.blocked_times.find({"tenant_id": tenant["tenant_id"], "employee_id": employee_id, "date": date}, {"_id": 0}).to_list(100)
    for block in blocked:
        if block.get("is_whole_day"):
            return {"slots": [], "message": "Este dia está bloqueado"}
    existing = await db.appointments.find({"tenant_id": tenant["tenant_id"], "employee_id": employee_id, "date": date, "status": {"$in": ["pending", "confirmed"]}}, {"_id": 0}).to_list(100)
    all_slots = []
    for hour in range(8, 20):
        for minute in [0, 30]:
            slot_time = f"{hour:02d}:{minute:02d}"
            all_slots.append(slot_time)
    available_slots = []
    for slot in all_slots:
        slot_hour, slot_min = map(int, slot.split(":"))
        slot_minutes = slot_hour * 60 + slot_min
        slot_end_minutes = slot_minutes + duration
        is_available = True
        for block in blocked:
            if block.get("start_time") and block.get("end_time"):
                block_start = int(block["start_time"].split(":")[0]) * 60 + int(block["start_time"].split(":")[1])
                block_end = int(block["end_time"].split(":")[0]) * 60 + int(block["end_time"].split(":")[1])
                if slot_minutes < block_end and slot_end_minutes > block_start:
                    is_available = False
                    break
        if is_available:
            for appt in existing:
                appt_hour, appt_min = map(int, appt["time"].split(":"))
                appt_minutes = appt_hour * 60 + appt_min
                appt_duration = appt.get("service_duration", 30)
                appt_end = appt_minutes + appt_duration
                if slot_minutes < appt_end and slot_end_minutes > appt_minutes:
                    is_available = False
                    break
        if is_available:
            available_slots.append(slot)
    return {"slots": available_slots}

# PUT /appointments/{appointment_id}/status
@router.put("/{appointment_id}/status")
async def update_appointment_status_route(request: Request, appointment_id: str, status: str):
    db = request.app.state.db
    result = await db.appointments.update_one({"appointment_id": appointment_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    return {"status": "ok"}

# PUT /appointments/{appointment_id}/reschedule
@router.put("/{appointment_id}/reschedule")
async def reschedule_appointment_route(request: Request, appointment_id: str, new_date: str, new_time: str):
    db = request.app.state.db
    result = await db.appointments.update_one({"appointment_id": appointment_id}, {"$set": {"date": new_date, "time": new_time}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    return {"status": "ok"}

# DELETE /appointments/{appointment_id}
@router.delete("/{appointment_id}")
async def delete_appointment_route(request: Request, appointment_id: str):
    db = request.app.state.db
    result = await db.appointments.delete_one({"appointment_id": appointment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    return {"status": "ok"}
