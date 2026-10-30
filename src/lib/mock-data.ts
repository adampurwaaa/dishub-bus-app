import { User, Bus, Shift, Trip, Settlement } from '@/types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-01',
    nip_or_id: 'ADMIN01',
    full_name: 'Bambang Sudirman, S.Tr.Tra',
    pin_code: 'admin123',
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'usr-driver-101',
    nip_or_id: 'D-101',
    full_name: 'Supriyadi Santoso',
    pin_code: '123456',
    role: 'DRIVER',
    status: 'ACTIVE',
    created_at: new Date('2026-01-05').toISOString(),
  },
  {
    id: 'usr-driver-102',
    nip_or_id: 'D-102',
    full_name: 'Ahmad Hidayat',
    pin_code: '234567',
    role: 'DRIVER',
    status: 'ACTIVE',
    created_at: new Date('2026-01-10').toISOString(),
  },
  {
    id: 'usr-driver-103',
    nip_or_id: 'D-103',
    full_name: 'Iwan Setiawan',
    pin_code: '345678',
    role: 'DRIVER',
    status: 'ACTIVE',
    created_at: new Date('2026-02-01').toISOString(),
  },
];

export const INITIAL_BUSES: Bus[] = [
  {
    id: 'bus-001',
    plate_number: 'B 7123 IA',
    route_name: 'Koridor 1: Terminal Blok M - Kota',
    fare_price: 5000,
    capacity: 45,
    status: 'OPERATIONAL',
  },
  {
    id: 'bus-002',
    plate_number: 'B 7890 PQ',
    route_name: 'Koridor 2: Harmoni - Pulo Gadung',
    fare_price: 4000,
    capacity: 50,
    status: 'OPERATIONAL',
  },
  {
    id: 'bus-003',
    plate_number: 'B 7451 XY',
    route_name: 'Koridor 3: Kalideres - Pasar Baru',
    fare_price: 5000,
    capacity: 40,
    status: 'OPERATIONAL',
  },
  {
    id: 'bus-004',
    plate_number: 'B 7300 TJ',
    route_name: 'Koridor 4: Kp. Rambutan - Ancol',
    fare_price: 6000,
    capacity: 48,
    status: 'MAINTENANCE',
  },
];

// Prepopulated shifts and settlements for reconciliation and dashboard demo
export const INITIAL_SHIFTS: Shift[] = [
  {
    id: 'shift-past-01',
    driver_id: 'usr-driver-102',
    bus_id: 'bus-002',
    start_time: '2026-10-29T06:00:00.000Z',
    end_time: '2026-10-29T14:30:00.000Z',
    status: 'CLOSED',
  },
  {
    id: 'shift-past-02',
    driver_id: 'usr-driver-103',
    bus_id: 'bus-003',
    start_time: '2026-10-29T05:30:00.000Z',
    end_time: '2026-10-29T13:00:00.000Z',
    status: 'CLOSED',
  },
];

export const INITIAL_TRIPS: Trip[] = [
  {
    id: 'trip-01',
    shift_id: 'shift-past-01',
    trip_number: 1,
    cash_passenger_count: 28,
    ticket_price: 4000,
    total_cash_amount: 112000,
    created_at: '2026-10-29T07:45:00.000Z',
  },
  {
    id: 'trip-02',
    shift_id: 'shift-past-01',
    trip_number: 2,
    cash_passenger_count: 35,
    ticket_price: 4000,
    total_cash_amount: 140000,
    created_at: '2026-10-29T10:15:00.000Z',
  },
  {
    id: 'trip-03',
    shift_id: 'shift-past-01',
    trip_number: 3,
    cash_passenger_count: 24,
    ticket_price: 4000,
    total_cash_amount: 96000,
    created_at: '2026-10-29T13:40:00.000Z',
  },
  {
    id: 'trip-04',
    shift_id: 'shift-past-02',
    trip_number: 1,
    cash_passenger_count: 2, // Anomaly candidate: suspiciously low (2 passengers)
    ticket_price: 5000,
    total_cash_amount: 10000,
    created_at: '2026-10-29T08:00:00.000Z',
  },
];

export const INITIAL_SETTLEMENTS: Settlement[] = [
  {
    id: 'set-001',
    shift_id: 'shift-past-01',
    driver_id: 'usr-driver-102',
    total_collected_amount: 348000,
    settlement_method: 'BANK_TRANSFER',
    receipt_image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    officer_pin_code: null,
    status: 'PENDING',
    created_at: '2026-10-29T14:45:00.000Z',
  },
  {
    id: 'set-002',
    shift_id: 'shift-past-02',
    driver_id: 'usr-driver-103',
    total_collected_amount: 10000,
    settlement_method: 'FIELD_OFFICER',
    receipt_image_url: null,
    officer_pin_code: '8899',
    status: 'APPROVED',
    verified_at: '2026-10-29T13:10:00.000Z',
    verified_by: 'usr-admin-01',
    created_at: '2026-10-29T13:05:00.000Z',
  },
];
