from datetime import datetime

async def get_revenue_report(db, tenant_id: str):
    pipeline = [
        {"$match": {"tenant_id": tenant_id, "status": "completed"}},
        {"$group": {
            "_id": "$date",
            "total": {"$sum": "$service_price"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    result = await db.appointments.aggregate(pipeline).to_list(100)
    return result
