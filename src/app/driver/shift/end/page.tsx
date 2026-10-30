'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { dataStore } from '@/lib/store';
import { Shift, Bus, Trip } from '@/types';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { 
  Building2, 
  UserCheck, 
  Upload, 
  Send, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  KeyRound,
  FileCheck2
} from 'lucide-react';

export default function EndShiftSettlementPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [activeBus, setActiveBus] = useState<Bus | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  
  // Settlement choices
  const [settlementMethod, setSettlementMethod] = useState<'BANK_TRANSFER' | 'FIELD_OFFICER'>('BANK_TRANSFER');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [officerPin, setOfficerPin] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    const shift = dataStore.getActiveShift(user.id);
    if (!shift) {
      router.push('/driver');
      return;
    }
    setActiveShift(shift);

    const buses = dataStore.getBuses();
    const bus = buses.find((b) => b.id === shift.bus_id) || null;
    setActiveBus(bus);

    const shiftTrips = dataStore.getTrips(shift.id);
    setTrips(shiftTrips);
  }, [user, router]);

  const totalAccumulatedAmount = trips.reduce((acc, t) => acc + t.total_cash_amount, 0);
  const totalPassengers = trips.reduce((acc, t) => acc + t.cash_passenger_count, 0);

  // File upload simulation (or directly with Supabase Storage if configured)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create local preview blob URL or demo receipt
      const localUrl = URL.createObjectURL(file);
      setReceiptUrl(localUrl);
      setErrorMsg('');
    }
  };

  const handleUseMockReceipt = () => {
    // Convenient demo button for testing without local image file
    setReceiptUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80');
    setErrorMsg('');
  };

  const handleSubmitReport = () => {
    if (!activeShift || !user) return;
    setErrorMsg('');

    if (settlementMethod === 'BANK_TRANSFER' && !receiptUrl) {
      setErrorMsg('Wajib mengunggah foto struk transfer / bukti setoran bank.');
      return;
    }

    if (settlementMethod === 'FIELD_OFFICER') {
      if (!officerPin || officerPin.trim().length < 4) {
        setErrorMsg('Wajib memasukkan 4-6 digit PIN verifikasi petugas Dishub.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const settlement = dataStore.submitSettlement({
        shiftId: activeShift.id,
        driverId: user.id,
        totalAmount: totalAccumulatedAmount,
        method: settlementMethod,
        receiptImageUrl: settlementMethod === 'BANK_TRANSFER' ? receiptUrl : null,
        officerPinCode: settlementMethod === 'FIELD_OFFICER' ? officerPin : null,
      });

      router.push(`/driver/confirmation?settlementId=${settlement.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirimkan laporan setoran.');
      setIsSubmitting(false);
    }
  };

  if (!activeShift) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-600">Menyiapkan ringkasan shift...</p>
      </div>
    );
  }

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
            Langkah 3: Akhir Shift
          </span>
          <h1 className="text-xl font-black text-slate-900">Setoran & Tutup Shift</h1>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Accumulated Total Cash Card */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-5 shadow-xl border border-blue-900/60">
        <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">
          Total Kas Tunai Terkumpul Hari Ini
        </div>
        <div className="text-3xl font-black text-emerald-400 mb-2">
          {formatRupiah(totalAccumulatedAmount)}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-300 pt-3 border-t border-slate-800">
          <span>Total Rit: <strong>{trips.length} Rit</strong></span>
          <span>Total Penumpang: <strong>{totalPassengers} Pax</strong></span>
          <span>Bus: <strong>{activeBus?.plate_number}</strong></span>
        </div>
      </div>

      {/* Settlement Choice Tabs */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
          Pilih Metode Penyerahan Setoran
        </label>
        
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSettlementMethod('BANK_TRANSFER');
              setErrorMsg('');
            }}
            className={`p-3.5 rounded-2xl text-left border-2 transition-all flex flex-col justify-between min-h-[96px] ${
              settlementMethod === 'BANK_TRANSFER'
                ? 'border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 leading-tight">
                Setor Mandiri ke Bank
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Upload Struk Transfer / ATM</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSettlementMethod('FIELD_OFFICER');
              setErrorMsg('');
            }}
            className={`p-3.5 rounded-2xl text-left border-2 transition-all flex flex-col justify-between min-h-[96px] ${
              settlementMethod === 'FIELD_OFFICER'
                ? 'border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 leading-tight">
                Serah Petugas Dishub
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Verifikasi PIN Petugas Loket</div>
            </div>
          </button>
        </div>
      </div>

      {/* Choice A: Bank Transfer / ATM Upload */}
      {settlementMethod === 'BANK_TRANSFER' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-blue-600" />
              Foto / Bukti Resi Transfer
            </h3>
            <button
              type="button"
              onClick={handleUseMockReceipt}
              className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 hover:bg-blue-100"
            >
              Gunakan Struk Contoh
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Transfer ke Rekening Kas Dishub: <strong className="text-slate-800">Bank DKI 101-23-45678 (Dishub Pendapatan Bus)</strong>.
          </p>

          {/* Upload Drop Area */}
          <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50 min-h-[140px]">
            {receiptUrl ? (
              <div className="space-y-2 text-center">
                <img
                  src={receiptUrl}
                  alt="Bukti Transfer"
                  className="max-h-36 rounded-xl object-contain mx-auto border border-slate-200 shadow-sm"
                />
                <span className="text-xs text-emerald-600 font-bold block">
                  Foto struk berhasil dipilih (Klik untuk ganti)
                </span>
              </div>
            ) : (
              <div className="text-center space-y-1">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <span className="text-xs font-bold text-slate-700 block">
                  Pilih Foto Struk / Kamera
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Format JPG, PNG, atau screenshot m-Banking
                </span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Choice B: Serah Terima Petugas Lapangan via PIN */}
      {settlementMethod === 'FIELD_OFFICER' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              PIN Petugas Verifikator Lapangan
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Serahkan uang fisik sejumlah <strong className="text-slate-900">{formatRupiah(totalAccumulatedAmount)}</strong> kepada petugas loket terminal, lalu mintalah petugas memasukkan PIN verifikasinya di bawah ini.
          </p>

          <div>
            <input
              type="password"
              maxLength={6}
              value={officerPin}
              onChange={(e) => setOfficerPin(e.target.value)}
              placeholder="Masukkan 4-6 digit PIN Petugas"
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3.5 text-center text-xl font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="text-center mt-2">
              <span className="text-[11px] text-slate-400">
                Demo PIN Petugas Lapangan: <code className="font-mono text-emerald-600 font-bold">8899</code>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Button: "Kirim Laporan Setoran" */}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={handleSubmitReport}
        className="w-full min-h-[54px] bg-blue-700 hover:bg-blue-800 text-white font-black text-base rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-800/30 active:scale-98 transition disabled:opacity-50"
      >
        <Send className="w-5 h-5" />
        <span>{isSubmitting ? 'Mengirim Laporan...' : 'Kirim Laporan Setoran'}</span>
      </button>
    </div>
  );
}
