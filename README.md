# HopeHands 

A full-stack web application for managing NGO registrations and donations with integrated Razorpay payment gateway.

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| **Frontend** | [https://hopehands-ngo.netlify.app](https://hopehands-ngo.netlify.app) |
| **Backend API** | [https://hopehands-production.up.railway.app/api](https://hopehands-production.up.railway.app/api) |

### Test Credentials:
- **Admin**: `testadmin@ngo.org` / `admin123`
- **User**: `newuser@test.com` / `test123`

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **MongoDB Atlas** account (or local MongoDB)
- **Razorpay** account (for payment integration)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/NSS-PROJECT-.git
cd NSS-PROJECT-
```

### 2. Backend Setup

```bash
cd Backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=YourApp
DB_NAME=ngo_donation_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Server Configuration
PORT=5001
CLIENT_URL=http://localhost:5173

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

```bash
# Initialize database with sample data (optional)
npm run seed

# Start the server
npm start
```

The backend will run at `http://localhost:5001`

### 3. Frontend Setup

```bash
cd ../Frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:5001/api" > .env

# Start development server
npm run dev
```

The frontend will run at `http://localhost:5173`

---

## 🔑 Default Accounts

After seeding, you can use these credentials:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `testadmin@ngo.org` | `admin123` |
| **User** | `testuser@example.com` | `password123` |

---


## 💳 Testing Payments

In Razorpay **test mode**, use these methods:

### Netbanking
1. Select any bank
2. Click "Success" on the mock bank page



### Cards
- **Domestic Card**: `5267 3181 8797 5449`
- **Expiry**: Any future date
- **CVV**: Any 3 digits

---


## 📜 Available Scripts

### Backend
```bash
npm start          # Start production server
npm run seed       # Seed database with sample data
npm run init-db    # Initialize database
```

### Frontend
```bash
npm run dev        # Start development server
```

---



