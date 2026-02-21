from fastapi import APIRouter, Request, HTTPException
from backend.services.report_service import get_revenue_report
from backend.utils.auth import require_admin

router = APIRouter(prefix="/reports")

@router.get("/revenue")
async def revenue_report_route(request: Request):
    db = request.app.state.db
    user = await require_admin(request, db)
    return await get_revenue_report(db, user.tenant_id)
