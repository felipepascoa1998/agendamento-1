from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None
    phone: Optional[str] = None

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    tenant_id: str
    role: str  # 'admin' or 'client'
    created_at: datetime
