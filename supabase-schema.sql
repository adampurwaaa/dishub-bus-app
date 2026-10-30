-- =========================================================================
-- DISHUB BUS REVENUE COLLECTION SYSTEM SCHEMA
-- Kementerian Perhubungan / Dinas Perhubungan (Dishub)
-- =========================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS / DRIVERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nip_or_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    pin_code VARCHAR(255) NOT NULL, -- Hashed PIN or plaintext for dev/demo
    role VARCHAR(20) NOT NULL CHECK (role IN ('DRIVER', 'ADMIN')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BUS TABLE
CREATE TABLE IF NOT EXISTS buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    route_name VARCHAR(150) NOT NULL,
    fare_price NUMERIC(12, 2) NOT NULL DEFAULT 5000,
    capacity INT NOT NULL DEFAULT 40,
    status VARCHAR(20) NOT NULL DEFAULT 'OPERATIONAL' CHECK (status IN ('OPERATIONAL', 'MAINTENANCE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SHIFT / TRIP SESSION TABLE
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TRIP TABLE
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    trip_number INT NOT NULL,
    cash_passenger_count INT NOT NULL DEFAULT 0,
    ticket_price NUMERIC(12, 2) NOT NULL,
    total_cash_amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SETTLEMENT TABLE
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID UNIQUE NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_collected_amount NUMERIC(12, 2) NOT NULL,
    settlement_method VARCHAR(30) NOT NULL CHECK (settlement_method IN ('BANK_TRANSFER', 'FIELD_OFFICER')),
    receipt_image_url TEXT,
    officer_pin_code VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    rejection_reason TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEED INITIAL MOCK DATA
INSERT INTO users (id, nip_or_id, full_name, pin_code, role, status)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'ADMIN01', 'Bambang Sudirman, S.Tr.Tra', 'admin123', 'ADMIN', 'ACTIVE'),
    ('00000000-0000-0000-0000-000000000002', 'D-101', 'Supriyadi Santoso', '123456', 'DRIVER', 'ACTIVE'),
    ('00000000-0000-0000-0000-000000000003', 'D-102', 'Ahmad Hidayat', '234567', 'DRIVER', 'ACTIVE'),
    ('00000000-0000-0000-0000-000000000004', 'D-103', 'Iwan Setiawan', '345678', 'DRIVER', 'ACTIVE')
ON CONFLICT (nip_or_id) DO NOTHING;

INSERT INTO buses (id, plate_number, route_name, fare_price, capacity, status)
VALUES 
    ('10000000-0000-0000-0000-000000000001', 'B 7123 IA', 'Koridor 1: Terminal Blok M - Kota', 5000, 45, 'OPERATIONAL'),
    ('10000000-0000-0000-0000-000000000002', 'B 7890 PQ', 'Koridor 2: Harmoni - Pulo Gadung', 4000, 50, 'OPERATIONAL'),
    ('10000000-0000-0000-0000-000000000003', 'B 7451 XY', 'Koridor 3: Kalideres - Pasar Baru', 5000, 40, 'OPERATIONAL'),
    ('10000000-0000-0000-0000-000000000004', 'B 7300 TJ', 'Koridor 4: Kampung Rambutan - Ancol', 6000, 48, 'MAINTENANCE')
ON CONFLICT (plate_number) DO NOTHING;

-- Supabase Storage Bucket setup for settlement receipts
-- Run in Supabase SQL editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('settlement-receipts', 'settlement-receipts', true)
-- ON CONFLICT (id) DO NOTHING;
