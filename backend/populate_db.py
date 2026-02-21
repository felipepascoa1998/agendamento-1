"""
Script para popular o banco MongoDB com dados iniciais para o sistema de agendamento.
Execute este script uma vez para criar coleções e registros básicos.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import hashlib
import os

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "agendamento")

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

async def main():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]

    # Tenant
    tenant = {
        "tenant_id": "tenant_demo",
        "name": "Demo Tenant",
        "slug": "demo",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    await db.tenants.update_one({"tenant_id": tenant["tenant_id"]}, {"$set": tenant}, upsert=True)

    # Usuário admin
    user = {
        "user_id": "admin1",
        "tenant_id": tenant["tenant_id"],
        "email": "admin@demo.com",
        "role": "admin",
        "hashed_password": hash_password("admin123")
    }
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": user}, upsert=True)

    # Serviço
    service = {
        "service_id": "service1",
        "tenant_id": tenant["tenant_id"],
        "name": "Corte de Cabelo",
        "duration": 30,
        "price": 50
    }
    await db.services.update_one({"service_id": service["service_id"]}, {"$set": service}, upsert=True)

    # Funcionário
    employee = {
        "employee_id": "employee1",
        "tenant_id": tenant["tenant_id"],
        "name": "João",
        "services": [service["service_id"]]
    }
    await db.employees.update_one({"employee_id": employee["employee_id"]}, {"$set": employee}, upsert=True)

    print("Dados iniciais criados com sucesso!")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
