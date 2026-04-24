const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { initDB } = require('./config/db');

const authRoutes     = require('./routes/auth');
const vehicleRoutes  = require('./routes/vehicles');
const bookingRoutes  = require('./routes/bookings');
const paymentRoutes  = require('./routes/payment');
const userRoutes     = require('./routes/users');

const app = express();

// Ensure upload directories exist
['uploads/licenses', 'uploads/payments', 'uploads/qr', 'uploads/vehicles'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth',     authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payment',  paymentRoutes);
app.use('/api/users',    userRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Fallback to frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 RentRide server running on http://localhost:${PORT}`);
      console.log(`📁 Uploads served at /uploads`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize DB:', err.message);
    process.exit(1);
  });
