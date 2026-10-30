'use client';

import { User, Bus, Shift, Trip, Settlement } from '@/types';
import { INITIAL_USERS, INITIAL_BUSES, INITIAL_SHIFTS, INITIAL_TRIPS, INITIAL_SETTLEMENTS } from './mock-data';

const USERS_KEY = 'dishub_users_v1';
const BUSES_KEY = 'dishub_buses_v1';
const SHIFTS_KEY = 'dishub_shifts_v1';
const TRIPS_KEY = 'dishub_trips_v1';
const SETTLEMENTS_KEY = 'dishub_settlements_v1';
const CURRENT_USER_KEY = 'dishub_current_user_v1';

function getItem<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setItem<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error(`Failed to save to localStorage (${key}):`, err);
  }
}

export const dataStore = {
  // Auth & Session
  getCurrentUser(): User | null {
    return getItem<User | null>(CURRENT_USER_KEY, null);
  },

  setCurrentUser(user: User | null): void {
    setItem(CURRENT_USER_KEY, user);
  },

  loginDriver(idSupir: string, pin: string): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const found = users.find(
      (u) => u.nip_or_id.toLowerCase() === idSupir.trim().toLowerCase() && u.role === 'DRIVER'
    );
    if (!found) {
      return { success: false, error: 'ID Supir tidak ditemukan dalam database.' };
    }
    if (found.status === 'INACTIVE') {
      return { success: false, error: 'Status akun Supir sedang dinonaktifkan.' };
    }
    if (found.pin_code !== pin.trim()) {
      return { success: false, error: 'PIN tidak sesuai. Silakan coba lagi.' };
    }
    this.setCurrentUser(found);
    return { success: true, user: found };
  },

  loginAdmin(nip: string, password: string): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const found = users.find(
      (u) => u.nip_or_id.toLowerCase() === nip.trim().toLowerCase() && u.role === 'ADMIN'
    );
    if (!found) {
      return { success: false, error: 'NIP Admin tidak terdaftar.' };
    }
    if (found.status === 'INACTIVE') {
      return { success: false, error: 'Akun Admin ini tidak aktif.' };
    }
    if (found.pin_code !== password.trim()) {
      return { success: false, error: 'Password Admin keliru.' };
    }
    this.setCurrentUser(found);
    return { success: true, user: found };
  },

  logout(): void {
    this.setCurrentUser(null);
  },

  // Users
  getUsers(): User[] {
    return getItem<User[]>(USERS_KEY, INITIAL_USERS);
  },

  addUser(user: Omit<User, 'id' | 'created_at'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    users.unshift(newUser);
    setItem(USERS_KEY, users);
    return newUser;
  },

  updateUser(id: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates, updated_at: new Date().toISOString() };
    setItem(USERS_KEY, users);
    return users[idx];
  },

  // Buses
  getBuses(): Bus[] {
    return getItem<Bus[]>(BUSES_KEY, INITIAL_BUSES);
  },

  addBus(bus: Omit<Bus, 'id'>): Bus {
    const buses = this.getBuses();
    const newBus: Bus = {
      ...bus,
      id: `bus-${Date.now()}`,
    };
    buses.unshift(newBus);
    setItem(BUSES_KEY, buses);
    return newBus;
  },

  updateBus(id: string, updates: Partial<Bus>): Bus | null {
    const buses = this.getBuses();
    const idx = buses.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    buses[idx] = { ...buses[idx], ...updates };
    setItem(BUSES_KEY, buses);
    return buses[idx];
  },

  // Shifts
  getShifts(): Shift[] {
    return getItem<Shift[]>(SHIFTS_KEY, INITIAL_SHIFTS);
  },

  getActiveShift(driverId: string): Shift | null {
    const shifts = this.getShifts();
    return shifts.find((s) => s.driver_id === driverId && s.status === 'OPEN') || null;
  },

  startShift(driverId: string, busId: string): Shift {
    const shifts = this.getShifts();
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      driver_id: driverId,
      bus_id: busId,
      start_time: new Date().toISOString(),
      end_time: null,
      status: 'OPEN',
      created_at: new Date().toISOString(),
    };
    shifts.unshift(newShift);
    setItem(SHIFTS_KEY, shifts);
    return newShift;
  },

  closeShift(shiftId: string): Shift | null {
    const shifts = this.getShifts();
    const idx = shifts.findIndex((s) => s.id === shiftId);
    if (idx === -1) return null;
    shifts[idx] = {
      ...shifts[idx],
      end_time: new Date().toISOString(),
      status: 'CLOSED',
    };
    setItem(SHIFTS_KEY, shifts);
    return shifts[idx];
  },

  // Trips
  getTrips(shiftId?: string): Trip[] {
    const trips = getItem<Trip[]>(TRIPS_KEY, INITIAL_TRIPS);
    if (shiftId) {
      return trips.filter((t) => t.shift_id === shiftId);
    }
    return trips;
  },

  addTrip(data: { shiftId: string; passengers: number; ticketPrice: number }): Trip {
    const trips = getItem<Trip[]>(TRIPS_KEY, INITIAL_TRIPS);
    const shiftTrips = trips.filter((t) => t.shift_id === data.shiftId);
    const nextTripNumber = shiftTrips.length + 1;

    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      shift_id: data.shiftId,
      trip_number: nextTripNumber,
      cash_passenger_count: data.passengers,
      ticket_price: data.ticketPrice,
      total_cash_amount: data.passengers * data.ticketPrice,
      created_at: new Date().toISOString(),
    };
    trips.unshift(newTrip);
    setItem(TRIPS_KEY, trips);
    return newTrip;
  },

  // Settlements
  getSettlements(): Settlement[] {
    return getItem<Settlement[]>(SETTLEMENTS_KEY, INITIAL_SETTLEMENTS);
  },

  getSettlementByShift(shiftId: string): Settlement | null {
    const settlements = this.getSettlements();
    return settlements.find((s) => s.shift_id === shiftId) || null;
  },

  submitSettlement(data: {
    shiftId: string;
    driverId: string;
    totalAmount: number;
    method: 'BANK_TRANSFER' | 'FIELD_OFFICER';
    receiptImageUrl?: string | null;
    officerPinCode?: string | null;
  }): Settlement {
    const settlements = this.getSettlements();
    // Close shift automatically when settlement is submitted
    this.closeShift(data.shiftId);

    const newSettlement: Settlement = {
      id: `set-${Date.now()}`,
      shift_id: data.shiftId,
      driver_id: data.driverId,
      total_collected_amount: data.totalAmount,
      settlement_method: data.method,
      receipt_image_url: data.receiptImageUrl || null,
      officer_pin_code: data.officerPinCode || null,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    settlements.unshift(newSettlement);
    setItem(SETTLEMENTS_KEY, settlements);
    return newSettlement;
  },

  updateSettlementStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    verifierId: string,
    rejectionReason?: string
  ): Settlement | null {
    const settlements = this.getSettlements();
    const idx = settlements.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    settlements[idx] = {
      ...settlements[idx],
      status,
      rejection_reason: rejectionReason || null,
      verified_at: new Date().toISOString(),
      verified_by: verifierId,
    };
    setItem(SETTLEMENTS_KEY, settlements);
    return settlements[idx];
  },

  // Populated view helper for Reconcile & Dashboard
  getReconciliationRecords() {
    const settlements = this.getSettlements();
    const shifts = this.getShifts();
    const users = this.getUsers();
    const buses = this.getBuses();
    const trips = getItem<Trip[]>(TRIPS_KEY, INITIAL_TRIPS);

    return settlements.map((settlement) => {
      const shift = shifts.find((s) => s.id === settlement.shift_id);
      const driver = users.find((u) => u.id === settlement.driver_id);
      const bus = shift ? buses.find((b) => b.id === shift.bus_id) : undefined;
      const shiftTrips = trips.filter((t) => t.shift_id === settlement.shift_id);
      const totalPassengers = shiftTrips.reduce((acc, t) => acc + t.cash_passenger_count, 0);

      // Anomaly detection rules
      // 1. Long shift (> 5 hours) with passenger count < 10
      // 2. Average passengers per trip < 4
      const startTime = shift ? new Date(shift.start_time).getTime() : 0;
      const endTime = shift?.end_time ? new Date(shift.end_time).getTime() : Date.now();
      const durationHours = (endTime - startTime) / (1000 * 60 * 60);

      let isAnomaly = false;
      let anomalyReason = '';

      if (durationHours > 4 && totalPassengers < 10) {
        isAnomaly = true;
        anomalyReason = `Shift ${durationHours.toFixed(1)} jam, namun hanya tercatat ${totalPassengers} penumpang tunai.`;
      } else if (shiftTrips.length > 0 && totalPassengers / shiftTrips.length < 5) {
        isAnomaly = true;
        anomalyReason = `Rata-rata penumpang sangat rendah (${(totalPassengers / shiftTrips.length).toFixed(1)} pax/rit).`;
      }

      return {
        ...settlement,
        shift,
        driver,
        bus,
        trips: shiftTrips,
        totalPassengers,
        tripCount: shiftTrips.length,
        isAnomaly,
        anomalyReason,
      };
    });
  },
};
