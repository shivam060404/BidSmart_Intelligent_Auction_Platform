from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import asyncio
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, auction_id: str):
        await websocket.accept()
        if auction_id not in self.active_connections:
            self.active_connections[auction_id] = []
        self.active_connections[auction_id].append(websocket)

    def disconnect(self, websocket: WebSocket, auction_id: str):
        if auction_id in self.active_connections:
            self.active_connections[auction_id].remove(websocket)
            if not self.active_connections[auction_id]:
                del self.active_connections[auction_id]

    async def broadcast(self, auction_id: str, message: dict):
        if auction_id in self.active_connections:
            for connection in self.active_connections[auction_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str  # "buyer" or "seller"
    rating: float = 5.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Auction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    auction_type: str  # "traditional" or "os_scheduled"
    starting_price: float
    current_price: float
    seller_id: str
    seller_name: str
    start_time: datetime
    end_time: datetime
    status: str = "active"  # "active", "ended", "cancelled"
    winner_id: Optional[str] = None
    winner_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AuctionCreate(BaseModel):
    title: str
    description: str
    auction_type: str
    starting_price: float
    duration_seconds: int

class Bid(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    auction_id: str
    bidder_id: str
    bidder_name: str
    bidder_rating: float
    amount: float
    bid_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    priority_score: Optional[float] = None  # For OS scheduled auctions

class BidCreate(BaseModel):
    auction_id: str
    amount: float

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise credentials_exception
    return User(**user)

def calculate_bid_index_priority(bids: List[Dict]) -> List[Dict]:
    """
    Calculate priority percentages based on bid price ordering:
    1. Sort bids by price (ascending)
    2. Assign index (1 to N)
    3. Calculate priority% = (index * 100) / N
    """
    # Sort bids by amount (price) ascending
    sorted_bids = sorted(bids, key=lambda x: x['amount'])
    total_bids = len(sorted_bids)
    
    # Calculate priority for each bid
    for index, bid in enumerate(sorted_bids, start=1):
        bid['index'] = index
        bid['priority_score'] = (index * 100.0) / total_bids
    
    return sorted_bids

def calculate_priority_score(bid_amount: float, starting_price: float, bidder_rating: float, 
                            bid_time: datetime, auction_start: datetime) -> float:
    """
    OS Scheduling Priority Calculation:
    Note: This is a placeholder score. The actual priority is calculated
    after collecting all bids using calculate_bid_index_priority().
    """
    # Return a temporary score; will be updated by batch processing
    return 0.0

# Auth Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.model_dump()
    user_dict.pop('password')
    user = User(**user_dict)
    
    doc = user.model_dump()
    doc['hashed_password'] = hashed_password
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user or not verify_password(login_data.password, user['hashed_password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_obj = User(**user)
    access_token = create_access_token(data={"sub": user_obj.id})
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Auction Routes
@api_router.post("/auctions", response_model=Auction)
async def create_auction(auction_data: AuctionCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can create auctions")
    
    start_time = datetime.now(timezone.utc)
    end_time = start_time + timedelta(seconds=auction_data.duration_seconds)
    
    auction = Auction(
        title=auction_data.title,
        description=auction_data.description,
        auction_type=auction_data.auction_type,
        starting_price=auction_data.starting_price,
        current_price=auction_data.starting_price,
        seller_id=current_user.id,
        seller_name=current_user.name,
        start_time=start_time,
        end_time=end_time
    )
    
    doc = auction.model_dump()
    doc['start_time'] = doc['start_time'].isoformat()
    doc['end_time'] = doc['end_time'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.auctions.insert_one(doc)
    return auction

@api_router.get("/auctions", response_model=List[Auction])
async def get_auctions(status: Optional[str] = None):
    query = {}
    if status:
        query['status'] = status
    
    auctions = await db.auctions.find(query, {"_id": 0}).to_list(1000)
    
    # Convert ISO strings back to datetime
    for auction in auctions:
        auction['start_time'] = datetime.fromisoformat(auction['start_time'])
        auction['end_time'] = datetime.fromisoformat(auction['end_time'])
        auction['created_at'] = datetime.fromisoformat(auction['created_at'])
    
    return auctions

@api_router.get("/auctions/{auction_id}", response_model=Auction)
async def get_auction(auction_id: str):
    auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    auction['start_time'] = datetime.fromisoformat(auction['start_time'])
    auction['end_time'] = datetime.fromisoformat(auction['end_time'])
    auction['created_at'] = datetime.fromisoformat(auction['created_at'])
    
    return Auction(**auction)

@api_router.get("/auctions/{auction_id}/bids", response_model=List[Bid])
async def get_auction_bids(auction_id: str):
    bids = await db.bids.find({"auction_id": auction_id}, {"_id": 0}).sort("bid_time", -1).to_list(1000)
    
    for bid in bids:
        bid['bid_time'] = datetime.fromisoformat(bid['bid_time'])
    
    return bids

@api_router.post("/bids", response_model=Bid)
async def place_bid(bid_data: BidCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can place bids")
    
    # Get auction
    auction = await db.auctions.find_one({"id": bid_data.auction_id}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    auction_obj = Auction(**{
        **auction,
        'start_time': datetime.fromisoformat(auction['start_time']),
        'end_time': datetime.fromisoformat(auction['end_time']),
        'created_at': datetime.fromisoformat(auction['created_at'])
    })
    
    # Check if auction is active
    if auction_obj.status != "active":
        raise HTTPException(status_code=400, detail="Auction is not active")
    
    now = datetime.now(timezone.utc)
    if now > auction_obj.end_time:
        await db.auctions.update_one({"id": bid_data.auction_id}, {"$set": {"status": "ended"}})
        raise HTTPException(status_code=400, detail="Auction has ended")
    
    # Create bid
    bid = Bid(
        auction_id=bid_data.auction_id,
        bidder_id=current_user.id,
        bidder_name=current_user.name,
        bidder_rating=current_user.rating,
        amount=bid_data.amount
    )
    
    # Calculate priority for OS scheduled auctions
    if auction_obj.auction_type == "os_scheduled":
        bid.priority_score = calculate_priority_score(
            bid.amount,
            auction_obj.starting_price,
            current_user.rating,
            bid.bid_time,
            auction_obj.start_time
        )
    
    # Save bid
    doc = bid.model_dump()
    doc['bid_time'] = doc['bid_time'].isoformat()
    await db.bids.insert_one(doc)
    
    # Update auction winner (preemptive)
    if auction_obj.auction_type == "traditional":
        # Traditional: highest bid wins
        if bid.amount > auction_obj.current_price:
            await db.auctions.update_one(
                {"id": bid_data.auction_id},
                {"$set": {
                    "current_price": bid.amount,
                    "winner_id": current_user.id,
                    "winner_name": current_user.name
                }}
            )
            auction_obj.current_price = bid.amount
            auction_obj.winner_id = current_user.id
            auction_obj.winner_name = current_user.name
    else:
        # OS Scheduled: index-based priority calculation
        all_bids = await db.bids.find({"auction_id": bid_data.auction_id}, {"_id": 0}).to_list(1000)
        if all_bids:
            # Calculate priorities for all bids
            prioritized_bids = calculate_bid_index_priority(all_bids)
            
            # Update priorities in database
            for updated_bid in prioritized_bids:
                await db.bids.update_one(
                    {"id": updated_bid["id"]},
                    {"$set": {
                        "priority_score": updated_bid["priority_score"],
                        "index": updated_bid["index"]
                    }}
                )
            
            # Highest index (N) has 100% priority and wins
            winning_bid = prioritized_bids[-1]
            await db.auctions.update_one(
                {"id": bid_data.auction_id},
                {"$set": {
                    "current_price": winning_bid["amount"],
                    "winner_id": winning_bid["bidder_id"],
                    "winner_name": winning_bid["bidder_name"]
                }}
            )
            auction_obj.current_price = winning_bid["amount"]
            auction_obj.winner_id = winning_bid["bidder_id"]
            auction_obj.winner_name = winning_bid["bidder_name"]
            
            # Update the current bid's priority score from the calculation
            current_bid = next(b for b in prioritized_bids if b["id"] == bid.id)
            bid.priority_score = current_bid["priority_score"]
    
    # Broadcast update via WebSocket
    await manager.broadcast(bid_data.auction_id, {
        "type": "new_bid",
        "bid": {
            "id": bid.id,
            "bidder_name": bid.bidder_name,
            "amount": bid.amount,
            "priority_score": bid.priority_score,
            "bid_time": bid.bid_time.isoformat()
        },
        "auction": {
            "current_price": auction_obj.current_price,
            "winner_id": auction_obj.winner_id,
            "winner_name": auction_obj.winner_name
        }
    })
    
    return bid

@api_router.get("/my-auctions", response_model=List[Auction])
async def get_my_auctions(current_user: User = Depends(get_current_user)):
    if current_user.role == "seller":
        auctions = await db.auctions.find({"seller_id": current_user.id}, {"_id": 0}).to_list(1000)
    else:
        # Get auctions where user has bids
        bids = await db.bids.find({"bidder_id": current_user.id}, {"_id": 0}).to_list(1000)
        auction_ids = list(set([bid['auction_id'] for bid in bids]))
        auctions = await db.auctions.find({"id": {"$in": auction_ids}}, {"_id": 0}).to_list(1000)
    
    for auction in auctions:
        auction['start_time'] = datetime.fromisoformat(auction['start_time'])
        auction['end_time'] = datetime.fromisoformat(auction['end_time'])
        auction['created_at'] = datetime.fromisoformat(auction['created_at'])
    
    return auctions

@api_router.get("/my-bids", response_model=List[Bid])
async def get_my_bids(current_user: User = Depends(get_current_user)):
    bids = await db.bids.find({"bidder_id": current_user.id}, {"_id": 0}).sort("bid_time", -1).to_list(1000)
    
    for bid in bids:
        bid['bid_time'] = datetime.fromisoformat(bid['bid_time'])
    
    return bids

# WebSocket endpoint
@app.websocket("/ws/auction/{auction_id}")
async def websocket_endpoint(websocket: WebSocket, auction_id: str):
    await manager.connect(websocket, auction_id)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Echo back for ping/pong
            await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, auction_id)

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()