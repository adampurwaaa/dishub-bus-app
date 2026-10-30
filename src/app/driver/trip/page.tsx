'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { dataStore } from '@/lib/store';
import { Shift, Bus, Trip } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatRupiah, formatTimeOnly, generateUuid } from '@/lib/utils';
import { 
  Bus as BusIcon, 
  Plus, 
  Minus, 
  CheckCircle, 
  History, 
  ArrowRight, 
  Users, 
  Coins, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function TripCashEntryPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [activeBus, setActiveBus] = useState<Bus | null>(null);
  const [pastTrips, setPastTrips] = useState<Trip[]>([]);
  
  // Passenger count state with prominent stepper
  const [passengerCount, setPassengerCount] = useState<number>(0);
  const [successToast, setSuccessToast] = useState<string>('');
  const [errorToast, setErrorToast] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;
    const shift = dataStore.getActiveShift(user.id);
    if (!shift) {
      router.push('/driver/shift/start');
      return;
    }
    setActiveShift(shift);

    const buses = dataStore.getBuses();
    const bus = buses.find((b) => b.id === shift.bus_id) || null;
    setActiveBus(bus);

    // Initial load from local store
    const trips = dataStore.getTrips(shift.id);
    setPastTrips(trips);

    // Also sync from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const fetchSupabaseTrips = async () => {
        try {
          const { data, error } = await client
            .from('trips')
            .select('*')
            .eq('shift_id', shift.id)
            .order('trip_number', { ascending: false });

          if (error) {
            console.error('[Supabase Error] Gagal memuat riwayat rit dari Supabase:', error.message, error);
          } else if (data && data.length > 0) {
            const mapped: Trip[] = data.map((t: any) => ({
              id: t.id,
              shift_id: t.shift_id,
              trip_number: Number(t.trip_number),
              cash_passenger_count: Number(t.cash_passenger_count),
              ticket_price: Number(t.ticket_price),
              total_cash_amount: Number(t.total_cash_amount),
              created_at: t.created_at,
            }));
            setPastTrips(mapped);
          }
        } catch (err) {
          console.error('[Supabase Exception] Error saat sync awal trips:', err);
        }
      };

      fetchSupabaseTrips();
    }
  }, [user, router]);

  const currentTripNumber = pastTrips.length + 1;
  const ticketPrice = activeBus?.fare_price || 5000;
  const totalTripAmount = passengerCount * ticketPrice;

  // Stepper handlers
  const handleIncrement = (amount = 1) => {
    setPassengerCount((prev) => prev + amount);
  };

  const handleDecrement = (amount = 1) => {
    setPassengerCount((prev) => Math.max(0, prev - amount));
  };

  const handleSaveTrip = async () => {
    if (!activeShift) return;
    if (passengerCount === 0) {
      if (!window.confirm('Jumlah penumpang 0 pax (rit kosong). Tetap simpan rit ini?')) {
        return;
      }
    }

    setIsSaving(true);
    setErrorToast('');

    const tripId = generateUuid();
    const tripPayload = {
      id: tripId,
      shift_id: activeShift.id,
      trip_number: currentTripNumber,
      cash_passenger_count: passengerCount,
      ticket_price: ticketPrice,
      total_cash_amount: totalTripAmount,
      created_at: new Date().toISOString(),
    };

    console.log('[Supabase Client] Mengirim data rit ke Supabase table "trips":', tripPayload);

    let supabaseSaved = false;

    // DIRECT Supabase insert call using Supabase Client
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('trips')
          .insert(tripPayload)
          .select();

        if (error) {
          console.error('[Supabase Error] Gagal menyimpan ke tabel "trips":', error.message, error);
          setErrorToast(`Peringatan: Gagal kirim ke database online (${error.message}). Data disimpan lokal.`);
        } else {
          console.log('[Supabase Success] Rit berhasil terkirim ke Supabase:', data);
          supabaseSaved = true;
        }
      } catch (err: any) {
        console.error('[Supabase Exception] Koneksi ke Supabase gagal saat insert rit:', err);
        setErrorToast(`Koneksi database bermasalah (${err?.message || 'Network Error'}). Tersimpan di cache HP.`);
      }
    } else {
      console.warn('[Supabase Notice] Supabase Client tidak aktif atau kredensial kosong. Menggunakan penyimpanan lokal.');
    }

    // Save to local cache as well so UI updates smoothly and works offline
    await dataStore.addTrip({
      shiftId: activeShift.id,
      passengers: passengerCount,
      ticketPrice: ticketPrice,
    });

    const updated = dataStore.getTrips(activeShift.id);
    setPastTrips(updated);
    setPassengerCount(0);
    setIsSaving(false);

    setSuccessToast(
      `Rit ke-${tripPayload.trip_number} berhasil disimpan${supabaseSaved ? ' & terkirim ke server Supabase' : ''}: ${formatRupiah(tripPayload.total_cash_amount)}`
    );

    setTimeout(() => {
      setSuccessToast('');
    }, 4000);
  };

  if (!activeShift || !activeBus) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-600">Menyiapkan data rit...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Trip Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-4 shadow-lg border border-blue-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-700">
            Pencatatan Berjalan
          </span>
          <div className="text-2xl font-black mt-1">
            Trip / Rit ke-{currentTripNumber}
          </div>
          <div className="text-xs text-blue-200 mt-0.5">
            Bus: <strong className="text-white">{activeBus.plate_number}</strong> ({activeBus.route_name})
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-blue-300 block">Tarif Tiket</span>
          <span className="text-sm font-extrabold text-emerald-400">
            {formatRupiah(ticketPrice)}/pax
          </span>
        </div>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg animate-bounce">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="p-3 bg-amber-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Main Counter Card with Stepper */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm text-center">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
          Jumlah Penumpang Tunai Rit Ini
        </label>

        {/* Big Counter Value */}
        <div className="my-2">
          <span className="text-6xl font-black text-slate-900 tracking-tight">
            {passengerCount}
          </span>
          <span className="text-base font-bold text-slate-400 ml-2">Orang</span>
        </div>

        {/* Primary Stepper Buttons (- and +) with 48px+ touch target */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <button
            type="button"
            onClick={() => handleDecrement(1)}
            disabled={passengerCount === 0 || isSaving}
            className="min-h-[58px] rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-black text-2xl flex items-center justify-center transition border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <Minus className="w-8 h-8" />
          </button>
          <button
            type="button"
            onClick={() => handleIncrement(1)}
            disabled={isSaving}
            className="min-h-[58px] rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-2xl flex items-center justify-center transition shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>

        {/* Quick Add Shortcuts */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[+5, +10, +15, +20].map((val) => (
            <button
              key={val}
              type="button"
              disabled={isSaving}
              onClick={() => handleIncrement(val)}
              className="py-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-xs border border-slate-200 transition active:scale-95 disabled:opacity-50"
            >
              +{val}
            </button>
          ))}
        </div>

        {/* Real-time automatic calculator display */}
        <div className="bg-emerald-50 border-2 border-emerald-500/30 rounded-2xl p-4 text-emerald-950">
          <div className="text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5 mb-1">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>Kalkulator Pendapatan Tunai Otomatis</span>
          </div>
          <div className="text-xs text-emerald-700">
            {passengerCount} Penumpang × {formatRupiah(ticketPrice)}
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            Total Trip Ini: {formatRupiah(totalTripAmount)}
          </div>
        </div>

        {/* Primary Action Button: "Simpan Trip Ini" */}
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSaveTrip}
          className="w-full mt-4 min-h-[54px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-700/30 active:scale-98 transition disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Menyimpan ke Supabase...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Simpan Trip Ini</span>
            </>
          )}
        </button>
      </div>

      {/* History of Completed Trips Today */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Daftar Rit Tersimpan ({pastTrips.length})
            </h3>
          </div>
          <button
            onClick={() => router.push('/driver/shift/end')}
            className="text-xs text-blue-700 font-extrabold flex items-center gap-0.5 hover:underline"
          >
            <span>Setor Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pastTrips.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Belum ada rit yang disimpan pada shift ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
            {pastTrips.map((t) => (
              <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-extrabold text-slate-800">
                    Rit #{t.trip_number} • {t.cash_passenger_count} Penumpang
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Jam: {formatTimeOnly(t.created_at)}
                  </div>
                </div>
                <div className="text-right font-black text-emerald-600 text-sm">
                  {formatRupiah(t.total_cash_amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
