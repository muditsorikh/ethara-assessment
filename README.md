# HRMS Lite - Human Resource Management System

A lightweight, full-stack HRMS application built with React, FastAPI, and MongoDB.

![HRMS Lite Dashboard](https://img.shields.io/badge/Status-Production%20Ready-green)
![React](https://img.shields.io/badge/React-18.2-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)

## 📋 Project Overview

HRMS Lite is a web-based Human Resource Management System designed for small to medium organizations. It allows administrators to manage employee records and track daily attendance with a clean, professional interface.

### Key Features

- **Employee Management**
  - Add new employees with ID, name, email, and department
  - View all employees in a searchable table
  - Delete employees (with cascade delete of attendance records)

- **Attendance Tracking**
  - Mark daily attendance (Present/Absent)
  - View attendance history with filtering options
  - Per-employee attendance summary (total present/absent days)

- **Dashboard**
  - Overview statistics (total employees, departments, today's attendance)
  - Department-wise employee distribution
  - Quick action links

### Screenshots

The application features:
- Clean, modern UI with consistent styling
- Responsive design for desktop and mobile
- Loading states, empty states, and error handling
- Toast notifications for user feedback

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icons
- **date-fns** - Date formatting

### Backend
- **FastAPI** - Python web framework
- **Motor** - Async MongoDB driver
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Database
- **MongoDB** - NoSQL database

### Deployment
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **MongoDB Atlas** - Database hosting

## 🚀 Live Demo

- **Frontend URL**: [Your Vercel URL]
- **Backend API**: [Your Render URL]
- **API Documentation**: [Your Render URL]/docs

> ⚠️ **Note**: Replace the URLs above with your actual deployed URLs

## 📁 Project Structure

```
ethara-assessment/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI application
│   │   ├── config.py        # Configuration settings
│   │   ├── database.py      # MongoDB connection
│   │   ├── models.py        # Pydantic schemas
│   │   └── routes/
│   │       ├── employees.py  # Employee endpoints
│   │       ├── attendance.py # Attendance endpoints
│   │       └── dashboard.py  # Dashboard endpoints
│   ├── requirements.txt
│   ├── Dockerfile
│   └── render.yaml
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔧 Local Development Setup

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **MongoDB** 7.0+ (or MongoDB Atlas account)

### 1. Clone the Repository

```bash
git clone https://github.com/muditsorikh/ethara-assessment.git
cd ethara-assessment
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your MongoDB connection string
# MONGODB_URL=mongodb://localhost:27017
# DATABASE_NAME=hrms_lite
# FRONTEND_URL=http://localhost:3000

# Run the backend server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env if needed
# VITE_API_URL=http://localhost:8000

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 4. Using Docker (Alternative)

```bash
# From project root directory
docker-compose up --build
```

This will start:
- MongoDB on port 27017
- Backend on port 8000
- Frontend on port 3000

## 📝 API Endpoints

### Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | Get all employees |
| GET | `/api/employees/{id}` | Get employee by ID |
| POST | `/api/employees` | Create new employee |
| DELETE | `/api/employees/{id}` | Delete employee |

### Attendance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance` | Get all attendance records |
| GET | `/api/attendance/employee/{id}` | Get attendance for employee |
| GET | `/api/attendance/summary/{id}` | Get attendance summary |
| POST | `/api/attendance` | Mark attendance |
| DELETE | `/api/attendance/{id}` | Delete attendance record |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get dashboard summary |

## 🚀 Deployment Instructions

### Backend (Render)

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables:
   - `MONGODB_URL`: Your MongoDB Atlas connection string
   - `DATABASE_NAME`: `hrms_lite`
   - `FRONTEND_URL`: Your Vercel frontend URL

### Frontend (Vercel)

1. Create a new project on [Vercel](https://vercel.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   - `VITE_API_URL`: Your Render backend URL

### Database (MongoDB Atlas)

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user
3. Whitelist IP addresses (0.0.0.0/0 for all)
4. Get connection string and use in backend env

## ⚠️ Assumptions & Limitations

- **Single Admin**: No authentication system; assumes single admin user
- **No Edit**: Employees cannot be edited, only added/deleted
- **Basic Validation**: Email format and required fields validation
- **No Pagination**: All records are loaded at once (suitable for small datasets)
- **UTC Dates**: All dates are stored and displayed in UTC

## 🎯 Bonus Features Implemented

✅ Filter attendance records by date range  
✅ Display total present/absent days per employee  
✅ Dashboard with summary statistics  
✅ Department-wise employee distribution chart

## 👤 Author

**Mudit Sorikh**
- GitHub: [@muditsorikh](https://github.com/muditsorikh)

## 📄 License

This project is created for assessment purposes.