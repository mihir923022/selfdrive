const express = require('express');
const { pool } = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const vehicleStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/vehicles/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const vehicleUpload = multer({ storage: vehicleStorage });

// GET /api/vehicles
router.get('/', async (req, res) => {
  try {
    const { type, location, fuel_type } = req.query;
    let query = 'SELECT * FROM vehicles WHERE availability = 1';
    const params = [];
    if (type)      { query += ' AND type = ?';      params.push(type); }
    if (location)  { query += ' AND location LIKE ?'; params.push(`%${location}%`); }
    if (fuel_type) { query += ' AND fuel_type = ?'; params.push(fuel_type); }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/vehicles/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Vehicle not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// POST /api/vehicles (admin)
router.post('/', verifyAdmin, vehicleUpload.single('image'), async (req, res) => {
  const { name, type, brand, fuel_type, seats, price_per_day, location, description } = req.body;
  const image_url = req.file ? `/uploads/vehicles/${req.file.filename}` : req.body.image_url;
  try {
    await pool.query(
      'INSERT INTO vehicles (name,type,brand,fuel_type,seats,price_per_day,image_url,location,description) VALUES (?,?,?,?,?,?,?,?,?)',
      [name, type, brand, fuel_type, seats, price_per_day, image_url, location, description]
    );
    res.status(201).json({ message: 'Vehicle added.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// PUT /api/vehicles/:id (admin)
router.put('/:id', verifyAdmin, async (req, res) => {
  const { name, type, brand, fuel_type, seats, price_per_day, image_url, location, availability, description } = req.body;
  try {
    await pool.query(
      'UPDATE vehicles SET name=?,type=?,brand=?,fuel_type=?,seats=?,price_per_day=?,image_url=?,location=?,availability=?,description=? WHERE id=?',
      [name, type, brand, fuel_type, seats, price_per_day, image_url, location, availability, description, req.params.id]
    );
    res.json({ message: 'Vehicle updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// DELETE /api/vehicles/:id (admin)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
    res.json({ message: 'Vehicle deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
