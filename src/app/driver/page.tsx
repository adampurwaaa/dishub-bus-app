'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { dataStore } from '@/lib/store';
import { Shift, Bus, Settlement } from '@/types';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { 
  Play, 
  PlusCircle, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  DollarSign, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export default function DriverDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [activeBus, setActiveBus] = useState<Bus | null>(null);
  const [tripCount, setTripCount] = useState(0);
  const [totalAccumulatedCash, setTotalAccumulatedCash] = useState(0);
  const [latestSettlement, setLatestSettlement] = useState<Settlement | null>(null);

  useEffect(() => {
    if (!user) return;
    const shift = dataStore.getActiveShift(user.id);
    setActiveShift(shift);

    if (shift) {
      const buses = dataStore.getBuses();
      const bus = buses.find((b) => b.id === shift.bus_id) || null;
      setActiveBus(bus);

      const trips = dataStore.getTrips(shift.id);
      setTripCount(trips.length);
      const sum = trips.reduce((acc, t) => acc + t.total_cash_amount, 0);
      setTotalAccumulatedCash(sum);
    } else {
      // Check if driver has a recent settlement
      const settlements = dataStore.getSettlements().filter((s) => s.driver_id === user.id);
      if (settlements.length > 0) {
        setLatestSettlement(settlements[0]);
      }
    }
  }, [user]);

  return (
    <div className="space-y-4">
      {/* Active Shift State */}
      {activeShift && activeBus ? (
        <div className="space-y-4">
          {/* Status Badge card */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-3xl p-5 shadow-xl border border-blue-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-blue-600/20 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Shift Aktif Sedang Berjalan
              </span>
              <span className="text-[11px] text-blue-200">
                {formatDateTime(activeShift.start_time)}
              </span>
            </div>

            <div className="bg-slate-950/40 backdrop-blur-sm rounded-2xl p-4 border border-blue-500/20 mb-4">
              <div className="text-xs text-blue-300 font-semibold mb-1">Armada & Rute Ditugaskan</div>
              <div className="text-2xl font-black tracking-wide text-white mb-1">
                {activeBus.plate_number}
              </div>
              <div className="text-xs text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{activeBus.route_name}</span>
              </div>
              <div className="text-xs text-blue-300 font-medium mt-2">
                Tarif Resmi: <strong className="text-white">{formatRupiah(activeBus.fare_price)} / pax</strong>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-950/60 p-3 rounded-2xl border border-blue-800/80">
                <span className="text-[11px] text-blue-300 block mb-1">Rit Diselesaikan</span>
                <span className="text-2xl font-black text-white">{tripCount} Rit</span>
              </div>
              <div className="bg-blue-950/60 p-3 rounded-2xl border border-blue-800/80">
                <span className="text-[11px] text-emerald-300 block mb-1">Total Kas Terkumpul</span>
                <span className="text-lg font-black text-emerald-400 truncate block">
                  {formatRupiah(totalAccumulatedCash)}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                onClick={() => router.push('/driver/trip')}
                className="w-full min-h-[50px] bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/40 active:scale-98 transition"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Input Rit Baru (+ Tambah Penumpang)</span>
              </button>
              <button
                onClick={() => router.push('/driver/shift/end')}
                className="w-full min-h-[46px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl flex items-center justify-center gap-2 border border-slate-700 text-sm active:scale-98 transition"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Akhiri Shift & Setor Pendapatan</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* No Active Shift -> Prompt to Start */
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-inner">
              <Play className="w-8 h-8 ml-1" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">
              Siap Memulai Operasional?
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Pilih bus dan rute yang akan Anda kemudikan hari ini untuk membuka pencatatan pendapatan rit.
            </p>

            <button
              onClick={() => router.push('/driver/shift/start')}
              className="w-full min-h-[52px] bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-700/30 active:scale-98 transition"
            >
              <span>Mulai Shift Operasional</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Last Settlement info if any */}
          {latestSettlement && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Setoran Terakhir Anda
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-extrabold ${
                    latestSettlement.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : latestSettlement.status === 'REJECTED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {latestSettlement.status === 'APPROVED'
                    ? 'Lunas / Terverifikasi'
                    : latestSettlement.status === 'REJECTED'
                    ? 'Ditolak Petugas'
                    : 'Menunggu Verifikasi'}
                </span>
              </div>
              <div className="text-xl font-black text-slate-900">
                {formatRupiah(latestSettlement.total_collected_amount)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Metode: {latestSettlement.settlement_method === 'BANK_TRANSFER' ? 'Transfer Bank' : 'Petugas Lapangan'} • {formatDateTime(latestSettlement.created_at)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Driver Guidelines card */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-1.5">
        <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          Ketentuan Sopir Dishub:
        </div>
        <p>1. Catat jumlah penumpang tunai setiap kali tiba di halte pemberhentian terakhir rute.</p>
        <p>2. Pastikan nominal uang fisik sesuai dengan perhitungan otomatis pada aplikasi sebelum setor.</p>
        <p>3. Simpan foto struk transfer ATM / Mobile Banking dengan jelas jika menyetor mandiri.</p>
      </div>
    </div>
  );
}
