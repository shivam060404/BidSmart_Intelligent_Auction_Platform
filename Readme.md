## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [OS Scheduling Algorithm](#os-scheduling-algorithm)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)


---

## 🎯 Overview

BidSmart is a full-stack web application that revolutionizes online auctions by implementing *Operating System-inspired Priority Scheduling*. Unlike traditional auctions where only the highest bid wins, BidSmart introduces an intelligent OS-Scheduled auction type that considers multiple factors:

- *Bid Urgency* (40%): Early bids receive higher priority
- *User Rating* (30%): Trusted users get preference
- *Bid Amount* (30%): Higher bids still matter

This creates a fairer, more dynamic bidding environment that rewards early participation and user reputation alongside monetary offers.

---

## ✨ Features

### Core Functionality

- *Dual Authentication System*
  - JWT-based email/password authentication
  - Role-based access control (Buyer/Seller)
  
- *Two Auction Types*
  - *Traditional Auctions*: Classic highest-bid-wins model
  - *OS-Scheduled Auctions*: Priority-based intelligent scheduling
  
- *Real-time Bidding*
  - WebSocket integration for instant updates
  - Live bid notifications
  - Dynamic winner updates (preemptive mode)
  
- *Interactive Dashboard*
  - Real-time statistics
  - Active auction tracking
  - Win/bid history

### User Experience

- *Modern UI/UX*
  - Glass-morphism design
  - Smooth animations and transitions
  - Responsive layout (mobile-friendly)
  - Color-coded urgency indicators
  
- *Live Features*
  - Countdown timers with seconds precision
  - Instant bid history updates
  - Current winner highlighting
  - Priority score visualization

---

## 🧠 OS Scheduling Algorithm

### How It Works

The OS-Scheduled auction type treats each bid as a \"process\" with a calculated priority score:


Priority Score = (Urgency × 0.4) + (Rating × 0.3) + (Amount × 0.3)


#### Components:

1. *Urgency Score (40%)*
   
   Urgency = max(0, 100 - (time_since_start / 60))
   
   - Earlier bids get higher scores
   - Decays over time (1 point per minute)
   - Encourages early participation

2. *Rating Score (30%)*
   
   Rating = (user_rating / 5.0) × 100
   
   - Based on user's reputation (1-5 stars)
   - Rewards trusted bidders
   - Default: 5.0 for new users

3. *Amount Score (30%)*
   
   Amount = min((bid_amount / starting_price) × 100, 100)
   
   - Normalized relative to starting price
   - Capped at 100 points
   - Higher bids get better scores

### Preemptive Scheduling

- Winner updates *instantly* with each new bid
- Highest priority score becomes the current winner
- Real-time recalculation via WebSocket

### Example Scenario

*Auction*: $100 starting price, 1-hour duration

| Bidder | Time | Amount | Rating | Urgency | Rating Pts | Amount Pts | *Priority* | Winner? |
|--------|------|--------|--------|---------|-----------|-----------|--------------|---------|
| Alice  | 0m   | $150   | 5.0    | 100     | 30        | 30        | *60.0*     | ✓       |
| Bob    | 10m  | $200   | 4.0    | 90      | 24        | 30        | *58.0*     | ✗       |
| Charlie| 5m   | $180   | 5.0    | 95      | 30        | 30        | *59.0*     | ✗       |

Alice wins despite Bob's higher bid due to superior timing and rating!

---

## 🛠 Tech Stack

### Backend
- *FastAPI* - Modern Python web framework
- *Motor* - Async MongoDB driver
- *WebSockets* - Real-time communication
- *JWT* - Secure authentication
- *Pydantic* - Data validation
- *Passlib/Bcrypt* - Password hashing

### Frontend
- *React 19* - UI library
- *React Router* - Navigation
- *Axios* - HTTP client
- *Socket.io-client* - WebSocket client
- *Tailwind CSS* - Utility-first styling
- *Shadcn/ui* - Component library
- *Sonner* - Toast notifications
- *Lucide React* - Icons

### Database
- *MongoDB* - NoSQL document database

### DevOps
- *Supervisor* - Process management
- *Yarn* - Package management

---

## 📁 Project Structure


/app
├── backend/
│   ├── server.py              # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AuthPage.js           # Login/Register
│   │   │   ├── Dashboard.js          # User dashboard
│   │   │   ├── AuctionList.js        # Browse auctions
│   │   │   ├── AuctionDetail.js      # Bidding interface
│   │   │   └── CreateAuction.js      # Create new auction
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.js             # Navigation bar
│   │   │   └── ui/                   # Shadcn components
│   │   │
│   │   ├── App.js                    # Main app component
│   │   ├── App.css                   # Global styles
│   │   └── index.js                  # Entry point
│   │
│   ├── package.json           # Node dependencies
│   ├── tailwind.config.js     # Tailwind configuration
│   └── .env                   # Environment variables
│
└── README.md                  # This file


---

## 🚀 Installation

### Prerequisites

- *Python 3.11+*
- *Node.js 18+*
- *MongoDB 6.0+*
- *Yarn 1.22+*

### Backend Setup

1. *Navigate to backend directory*
   bash
   cd backend
   

2. *Install Python dependencies*
   bash
   pip install -r requirements.txt
   

3. *Configure environment variables*
   bash
   # backend/.env
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=bidsmart_db
   SECRET_KEY=your-secret-key-change-in-production
   CORS_ORIGINS=*
   

4. *Start the backend*
   bash
   uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   

### Frontend Setup

1. *Navigate to frontend directory*
   bash
   cd frontend
   

2. *Install Node dependencies*
   bash
   yarn install
   

3. *Configure environment variables*
   bash
   # frontend/.env
   REACT_APP_BACKEND_URL=http://localhost:8001
   

4. *Start the frontend*
   bash
   yarn start
   

5. *Access the application*
   
   Open http://localhost:3000 in your browser
   

---

## 📖 Usage Guide

### For Sellers

1. *Register* as a seller
2. *Create Auction*
   - Choose auction type (Traditional or OS-Scheduled)
   - Set starting price and duration
   - Add title and description
3. *Monitor* your auctions from the dashboard
4. *Track* bids in real-time

### For Buyers

1. *Register* as a buyer
2. *Browse* active auctions
3. *Filter* by type or status
4. *Place Bids*
   - View current price and winner
   - See priority scores (OS auctions)
   - Get instant notifications
5. *Win* auctions and track your victories

---

## 🔌 API Documentation

### Authentication

#### Register
http
POST /api/auth/register
Content-Type: application/json

{
  \"email\": \"user@example.com\",
  \"password\": \"password123\",
  \"name\": \"John Doe\",
  \"role\": \"buyer\" | \"seller\"
}

Response: { access_token, token_type, user }


#### Login
http
POST /api/auth/login
Content-Type: application/json

{
  \"email\": \"user@example.com\",
  \"password\": \"password123\"
}

Response: { access_token, token_type, user }


### Auctions

#### Create Auction (Seller Only)
http
POST /api/auctions
Authorization: Bearer <token>
Content-Type: application/json

{
  \"title\": \"Vintage Watch\",
  \"description\": \"Rare 1960s timepiece\",
  \"auction_type\": \"traditional\" | \"os_scheduled\",
  \"starting_price\": 100.0,
  \"duration_seconds\": 3600
}


#### Get All Auctions
http
GET /api/auctions?status=active


#### Get Auction Details
http
GET /api/auctions/{auction_id}


#### Get Auction Bids
http
GET /api/auctions/{auction_id}/bids


### Bidding

#### Place Bid (Buyer Only)
http
POST /api/bids
Authorization: Bearer <token>
Content-Type: application/json

{
  \"auction_id\": \"auction-uuid\",
  \"amount\": 150.0
}

Response: { 
  id, auction_id, bidder_name, amount, 
  bid_time, priority_score 
}


#### Get My Bids
http
GET /api/my-bids
Authorization: Bearer <token>


### WebSocket

#### Real-time Updates
javascript
ws://localhost:8001/ws/auction/{auction_id}

// Receive messages:
{
  \"type\": \"new_bid\",
  \"bid\": { id, bidder_name, amount, priority_score, bid_time },
  \"auction\": { current_price, winner_id, winner_name }
}





