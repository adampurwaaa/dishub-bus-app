'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { dataStore } from '@/lib/store';
import { Bus } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { Bus as BusIcon, MapPin, Users, Check, ArrowLeft, Play, ShieldAlert } from 'lucide-react';

export default function StartShiftPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    // Check if user already has an active shift
    const existing = dataStore.getActiveShift(user.id);
    if (existing) {
      router.push('/driver');
      return;
    }
    const list = dataStore.getBuses().filter((b) => b.status === 'OPERATIONAL');
    setBuses(list);
    if (list.length > 0) {
      setSelectedBusId(list[0].id);
    }
  }, [user, router]);

  const handleStartShift = () => {
    if (!user) return;
    if (!selectedBusId) {
      setError('Silakan pilih salah satu armada bus yang beroperasi.');
      return;
    }

    dataStore.startShift(user.id, selectedBusId);
    router.push('/driver/trip');
  };

  const selectedBus = buses.find((b) => b.id === selectedBusId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/driver')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            Langkah 1: Mulai Shift
          </span>
          <h1 className="text-xl font-black text-slate-900">Pilih Armada & Rute</h1>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Bus Selection Cards */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
          Daftar Bus Operasional Tersedia ({buses.length})
        </label>

        {buses.map((bus) => {
          const isSelected = bus.id === selectedBusId;
          return (
            <div
              key={bus.id}
              onClick={() => setSelectedBusId(bus.id)}
              className={`p-4 rounded-2xl cursor-pointer border-2 transition-all relative ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <BusIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900 leading-tight">
                      {bus.plate_number}
                    </div>
                    <div className="text-xs font-semibold text-blue-700 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{bus.route_name}</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>

              {/* Extra details */}
              <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kapasitas: {bus.capacity} Seat</span>
                </div>
                <div className="font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  Tarif: {formatRupiah(bus.fare_price)} / pax
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation summary */}
      {selectedBus && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg">
          <div className="text-xs text-slate-400 font-semibold mb-1">Konfirmasi Penugasan</div>
          <div className="text-sm font-bold">
            Anda akan bertugas di bus <span className="text-blue-400">{selectedBus.plate_number}</span> dengan rute <span className="text-emerald-400">{selectedBus.route_name}</span>.
          </div>
        </div>
      )}

      {/* Primary Action Button (Large Touch Target) */}
      <button
        type="button"
        onClick={handleStartShift}
        className="w-full min-h-[56px] bg-blue-700 hover:bg-blue-800 text-white font-black text-base rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-800/30 active:scale-98 transition"
      >
        <Play className="w-5 h-5 fill-current" />
        <span>Mulai Shift Operasional</span>
      </button>
    </div>
  );
}
