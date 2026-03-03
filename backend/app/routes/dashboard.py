"""
Dashboard routes for summary statistics.
"""
from fastapi import APIRouter
from datetime import datetime, date as date_type

from app.database import get_database
from app.models import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "",
    response_model=DashboardSummary,
    summary="Get dashboard summary",
    description="Get overview statistics for the HRMS dashboard."
)
async def get_dashboard_summary():
    """Get dashboard summary with key metrics."""
    db = get_database()
    
    # Total employees
    total_employees = await db.employees.count_documents({})
    
    # Get unique departments
    pipeline = [
        {"$group": {"_id": "$department", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    departments = []
    async for dept in db.employees.aggregate(pipeline):
        departments.append({"name": dept["_id"], "count": dept["count"]})
    
    total_departments = len(departments)
    
    # Today's attendance
    today_start = datetime.combine(date_type.today(), datetime.min.time())
    today_end = datetime.combine(date_type.today(), datetime.max.time())
    
    today_present = await db.attendance.count_documents({
        "date": {"$gte": today_start, "$lte": today_end},
        "status": "Present"
    })
    
    today_absent = await db.attendance.count_documents({
        "date": {"$gte": today_start, "$lte": today_end},
        "status": "Absent"
    })
    
    return DashboardSummary(
        total_employees=total_employees,
        total_departments=total_departments,
        today_present=today_present,
        today_absent=today_absent,
        departments=departments
    )
