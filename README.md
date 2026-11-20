# Expo Spin & Win - Professional Web Application

A complete, production-ready, enterprise-grade **Expo Spin & Win Web Application** designed for exhibitions, trade shows, business expos, and physical kiosk setups.

Visitors register their contact details, spin a weighted prize wheel, and receive instant gifts, discount vouchers, or "Better Luck Next Time" rewards with celebration confetti and redemption instructions.

---

## 🌟 Key Architectural Features

1. **Backend-Driven Weighted Probability**:
   - The winning prize is calculated strictly on the backend using weighted randomness.
   - The canvas wheel animation receives the exact slice index from the API and aligns precisely to the pointer (top center, 270°). The frontend can never manipulate or override the result.
   - Dynamic normalization ensures that if a prize sells out or is deactivated, probability automatically redistributes across remaining active prizes.

2. **Kiosk Registration & Fair Play Security**:
   - Compulsory visitor registration (Full Name, 10-digit Indian Mobile `[6-9]XXXXXXXXX`, optional email, company, and city).
   - Generates a unique Participation Ticket ID (`EXP-XXXXXX`).
   - Anti-duplicate policy: Enforces 1 spin per mobile number to prevent attendee abuse.
   - Atomic database transactions prevent double spins or race conditions.
   - Kiosk reset capability: Prepares the screen for the next attendee in line without deleting or compromising records.

3. **Executive Admin Dashboard**:
   - Protected by JWT authentication and bcrypt password hashing.
   - Live KPI cards: Total Visitors, Total Spins, Gifts Won, Discounts Won, No Prize count, and Stock Remaining.
   - Visual distribution bar charts and live inventory tracking.

4. **Visitor & Winner Management**:
   - Paginated, searchable, and filterable table (by name, mobile, participation ticket, prize category, spin status, and claim status).
   - Modal inspection to review visitor company details and update prize redemption status (`Pending` vs `Claimed`) with internal booth staff notes.

5. **Certified Excel Export (.xlsx)**:
   - One-click export using the `xlsx` library with auto-fitted column widths and custom filename formatting (`Expo_Spin_Win_Visitors_YYYY-MM-DD.xlsx`).

6. **Full Prize & Wheel Management**:
   - Full CRUD operations for prizes.
   - Configure: Name, Category (`Gift`, `Discount`, `No Prize`), Winning Probability (%), Stock Quantity (or -1 for unlimited), Wheel Slice Color, Text Color, Order, and Redemption Instructions.
   - Built-in validation checking if active probabilities sum to exactly 100%.

---

## 🗂️ Project Directory Structure

```
spinTheWheel2/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # Dual MongoDB connector (Local/Atlas or Embedded In-Memory)
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT verification middleware
│   │   ├── models/
│   │   │   ├── Admin.js              # Admin schema
│   │   │   ├── Prize.js              # Wheel prizes & inventory schema
│   │   │   ├── Settings.js           # Kiosk configuration & duplicate policy schema
│   │   │   └── Visitor.js            # Registered visitors & spin records schema
│   │   ├── routes/
│   │   │   ├── adminRoutes.js        # Admin API (auth, dashboard, CRUD, export, claims)
│   │   │   └── visitorRoutes.js      # Public visitor registration & spin execution
│   │   ├── utils/
│   │   │   └── probability.js        # Weighted random selection algorithm
│   │   ├── seed.js                   # Default admin user, settings, and prizes seeder
│   │   └── server.js                 # Express server with rate-limiting and CORS
│   ├── .env                          # Environment variables
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminLayout.jsx       # Admin navigation sidebar & shell
│   │   │   ├── CanvasWheel.jsx       # High-definition 60FPS canvas wheel with metallic bezel
│   │   │   └── WinnerModal.jsx       # Celebratory modal with claim details & kiosk reset
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AdminLogin.jsx
│   │   │   │   ├── ExpoSettings.jsx
│   │   │   │   ├── PrizeManagement.jsx
│   │   │   │   └── VisitorManagement.jsx
│   │   │   ├── SpinWheel.jsx         # Spin arena with eased animation and confetti
│   │   │   └── VisitorRegistration.jsx
│   │   ├── services/
│   │   │   └── api.js                # Axios instance with auth interceptor
│   │   ├── App.jsx                   # React Router with ProtectedAdminRoute
│   │   ├── index.css                 # Tailwind CSS v4 setup and animations
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 🚀 Installation & Getting Started

### Prerequisites
- Node.js (v18 or v20+)
- npm or pnpm

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env`:
   ```env
   PORT=5000
   # Optional: MongoDB connection string (leave commented to use embedded instance)
   # MONGO_URI=mongodb://127.0.0.1:27017/expo_spin_win
   JWT_SECRET=expo_spin_win_super_secret_jwt_key_2026
   ```
4. Start the backend:
   ```bash
   npm start
   ```
   > The server will start on `http://localhost:5000`. It automatically seeds the default admin user and sample prizes with a 100% calibrated probability distribution.

### 2. Frontend Setup
1. In a second terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   > The frontend application will be available at `http://localhost:5173`.

---

## 🔑 Default Credentials

- **Admin Login URL**: `http://localhost:5173/admin/login`
- **Username**: `admin`
- **Password**: `admin123`

---

## 🧪 Verification & Testing Completed

1. **Visitor Registration Validation**:
   - Full name required.
   - Indian mobile validation verified: exactly 10 digits starting with `6`, `7`, `8`, or `9`.
   - Blocks duplicate registrations when enabled in settings.

2. **Backend Weighted Probability Selection**:
   - Verified that the backend selects the prize and passes `prizeIndex` to the frontend.
   - Wheel animation ease-out calculation tested to stop exactly on the chosen sector.

3. **Double Spin & Exploit Prevention**:
   - Calling `/api/visitor/spin` a second time with the same participation ID returns `HTTP 400 Bad Request`.
   - Direct frontend manipulation is impossible as results are determined server-side.

4. **Excel Export**:
   - Formatted `.xlsx` spreadsheet generation verified with headers and auto-column widths.

5. **Prize Claim Workflow**:
   - Admin can view, inspect, mark prizes as `Claimed`, and append internal counter notes.
