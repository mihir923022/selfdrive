const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = mysql.createPool({
  host:             process.env.DB_HOST     || 'localhost',
  user:             process.env.DB_USER     || 'root',
  password:         process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0
});

const DB = process.env.DB_NAME || 'rentride';

const initDB = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${DB}\``);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(100)  NOT NULL,
        email      VARCHAR(150)  NOT NULL UNIQUE,
        password   VARCHAR(255)  NOT NULL,
        role       ENUM('user','admin') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        name          VARCHAR(150)  NOT NULL,
        type          ENUM('car','bike','suv','van','truck','scooter') NOT NULL,
        brand         VARCHAR(100),
        fuel_type     ENUM('petrol','diesel','electric','hybrid') NOT NULL DEFAULT 'petrol',
        seats         INT NOT NULL DEFAULT 5,
        price_per_day DECIMAL(10,2) NOT NULL,
        image_url     VARCHAR(500),
        location      VARCHAR(150),
        availability  TINYINT(1) NOT NULL DEFAULT 1,
        description   TEXT,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id                 INT AUTO_INCREMENT PRIMARY KEY,
        user_id            INT NOT NULL,
        vehicle_id         INT NOT NULL,
        start_date         DATE NOT NULL,
        end_date           DATE NOT NULL,
        total_price        DECIMAL(10,2) NOT NULL,
        status             ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
        pickup_location    VARCHAR(200),
        license_image      VARCHAR(500) NULL,
        payment_status     ENUM('unpaid','pending_verification','paid') NOT NULL DEFAULT 'unpaid',
        payment_screenshot VARCHAR(500) NULL,
        created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS payment_settings (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        qr_image   VARCHAR(500) NULL,
        upi_id     VARCHAR(200) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const [psRows] = await conn.query('SELECT id FROM payment_settings LIMIT 1');
    if (psRows.length === 0) {
      await conn.query("INSERT INTO payment_settings (upi_id) VALUES ('rentride@upi')");
      console.log('✅ Default payment settings created');
    }

    const adminEmail = 'admin@rentride.in';
    const adminPass  = 'Admin@123';
    const [admins] = await conn.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (admins.length === 0) {
      const hash = await bcrypt.hash(adminPass, 10);
      await conn.query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')", ['RentRide Admin', adminEmail, hash]);
      console.log('✅ Admin user created  →  admin@rentride.in / Admin@123');
    } else {
      const hash = await bcrypt.hash(adminPass, 10);
      await conn.query('UPDATE users SET password = ? WHERE email = ?', [hash, adminEmail]);
      console.log('🔄 Admin password re-synced  →  admin@rentride.in / Admin@123');
    }

    const [existing] = await conn.query('SELECT id FROM vehicles LIMIT 1');
    if (existing.length === 0) {
      await conn.query(`
        INSERT INTO vehicles (name, type, brand, fuel_type, seats, price_per_day, image_url, location, description) VALUES
        ('Swift Dzire','car','Maruti Suzuki','petrol',5,1200,'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800','Mumbai','Comfortable sedan perfect for city and highway drives.'),
        ('Royal Enfield Classic 350','bike','Royal Enfield','petrol',2,800,'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800','Goa','Iconic motorcycle, perfect for road trips and coastal drives.'),
        ('Mahindra Thar','suv','Mahindra','diesel',4,2500,'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800','Manali','Rugged off-roader built for mountain adventures.'),
        ('Toyota Innova Crysta','van','Toyota','diesel',7,3000,'https://images.unsplash.com/photo-1511527844068-006b95d162c2?w=800','Delhi','Spacious MPV ideal for family trips across India.'),
        ('Tata Nexon EV','car','Tata','electric',5,1800,'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800','Bengaluru','Eco-friendly electric SUV with long range.'),
        ('Honda Activa 6G','scooter','Honda','petrol',2,400,'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800','Pune','Reliable scooter for daily city commutes.'),
        ('Force Traveller','van','Force','diesel',12,4500,'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800','Jaipur','Perfect for group travel and corporate outings.'),
        ('BMW 3 Series','car','BMW','petrol',5,6000,'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800','Mumbai','Luxury sedan for a premium travel experience.'),
        ('Hyundai Creta','suv','Hyundai','petrol',5,2000,'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800','Chennai','Popular compact SUV with great mileage and comfort.'),
        ('Bajaj Pulsar NS200','bike','Bajaj','petrol',2,600,'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800','Hyderabad','Sporty naked motorcycle for thrill-seekers.'),
        ('Toyota Fortuner','suv','Toyota','diesel',7,5500,'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800','Delhi','Full-size SUV for long highway road trips.'),
        ('Ather 450X','scooter','Ather','electric',2,500,'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800','Bengaluru','Premium electric scooter with smart features.')
      `);
      console.log('✅ Sample vehicles seeded');
    }

    console.log('✅ Database ready');
  } catch (err) {
    console.error('❌ DB init error:', err.message);
    throw err;
  } finally {
    conn.release();
  }
};

pool.on('connection', (conn) => { conn.query(`USE \`${DB}\``); });

module.exports = { pool, initDB };
