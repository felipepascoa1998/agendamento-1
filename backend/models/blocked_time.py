from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class BlockedTimeBase(BaseModel):
    employee_id: str
    date: str  # YYYY-MM-DD
    start_time: Optional[str] = None  # HH:MM - None means whole day
    end_time: Optional[str] = None  # HH:MM
    reason: Optional[str] = None

class BlockedTimeCreate(BlockedTimeBase):
    pass

class BlockedTime(BlockedTimeBase):
    model_config = ConfigDict(extra="ignore")
    blocked_id: str
    tenant_id: str
    is_whole_day: bool
    created_at: datetime
