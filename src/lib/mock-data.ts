import { User, Bus, Shift, Trip, Settlement } from '@/types';

export const INITIAL_USERS: User[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    nip_or_id: 'ADMIN01',
    full_name: 'Bambang Sudirman, S.Tr.Tra',
    pin_code: 'admin123',
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    nip_or_id: 'D-101',
    full_name: 'Supriyadi Santoso',
    pin_code: '123456',
    role: 'DRIVER',
    status: 'ACTIVE',
    created_at: new Date('2026-01-05').toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    nip_or_id: 'D-102',
    full_name: 'Ahmad Hidayat',
    pin_code: '234567',
    role: 'DRIVER',
    status: 'ACTIVE',
    created_at: new Date('2026-01-10').toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
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
    id: '10000000-0000-0000-0000-000000000001',
    plate_number: 'B 7123 IA',
    route_name: 'Koridor 1: Terminal Blok M - Kota',
    fare_price: 5000,
    capacity: 45,
    status: 'OPERATIONAL',
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    plate_number: 'B 7890 PQ',
    route_name: 'Koridor 2: Harmoni - Pulo Gadung',
    fare_price: 4000,
    capacity: 50,
    status: 'OPERATIONAL',
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    plate_number: 'B 7451 XY',
    route_name: 'Koridor 3: Kalideres - Pasar Baru',
    fare_price: 5000,
    capacity: 40,
    status: 'OPERATIONAL',
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
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
    id: '20000000-0000-0000-0000-000000000001',
    driver_id: '00000000-0000-0000-0000-000000000003',
    bus_id: '10000000-0000-0000-0000-000000000002',
    start_time: '2026-10-29T06:00:00.000Z',
    end_time: '2026-10-29T14:30:00.000Z',
    status: 'CLOSED',
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    driver_id: '00000000-0000-0000-0000-000000000004',
    bus_id: '10000000-0000-0000-0000-000000000003',
    start_time: '2026-10-29T05:30:00.000Z',
    end_time: '2026-10-29T13:00:00.000Z',
    status: 'CLOSED',
  },
];

export const INITIAL_TRIPS: Trip[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    shift_id: '20000000-0000-0000-0000-000000000001',
    trip_number: 1,
    cash_passenger_count: 28,
    ticket_price: 4000,
    total_cash_amount: 112000,
    created_at: '2026-10-29T07:45:00.000Z',
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    shift_id: '20000000-0000-0000-0000-000000000001',
    trip_number: 2,
    cash_passenger_count: 35,
    ticket_price: 4000,
    total_cash_amount: 140000,
    created_at: '2026-10-29T10:15:00.000Z',
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    shift_id: '20000000-0000-0000-0000-000000000001',
    trip_number: 3,
    cash_passenger_count: 24,
    ticket_price: 4000,
    total_cash_amount: 96000,
    created_at: '2026-10-29T13:40:00.000Z',
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    shift_id: '20000000-0000-0000-0000-000000000002',
    trip_number: 1,
    cash_passenger_count: 2, // Anomaly candidate: suspiciously low (2 passengers)
    ticket_price: 5000,
    total_cash_amount: 10000,
    created_at: '2026-10-29T08:00:00.000Z',
  },
];

export const INITIAL_SETTLEMENTS: Settlement[] = [
  {
    id: '40000000-0000-0000-0000-000000000001',
    shift_id: '20000000-0000-0000-0000-000000000001',
    driver_id: '00000000-0000-0000-0000-000000000003',
    total_collected_amount: 348000,
    settlement_method: 'BANK_TRANSFER',
    receipt_image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    officer_pin_code: null,
    status: 'PENDING',
    created_at: '2026-10-29T14:45:00.000Z',
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    shift_id: '20000000-0000-0000-0000-000000000002',
    driver_id: '00000000-0000-0000-0000-000000000004',
    total_collected_amount: 10000,
    settlement_method: 'FIELD_OFFICER',
    receipt_image_url: null,
    officer_pin_code: '8899',
    status: 'APPROVED',
    verified_at: '2026-10-29T13:10:00.000Z',
    verified_by: '00000000-0000-0000-0000-000000000001',
    created_at: '2026-10-29T13:05:00.000Z',
  },
];
