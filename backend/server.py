
"""
Salon Scheduler SaaS - Multi-tenant Backend
Sistema de agendamento para salões de beleza
"""


from fastapi import FastAPI, APIRouter

from fastapi.middleware.cors import CORSMiddleware
import logging
from backend.db import connect_to_mongo, close_mongo_connection

from backend.routes.tenant import router as tenant_router
from backend.routes.service import router as service_router
from backend.routes.employee import router as employee_router
from backend.routes.appointment import router as appointment_router
from backend.routes.auth import router as auth_router
from backend.routes.blocked_time import router as blocked_time_router
from backend.routes.report import router as report_router


app = FastAPI()
api_router = APIRouter()

# Configura logging básico
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============== ROOT ROUTE ==============

@api_router.get("/")
async def root():
    return {"message": "Salon Scheduler SaaS API", "version": "1.0.0"}


# Inclui todos os routers das rotas no api_router
api_router.include_router(tenant_router)
api_router.include_router(service_router)
api_router.include_router(employee_router)
api_router.include_router(appointment_router)
api_router.include_router(auth_router)
api_router.include_router(blocked_time_router)
api_router.include_router(report_router)


# Inclui o api_router no app principal com prefixo '/api'
app.include_router(api_router, prefix="/api")

# Eventos de inicialização e finalização do app para conectar/desconectar do MongoDB
@app.on_event("startup")
async def startup_event():
    logger.info("Conectando ao MongoDB...")
    await connect_to_mongo(app)
    logger.info("MongoDB conectado!")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Desconectando do MongoDB...")
    await close_mongo_connection(app)
    logger.info("MongoDB desconectado!")


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de depuração para logar requisições e respostas
@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Requisição: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Resposta: {response.status_code} para {request.method} {request.url}")
    return response

# Remova ou ajuste o shutdown_db_client se não houver client definido
