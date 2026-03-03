"""
Pydantic models for request/response schemas.
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import date as date_type
from enum import Enum


class AttendanceStatus(str, Enum):
    """Attendance status enum."""
    PRESENT = "Present"
    ABSENT = "Absent"


# Employee Models
class EmployeeCreate(BaseModel):
    """Schema for creating a new employee."""
    employee_id: str = Field(..., min_length=1, max_length=50, description="Unique employee ID")
    full_name: str = Field(..., min_length=1, max_length=100, description="Employee's full name")
    email: EmailStr = Field(..., description="Employee's email address")
    department: str = Field(..., min_length=1, max_length=100, description="Department name")
    
    @field_validator('employee_id', 'full_name', 'department')
    @classmethod
    def validate_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Field cannot be empty or whitespace only')
        return v.strip()
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        return v.lower().strip()


class EmployeeResponse(BaseModel):
    """Schema for employee response."""
    id: str
    employee_id: str
    full_name: str
    email: str
    department: str
    created_at: str
    
    class Config:
        from_attributes = True


class EmployeeListResponse(BaseModel):
    """Schema for list of employees."""
    employees: List[EmployeeResponse]
    total: int


# Attendance Models
class AttendanceCreate(BaseModel):
    """Schema for marking attendance."""
    employee_id: str = Field(..., description="Employee ID")
    date: date_type = Field(..., description="Attendance date")
    status: AttendanceStatus = Field(..., description="Attendance status")


class AttendanceResponse(BaseModel):
    """Schema for attendance response."""
    id: str
    employee_id: str
    date: str
    status: str
    employee_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class AttendanceListResponse(BaseModel):
    """Schema for list of attendance records."""
    records: List[AttendanceResponse]
    total: int


class AttendanceSummary(BaseModel):
    """Schema for attendance summary."""
    employee_id: str
    employee_name: str
    total_present: int
    total_absent: int
    total_days: int


# Dashboard Models
class DashboardSummary(BaseModel):
    """Schema for dashboard summary."""
    total_employees: int
    total_departments: int
    today_present: int
    today_absent: int
    departments: List[dict]


# Error Models
class ErrorResponse(BaseModel):
    """Schema for error responses."""
    detail: str
    error_code: Optional[str] = None


class SuccessResponse(BaseModel):
    """Schema for success responses."""
    message: str
    id: Optional[str] = None
