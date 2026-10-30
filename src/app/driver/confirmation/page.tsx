'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { dataStore } from '@/lib/store';
import { Settlement, Shift, Bus } from '@/types';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileText, 
  Home, 
  ShieldCheck, 
  RefreshCw,
  Building2,
  UserCheck
} from 'lucide-react';

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const settlementId = searchParams.get('settlementId');
  const { user } = useAuth();

  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [shift, setShift] = useState<Shift | null>(null);
  const [bus, setBus] = useState<Bus | null>(null);

  const reloadData = async () => {
    if (!settlementId) return;

    // Check local store first
    const all = dataStore.getSettlements();
    let found = all.find((s) => s.id === settlementId) || null;

    // Check Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('settlements')
          .select('*')
          .eq('id', settlementId)
          .single();

        if (error) {
          console.error('[Confirmation] Gagal fetch settlement dari Supabase:', error.message);
        } else if (data) {
          found = {
            id: data.id,
            shift_id: data.shift_id,
            driver_id: data.driver_id,
            total_collected_amount: Number(data.total_collected_amount),
            settlement_method: data.settlement_method,
            receipt_image_url: data.receipt_image_url,
            officer_pin_code: data.officer_pin_code,
            status: data.status,
            rejection_reason: data.rejection_reason,
            verified_at: data.verified_at,
            verified_by: data.verified_by,
            created_at: data.created_at,
          };
        }
      } catch (err) {
        console.error('[Confirmation] Exception fetch settlement:', err);
      }
    }

    setSettlement(found);

    if (found) {
      const shifts = dataStore.getShifts();
      const s = shifts.find((sh) => sh.id === found.shift_id) || null;
      setShift(s);
      if (s) {
        const buses = dataStore.getBuses();
        setBus(buses.find((b) => b.id === s.bus_id) || null);
      }
    }
  };

  useEffect(() => {
    reloadData();

    // Listen in realtime for verification status updates from Admin
    if (isSupabaseConfigured && supabase && settlementId) {
      const client = supabase;
      const channel = client
        .channel(`driver-settlement-${settlementId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'settlements',
            filter: `id=eq.${settlementId}`,
          },
          (payload) => {
            console.log('[Realtime Driver] Status setoran berubah:', payload);
            reloadData();
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, [settlementId]);

  if (!settlement) {
    return (
      <div className="text-center py-12">
        <Clock className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
        <p className="text-sm text-slate-600">Memuat rincian setoran...</p>
      </div>
    );
  }

  const isApproved = settlement.status === 'APPROVED';
  const isRejected = settlement.status === 'REJECTED';
  const isPending = settlement.status === 'PENDING';

  return (
    <div className="space-y-4">
      {/* Status Hero Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 text-center shadow-sm">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
            isApproved
              ? 'bg-emerald-100 text-emerald-600'
              : isRejected
              ? 'bg-red-100 text-red-600'
              : 'bg-amber-100 text-amber-600'
          }`}
        >
          {isApproved ? (
            <CheckCircle className="w-10 h-10" />
          ) : isRejected ? (
            <XCircle className="w-10 h-10" />
          ) : (
            <Clock className="w-10 h-10 animate-pulse" />
          )}
        </div>

        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 ${
            isApproved
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
              : isRejected
              ? 'bg-red-50 text-red-700 border border-red-300'
              : 'bg-amber-50 text-amber-800 border border-amber-300'
          }`}
        >
          {isApproved
            ? '✓ Lunas / Terverifikasi Dishub'
            : isRejected
            ? '✗ Laporan Ditolak'
            : 'Menunggu Verifikasi Petugas'}
        </span>

        <h1 className="text-xl font-black text-slate-900">
          {isApproved
            ? 'Setoran Berhasil Diverifikasi!'
            : isRejected
            ? 'Setoran Memerlukan Revisi'
            : 'Laporan Setoran Terkirim'}
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          {isApproved
            ? 'Dana pendapatan operasional telah dicocokkan dan disetujui oleh Administrator.'
            : isRejected
            ? `Alasan: ${settlement.rejection_reason || 'Bukti transfer tidak terbaca.'}`
            : 'Laporan shift dan bukti setoran Anda sedang dalam proses rekonsiliasi admin loket Dishub.'}
        </p>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-400">Total Nilai Setoran</div>
          <div className="text-3xl font-black text-slate-900">
            {formatRupiah(settlement.total_collected_amount)}
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs">
        <h3 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-blue-600" />
          Detail Pengajuan Shift
        </h3>

        <div className="space-y-2 divide-y divide-slate-100">
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500">Nomor Registrasi Setoran</span>
            <span className="font-mono font-bold text-slate-800">{settlement.id}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500">Nama Pengemudi</span>
            <span className="font-bold text-slate-800">{user?.full_name}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500">Armada Bus</span>
            <span className="font-bold text-slate-800">{bus?.plate_number || '-'}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500">Rute</span>
            <span className="font-bold text-slate-800 text-right max-w-[200px] truncate">
              {bus?.route_name || '-'}
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500">Metode Setoran</span>
            <span className="font-bold text-blue-700">
              {settlement.settlement_method === 'BANK_TRANSFER'
                ? 'Setor Mandiri ke Bank'
                : 'Serah Terima Petugas Dishub'}
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500">Waktu Kirim</span>
            <span className="font-semibold text-slate-700">
              {formatDateTime(settlement.created_at)}
            </span>
          </div>
        </div>

        {/* Receipt Image if available */}
        {settlement.receipt_image_url && (
          <div className="pt-2">
            <span className="text-slate-500 block mb-1.5">Foto Struk / Resi:</span>
            <img
              src={settlement.receipt_image_url}
              alt="Bukti Resi"
              className="w-full max-h-48 object-cover rounded-xl border border-slate-200"
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={reloadData}
          className="w-full min-h-[46px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 border border-slate-300"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Cek Pembaruan Status Real-Time</span>
        </button>

        <button
          onClick={() => router.push('/driver')}
          className="w-full min-h-[50px] bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-800/30 active:scale-98 transition"
        >
          <Home className="w-4 h-4" />
          <span>Kembali ke Halaman Utama Supir</span>
        </button>
      </div>
    </div>
  );
}

export default function SubmissionConfirmationScreen() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Memuat rincian konfirmasi...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
