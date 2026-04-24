const express = require('express');
const { pool } = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Ensure upload dirs exist
['uploads/licenses', 'uploads/payments'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer config for driving license
const licenseStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/licenses/'),
  filename: (req, file, cb) => cb(null, `license_${Date.now()}${path.extname(file.originalname)}`)
});
const licenseUpload = multer({
  storage: licenseStorage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Multer config for payment screenshot
const paymentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/payments/'),
  filename: (req, file, cb) => cb(null, `payment_${Date.now()}${path.extname(file.originalname)}`)
});
const paymentUpload = multer({
  storage: paymentStorage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// POST /api/bookings — create booking with optional license upload
router.post('/', verifyToken, licenseUpload.single('license_image'), async (req, res) => {
  const { vehicle_id, start_date, end_date, pickup_location } = req.body;
  const user_id = req.user.id;

  if (!vehicle_id || !start_date || !end_date)
    return res.status(400).json({ message: 'vehicle_id, start_date, end_date are required.' });

  try {
    const [vehicles] = await pool.query('SELECT * FROM vehicles WHERE id = ? AND availability = 1', [vehicle_id]);
    if (vehicles.length === 0)
      return res.status(404).json({ message: 'Vehicle not found or unavailable.' });

    const vehicle = vehicles[0];
    const start = new Date(start_date);
    const end   = new Date(end_date);
    if (end <= start)
      return res.status(400).json({ message: 'end_date must be after start_date.' });

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const total_price = days * vehicle.price_per_day;
    const license_image = req.file ? `/uploads/licenses/${req.file.filename}` : null;

    const [result] = await pool.query(
      'INSERT INTO bookings (user_id, vehicle_id, start_date, end_date, total_price, pickup_location, license_image, status, payment_status) VALUES (?,?,?,?,?,?,?,?,?)',
      [user_id, vehicle_id, start_date, end_date, total_price, pickup_location || null, license_image, 'pending', 'unpaid']
    );

    res.status(201).json({
      message: 'Booking created successfully.',
      booking_id: result.insertId,
      total_price,
      days
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// POST /api/bookings/:id/payment-screenshot — user uploads payment proof
router.post('/:id/payment-screenshot', verifyToken, paymentUpload.single('payment_screenshot'), async (req, res) => {
  const booking_id = req.params.id;
  const user_id = req.user.id;

  if (!req.file)
    return res.status(400).json({ message: 'Payment screenshot is required.' });

  try {
    const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ? AND user_id = ?', [booking_id, user_id]);
    if (rows.length === 0)
      return res.status(404).json({ message: 'Booking not found.' });

    const screenshot_path = `/uploads/payments/${req.file.filename}`;
    await pool.query(
      'UPDATE bookings SET payment_screenshot = ?, payment_status = ? WHERE id = ?',
      [screenshot_path, 'pending_verification', booking_id]
    );

    res.json({ message: 'Payment screenshot uploaded. Awaiting admin verification.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/bookings/my — user's own bookings
router.get('/my', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, v.name AS vehicle_name, v.image_url, v.type AS vehicle_type, v.brand
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/bookings — admin: all bookings
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, u.name AS user_name, u.email AS user_email,
             v.name AS vehicle_name, v.type AS vehicle_type, v.brand
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      ORDER BY b.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// PUT /api/bookings/:id/status — admin: update booking status & payment status
router.put('/:id/status', verifyAdmin, async (req, res) => {
  const { status, payment_status } = req.body;
  try {
    const fields = [];
    const values = [];
    if (status)         { fields.push('status = ?');         values.push(status); }
    if (payment_status) { fields.push('payment_status = ?'); values.push(payment_status); }
    if (fields.length === 0)
      return res.status(400).json({ message: 'No fields to update.' });
    values.push(req.params.id);
    await pool.query(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Booking updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// DELETE /api/bookings/:id — admin
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM bookings WHERE id = ?', [req.params.id]);
    res.json({ message: 'Booking deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
