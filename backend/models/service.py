from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ServiceBase(BaseModel):
    name: str
    duration: int  # in minutes
    price: float
    description: Optional[str] = None
    is_active: bool = True

class ServiceCreate(ServiceBase):
    pass

class Service(ServiceBase):
    model_config = ConfigDict(extra="ignore")
    service_id: str
    tenant_id: str
    created_at: datetime
