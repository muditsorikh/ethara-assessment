"""
Attendance management routes.
"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date as date_type
from bson import ObjectId

from app.database import get_database
from app.models import (
    AttendanceCreate,
    AttendanceResponse,
    AttendanceListResponse,
    AttendanceSummary,
    SuccessResponse,
    ErrorResponse
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])


def attendance_helper(record, employee_name: str = None) -> dict:
    """Convert MongoDB attendance document to response format."""
    return {
        "id": str(record["_id"]),
        "employee_id": record["employee_id"],
        "date": record["date"].isoformat() if isinstance(record["date"], datetime) else str(record["date"]),
        "status": record["status"],
        "employee_name": employee_name
    }


@router.get(
    "",
    response_model=AttendanceListResponse,
    summary="Get all attendance records",
    description="Retrieve attendance records with optional filtering by employee_id and date range."
)
async def get_attendance_records(
    employee_id: Optional[str] = Query(None, description="Filter by employee ID"),
    start_date: Optional[date_type] = Query(None, description="Filter from date (inclusive)"),
    end_date: Optional[date_type] = Query(None, description="Filter to date (inclusive)")
):
    """Get attendance records with optional filters."""
    db = get_database()
    
    # Build query filter
    query = {}
    
    if employee_id:
        query["employee_id"] = employee_id
    
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = datetime.combine(start_date, datetime.min.time())
        if end_date:
            date_filter["$lte"] = datetime.combine(end_date, datetime.max.time())
        if date_filter:
            query["date"] = date_filter
    
    # Get employee names for lookup
    employees = {}
    cursor = db.employees.find()
    async for emp in cursor:
        employees[emp["employee_id"]] = emp["full_name"]
    
    # Get attendance records
    records = []
    cursor = db.attendance.find(query).sort("date", -1)
    async for record in cursor:
        employee_name = employees.get(record["employee_id"], "Unknown")
        records.append(attendance_helper(record, employee_name))
    
    return AttendanceListResponse(records=records, total=len(records))


@router.get(
    "/employee/{employee_id}",
    response_model=AttendanceListResponse,
    summary="Get attendance for specific employee",
    description="Retrieve all attendance records for a specific employee.",
    responses={404: {"model": ErrorResponse}}
)
async def get_employee_attendance(
    employee_id: str,
    start_date: Optional[date_type] = Query(None, description="Filter from date"),
    end_date: Optional[date_type] = Query(None, description="Filter to date")
):
    """Get attendance records for a specific employee."""
    db = get_database()
    
    # Check if employee exists
    employee = await db.employees.find_one({"employee_id": employee_id})
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID '{employee_id}' not found"
        )
    
    # Build query
    query = {"employee_id": employee_id}
    
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = datetime.combine(start_date, datetime.min.time())
        if end_date:
            date_filter["$lte"] = datetime.combine(end_date, datetime.max.time())
        if date_filter:
            query["date"] = date_filter
    
    # Get records
    records = []
    cursor = db.attendance.find(query).sort("date", -1)
    async for record in cursor:
        records.append(attendance_helper(record, employee["full_name"]))
    
    return AttendanceListResponse(records=records, total=len(records))


@router.get(
    "/summary/{employee_id}",
    response_model=AttendanceSummary,
    summary="Get attendance summary for employee",
    description="Get total present/absent days for an employee.",
    responses={404: {"model": ErrorResponse}}
)
async def get_attendance_summary(employee_id: str):
    """Get attendance summary for a specific employee."""
    db = get_database()
    
    # Check if employee exists
    employee = await db.employees.find_one({"employee_id": employee_id})
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID '{employee_id}' not found"
        )
    
    # Count attendance
    total_present = await db.attendance.count_documents({
        "employee_id": employee_id,
        "status": "Present"
    })
    
    total_absent = await db.attendance.count_documents({
        "employee_id": employee_id,
        "status": "Absent"
    })
    
    return AttendanceSummary(
        employee_id=employee_id,
        employee_name=employee["full_name"],
        total_present=total_present,
        total_absent=total_absent,
        total_days=total_present + total_absent
    )


@router.post(
    "",
    response_model=AttendanceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Mark attendance",
    description="Mark attendance for an employee on a specific date.",
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse}
    }
)
async def mark_attendance(attendance: AttendanceCreate):
    """Mark attendance for an employee."""
    db = get_database()
    
    # Check if employee exists
    employee = await db.employees.find_one({"employee_id": attendance.employee_id})
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID '{attendance.employee_id}' not found"
        )
    
    # Check if attendance already marked for this date
    attendance_date = datetime.combine(attendance.date, datetime.min.time())
    existing = await db.attendance.find_one({
        "employee_id": attendance.employee_id,
        "date": attendance_date
    })
    
    if existing:
        # Update existing record
        await db.attendance.update_one(
            {"_id": existing["_id"]},
            {"$set": {"status": attendance.status.value}}
        )
        existing["status"] = attendance.status.value
        return attendance_helper(existing, employee["full_name"])
    
    # Create new attendance record
    attendance_doc = {
        "employee_id": attendance.employee_id,
        "date": attendance_date,
        "status": attendance.status.value
    }
    
    result = await db.attendance.insert_one(attendance_doc)
    attendance_doc["_id"] = result.inserted_id
    
    return attendance_helper(attendance_doc, employee["full_name"])


@router.delete(
    "/{record_id}",
    response_model=SuccessResponse,
    summary="Delete attendance record",
    description="Delete a specific attendance record.",
    responses={404: {"model": ErrorResponse}}
)
async def delete_attendance(record_id: str):
    """Delete an attendance record."""
    db = get_database()
    
    try:
        obj_id = ObjectId(record_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid record ID format"
        )
    
    result = await db.attendance.delete_one({"_id": obj_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attendance record not found"
        )
    
    return SuccessResponse(message="Attendance record deleted successfully", id=record_id)
