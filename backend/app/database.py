"""
MongoDB database connection and utilities.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from app.config import settings

client: Optional[AsyncIOMotorClient] = None
database = None


async def connect_to_mongodb():
    """Connect to MongoDB database."""
    global client, database
    
    print(f"Connecting to MongoDB at {settings.mongodb_url}...")
    client = AsyncIOMotorClient(settings.mongodb_url)
    database = client[settings.database_name]
    
    await database.employees.create_index("employee_id", unique=True)
    await database.employees.create_index("email", unique=True)
    await database.attendance.create_index([("employee_id", 1), ("date", 1)], unique=True)
    
    print(f"Connected to database: {settings.database_name}")


async def close_mongodb_connection():
    """Close MongoDB connection."""
    global client
    
    if client:
        client.close()
        print("MongoDB connection closed.")


def get_database():
    """Get database instance."""
    return database
