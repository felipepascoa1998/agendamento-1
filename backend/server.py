"""
Salon Scheduler SaaS - Multi-tenant Backend
Sistema de agendamento para salões de beleza
"""

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend Email configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Create the main app
app = FastAPI(title="Salon Scheduler SaaS")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class TenantBase(BaseModel):
    name: str
    slug: str
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class TenantCreate(TenantBase):
    pass

class Tenant(TenantBase):
    model_config = ConfigDict(extra="ignore")
    tenant_id: str
    created_at: datetime
    is_active: bool = True

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

# ============== AUTH HELPERS ==============

async def get_session_from_cookie(request: Request) -> Optional[dict]:
    """Get session from cookie or Authorization header"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        return None
    
    # Check expiry with timezone awareness
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        return None
    
    return session

async def get_current_user(request: Request) -> Optional[User]:
    """Get current authenticated user"""
    session = await get_session_from_cookie(request)
    if not session:
        return None
    
    user = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if user:
        return User(**user)
    return None

async def require_auth(request: Request) -> User:
    """Require authentication"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Não autenticado")
    return user

async def require_admin(request: Request) -> User:
    """Require admin role"""
    user = await require_auth(request)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    return user

def get_tenant_from_host(request: Request) -> str:
    """Extract tenant slug from host"""
    host = request.headers.get("host", "")
    # Remove port if present
    host = host.split(":")[0]
    
    # Extract subdomain or use 'demo' as default
    parts = host.split(".")
    if len(parts) >= 2:
        # subdomain.domain.com
        return parts[0]
    
    # For localhost or direct IP access, use 'demo'
    return "demo"

# ============== AUTH ROUTES ==============

@api_router.get("/auth/me")
async def get_current_user_route(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Não autenticado")
    
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "role": user.role,
        "tenant_id": user.tenant_id
    }

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id for session_token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id é obrigatório")
    
    # Get user data from Emergent Auth
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Sessão inválida")
            
            auth_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=401, detail="Erro de autenticação")
    
    email = auth_data["email"]
    name = auth_data["name"]
    picture = auth_data.get("picture", "")
    session_token = auth_data["session_token"]
    
    # Get tenant from host
    tenant_slug = get_tenant_from_host(request)
    
    # Ensure tenant exists (create demo tenant if needed)
    tenant = await db.tenants.find_one({"slug": tenant_slug}, {"_id": 0})
    if not tenant:
        # Create default tenant
        tenant_id = f"tenant_{uuid.uuid4().hex[:12]}"
        tenant = {
            "tenant_id": tenant_id,
            "name": tenant_slug.replace("-", " ").title(),
            "slug": tenant_slug,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True
        }
        await db.tenants.insert_one(tenant)
    else:
        tenant_id = tenant["tenant_id"]
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user data
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
        role = existing_user.get("role", "client")
    else:
        # Create new user - first user is admin
        user_count = await db.users.count_documents({"tenant_id": tenant_id})
        role = "admin" if user_count == 0 else "client"
        
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "tenant_id": tenant_id,
            "role": role,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Remove old sessions for this user
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "role": role,
        "tenant_id": tenant_id
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session = await get_session_from_cookie(request)
    if session:
        await db.user_sessions.delete_one({"session_token": session["session_token"]})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logout realizado com sucesso"}

# ============== TENANT ROUTES ==============

@api_router.get("/tenant")
async def get_tenant_info(request: Request):
    """Get current tenant info"""
    tenant_slug = get_tenant_from_host(request)
    tenant = await db.tenants.find_one({"slug": tenant_slug}, {"_id": 0})
    
    if not tenant:
        # Create demo tenant
        tenant_id = f"tenant_{uuid.uuid4().hex[:12]}"
        tenant = {
            "tenant_id": tenant_id,
            "name": tenant_slug.replace("-", " ").title(),
            "slug": tenant_slug,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True
        }
        await db.tenants.insert_one(tenant)
    
    return tenant

@api_router.put("/tenant")
async def update_tenant(request: Request, data: TenantBase):
    """Update tenant info (admin only)"""
    user = await require_admin(request)
    
    await db.tenants.update_one(
        {"tenant_id": user.tenant_id},
        {"$set": data.model_dump(exclude_none=True)}
    )
    
    tenant = await db.tenants.find_one({"tenant_id": user.tenant_id}, {"_id": 0})
    return tenant

# ============== SERVICES ROUTES ==============

@api_router.get("/services", response_model=List[Service])
async def list_services(request: Request):
    """List all services for current tenant"""
    tenant_slug = get_tenant_from_host(request)
    tenant = await db.tenants.find_one({"slug": tenant_slug}, {"_id": 0})
    
    if not tenant:
        return []
    
    services = await db.services.find(
        {"tenant_id": tenant["tenant_id"], "is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    return services

@api_router.get("/services/all", response_model=List[Service])
async def list_all_services(request: Request):
    """List all services including inactive (admin only)"""
    user = await require_admin(request)
    
    services = await db.services.find(
        {"tenant_id": user.tenant_id},
        {"_id": 0}
    ).to_list(100)
    
    return services

@api_router.post("/services", response_model=Service)
async def create_service(request: Request, data: ServiceCreate):
    """Create a new service (admin only)"""
    user = await require_admin(request)
    
    service_id = f"svc_{uuid.uuid4().hex[:12]}"
    service = {
        "service_id": service_id,
        "tenant_id": user.tenant_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.services.insert_one(service)
    return Service(**{k: v for k, v in service.items() if k != "_id"})

@api_router.put("/services/{service_id}", response_model=Service)
async def update_service(request: Request, service_id: str, data: ServiceCreate):
    """Update a service (admin only)"""
    user = await require_admin(request)
    
    result = await db.services.update_one(
        {"service_id": service_id, "tenant_id": user.tenant_id},
        {"$set": data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    
    service = await db.services.find_one({"service_id": service_id}, {"_id": 0})
    return Service(**service)

@api_router.delete("/services/{service_id}")
async def delete_service(request: Request, service_id: str):
    """Delete a service (admin only)"""
    user = await require_admin(request)
    
    result = await db.services.delete_one(
        {"service_id": service_id, "tenant_id": user.tenant_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    
    return {"message": "Serviço removido com sucesso"}

# ============== EMPLOYEES ROUTES ==============

@api_router.get("/employees", response_model=List[Employee])
async def list_employees(request: Request):
    """List all employees for current tenant"""
    tenant_slug = get_tenant_from_host(request)
    tenant = await db.tenants.find_one({"slug": tenant_slug}, {"_id": 0})
    
    if not tenant:
        return []
    
    employees = await db.employees.find(
        {"tenant_id": tenant["tenant_id"], "is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    return employees

@api_router.get("/employees/all", response_model=List[Employee])
async def list_all_employees(request: Request):
    """List all employees including inactive (admin only)"""
    user = await require_admin(request)
    
    employees = await db.employees.find(
        {"tenant_id": user.tenant_id},
        {"_id": 0}
    ).to_list(100)
    
    return employees

@api_router.post("/employees", response_model=Employee)
async def create_employee(request: Request, data: EmployeeCreate):
    """Create a new employee (admin only)"""
    user = await require_admin(request)
    
    employee_id = f"emp_{uuid.uuid4().hex[:12]}"
    employee = {
        "employee_id": employee_id,
        "tenant_id": user.tenant_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.employees.insert_one(employee)
    return Employee(**{k: v for k, v in employee.items() if k != "_id"})

@api_router.put("/employees/{employee_id}", response_model=Employee)
async def update_employee(request: Request, employee_id: str, data: EmployeeCreate):
    """Update an employee (admin only)"""
    user = await require_admin(request)
    
    result = await db.employees.update_one(
        {"employee_id": employee_id, "tenant_id": user.tenant_id},
        {"$set": data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")
    
    employee = await db.employees.find_one({"employee_id": employee_id}, {"_id": 0})
    return Employee(**employee)

@api_router.delete("/employees/{employee_id}")
async def delete_employee(request: Request, employee_id: str):
    """Delete an employee (admin only)"""
    user = await require_admin(request)
    
    result = await db.employees.delete_one(
        {"employee_id": employee_id, "tenant_id": user.tenant_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")
    
    return {"message": "Funcionário removido com sucesso"}

# ============== APPOINTMENTS ROUTES ==============

@api_router.get("/appointments", response_model=List[Appointment])
async def list_appointments(
    request: Request,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    employee_id: Optional[str] = None
):
    """List appointments (admin sees all, client sees own)"""
    user = await get_current_user(request)
    tenant_slug = get_tenant_from_host(request)
    tenant = await db.tenants.find_one({"slug": tenant_slug}, {"_id": 0})
    
    if not tenant:
        return []
    
    query = {"tenant_id": tenant["tenant_id"]}
    
    if user and user.role != "admin":
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

@api_router.get("/appointments/available-slots")
async def get_available_slots(
    request: Request,
    employee_id: str,
    date: str,
    service_id: str
):
    """Get available time slots for booking"""
    tenant_slug = get_tenant_from_host(request)
    tenant = await db.tenants.find_one({"slug": tenant_slug}, {"_id": 0})
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    # Get service duration
    service = await db.services.find_one({"service_id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    
    duration = service["duration"]
    
    # Get blocked times for this date
    blocked = await db.blocked_times.find(
        {
            "tenant_id": tenant["tenant_id"],
            "employee_id": employee_id,
            "date": date
        },
        {"_id": 0}
    ).to_list(100)
    
    # Check for whole day block
    for block in blocked:
        if block.get("is_whole_day"):
            return {"slots": [], "message": "Este dia está bloqueado"}
    
    # Get existing appointments
    existing = await db.appointments.find(
        {
            "tenant_id": tenant["tenant_id"],
            "employee_id": employee_id,
            "date": date,
            "status": {"$in": ["pending", "confirmed"]}
        },
        {"_id": 0}
    ).to_list(100)
    
    # Generate time slots (8:00 to 20:00)
    all_slots = []
    for hour in range(8, 20):
        for minute in [0, 30]:
            slot_time = f"{hour:02d}:{minute:02d}"
            all_slots.append(slot_time)
    
    # Filter out blocked and booked slots
    available_slots = []
    
    for slot in all_slots:
        slot_hour, slot_min = map(int, slot.split(":"))
        slot_minutes = slot_hour * 60 + slot_min
        slot_end_minutes = slot_minutes + duration
        
        is_available = True
        
        # Check blocked times
        for block in blocked:
            if block.get("start_time") and block.get("end_time"):
                block_start = int(block["start_time"].split(":")[0]) * 60 + int(block["start_time"].split(":")[1])
                block_end = int(block["end_time"].split(":")[0]) * 60 + int(block["end_time"].split(":")[1])
                
                if slot_minutes < block_end and slot_end_minutes > block_start:
                    is_available = False
                    break
        
        # Check existing appointments
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

@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(request: Request, data: AppointmentCreate):
    """Create a new appointment"""
    tenant_slug = get_tenant_from_host(request)
    tenant = await db.tenants.find_one({"slug": tenant_slug}, {"_id": 0})
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    # Check for conflicts
    existing = await db.appointments.find_one({
        "tenant_id": tenant["tenant_id"],
        "employee_id": data.employee_id,
        "date": data.date,
        "time": data.time,
        "status": {"$in": ["pending", "confirmed"]}
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Horário já reservado")
    
    # Get service info
    service = await db.services.find_one({"service_id": data.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    
    # Get employee info
    employee = await db.employees.find_one({"employee_id": data.employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")
    
    # Get current user if authenticated
    user = await get_current_user(request)
    
    appointment_id = f"appt_{uuid.uuid4().hex[:12]}"
    appointment = {
        "appointment_id": appointment_id,
        "tenant_id": tenant["tenant_id"],
        "service_id": data.service_id,
        "service_name": service["name"],
        "service_price": service["price"],
        "service_duration": service["duration"],
        "employee_id": data.employee_id,
        "employee_name": employee["name"],
        "date": data.date,
        "time": data.time,
        "client_user_id": user.user_id if user else None,
        "client_name": data.client_name,
        "client_email": data.client_email,
        "client_phone": data.client_phone,
        "notes": data.notes,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.appointments.insert_one(appointment)
    return Appointment(**{k: v for k, v in appointment.items() if k != "_id"})

@api_router.put("/appointments/{appointment_id}/status")
async def update_appointment_status(
    request: Request,
    appointment_id: str,
    status: str
):
    """Update appointment status (admin only)"""
    user = await require_admin(request)
    
    if status not in ["pending", "confirmed", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Status inválido")
    
    result = await db.appointments.update_one(
        {"appointment_id": appointment_id, "tenant_id": user.tenant_id},
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    
    appointment = await db.appointments.find_one({"appointment_id": appointment_id}, {"_id": 0})
    return appointment

@api_router.put("/appointments/{appointment_id}/reschedule")
async def reschedule_appointment(
    request: Request,
    appointment_id: str,
    date: str,
    time: str
):
    """Reschedule an appointment"""
    user = await get_current_user(request)
    tenant_slug = get_tenant_from_host(request)
    tenant = await db.tenants.find_one({"slug": tenant_slug}, {"_id": 0})
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    # Get appointment
    appointment = await db.appointments.find_one(
        {"appointment_id": appointment_id, "tenant_id": tenant["tenant_id"]},
        {"_id": 0}
    )
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    
    # Check permission
    if user:
        if user.role != "admin" and appointment.get("client_user_id") != user.user_id:
            raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Check for blocked times
    blocked = await db.blocked_times.find(
        {
            "tenant_id": tenant["tenant_id"],
            "employee_id": appointment["employee_id"],
            "date": date
        },
        {"_id": 0}
    ).to_list(100)
    
    # Check for whole day block
    for block in blocked:
        if block.get("is_whole_day"):
            raise HTTPException(status_code=400, detail="Este dia está bloqueado para o funcionário")
    
    # Check for specific time blocks
    time_hour, time_min = map(int, time.split(":"))
    time_minutes = time_hour * 60 + time_min
    service_duration = appointment.get("service_duration", 30)
    time_end_minutes = time_minutes + service_duration
    
    for block in blocked:
        if block.get("start_time") and block.get("end_time"):
            block_start = int(block["start_time"].split(":")[0]) * 60 + int(block["start_time"].split(":")[1])
            block_end = int(block["end_time"].split(":")[0]) * 60 + int(block["end_time"].split(":")[1])
            
            # Check if appointment overlaps with blocked time
            if time_minutes < block_end and time_end_minutes > block_start:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Horário bloqueado ({block.get('reason', 'indisponível')})"
                )
    
    # Check for conflicts with other appointments
    existing = await db.appointments.find_one({
        "tenant_id": tenant["tenant_id"],
        "employee_id": appointment["employee_id"],
        "date": date,
        "time": time,
        "status": {"$in": ["pending", "confirmed"]},
        "appointment_id": {"$ne": appointment_id}
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Novo horário não disponível")
    
    await db.appointments.update_one(
        {"appointment_id": appointment_id},
        {"$set": {"date": date, "time": time}}
    )
    
    updated = await db.appointments.find_one({"appointment_id": appointment_id}, {"_id": 0})
    return updated

@api_router.delete("/appointments/{appointment_id}")
async def cancel_appointment(request: Request, appointment_id: str):
    """Cancel an appointment"""
    user = await get_current_user(request)
    tenant_slug = get_tenant_from_host(request)
    tenant = await db.tenants.find_one({"slug": tenant_slug}, {"_id": 0})
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    appointment = await db.appointments.find_one(
        {"appointment_id": appointment_id, "tenant_id": tenant["tenant_id"]},
        {"_id": 0}
    )
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    
    # Check permission
    if user:
        if user.role != "admin" and appointment.get("client_user_id") != user.user_id:
            raise HTTPException(status_code=403, detail="Acesso negado")
    
    await db.appointments.update_one(
        {"appointment_id": appointment_id},
        {"$set": {"status": "cancelled"}}
    )
    
    return {"message": "Agendamento cancelado com sucesso"}

# ============== BLOCKED TIMES ROUTES ==============

@api_router.get("/blocked-times", response_model=List[BlockedTime])
async def list_blocked_times(
    request: Request,
    employee_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """List blocked times (admin only)"""
    user = await require_admin(request)
    
    query = {"tenant_id": user.tenant_id}
    
    if employee_id:
        query["employee_id"] = employee_id
    
    if date_from:
        query["date"] = {"$gte": date_from}
    
    if date_to:
        if "date" in query:
            query["date"]["$lte"] = date_to
        else:
            query["date"] = {"$lte": date_to}
    
    blocked = await db.blocked_times.find(query, {"_id": 0}).to_list(500)
    return blocked

@api_router.post("/blocked-times", response_model=BlockedTime)
async def create_blocked_time(request: Request, data: BlockedTimeCreate):
    """Create a blocked time (admin only)"""
    user = await require_admin(request)
    
    # Check if there are appointments in this time
    if data.start_time and data.end_time:
        # Specific time range
        existing = await db.appointments.find_one({
            "tenant_id": user.tenant_id,
            "employee_id": data.employee_id,
            "date": data.date,
            "status": {"$in": ["pending", "confirmed"]}
        })
        
        if existing:
            # Check time overlap
            existing_hour, existing_min = map(int, existing["time"].split(":"))
            existing_minutes = existing_hour * 60 + existing_min
            block_start = int(data.start_time.split(":")[0]) * 60 + int(data.start_time.split(":")[1])
            block_end = int(data.end_time.split(":")[0]) * 60 + int(data.end_time.split(":")[1])
            
            if existing_minutes >= block_start and existing_minutes < block_end:
                raise HTTPException(
                    status_code=400,
                    detail="Existe agendamento neste horário. Cancele o agendamento primeiro."
                )
    else:
        # Whole day
        existing = await db.appointments.find_one({
            "tenant_id": user.tenant_id,
            "employee_id": data.employee_id,
            "date": data.date,
            "status": {"$in": ["pending", "confirmed"]}
        })
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Existem agendamentos neste dia. Cancele os agendamentos primeiro."
            )
    
    blocked_id = f"block_{uuid.uuid4().hex[:12]}"
    is_whole_day = not (data.start_time and data.end_time)
    
    blocked = {
        "blocked_id": blocked_id,
        "tenant_id": user.tenant_id,
        "employee_id": data.employee_id,
        "date": data.date,
        "start_time": data.start_time,
        "end_time": data.end_time,
        "reason": data.reason,
        "is_whole_day": is_whole_day,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.blocked_times.insert_one(blocked)
    return BlockedTime(**{k: v for k, v in blocked.items() if k != "_id"})

@api_router.delete("/blocked-times/{blocked_id}")
async def delete_blocked_time(request: Request, blocked_id: str):
    """Delete a blocked time (admin only)"""
    user = await require_admin(request)
    
    result = await db.blocked_times.delete_one(
        {"blocked_id": blocked_id, "tenant_id": user.tenant_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bloqueio não encontrado")
    
    return {"message": "Bloqueio removido com sucesso"}

# ============== REPORTS ROUTES ==============

@api_router.get("/reports/revenue")
async def get_revenue_report(
    request: Request,
    date_from: str,
    date_to: str
):
    """Get revenue report (admin only)"""
    user = await require_admin(request)
    
    # Get completed appointments
    appointments = await db.appointments.find({
        "tenant_id": user.tenant_id,
        "status": "completed",
        "date": {"$gte": date_from, "$lte": date_to}
    }, {"_id": 0}).to_list(1000)
    
    total_revenue = sum(appt.get("service_price", 0) for appt in appointments)
    total_appointments = len(appointments)
    
    # Group by service
    by_service = {}
    for appt in appointments:
        service_name = appt.get("service_name", "Desconhecido")
        if service_name not in by_service:
            by_service[service_name] = {"count": 0, "revenue": 0}
        by_service[service_name]["count"] += 1
        by_service[service_name]["revenue"] += appt.get("service_price", 0)
    
    # Group by employee
    by_employee = {}
    for appt in appointments:
        employee_name = appt.get("employee_name", "Desconhecido")
        if employee_name not in by_employee:
            by_employee[employee_name] = {"count": 0, "revenue": 0}
        by_employee[employee_name]["count"] += 1
        by_employee[employee_name]["revenue"] += appt.get("service_price", 0)
    
    return {
        "total_revenue": total_revenue,
        "total_appointments": total_appointments,
        "by_service": by_service,
        "by_employee": by_employee,
        "date_from": date_from,
        "date_to": date_to
    }

# ============== EMAIL ROUTES ==============

async def send_email_async(to_email: str, subject: str, html_content: str):
    """Send email asynchronously using Resend"""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return None
    
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to_email}: {email.get('id')}")
        return email
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return None

def get_client_reminder_email(appointment: dict, tenant_name: str) -> str:
    """Generate HTML email for client reminder"""
    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2C4A3B 0%, #3d6350 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✨ Lembrete de Agendamento</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Olá <strong>{appointment.get('client_name', 'Cliente')}</strong>!
            </p>
            <p style="color: #666; font-size: 15px;">
                Este é um lembrete do seu agendamento em <strong>{tenant_name}</strong>:
            </p>
            <div style="background: #f8f7f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #888;">📅 Data:</td>
                        <td style="padding: 8px 0; color: #333; font-weight: 600;">{appointment.get('date', '')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #888;">⏰ Horário:</td>
                        <td style="padding: 8px 0; color: #333; font-weight: 600;">{appointment.get('time', '')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #888;">💇 Serviço:</td>
                        <td style="padding: 8px 0; color: #333; font-weight: 600;">{appointment.get('service_name', '')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #888;">👤 Profissional:</td>
                        <td style="padding: 8px 0; color: #333; font-weight: 600;">{appointment.get('employee_name', '')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #888;">💰 Valor:</td>
                        <td style="padding: 8px 0; color: #2C4A3B; font-weight: 600;">R$ {appointment.get('service_price', 0):.2f}</td>
                    </tr>
                </table>
            </div>
            <p style="color: #666; font-size: 14px;">
                Caso precise reagendar ou cancelar, acesse nosso sistema online.
            </p>
            <p style="color: #888; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                {tenant_name} - Sistema de Agendamentos
            </p>
        </div>
    </div>
    """

def get_employee_reminder_email(appointment: dict, tenant_name: str) -> str:
    """Generate HTML email for employee reminder"""
    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2C4A3B 0%, #3d6350 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📋 Lembrete de Atendimento</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Olá <strong>{appointment.get('employee_name', 'Profissional')}</strong>!
            </p>
            <p style="color: #666; font-size: 15px;">
                Você tem um atendimento agendado:
            </p>
            <div style="background: #f8f7f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #888;">📅 Data:</td>
                        <td style="padding: 8px 0; color: #333; font-weight: 600;">{appointment.get('date', '')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #888;">⏰ Horário:</td>
                        <td style="padding: 8px 0; color: #333; font-weight: 600;">{appointment.get('time', '')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #888;">💇 Serviço:</td>
                        <td style="padding: 8px 0; color: #333; font-weight: 600;">{appointment.get('service_name', '')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #888;">👤 Cliente:</td>
                        <td style="padding: 8px 0; color: #333; font-weight: 600;">{appointment.get('client_name', '')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #888;">📧 Email:</td>
                        <td style="padding: 8px 0; color: #333;">{appointment.get('client_email', '')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #888;">📱 Telefone:</td>
                        <td style="padding: 8px 0; color: #333;">{appointment.get('client_phone', '-')}</td>
                    </tr>
                </table>
            </div>
            <p style="color: #888; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                {tenant_name} - Sistema de Agendamentos
            </p>
        </div>
    </div>
    """

class SendReminderRequest(BaseModel):
    appointment_id: str
    send_to_client: bool = True
    send_to_employee: bool = True

@api_router.post("/appointments/{appointment_id}/send-reminder")
async def send_appointment_reminder(
    request: Request,
    appointment_id: str,
    send_to_client: bool = True,
    send_to_employee: bool = True
):
    """Send reminder emails for an appointment (admin only)"""
    user = await require_admin(request)
    
    if not RESEND_API_KEY:
        raise HTTPException(status_code=400, detail="Serviço de email não configurado. Configure RESEND_API_KEY.")
    
    # Get appointment
    appointment = await db.appointments.find_one(
        {"appointment_id": appointment_id, "tenant_id": user.tenant_id},
        {"_id": 0}
    )
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    
    # Get tenant info
    tenant = await db.tenants.find_one({"tenant_id": user.tenant_id}, {"_id": 0})
    tenant_name = tenant.get("name", "Salão") if tenant else "Salão"
    
    results = {"client": None, "employee": None}
    
    # Send to client
    if send_to_client and appointment.get("client_email"):
        client_html = get_client_reminder_email(appointment, tenant_name)
        client_result = await send_email_async(
            appointment["client_email"],
            f"Lembrete: Agendamento em {tenant_name} - {appointment.get('date')} às {appointment.get('time')}",
            client_html
        )
        results["client"] = "sent" if client_result else "failed"
    
    # Send to employee
    if send_to_employee:
        employee = await db.employees.find_one(
            {"employee_id": appointment.get("employee_id")},
            {"_id": 0}
        )
        if employee and employee.get("email"):
            employee_html = get_employee_reminder_email(appointment, tenant_name)
            employee_result = await send_email_async(
                employee["email"],
                f"Lembrete: Atendimento - {appointment.get('client_name')} - {appointment.get('date')} às {appointment.get('time')}",
                employee_html
            )
            results["employee"] = "sent" if employee_result else "failed"
        else:
            results["employee"] = "no_email"
    
    return {
        "message": "Lembretes processados",
        "results": results
    }

@api_router.post("/appointments/send-daily-reminders")
async def send_daily_reminders(request: Request, date: Optional[str] = None):
    """Send reminders for all appointments on a specific date (admin only)"""
    user = await require_admin(request)
    
    if not RESEND_API_KEY:
        raise HTTPException(status_code=400, detail="Serviço de email não configurado")
    
    # Default to tomorrow
    if not date:
        tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
        date = tomorrow.strftime("%Y-%m-%d")
    
    # Get all appointments for the date
    appointments = await db.appointments.find({
        "tenant_id": user.tenant_id,
        "date": date,
        "status": {"$in": ["pending", "confirmed"]}
    }, {"_id": 0}).to_list(100)
    
    # Get tenant info
    tenant = await db.tenants.find_one({"tenant_id": user.tenant_id}, {"_id": 0})
    tenant_name = tenant.get("name", "Salão") if tenant else "Salão"
    
    sent_count = 0
    failed_count = 0
    
    for appt in appointments:
        # Send to client
        if appt.get("client_email"):
            client_html = get_client_reminder_email(appt, tenant_name)
            result = await send_email_async(
                appt["client_email"],
                f"Lembrete: Agendamento amanhã em {tenant_name} - {appt.get('time')}",
                client_html
            )
            if result:
                sent_count += 1
            else:
                failed_count += 1
        
        # Send to employee
        employee = await db.employees.find_one(
            {"employee_id": appt.get("employee_id")},
            {"_id": 0}
        )
        if employee and employee.get("email"):
            employee_html = get_employee_reminder_email(appt, tenant_name)
            result = await send_email_async(
                employee["email"],
                f"Lembrete: Atendimento amanhã - {appt.get('client_name')} às {appt.get('time')}",
                employee_html
            )
            if result:
                sent_count += 1
            else:
                failed_count += 1
    
    return {
        "message": f"Lembretes enviados para {date}",
        "appointments_count": len(appointments),
        "emails_sent": sent_count,
        "emails_failed": failed_count
    }

# ============== ROOT ROUTE ==============

@api_router.get("/")
async def root():
    return {"message": "Salon Scheduler SaaS API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
