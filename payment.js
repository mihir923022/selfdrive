const express = require('express');
const { pool } = require('../config/db');
const { verifyAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

if (!fs.existsSync('uploads/qr')) fs.mkdirSync('uploads/qr', { recursive: true });

const qrStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/qr/'),
  filename: (req, file, cb) => cb(null, `qr_${Date.now()}${path.extname(file.originalname)}`)
});
const qrUpload = multer({
  storage: qrStorage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
  limits: { fileSize: 2 * 1024 * 1024 }
});

// GET /api/payment/settings — public: get current QR + UPI ID
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payment_settings ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) return res.json({ qr_image: null, upi_id: null });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// PUT /api/payment/settings — admin: update QR image and/or UPI ID
router.put('/settings', verifyAdmin, qrUpload.single('qr_image'), async (req, res) => {
  const { upi_id } = req.body;
  try {
    const [rows] = await pool.query('SELECT id FROM payment_settings LIMIT 1');

    let qr_image = req.file ? `/uploads/qr/${req.file.filename}` : undefined;

    if (rows.length === 0) {
      await pool.query('INSERT INTO payment_settings (qr_image, upi_id) VALUES (?, ?)', [qr_image || null, upi_id || null]);
    } else {
      const updates = [];
      const vals = [];
      if (qr_image !== undefined) { updates.push('qr_image = ?'); vals.push(qr_image); }
      if (upi_id !== undefined)   { updates.push('upi_id = ?');   vals.push(upi_id); }
      if (updates.length > 0) {
        vals.push(rows[0].id);
        await pool.query(`UPDATE payment_settings SET ${updates.join(', ')} WHERE id = ?`, vals);
      }
    }

    const [updated] = await pool.query('SELECT * FROM payment_settings ORDER BY id DESC LIMIT 1');
    res.json({ message: 'Payment settings updated.', settings: updated[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
