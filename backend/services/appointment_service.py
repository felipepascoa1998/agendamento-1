from backend.models.appointment import Appointment
from backend.utils.email import send_email_async, get_client_reminder_email, get_employee_reminder_email
from datetime import datetime, timezone

async def create_appointment(db, data):
    """Cria um novo agendamento e retorna o objeto criado."""
    appointment_id = f"appt_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}"
    appointment = {
        **data,
        "appointment_id": appointment_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "pending"
    }
    await db.appointments.insert_one(appointment)
    return appointment

async def send_reminder_emails(db, appointment_id, tenant_name, send_to_client=True, send_to_employee=True):
    """Envia e-mails de lembrete para cliente e/ou profissional."""
    appointment = await db.appointments.find_one({"appointment_id": appointment_id}, {"_id": 0})
    if not appointment:
        return False
    results = {}
    if send_to_client and appointment.get("client_email"):
        html = get_client_reminder_email(appointment, tenant_name)
        results["client"] = await send_email_async(appointment["client_email"], "Lembrete de Agendamento", html)
    if send_to_employee and appointment.get("employee_email"):
        html = get_employee_reminder_email(appointment, tenant_name)
        results["employee"] = await send_email_async(appointment["employee_email"], "Lembrete de Atendimento", html)
    return results
