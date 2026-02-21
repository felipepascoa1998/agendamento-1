from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class EmployeeBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: bool = True

class EmployeeCreate(EmployeeBase):
    service_ids: List[str] = []

class Employee(EmployeeBase):
    model_config = ConfigDict(extra="ignore")
    employee_id: str
    tenant_id: str
    service_ids: List[str] = []
    created_at: datetime
