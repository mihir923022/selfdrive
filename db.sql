-- ============================================================
--  RentRide Database — MySQL Workbench Import File
--  Import: Server > Data Import > Import from Self-Contained File
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET TIME_ZONE = '+00:00';

-- ------------------------------------------------------------
-- Create & select database
-- ------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `rentride`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `rentride`;

-- ============================================================
--  TABLE: users
-- ============================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`         INT            NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100)   NOT NULL,
  `email`      VARCHAR(150)   NOT NULL,
  `password`   VARCHAR(255)   NOT NULL,
  `role`       ENUM('user','admin') NOT NULL DEFAULT 'user',
  `created_at` TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Seed: Admin user
-- Password: Admin@123
-- Hash generated with bcrypt (10 rounds)
-- NOTE: The Node.js server re-hashes this on every startup,
--       so the password is always guaranteed to be correct.
-- ------------------------------------------------------------
INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES
(
  'RentRide Admin',
  'admin@rentride.in',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin'
);
-- ⚠️  The hash above is a placeholder. When you run `node server.js`
--     for the first time, the server will automatically re-hash the
--     password to the correct value. Login: admin@rentride.in / Admin@123

-- ============================================================
--  TABLE: vehicles
-- ============================================================
DROP TABLE IF EXISTS `vehicles`;
CREATE TABLE `vehicles` (
  `id`            INT             NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(150)    NOT NULL,
  `type`          ENUM('car','bike','suv','van','truck','scooter') NOT NULL,
  `brand`         VARCHAR(100)    DEFAULT NULL,
  `fuel_type`     ENUM('petrol','diesel','electric','hybrid') NOT NULL DEFAULT 'petrol',
  `seats`         INT             NOT NULL DEFAULT 5,
  `price_per_day` DECIMAL(10,2)   NOT NULL,
  `image_url`     VARCHAR(500)    DEFAULT NULL,
  `location`      VARCHAR(150)    DEFAULT NULL,
  `availability`  TINYINT(1)      NOT NULL DEFAULT 1,
  `description`   TEXT            DEFAULT NULL,
  `created_at`    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Seed: 12 sample vehicles
-- ------------------------------------------------------------
INSERT INTO `vehicles`
  (`name`, `type`, `brand`, `fuel_type`, `seats`, `price_per_day`, `image_url`, `location`, `availability`, `description`)
VALUES
(
  'Swift Dzire', 'car', 'Maruti Suzuki', 'petrol', 5, 1200.00,
  'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800',
  'Mumbai', 1,
  'Comfortable sedan perfect for city and highway drives.'
),
(
  'Royal Enfield Classic 350', 'bike', 'Royal Enfield', 'petrol', 2, 800.00,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  'Goa', 1,
  'Iconic motorcycle, perfect for road trips and coastal drives.'
),
(
  'Mahindra Thar', 'suv', 'Mahindra', 'diesel', 4, 2500.00,
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800',
  'Manali', 1,
  'Rugged off-roader built for mountain adventures.'
),
(
  'Toyota Innova Crysta', 'van', 'Toyota', 'diesel', 7, 3000.00,
  'https://images.unsplash.com/photo-1511527844068-006b95d162c2?w=800',
  'Delhi', 1,
  'Spacious MPV ideal for family trips across India.'
),
(
  'Tata Nexon EV', 'car', 'Tata', 'electric', 5, 1800.00,
  'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800',
  'Bengaluru', 1,
  'Eco-friendly electric SUV with long range.'
),
(
  'Honda Activa 6G', 'scooter', 'Honda', 'petrol', 2, 400.00,
  'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800',
  'Pune', 1,
  'Reliable scooter for daily city commutes.'
),
(
  'Force Traveller', 'van', 'Force', 'diesel', 12, 4500.00,
  'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800',
  'Jaipur', 1,
  'Perfect for group travel and corporate outings.'
),
(
  'BMW 3 Series', 'car', 'BMW', 'petrol', 5, 6000.00,
  'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800',
  'Mumbai', 1,
  'Luxury sedan for a premium travel experience.'
),
(
  'Hyundai Creta', 'suv', 'Hyundai', 'petrol', 5, 2000.00,
  'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800',
  'Chennai', 1,
  'Popular compact SUV with great mileage and comfort.'
),
(
  'Bajaj Pulsar NS200', 'bike', 'Bajaj', 'petrol', 2, 600.00,
  'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800',
  'Hyderabad', 1,
  'Sporty naked motorcycle for thrill-seekers.'
),
(
  'Toyota Fortuner', 'suv', 'Toyota', 'diesel', 7, 5500.00,
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800',
  'Delhi', 1,
  'Full-size SUV for long highway road trips.'
),
(
  'Ather 450X', 'scooter', 'Ather', 'electric', 2, 500.00,
  'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800',
  'Bengaluru', 1,
  'Premium electric scooter with smart features.'
);

-- ============================================================
--  TABLE: bookings
-- ============================================================
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
  `id`                 INT           NOT NULL AUTO_INCREMENT,
  `user_id`            INT           NOT NULL,
  `vehicle_id`         INT           NOT NULL,
  `start_date`         DATE          NOT NULL,
  `end_date`           DATE          NOT NULL,
  `total_price`        DECIMAL(10,2) NOT NULL,
  `status`             ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
  `pickup_location`    VARCHAR(200)  DEFAULT NULL,
  `license_image`      VARCHAR(500)  DEFAULT NULL  COMMENT 'Path to uploaded driving licence photo',
  `payment_status`     ENUM('unpaid','pending_verification','paid') NOT NULL DEFAULT 'unpaid',
  `payment_screenshot` VARCHAR(500)  DEFAULT NULL  COMMENT 'Path to payment screenshot uploaded by user',
  `created_at`         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_booking_user`    (`user_id`),
  KEY `fk_booking_vehicle` (`vehicle_id`),
  CONSTRAINT `fk_booking_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`    (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_booking_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (No seed data for bookings — created at runtime by users)

-- ============================================================
--  TABLE: payment_settings
-- ============================================================
DROP TABLE IF EXISTS `payment_settings`;
CREATE TABLE `payment_settings` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `qr_image`   VARCHAR(500) DEFAULT NULL  COMMENT 'Path to payment QR code image uploaded by admin',
  `upi_id`     VARCHAR(200) DEFAULT NULL  COMMENT 'UPI payment ID shown to users',
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Seed: default payment settings row
-- ------------------------------------------------------------
INSERT INTO `payment_settings` (`qr_image`, `upi_id`) VALUES
(NULL, 'rentride@upi');

-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================
-- IMPORT COMPLETE
-- Tables created: users, vehicles, bookings, payment_settings
-- Admin login   : admin@rentride.in  /  Admin@123
--                 (password is re-hashed on first server start)
-- ============================================================
