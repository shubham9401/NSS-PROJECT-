# 🙌 HopeHands - NGO Donation Management System

A full-stack web application for managing NGO registrations and donations with integrated Razorpay payment gateway.

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-Integrated-0066FF?logo=razorpay&logoColor=white)

---

## ✨ Features

### 👤 User Features
- **User Registration & Authentication** - Secure JWT-based auth with HTTP-only cookies
- **Personal Dashboard** - View donation history and statistics
- **Make Donations** - Seamless Razorpay checkout integration
- **Profile Management** - Update personal information

### 🔐 Admin Features
- **Admin Dashboard** - Real-time statistics and analytics
- **User Management** - View all registered users with filtering
- **Donation Reports** - Comprehensive donation tracking with CSV export
- **Payment Status Sync** - Sync payment statuses from Razorpay

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js + Express** | REST API server |
| **MongoDB + Mongoose** | Database & ODM |
| **JWT** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **Razorpay SDK** | Payment processing |
| **express-validator** | Input validation |
| **express-rate-limit** | API rate limiting |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **TailwindCSS** | Styling |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client |
| **react-hot-toast** | Notifications |

---

## 📁 Project Structure

```
NSS-PROJECT-/
├── Backend/
│   ├── src/
│   │   ├── config/         # Database & Razorpay config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, error handling, rate limiting
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API route definitions
│   │   ├── scripts/        # DB initialization & seeding
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Helper functions
│   │   └── index.js        # App entry point
│   ├── .env.example        # Environment template
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context (Auth)
│   │   ├── pages/          # Route pages
│   │   ├── services/       # API service layer
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── .env                # Frontend environment
│   └── package.json
│
└── README.md
```

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

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get user profile |
| PUT | `/api/users/profile` | Update profile |
| GET | `/api/users` | List all users (Admin) |

### Donations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/donations` | Get user's donations |
| GET | `/api/donations/stats` | Get donation statistics |
| GET | `/api/donations/all` | All donations (Admin) |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment |
| POST | `/api/payments/webhook` | Razorpay webhook |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/donations` | Filter donations |
| GET | `/api/admin/donations/export` | Export to CSV |

---

## 💳 Testing Payments

In Razorpay **test mode**, use these methods:

### Netbanking (Easiest)
1. Select any bank
2. Click "Success" on the mock bank page

### UPI (if enabled)
- Use VPA: `success@razorpay`

### Cards
- **Domestic Card**: `5267 3181 8797 5449`
- **Expiry**: Any future date
- **CVV**: Any 3 digits

---

## 🔒 Security Features

- ✅ JWT tokens with HTTP-only cookies
- ✅ Password hashing with bcrypt
- ✅ API rate limiting
- ✅ Input validation & sanitization
- ✅ CORS protection
- ✅ Razorpay signature verification
- ✅ Role-based access control

---

## 📜 Available Scripts

### Backend
```bash
npm start          # Start production server
npm run dev        # Start development server
npm run seed       # Seed database with sample data
npm run init-db    # Initialize database
```

### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

---

## 🐛 Troubleshooting

### CORS Error
Ensure `CLIENT_URL` in backend `.env` matches your frontend URL:
```env
CLIENT_URL=http://localhost:5173
```

### MongoDB Connection Failed
1. Check your `MONGODB_URI` is correct
2. Ensure your IP is whitelisted in MongoDB Atlas
3. Verify database user credentials

### Razorpay Checkout Not Opening
1. Verify `RAZORPAY_KEY_ID` is correct
2. Ensure you're using test keys for development
3. Check browser console for errors

---

## 📄 License

This project is licensed under the ISC License.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<p align="center">
  Made with ❤️ for HopeHands Foundation
</p>
