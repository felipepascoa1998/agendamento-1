from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import FastAPI
import os

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "agendamento")

async def connect_to_mongo(app: FastAPI):
    app.state.mongo_client = AsyncIOMotorClient(MONGODB_URI)
    app.state.db = app.state.mongo_client[DB_NAME]

async def close_mongo_connection(app: FastAPI):
    app.state.mongo_client.close()
