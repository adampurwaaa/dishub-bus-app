export type UserRole = 'DRIVER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type BusStatus = 'OPERATIONAL' | 'MAINTENANCE';
export type ShiftStatus = 'OPEN' | 'CLOSED';
export type SettlementMethod = 'BANK_TRANSFER' | 'FIELD_OFFICER';
export type SettlementStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  nip_or_id: string;
  full_name: string;
  pin_code: string;
  role: UserRole;
  status: UserStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Bus {
  id: string;
  plate_number: string;
  route_name: string;
  fare_price: number;
  capacity: number;
  status: BusStatus;
  created_at?: string;
}

export interface Shift {
  id: string;
  driver_id: string;
  bus_id: string;
  start_time: string;
  end_time?: string | null;
  status: ShiftStatus;
  created_at?: string;
  // Joined fields
  bus?: Bus;
  driver?: User;
  trips?: Trip[];
  settlement?: Settlement | null;
}

export interface Trip {
  id: string;
  shift_id: string;
  trip_number: number;
  cash_passenger_count: number;
  ticket_price: number;
  total_cash_amount: number;
  created_at: string;
}

export interface Settlement {
  id: string;
  shift_id: string;
  driver_id: string;
  total_collected_amount: number;
  settlement_method: SettlementMethod;
  receipt_image_url?: string | null;
  officer_pin_code?: string | null;
  status: SettlementStatus;
  rejection_reason?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  created_at: string;
  // Joined fields
  shift?: Shift;
  driver?: User;
}

export interface AuthSession {
  user: User;
  token: string;
}
