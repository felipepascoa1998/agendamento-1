from backend.models.appointment import Appointment
from backend.utils.email import send_email_async, get_client_reminder_email, get_employee_reminder_email
from datetime import datetime, timezone


def log_appointment_security(appt, tenant_id):
    if appt.get("tenant_id") != tenant_id:
        print(f"[SECURITY] Tentativa de acesso cruzado de tenant em agendamento: {appt}")
    if "tenant_id" not in appt:
        print(f"[SECURITY] Agendamento sem tenant_id detectado: {appt}")

async def create_appointment(db, data):
    # Log de segurança para dados sem tenant_id
    if "tenant_id" not in data or not data["tenant_id"]:
        print(f"[SECURITY] Tentativa de criar agendamento sem tenant_id: {data}")
    """Cria um novo agendamento e retorna o objeto criado."""
    if "tenant_id" not in data or not data["tenant_id"]:
        raise Exception("tenant_id obrigatório para criar agendamento")
    appointment_id = f"appt_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}"
    appointment = {
        **data,
        "appointment_id": appointment_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "pending"
    }
    await db.appointments.insert_one(appointment)
    return appointment

# Função utilitária para garantir campos obrigatórios em agendamentos
def ensure_appointment_fields(appt):
    if "created_at" not in appt:
        appt["created_at"] = datetime.now(timezone.utc).isoformat()
    if "status" not in appt:
        appt["status"] = "pending"
    if "client_name" not in appt:
        appt["client_name"] = ""
    if "client_email" not in appt:
        appt["client_email"] = ""
    if "service_id" not in appt:
        appt["service_id"] = ""
    if "employee_id" not in appt:
        appt["employee_id"] = ""
    return appt

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
