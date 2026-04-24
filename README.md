# 🚗 RentRide — Vehicle Rental Platform

## New Features Added
1. **Driving Licence Upload** — Required during booking (JPG/PNG/PDF, max 5MB)
2. **Payment QR Code** — Shown after booking confirmation (UPI payment)
3. **Payment Screenshot Upload** — User uploads proof of payment
4. **Admin: View Payment Screenshots** — Admin can view all payment screenshots
5. **Admin: Manage QR Code** — Admin can upload new QR + update UPI ID

## Setup

### Prerequisites
- Node.js 18+
- MySQL 8+

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MySQL credentials
node server.js
```

### 2. Access
- Frontend: http://localhost:5000
- Admin Login: admin@rentride.in / Admin@123

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login

### Vehicles
- GET /api/vehicles
- GET /api/vehicles/:id
- POST /api/vehicles (admin)
- PUT /api/vehicles/:id (admin)
- DELETE /api/vehicles/:id (admin)

### Bookings
- POST /api/bookings (multipart/form-data — includes license_image)
- POST /api/bookings/:id/payment-screenshot (multipart/form-data)
- GET /api/bookings/my (user)
- GET /api/bookings (admin)
- PUT /api/bookings/:id/status (admin)

### Payment Settings
- GET /api/payment/settings (public)
- PUT /api/payment/settings (admin — multipart/form-data)

### Users
- GET /api/users/me
- GET /api/users (admin)
- DELETE /api/users/:id (admin)

## DB Changes
New columns on `bookings`:
- `license_image` VARCHAR(500) — path to uploaded driving licence
- `payment_status` ENUM('unpaid','pending_verification','paid')
- `payment_screenshot` VARCHAR(500) — path to payment screenshot

New table `payment_settings`:
- `qr_image` — path to QR code image
- `upi_id` — UPI payment ID

## Upload Directories
- `backend/uploads/licenses/` — driving licence photos
- `backend/uploads/payments/` — payment screenshots
- `backend/uploads/qr/` — payment QR codes
