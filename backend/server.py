from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Query, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import pandas as pd
import io
from openpyxl import load_workbook

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Fiji Business Register Management System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserRole:
    ADMIN = "admin"
    OFFICER = "officer"
    END_USER = "end_user"

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = UserRole.END_USER
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Business(BaseModel):
    business_id: str = Field(default_factory=lambda: f"bus_{uuid.uuid4().hex[:12]}")
    business_name: str
    trading_name: Optional[str] = None
    tin: Optional[str] = None  # Tax Identification Number
    registration_number: Optional[str] = None
    registration_date: Optional[datetime] = None
    business_type: Optional[str] = None
    legal_status: Optional[str] = None
    fsic_code: str  # Fiji Standard Industrial Classification
    fsic_description: Optional[str] = None
    establishment_survey: Optional[str] = None
    province: Optional[str] = None
    division: Optional[str] = None
    tikina: Optional[str] = None
    address: Optional[str] = None
    postal_address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    employee_count: Optional[int] = None
    annual_turnover: Optional[float] = None
    status: str = "active"  # active, inactive, ceased, dormant
    data_source: str = "manual"  # manual, frcs_import, moj_import, excel_import
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    notes: Optional[str] = None

class BusinessCreate(BaseModel):
    business_name: str
    trading_name: Optional[str] = None
    tin: Optional[str] = None
    registration_number: Optional[str] = None
    registration_date: Optional[datetime] = None
    business_type: Optional[str] = None
    legal_status: Optional[str] = None
    fsic_code: str
    province: Optional[str] = None
    division: Optional[str] = None
    tikina: Optional[str] = None
    address: Optional[str] = None
    postal_address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    employee_count: Optional[int] = None
    annual_turnover: Optional[float] = None
    status: str = "active"
    notes: Optional[str] = None

class BusinessUpdate(BaseModel):
    business_name: Optional[str] = None
    trading_name: Optional[str] = None
    tin: Optional[str] = None
    registration_number: Optional[str] = None
    registration_date: Optional[datetime] = None
    business_type: Optional[str] = None
    legal_status: Optional[str] = None
    fsic_code: Optional[str] = None
    province: Optional[str] = None
    division: Optional[str] = None
    tikina: Optional[str] = None
    address: Optional[str] = None
    postal_address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    employee_count: Optional[int] = None
    annual_turnover: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class Notification(BaseModel):
    notification_id: str = Field(default_factory=lambda: f"notif_{uuid.uuid4().hex[:12]}")
    user_id: str
    title: str
    message: str
    type: str = "info"  # info, warning, success, error
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FSICCode(BaseModel):
    code: str
    section: str
    section_name: str
    division: str
    division_name: str
    group: Optional[str] = None
    group_name: Optional[str] = None
    class_code: Optional[str] = None
    class_name: Optional[str] = None
    description: str
    establishment_survey: str

class ImportLog(BaseModel):
    import_id: str = Field(default_factory=lambda: f"imp_{uuid.uuid4().hex[:12]}")
    import_type: str  # excel, frcs, moj
    file_name: Optional[str] = None
    records_processed: int = 0
    records_created: int = 0
    records_updated: int = 0
    records_failed: int = 0
    errors: List[str] = []
    imported_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============== FSIC 2010 DATA (Based on ISIC Rev 4) ==============

FSIC_SECTIONS = {
    "A": {"name": "Agriculture, Forestry and Fishing", "divisions": ["01", "02", "03"], "survey": "Agriculture Forestry Fishing"},
    "B": {"name": "Mining and Quarrying", "divisions": ["05", "06", "07", "08", "09"], "survey": "Mining and Quarrying"},
    "C": {"name": "Manufacturing", "divisions": [f"{i:02d}" for i in range(10, 34)], "survey": "Manufacturing"},
    "D": {"name": "Electricity, Gas, Steam and Air Conditioning Supply", "divisions": ["35"], "survey": "Electricity"},
    "E": {"name": "Water Supply; Sewerage, Waste Management", "divisions": ["36", "37", "38", "39"], "survey": "Water and Sewerage"},
    "F": {"name": "Construction", "divisions": ["41", "42", "43"], "survey": "Construction"},
    "G": {"name": "Wholesale and Retail Trade; Repair of Motor Vehicles", "divisions": ["45", "46", "47"], "survey": "Wholesale Retail Trade"},
    "H": {"name": "Transportation and Storage", "divisions": ["49", "50", "51", "52", "53"], "survey": "Transport"},
    "I": {"name": "Accommodation and Food Service Activities", "divisions": ["55", "56"], "survey": "Accommodation and Food Services"},
    "J": {"name": "Information and Communication", "divisions": ["58", "59", "60", "61", "62", "63"], "survey": "Information and Communication"},
    "K": {"name": "Financial and Insurance Activities", "divisions": ["64", "65", "66"], "survey": "Financial Activities"},
    "L": {"name": "Real Estate Activities", "divisions": ["68"], "survey": "Real Estate Activities"},
    "M": {"name": "Professional, Scientific and Technical Activities", "divisions": ["69", "70", "71", "72", "73", "74", "75"], "survey": "Professional Scientific and Technical Activities"},
    "N": {"name": "Administrative and Support Service Activities", "divisions": ["77", "78", "79", "80", "81", "82"], "survey": "Administrative and Support Service Activities"},
    "O": {"name": "Public Administration and Defence", "divisions": ["84"], "survey": "Economic Surveys"},
    "P": {"name": "Education", "divisions": ["85"], "survey": "Education"},
    "Q": {"name": "Human Health and Social Work Activities", "divisions": ["86", "87", "88"], "survey": "Human Health"},
    "R": {"name": "Arts, Entertainment and Recreation", "divisions": ["90", "91", "92", "93"], "survey": "Arts Entertainment and Recreation"},
    "S": {"name": "Other Service Activities", "divisions": ["94", "95", "96"], "survey": "Economic Surveys"},
    "T": {"name": "Activities of Households as Employers", "divisions": ["97", "98"], "survey": "Economic Surveys"},
    "U": {"name": "Activities of Extraterritorial Organizations", "divisions": ["99"], "survey": "Economic Surveys"},
}

FSIC_DIVISIONS = {
    "01": {"name": "Crop and Animal Production, Hunting", "section": "A"},
    "02": {"name": "Forestry and Logging", "section": "A"},
    "03": {"name": "Fishing and Aquaculture", "section": "A"},
    "05": {"name": "Mining of Coal and Lignite", "section": "B"},
    "06": {"name": "Extraction of Crude Petroleum and Natural Gas", "section": "B"},
    "07": {"name": "Mining of Metal Ores", "section": "B"},
    "08": {"name": "Other Mining and Quarrying", "section": "B"},
    "09": {"name": "Mining Support Service Activities", "section": "B"},
    "10": {"name": "Manufacture of Food Products", "section": "C"},
    "11": {"name": "Manufacture of Beverages", "section": "C"},
    "12": {"name": "Manufacture of Tobacco Products", "section": "C"},
    "13": {"name": "Manufacture of Textiles", "section": "C"},
    "14": {"name": "Manufacture of Wearing Apparel", "section": "C"},
    "15": {"name": "Manufacture of Leather Products", "section": "C"},
    "16": {"name": "Manufacture of Wood Products", "section": "C"},
    "17": {"name": "Manufacture of Paper Products", "section": "C"},
    "18": {"name": "Printing and Reproduction of Recorded Media", "section": "C"},
    "19": {"name": "Manufacture of Coke and Refined Petroleum Products", "section": "C"},
    "20": {"name": "Manufacture of Chemicals and Chemical Products", "section": "C"},
    "21": {"name": "Manufacture of Pharmaceuticals", "section": "C"},
    "22": {"name": "Manufacture of Rubber and Plastics Products", "section": "C"},
    "23": {"name": "Manufacture of Other Non-metallic Mineral Products", "section": "C"},
    "24": {"name": "Manufacture of Basic Metals", "section": "C"},
    "25": {"name": "Manufacture of Fabricated Metal Products", "section": "C"},
    "26": {"name": "Manufacture of Computer, Electronic Products", "section": "C"},
    "27": {"name": "Manufacture of Electrical Equipment", "section": "C"},
    "28": {"name": "Manufacture of Machinery and Equipment", "section": "C"},
    "29": {"name": "Manufacture of Motor Vehicles", "section": "C"},
    "30": {"name": "Manufacture of Other Transport Equipment", "section": "C"},
    "31": {"name": "Manufacture of Furniture", "section": "C"},
    "32": {"name": "Other Manufacturing", "section": "C"},
    "33": {"name": "Repair and Installation of Machinery", "section": "C"},
    "35": {"name": "Electricity, Gas, Steam and Air Conditioning Supply", "section": "D"},
    "36": {"name": "Water Collection, Treatment and Supply", "section": "E"},
    "37": {"name": "Sewerage", "section": "E"},
    "38": {"name": "Waste Collection, Treatment and Disposal", "section": "E"},
    "39": {"name": "Remediation and Other Waste Management", "section": "E"},
    "41": {"name": "Construction of Buildings", "section": "F"},
    "42": {"name": "Civil Engineering", "section": "F"},
    "43": {"name": "Specialized Construction Activities", "section": "F"},
    "45": {"name": "Wholesale and Retail Trade of Motor Vehicles", "section": "G"},
    "46": {"name": "Wholesale Trade, Except Motor Vehicles", "section": "G"},
    "47": {"name": "Retail Trade, Except Motor Vehicles", "section": "G"},
    "49": {"name": "Land Transport and Transport via Pipelines", "section": "H"},
    "50": {"name": "Water Transport", "section": "H"},
    "51": {"name": "Air Transport", "section": "H"},
    "52": {"name": "Warehousing and Support Activities for Transportation", "section": "H"},
    "53": {"name": "Postal and Courier Activities", "section": "H"},
    "55": {"name": "Accommodation", "section": "I"},
    "56": {"name": "Food and Beverage Service Activities", "section": "I"},
    "58": {"name": "Publishing Activities", "section": "J"},
    "59": {"name": "Motion Picture, Video, Television Production", "section": "J"},
    "60": {"name": "Programming and Broadcasting Activities", "section": "J"},
    "61": {"name": "Telecommunications", "section": "J"},
    "62": {"name": "Computer Programming and Consultancy", "section": "J"},
    "63": {"name": "Information Service Activities", "section": "J"},
    "64": {"name": "Financial Service Activities", "section": "K"},
    "65": {"name": "Insurance, Reinsurance and Pension Funding", "section": "K"},
    "66": {"name": "Activities Auxiliary to Financial Services", "section": "K"},
    "68": {"name": "Real Estate Activities", "section": "L"},
    "69": {"name": "Legal and Accounting Activities", "section": "M"},
    "70": {"name": "Activities of Head Offices; Management Consultancy", "section": "M"},
    "71": {"name": "Architectural and Engineering Activities", "section": "M"},
    "72": {"name": "Scientific Research and Development", "section": "M"},
    "73": {"name": "Advertising and Market Research", "section": "M"},
    "74": {"name": "Other Professional, Scientific, Technical Activities", "section": "M"},
    "75": {"name": "Veterinary Activities", "section": "M"},
    "77": {"name": "Rental and Leasing Activities", "section": "N"},
    "78": {"name": "Employment Activities", "section": "N"},
    "79": {"name": "Travel Agency, Tour Operator Activities", "section": "N"},
    "80": {"name": "Security and Investigation Activities", "section": "N"},
    "81": {"name": "Services to Buildings and Landscape Activities", "section": "N"},
    "82": {"name": "Office Administrative and Support Activities", "section": "N"},
    "84": {"name": "Public Administration and Defence", "section": "O"},
    "85": {"name": "Education", "section": "P"},
    "86": {"name": "Human Health Activities", "section": "Q"},
    "87": {"name": "Residential Care Activities", "section": "Q"},
    "88": {"name": "Social Work Activities without Accommodation", "section": "Q"},
    "90": {"name": "Creative, Arts and Entertainment Activities", "section": "R"},
    "91": {"name": "Libraries, Archives, Museums", "section": "R"},
    "92": {"name": "Gambling and Betting Activities", "section": "R"},
    "93": {"name": "Sports Activities and Amusement", "section": "R"},
    "94": {"name": "Activities of Membership Organizations", "section": "S"},
    "95": {"name": "Repair of Computers and Personal Goods", "section": "S"},
    "96": {"name": "Other Personal Service Activities", "section": "S"},
    "97": {"name": "Activities of Households as Employers", "section": "T"},
    "98": {"name": "Undifferentiated Goods/Services-Producing Activities", "section": "T"},
    "99": {"name": "Activities of Extraterritorial Organizations", "section": "U"},
}

ESTABLISHMENT_SURVEYS = [
    "Economic Surveys",
    "Accommodation and Food Services",
    "Administrative and Support Service Activities",
    "Agriculture Forestry Fishing",
    "Arts Entertainment and Recreation",
    "Construction",
    "Education",
    "Electricity",
    "Financial Activities",
    "Human Health",
    "Information and Communication",
    "Manufacturing",
    "Mining and Quarrying",
    "Professional Scientific and Technical Activities",
    "Real Estate Activities",
    "Transport",
    "Water and Sewerage",
    "Wholesale Retail Trade",
]

FIJI_PROVINCES = [
    "Ba", "Bua", "Cakaudrove", "Kadavu", "Lau", "Lomaiviti",
    "Macuata", "Nadroga-Navosa", "Naitasiri", "Namosi", "Ra",
    "Rewa", "Rotuma", "Serua", "Tailevu"
]

FIJI_DIVISIONS = ["Central", "Eastern", "Northern", "Western"]

# ============== HELPER FUNCTIONS ==============

def get_establishment_survey(fsic_code: str) -> str:
    """Determine the establishment survey based on FSIC code"""
    if not fsic_code:
        return "Economic Surveys"
    
    division = fsic_code[:2] if len(fsic_code) >= 2 else fsic_code
    
    if division in FSIC_DIVISIONS:
        section = FSIC_DIVISIONS[division]["section"]
        if section in FSIC_SECTIONS:
            return FSIC_SECTIONS[section]["survey"]
    
    return "Economic Surveys"

def get_fsic_description(fsic_code: str) -> dict:
    """Get FSIC code description"""
    if not fsic_code:
        return {"section": "", "section_name": "", "division": "", "division_name": "", "survey": "Economic Surveys"}
    
    division = fsic_code[:2] if len(fsic_code) >= 2 else fsic_code
    
    if division in FSIC_DIVISIONS:
        div_info = FSIC_DIVISIONS[division]
        section = div_info["section"]
        section_info = FSIC_SECTIONS.get(section, {})
        return {
            "section": section,
            "section_name": section_info.get("name", ""),
            "division": division,
            "division_name": div_info["name"],
            "survey": section_info.get("survey", "Economic Surveys")
        }
    
    return {"section": "", "section_name": "", "division": "", "division_name": "", "survey": "Economic Surveys"}

async def get_current_user(request: Request) -> Optional[dict]:
    """Get current user from session token"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        return None
    
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    return user_doc

async def require_auth(request: Request) -> dict:
    """Require authentication"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_admin(request: Request) -> dict:
    """Require admin role"""
    user = await require_auth(request)
    if user.get("role") != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_officer_or_admin(request: Request) -> dict:
    """Require officer or admin role"""
    user = await require_auth(request)
    if user.get("role") not in [UserRole.ADMIN, UserRole.OFFICER]:
        raise HTTPException(status_code=403, detail="Officer or Admin access required")
    return user

# ============== AUTH ROUTES ==============

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id for session_token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Exchange session_id with Emergent Auth
    async with httpx.AsyncClient() as client:
        auth_response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_data = auth_response.json()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    email = user_data.get("email")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "name": user_data.get("name"),
                "picture": user_data.get("picture"),
                "last_login": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        # Create new user
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": user_data.get("name"),
            "picture": user_data.get("picture"),
            "role": UserRole.END_USER,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    # Create session
    session_token = user_data.get("session_token", f"sess_{uuid.uuid4().hex}")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Remove old sessions for this user
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Get user data
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return user_doc

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    
    return {"message": "Logged out successfully"}

# ============== USER MANAGEMENT ROUTES ==============

@api_router.get("/users")
async def get_users(request: Request):
    """Get all users (admin only)"""
    await require_admin(request)
    
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

@api_router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, request: Request):
    """Update user role (admin only)"""
    await require_admin(request)
    
    body = await request.json()
    new_role = body.get("role")
    
    if new_role not in [UserRole.ADMIN, UserRole.OFFICER, UserRole.END_USER]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"role": new_role}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Role updated successfully"}

# ============== BUSINESS ROUTES ==============

@api_router.get("/businesses")
async def get_businesses(
    request: Request,
    search: Optional[str] = None,
    status: Optional[str] = None,
    fsic_section: Optional[str] = None,
    survey: Optional[str] = None,
    province: Optional[str] = None,
    data_source: Optional[str] = None,
    page: int = 1,
    limit: int = 50
):
    """Get businesses with filtering and pagination"""
    await require_auth(request)
    
    query = {}
    
    if search:
        query["$or"] = [
            {"business_name": {"$regex": search, "$options": "i"}},
            {"trading_name": {"$regex": search, "$options": "i"}},
            {"tin": {"$regex": search, "$options": "i"}},
            {"registration_number": {"$regex": search, "$options": "i"}},
        ]
    
    if status:
        query["status"] = status
    
    if fsic_section:
        # Find all division codes for this section
        if fsic_section in FSIC_SECTIONS:
            divisions = FSIC_SECTIONS[fsic_section]["divisions"]
            query["fsic_code"] = {"$regex": f"^({'|'.join(divisions)})"}
    
    if survey:
        query["establishment_survey"] = survey
    
    if province:
        query["province"] = province
    
    if data_source:
        query["data_source"] = data_source
    
    skip = (page - 1) * limit
    
    total = await db.businesses.count_documents(query)
    businesses = await db.businesses.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    return {
        "businesses": businesses,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/businesses/{business_id}")
async def get_business(business_id: str, request: Request):
    """Get single business by ID"""
    await require_auth(request)
    
    business = await db.businesses.find_one({"business_id": business_id}, {"_id": 0})
    
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    return business

@api_router.post("/businesses")
async def create_business(business_data: BusinessCreate, request: Request):
    """Create new business"""
    user = await require_officer_or_admin(request)
    
    # Auto-determine establishment survey
    fsic_info = get_fsic_description(business_data.fsic_code)
    establishment_survey = fsic_info["survey"]
    
    business = Business(
        **business_data.model_dump(),
        fsic_description=fsic_info["division_name"],
        establishment_survey=establishment_survey,
        data_source="manual",
        created_by=user["user_id"],
        updated_by=user["user_id"]
    )
    
    await db.businesses.insert_one(business.model_dump())
    
    # Create notification
    notification = Notification(
        user_id=user["user_id"],
        title="Business Created",
        message=f"New business '{business_data.business_name}' has been added to the register.",
        type="success"
    )
    await db.notifications.insert_one(notification.model_dump())
    
    return business.model_dump()

@api_router.put("/businesses/{business_id}")
async def update_business(business_id: str, business_data: BusinessUpdate, request: Request):
    """Update business"""
    user = await require_officer_or_admin(request)
    
    existing = await db.businesses.find_one({"business_id": business_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Business not found")
    
    update_dict = {k: v for k, v in business_data.model_dump().items() if v is not None}
    
    # Update FSIC description and survey if code changed
    if "fsic_code" in update_dict:
        fsic_info = get_fsic_description(update_dict["fsic_code"])
        update_dict["fsic_description"] = fsic_info["division_name"]
        update_dict["establishment_survey"] = fsic_info["survey"]
    
    update_dict["last_updated"] = datetime.now(timezone.utc).isoformat()
    update_dict["updated_by"] = user["user_id"]
    
    await db.businesses.update_one(
        {"business_id": business_id},
        {"$set": update_dict}
    )
    
    updated = await db.businesses.find_one({"business_id": business_id}, {"_id": 0})
    return updated

@api_router.delete("/businesses/{business_id}")
async def delete_business(business_id: str, request: Request):
    """Delete business (admin only)"""
    await require_admin(request)
    
    result = await db.businesses.delete_one({"business_id": business_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Business not found")
    
    return {"message": "Business deleted successfully"}

# ============== IMPORT ROUTES ==============

@api_router.post("/import/excel")
async def import_excel(request: Request, file: UploadFile = File(...)):
    """Import businesses from Excel/CSV file"""
    user = await require_officer_or_admin(request)
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    content = await file.read()
    
    import_log = ImportLog(
        import_type="excel",
        file_name=file.filename,
        imported_by=user["user_id"]
    )
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use .xlsx, .xls, or .csv")
        
        # Expected columns mapping
        column_mapping = {
            'business_name': ['business_name', 'business name', 'name', 'company_name', 'company name'],
            'trading_name': ['trading_name', 'trading name', 'trade_name', 'trade name'],
            'tin': ['tin', 'tax_id', 'tax id', 'tax_identification_number'],
            'registration_number': ['registration_number', 'registration number', 'reg_no', 'reg no'],
            'fsic_code': ['fsic_code', 'fsic code', 'isic_code', 'industry_code', 'activity_code'],
            'province': ['province', 'location_province'],
            'division': ['division', 'location_division'],
            'address': ['address', 'business_address', 'street_address'],
            'phone': ['phone', 'telephone', 'contact_number'],
            'email': ['email', 'business_email', 'contact_email'],
            'employee_count': ['employee_count', 'employees', 'num_employees', 'staff_count'],
            'status': ['status', 'business_status'],
        }
        
        # Normalize column names
        df.columns = df.columns.str.lower().str.strip()
        
        records_created = 0
        records_updated = 0
        records_failed = 0
        errors = []
        
        for idx, row in df.iterrows():
            try:
                # Map columns
                business_dict = {}
                
                for field, possible_names in column_mapping.items():
                    for col_name in possible_names:
                        if col_name in df.columns:
                            value = row[col_name]
                            if pd.notna(value):
                                business_dict[field] = str(value).strip() if not isinstance(value, (int, float)) else value
                            break
                
                if 'business_name' not in business_dict or not business_dict['business_name']:
                    errors.append(f"Row {idx + 2}: Missing business name")
                    records_failed += 1
                    continue
                
                if 'fsic_code' not in business_dict:
                    business_dict['fsic_code'] = '99'  # Default to extraterritorial
                
                # Get FSIC info
                fsic_info = get_fsic_description(business_dict.get('fsic_code', ''))
                business_dict['fsic_description'] = fsic_info['division_name']
                business_dict['establishment_survey'] = fsic_info['survey']
                business_dict['data_source'] = 'excel_import'
                business_dict['created_by'] = user['user_id']
                business_dict['updated_by'] = user['user_id']
                business_dict['last_updated'] = datetime.now(timezone.utc).isoformat()
                business_dict['created_at'] = datetime.now(timezone.utc).isoformat()
                
                # Check for existing business by TIN or registration number
                existing = None
                if business_dict.get('tin'):
                    existing = await db.businesses.find_one({"tin": business_dict['tin']})
                elif business_dict.get('registration_number'):
                    existing = await db.businesses.find_one({"registration_number": business_dict['registration_number']})
                
                if existing:
                    # Update existing
                    business_dict.pop('created_at', None)
                    await db.businesses.update_one(
                        {"business_id": existing['business_id']},
                        {"$set": business_dict}
                    )
                    records_updated += 1
                else:
                    # Create new
                    business_dict['business_id'] = f"bus_{uuid.uuid4().hex[:12]}"
                    business_dict['status'] = business_dict.get('status', 'active')
                    await db.businesses.insert_one(business_dict)
                    records_created += 1
                    
            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")
                records_failed += 1
        
        import_log.records_processed = len(df)
        import_log.records_created = records_created
        import_log.records_updated = records_updated
        import_log.records_failed = records_failed
        import_log.errors = errors[:50]  # Limit errors stored
        
        await db.import_logs.insert_one(import_log.model_dump())
        
        return {
            "import_id": import_log.import_id,
            "records_processed": len(df),
            "records_created": records_created,
            "records_updated": records_updated,
            "records_failed": records_failed,
            "errors": errors[:10]
        }
        
    except Exception as e:
        logger.error(f"Import error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

@api_router.post("/import/frcs")
async def import_frcs(request: Request, file: UploadFile = File(...)):
    """Import FRCS (Fiji Revenue & Customs Service) data"""
    user = await require_officer_or_admin(request)
    
    # Same logic as Excel import but tagged as FRCS source
    content = await file.read()
    
    import_log = ImportLog(
        import_type="frcs",
        file_name=file.filename,
        imported_by=user["user_id"]
    )
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        df.columns = df.columns.str.lower().str.strip()
        
        records_created = 0
        records_updated = 0
        
        for idx, row in df.iterrows():
            business_dict = {}
            for col in df.columns:
                if pd.notna(row[col]):
                    business_dict[col.replace(' ', '_')] = row[col]
            
            if 'business_name' not in business_dict:
                continue
            
            business_dict['data_source'] = 'frcs_import'
            business_dict['updated_by'] = user['user_id']
            business_dict['last_updated'] = datetime.now(timezone.utc).isoformat()
            
            # Check for existing by TIN
            existing = None
            if business_dict.get('tin'):
                existing = await db.businesses.find_one({"tin": business_dict['tin']})
            
            if existing:
                await db.businesses.update_one(
                    {"business_id": existing['business_id']},
                    {"$set": business_dict}
                )
                records_updated += 1
            else:
                fsic_code = business_dict.get('fsic_code', '99')
                fsic_info = get_fsic_description(fsic_code)
                business_dict['fsic_code'] = fsic_code
                business_dict['fsic_description'] = fsic_info['division_name']
                business_dict['establishment_survey'] = fsic_info['survey']
                business_dict['business_id'] = f"bus_{uuid.uuid4().hex[:12]}"
                business_dict['status'] = 'active'
                business_dict['created_by'] = user['user_id']
                business_dict['created_at'] = datetime.now(timezone.utc).isoformat()
                await db.businesses.insert_one(business_dict)
                records_created += 1
        
        import_log.records_processed = len(df)
        import_log.records_created = records_created
        import_log.records_updated = records_updated
        
        await db.import_logs.insert_one(import_log.model_dump())
        
        return {
            "import_id": import_log.import_id,
            "records_processed": len(df),
            "records_created": records_created,
            "records_updated": records_updated
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FRCS import failed: {str(e)}")

@api_router.post("/import/moj")
async def import_moj(request: Request, file: UploadFile = File(...)):
    """Import MOJ (Ministry of Justice) data"""
    user = await require_officer_or_admin(request)
    
    content = await file.read()
    
    import_log = ImportLog(
        import_type="moj",
        file_name=file.filename,
        imported_by=user["user_id"]
    )
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        df.columns = df.columns.str.lower().str.strip()
        
        records_created = 0
        records_updated = 0
        
        for idx, row in df.iterrows():
            business_dict = {}
            for col in df.columns:
                if pd.notna(row[col]):
                    business_dict[col.replace(' ', '_')] = row[col]
            
            if 'business_name' not in business_dict:
                continue
            
            business_dict['data_source'] = 'moj_import'
            business_dict['updated_by'] = user['user_id']
            business_dict['last_updated'] = datetime.now(timezone.utc).isoformat()
            
            # Check for existing by registration number
            existing = None
            if business_dict.get('registration_number'):
                existing = await db.businesses.find_one({"registration_number": business_dict['registration_number']})
            
            if existing:
                await db.businesses.update_one(
                    {"business_id": existing['business_id']},
                    {"$set": business_dict}
                )
                records_updated += 1
            else:
                fsic_code = business_dict.get('fsic_code', '99')
                fsic_info = get_fsic_description(fsic_code)
                business_dict['fsic_code'] = fsic_code
                business_dict['fsic_description'] = fsic_info['division_name']
                business_dict['establishment_survey'] = fsic_info['survey']
                business_dict['business_id'] = f"bus_{uuid.uuid4().hex[:12]}"
                business_dict['status'] = 'active'
                business_dict['created_by'] = user['user_id']
                business_dict['created_at'] = datetime.now(timezone.utc).isoformat()
                await db.businesses.insert_one(business_dict)
                records_created += 1
        
        import_log.records_processed = len(df)
        import_log.records_created = records_created
        import_log.records_updated = records_updated
        
        await db.import_logs.insert_one(import_log.model_dump())
        
        return {
            "import_id": import_log.import_id,
            "records_processed": len(df),
            "records_created": records_created,
            "records_updated": records_updated
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MOJ import failed: {str(e)}")

@api_router.get("/import/logs")
async def get_import_logs(request: Request, limit: int = 20):
    """Get import history"""
    await require_officer_or_admin(request)
    
    logs = await db.import_logs.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return logs

# ============== FSIC ROUTES ==============

@api_router.get("/fsic/sections")
async def get_fsic_sections():
    """Get all FSIC sections"""
    sections = []
    for code, info in FSIC_SECTIONS.items():
        sections.append({
            "code": code,
            "name": info["name"],
            "survey": info["survey"],
            "divisions": info["divisions"]
        })
    return sections

@api_router.get("/fsic/divisions")
async def get_fsic_divisions(section: Optional[str] = None):
    """Get FSIC divisions, optionally filtered by section"""
    divisions = []
    for code, info in FSIC_DIVISIONS.items():
        if section is None or info["section"] == section:
            section_info = FSIC_SECTIONS.get(info["section"], {})
            divisions.append({
                "code": code,
                "name": info["name"],
                "section": info["section"],
                "section_name": section_info.get("name", ""),
                "survey": section_info.get("survey", "Economic Surveys")
            })
    return divisions

@api_router.get("/fsic/lookup/{code}")
async def lookup_fsic(code: str):
    """Lookup FSIC code details"""
    info = get_fsic_description(code)
    return info

@api_router.get("/surveys")
async def get_surveys():
    """Get all establishment surveys"""
    return ESTABLISHMENT_SURVEYS

# ============== STATISTICS ROUTES ==============

@api_router.get("/stats/dashboard")
async def get_dashboard_stats(request: Request):
    """Get dashboard statistics"""
    await require_auth(request)
    
    total_businesses = await db.businesses.count_documents({})
    active_businesses = await db.businesses.count_documents({"status": "active"})
    inactive_businesses = await db.businesses.count_documents({"status": "inactive"})
    
    # By survey
    survey_stats = []
    for survey in ESTABLISHMENT_SURVEYS:
        count = await db.businesses.count_documents({"establishment_survey": survey})
        if count > 0:
            survey_stats.append({"survey": survey, "count": count})
    
    # By section
    section_stats = []
    for section, info in FSIC_SECTIONS.items():
        divisions = info["divisions"]
        count = await db.businesses.count_documents({
            "fsic_code": {"$regex": f"^({'|'.join(divisions)})"}
        })
        if count > 0:
            section_stats.append({
                "section": section,
                "name": info["name"],
                "count": count
            })
    
    # By province
    province_pipeline = [
        {"$match": {"province": {"$exists": True, "$ne": None}}},
        {"$group": {"_id": "$province", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    province_stats = await db.businesses.aggregate(province_pipeline).to_list(50)
    
    # By data source
    source_pipeline = [
        {"$group": {"_id": "$data_source", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    source_stats = await db.businesses.aggregate(source_pipeline).to_list(50)
    
    # Recent imports
    recent_imports = await db.import_logs.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_businesses": total_businesses,
        "active_businesses": active_businesses,
        "inactive_businesses": inactive_businesses,
        "by_survey": survey_stats,
        "by_section": section_stats,
        "by_province": [{"province": s["_id"], "count": s["count"]} for s in province_stats],
        "by_source": [{"source": s["_id"], "count": s["count"]} for s in source_stats],
        "recent_imports": recent_imports
    }

# ============== NOTIFICATION ROUTES ==============

@api_router.get("/notifications")
async def get_notifications(request: Request):
    """Get user notifications"""
    user = await require_auth(request)
    
    notifications = await db.notifications.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, request: Request):
    """Mark notification as read"""
    user = await require_auth(request)
    
    await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": user["user_id"]},
        {"$set": {"read": True}}
    )
    
    return {"message": "Notification marked as read"}

@api_router.post("/notifications/broadcast")
async def broadcast_notification(request: Request):
    """Broadcast notification to all users (admin only)"""
    await require_admin(request)
    
    body = await request.json()
    title = body.get("title")
    message = body.get("message")
    
    if not title or not message:
        raise HTTPException(status_code=400, detail="Title and message required")
    
    users = await db.users.find({}, {"user_id": 1, "_id": 0}).to_list(10000)
    
    notifications = []
    for user in users:
        notifications.append({
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_id": user["user_id"],
            "title": title,
            "message": message,
            "type": "info",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    if notifications:
        await db.notifications.insert_many(notifications)
    
    return {"message": f"Notification sent to {len(notifications)} users"}

# ============== PUBLIC REPORTS ROUTES ==============

@api_router.get("/public/statistics")
async def get_public_statistics():
    """Get public statistics for publishing - no authentication required"""
    total_businesses = await db.businesses.count_documents({})
    active_businesses = await db.businesses.count_documents({"status": "active"})
    inactive_businesses = await db.businesses.count_documents({"status": "inactive"})
    
    # By survey
    survey_stats = []
    for survey in ESTABLISHMENT_SURVEYS:
        count = await db.businesses.count_documents({"establishment_survey": survey})
        if count > 0:
            survey_stats.append({"survey": survey, "count": count})
    
    # By section
    section_stats = []
    for section, info in FSIC_SECTIONS.items():
        divisions = info["divisions"]
        count = await db.businesses.count_documents({
            "fsic_code": {"$regex": f"^({'|'.join(divisions)})"}
        })
        if count > 0:
            section_stats.append({
                "section": section,
                "name": info["name"],
                "count": count
            })
    
    # By province
    province_pipeline = [
        {"$match": {"province": {"$exists": True, "$ne": None}}},
        {"$group": {"_id": "$province", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    province_stats = await db.businesses.aggregate(province_pipeline).to_list(50)
    
    # By status
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    status_stats = await db.businesses.aggregate(status_pipeline).to_list(10)
    
    return {
        "report_title": "Fiji Business Register Statistics",
        "organization": "Fiji Bureau of Statistics",
        "division": "Economics Statistics Division",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_businesses": total_businesses,
            "active_businesses": active_businesses,
            "inactive_businesses": inactive_businesses,
            "active_rate": round((active_businesses / total_businesses * 100), 1) if total_businesses > 0 else 0,
            "total_sections": len([s for s in section_stats if s["count"] > 0]),
            "total_provinces": len(province_stats)
        },
        "by_survey": sorted(survey_stats, key=lambda x: x["count"], reverse=True),
        "by_section": sorted(section_stats, key=lambda x: x["count"], reverse=True),
        "by_province": [{"province": s["_id"], "count": s["count"]} for s in province_stats],
        "by_status": [{"status": s["_id"] or "unknown", "count": s["count"]} for s in status_stats],
        "methodology": {
            "classification": "FSIC 2010 (Based on ISIC Rev. 4)",
            "data_sources": ["Administrative Records", "FRCS Data", "MOJ Registrations", "Economic Surveys"],
            "coverage": "All registered businesses in Fiji engaged in production of goods and services"
        },
        "disclaimer": "These statistics are produced by the Fiji Bureau of Statistics for official use. Data is subject to revision."
    }

# ============== REFERENCE DATA ROUTES ==============

@api_router.get("/reference/provinces")
async def get_provinces():
    """Get Fiji provinces"""
    return FIJI_PROVINCES

@api_router.get("/reference/divisions")
async def get_divisions():
    """Get Fiji divisions"""
    return FIJI_DIVISIONS

@api_router.get("/")
async def root():
    return {"message": "Fiji Business Register Management System API"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
