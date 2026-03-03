"""
Employee management routes.
"""
from fastapi import APIRouter, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId

from app.database import get_database
from app.models import (
    EmployeeCreate,
    EmployeeResponse,
    EmployeeListResponse,
    SuccessResponse,
    ErrorResponse
)

router = APIRouter(prefix="/employees", tags=["Employees"])


def employee_helper(employee) -> dict:
    """Convert MongoDB employee document to response format."""
    return {
        "id": str(employee["_id"]),
        "employee_id": employee["employee_id"],
        "full_name": employee["full_name"],
        "email": employee["email"],
        "department": employee["department"],
        "created_at": employee["created_at"].isoformat() if isinstance(employee["created_at"], datetime) else employee["created_at"]
    }


@router.get(
    "",
    response_model=EmployeeListResponse,
    summary="Get all employees",
    description="Retrieve a list of all employees in the system."
)
async def get_all_employees():
    """Get all employees."""
    db = get_database()
    employees = []
    
    cursor = db.employees.find().sort("created_at", -1)
    async for employee in cursor:
        employees.append(employee_helper(employee))
    
    return EmployeeListResponse(employees=employees, total=len(employees))


@router.get(
    "/{employee_id}",
    response_model=EmployeeResponse,
    summary="Get employee by ID",
    description="Retrieve a specific employee by their employee ID.",
    responses={404: {"model": ErrorResponse}}
)
async def get_employee(employee_id: str):
    """Get a specific employee by employee_id."""
    db = get_database()
    
    employee = await db.employees.find_one({"employee_id": employee_id})
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID '{employee_id}' not found"
        )
    
    return employee_helper(employee)


@router.post(
    "",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new employee",
    description="Add a new employee to the system.",
    responses={
        400: {"model": ErrorResponse},
        409: {"model": ErrorResponse}
    }
)
async def create_employee(employee: EmployeeCreate):
    """Create a new employee."""
    db = get_database()
    
    # Check for duplicate employee_id
    existing_by_id = await db.employees.find_one({"employee_id": employee.employee_id})
    if existing_by_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Employee with ID '{employee.employee_id}' already exists"
        )
    
    # Check for duplicate email
    existing_by_email = await db.employees.find_one({"email": employee.email})
    if existing_by_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Employee with email '{employee.email}' already exists"
        )
    
    # Create employee document
    employee_doc = {
        "employee_id": employee.employee_id,
        "full_name": employee.full_name,
        "email": employee.email,
        "department": employee.department,
        "created_at": datetime.utcnow()
    }
    
    result = await db.employees.insert_one(employee_doc)
    employee_doc["_id"] = result.inserted_id
    
    return employee_helper(employee_doc)


@router.delete(
    "/{employee_id}",
    response_model=SuccessResponse,
    summary="Delete employee",
    description="Remove an employee from the system. This will also delete all their attendance records.",
    responses={404: {"model": ErrorResponse}}
)
async def delete_employee(employee_id: str):
    """Delete an employee and their attendance records."""
    db = get_database()
    
    # Check if employee exists
    employee = await db.employees.find_one({"employee_id": employee_id})
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID '{employee_id}' not found"
        )
    
    # Delete employee
    await db.employees.delete_one({"employee_id": employee_id})
    
    # Delete associated attendance records
    await db.attendance.delete_many({"employee_id": employee_id})
    
    return SuccessResponse(
        message=f"Employee '{employee['full_name']}' and their attendance records have been deleted",
        id=employee_id
    )
