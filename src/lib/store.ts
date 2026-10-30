'use client';

import { User, Bus, Shift, Trip, Settlement } from '@/types';
import { INITIAL_USERS, INITIAL_BUSES, INITIAL_SHIFTS, INITIAL_TRIPS, INITIAL_SETTLEMENTS } from './mock-data';
import { supabase, isSupabaseConfigured } from './supabase';
import { generateUuid } from './utils';

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

  async startShift(driverId: string, busId: string): Promise<Shift> {
    const shifts = this.getShifts();
    const newShift: Shift = {
      id: generateUuid(),
      driver_id: driverId,
      bus_id: busId,
      start_time: new Date().toISOString(),
      end_time: null,
      status: 'OPEN',
      created_at: new Date().toISOString(),
    };

    // Save locally first for instant responsive UI
    shifts.unshift(newShift);
    setItem(SHIFTS_KEY, shifts);

    // Sync to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('shifts').insert({
          id: newShift.id,
          driver_id: newShift.driver_id,
          bus_id: newShift.bus_id,
          start_time: newShift.start_time,
          status: newShift.status,
        });
        if (error) {
          console.error('[Supabase Error] Gagal insert shift:', error.message, error);
        } else {
          console.log('[Supabase Success] Shift tersimpan di database:', newShift.id);
        }
      } catch (err) {
        console.error('[Supabase Exception] Error jaringan saat insert shift:', err);
      }
    }

    return newShift;
  },

  async closeShift(shiftId: string): Promise<Shift | null> {
    const shifts = this.getShifts();
    const idx = shifts.findIndex((s) => s.id === shiftId);
    if (idx === -1) return null;
    const endTime = new Date().toISOString();
    shifts[idx] = {
      ...shifts[idx],
      end_time: endTime,
      status: 'CLOSED',
    };
    setItem(SHIFTS_KEY, shifts);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('shifts')
          .update({
            end_time: endTime,
            status: 'CLOSED',
          })
          .eq('id', shiftId);
        if (error) {
          console.error('[Supabase Error] Gagal update closeShift:', error.message, error);
        }
      } catch (err) {
        console.error('[Supabase Exception] Error saat closeShift di Supabase:', err);
      }
    }

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

  async addTrip(data: { shiftId: string; passengers: number; ticketPrice: number }): Promise<Trip> {
    const trips = getItem<Trip[]>(TRIPS_KEY, INITIAL_TRIPS);
    const shiftTrips = trips.filter((t) => t.shift_id === data.shiftId);
    const nextTripNumber = shiftTrips.length + 1;

    const newTrip: Trip = {
      id: generateUuid(),
      shift_id: data.shiftId,
      trip_number: nextTripNumber,
      cash_passenger_count: data.passengers,
      ticket_price: data.ticketPrice,
      total_cash_amount: data.passengers * data.ticketPrice,
      created_at: new Date().toISOString(),
    };

    // Update local store immediately for instant UI feedback
    trips.unshift(newTrip);
    setItem(TRIPS_KEY, trips);

    // Directly insert into Supabase trips table
    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase] Mengirim transaksi rit ke Supabase...');
        const { data: insertedData, error } = await supabase.from('trips').insert({
          id: newTrip.id,
          shift_id: newTrip.shift_id,
          trip_number: newTrip.trip_number,
          cash_passenger_count: newTrip.cash_passenger_count,
          ticket_price: newTrip.ticket_price,
          total_cash_amount: newTrip.total_cash_amount,
          created_at: newTrip.created_at,
        }).select();

        if (error) {
          console.error('[Supabase Error] Gagal menyimpan rit ke tabel "trips":', error.message, error);
        } else {
          console.log('[Supabase Success] Rit berhasil tersimpan ke tabel "trips":', insertedData);
        }
      } catch (err) {
        console.error('[Supabase Exception] Terjadi kegagalan jaringan saat insert trips:', err);
      }
    } else {
      console.warn('[Supabase Notice] Supabase belum dikonfigurasi / kredensial belum valid. Tersimpan di local cache.');
    }

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

  async submitSettlement(data: {
    shiftId: string;
    driverId: string;
    totalAmount: number;
    method: 'BANK_TRANSFER' | 'FIELD_OFFICER';
    receiptImageUrl?: string | null;
    officerPinCode?: string | null;
  }): Promise<Settlement> {
    const settlements = this.getSettlements();
    // Close shift automatically when settlement is submitted
    await this.closeShift(data.shiftId);

    const newSettlement: Settlement = {
      id: generateUuid(),
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

    // Directly insert into Supabase settlements table
    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase] Mengirim setoran shift ke Supabase...');
        const { data: insertedData, error } = await supabase.from('settlements').insert({
          id: newSettlement.id,
          shift_id: newSettlement.shift_id,
          driver_id: newSettlement.driver_id,
          total_collected_amount: newSettlement.total_collected_amount,
          settlement_method: newSettlement.settlement_method,
          receipt_image_url: newSettlement.receipt_image_url,
          officer_pin_code: newSettlement.officer_pin_code,
          status: newSettlement.status,
          created_at: newSettlement.created_at,
        }).select();

        if (error) {
          console.error('[Supabase Error] Gagal menyimpan setoran ke tabel "settlements":', error.message, error);
        } else {
          console.log('[Supabase Success] Setoran berhasil tersimpan ke tabel "settlements":', insertedData);
        }
      } catch (err) {
        console.error('[Supabase Exception] Terjadi kegagalan jaringan saat insert settlements:', err);
      }
    } else {
      console.warn('[Supabase Notice] Supabase belum dikonfigurasi. Setoran tersimpan di local cache.');
    }

    return newSettlement;
  },

  async updateSettlementStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    verifierId: string,
    rejectionReason?: string
  ): Promise<Settlement | null> {
    const settlements = this.getSettlements();
    const idx = settlements.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    const verifiedAt = new Date().toISOString();
    settlements[idx] = {
      ...settlements[idx],
      status,
      rejection_reason: rejectionReason || null,
      verified_at: verifiedAt,
      verified_by: verifierId,
    };
    setItem(SETTLEMENTS_KEY, settlements);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('settlements')
          .update({
            status,
            rejection_reason: rejectionReason || null,
            verified_at: verifiedAt,
            verified_by: verifierId,
          })
          .eq('id', id);

        if (error) {
          console.error('[Supabase Error] Gagal update status settlement:', error.message, error);
        } else {
          console.log('[Supabase Success] Status settlement terupdate di database:', id, status);
        }
      } catch (err) {
        console.error('[Supabase Exception] Error saat update status settlement di Supabase:', err);
      }
    }

    return settlements[idx];
  },

  // Sync trips from Supabase into memory
  async syncTripsFromSupabase(): Promise<Trip[]> {
    if (!isSupabaseConfigured || !supabase) return this.getTrips();
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase Error] Gagal fetch trips:', error.message, error);
        return this.getTrips();
      }

      if (data && data.length > 0) {
        const local = this.getTrips();
        // Merge Supabase trips with local trips
        const mergedMap = new Map<string, Trip>();
        local.forEach((t) => mergedMap.set(t.id, t));
        data.forEach((t: any) => {
          mergedMap.set(t.id, {
            id: t.id,
            shift_id: t.shift_id,
            trip_number: Number(t.trip_number),
            cash_passenger_count: Number(t.cash_passenger_count),
            ticket_price: Number(t.ticket_price),
            total_cash_amount: Number(t.total_cash_amount),
            created_at: t.created_at,
          });
        });
        const mergedList = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setItem(TRIPS_KEY, mergedList);
        return mergedList;
      }
    } catch (err) {
      console.error('[Supabase Exception] Error sync trips:', err);
    }
    return this.getTrips();
  },

  // Sync settlements from Supabase into memory
  async syncSettlementsFromSupabase(): Promise<Settlement[]> {
    if (!isSupabaseConfigured || !supabase) return this.getSettlements();
    try {
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase Error] Gagal fetch settlements:', error.message, error);
        return this.getSettlements();
      }

      if (data && data.length > 0) {
        const local = this.getSettlements();
        const mergedMap = new Map<string, Settlement>();
        local.forEach((s) => mergedMap.set(s.id, s));
        data.forEach((s: any) => {
          mergedMap.set(s.id, {
            id: s.id,
            shift_id: s.shift_id,
            driver_id: s.driver_id,
            total_collected_amount: Number(s.total_collected_amount),
            settlement_method: s.settlement_method,
            receipt_image_url: s.receipt_image_url,
            officer_pin_code: s.officer_pin_code,
            status: s.status,
            rejection_reason: s.rejection_reason,
            verified_at: s.verified_at,
            verified_by: s.verified_by,
            created_at: s.created_at,
          });
        });
        const mergedList = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setItem(SETTLEMENTS_KEY, mergedList);
        return mergedList;
      }
    } catch (err) {
      console.error('[Supabase Exception] Error sync settlements:', err);
    }
    return this.getSettlements();
  },

  // Fetch full records combining Supabase + local cache
  async fetchReconciliationRecords() {
    if (isSupabaseConfigured && supabase) {
      await Promise.all([
        this.syncTripsFromSupabase(),
        this.syncSettlementsFromSupabase(),
      ]);
    }
    return this.getReconciliationRecords();
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
