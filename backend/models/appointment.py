from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AppointmentBase(BaseModel):
    service_id: str
    employee_id: str
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    client_name: str
    client_email: str
    client_phone: Optional[str] = None

class Appointment(AppointmentBase):
    model_config = ConfigDict(extra="ignore")
    appointment_id: str
    tenant_id: str
    client_user_id: Optional[str] = None
    client_name: str
    client_email: str
    client_phone: Optional[str] = None
    status: str  # 'pending', 'confirmed', 'completed', 'cancelled'
    created_at: datetime
    service_name: Optional[str] = None
    service_price: Optional[float] = None
    employee_name: Optional[str] = None
