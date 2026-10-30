'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { dataStore } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { 
  FileCheck, 
  Check, 
  X, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Building, 
  UserCheck, 
  Filter, 
  Search,
  ExternalLink,
  RefreshCw,
  Radio
} from 'lucide-react';

export default function ReconcilePage() {
  const { user } = useAuth();

  const [records, setRecords] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(false);
  
  // Modal viewer state for receipt photo
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  
  // Rejection modal
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Nominal transfer tidak sesuai dengan rekap rit.');

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const list = await dataStore.fetchReconciliationRecords();
      setRecords(list);
    } catch (err) {
      console.error('[Reconcile Page] Error fetch data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshData();

    // Supabase Realtime Subscription for automatic table updates
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      console.log('[Realtime Reconcile] Mendengarkan pembaruan tabel "settlements" dan "trips"...');
      const channel = client
        .channel('admin-reconcile-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'settlements' },
          (payload) => {
            console.log('[Realtime Event Reconcile] Settlements change:', payload);
            refreshData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'trips' },
          (payload) => {
            console.log('[Realtime Event Reconcile] Trips change:', payload);
            refreshData();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setRealtimeConnected(true);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setRealtimeConnected(false);
          }
        });

      return () => {
        client.removeChannel(channel);
      };
    }
  }, [refreshData]);

  const handleApprove = async (id: string) => {
    if (!user) return;
    await dataStore.updateSettlementStatus(id, 'APPROVED', user.id);
    refreshData();
  };

  const handleRejectSubmit = async () => {
    if (!user || !rejectingId) return;
    await dataStore.updateSettlementStatus(rejectingId, 'REJECTED', user.id, rejectReason);
    setRejectingId(null);
    refreshData();
  };

  // Filtering
  const filteredRecords = records.filter((r) => {
    const matchesStatus = filterStatus === 'ALL' ? true : r.status === filterStatus;
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      (r.bus?.plate_number || '').toLowerCase().includes(query) ||
      (r.driver?.full_name || '').toLowerCase().includes(query) ||
      (r.bus?.route_name || '').toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Verifikasi & Rekonsiliasi Kas Dishub
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
            Rekonsiliasi Setoran Supir
          </h1>
          <p className="text-sm text-slate-500">
            Verifikasi bukti transfer bank, periksa validitas rit harian, serta deteksi indikasi anomali/kecurangan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs shadow-sm">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                realtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-semibold text-slate-700">
              {realtimeConnected ? 'Realtime Aktif' : 'Polling Sync'}
            </span>
          </div>

          <button
            type="button"
            onClick={refreshData}
            disabled={isRefreshing}
            title="Tarik data terbaru dari Supabase"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500">Status:</span>
          <div className="flex gap-1.5 overflow-x-auto">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'Semua' : st}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Plat nomor, Supir, Rute..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Plat & Rute Armada</th>
                <th className="py-3.5 px-4">Nama Supir</th>
                <th className="py-3.5 px-4">Rit & Pax</th>
                <th className="py-3.5 px-4">Total Kas Tunai</th>
                <th className="py-3.5 px-4">Metode Penyetoran</th>
                <th className="py-3.5 px-4">Status & Waktu</th>
                <th className="py-3.5 px-4 text-center">Aksi / Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Tidak ditemukan catatan setoran yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isPending = r.status === 'PENDING';
                  return (
                    <tr
                      key={r.id}
                      className={`transition ${
                        r.isAnomaly
                          ? 'bg-amber-50/70 hover:bg-amber-100/50'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Plat & Rute with Anomaly Tag */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {r.bus?.plate_number || 'Tanpa Plat'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                          {r.bus?.route_name || '-'}
                        </div>
                        {r.isAnomaly && (
                          <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 text-[10px] font-bold border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-700" />
                            <span>{r.anomalyReason}</span>
                          </div>
                        )}
                      </td>

                      {/* Nama Supir */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{r.driver?.full_name || '-'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {r.driver?.nip_or_id}
                        </div>
                      </td>

                      {/* Rit & Pax */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{r.totalPassengers} Penumpang</div>
                        <div className="text-[10px] text-slate-400">{r.tripCount} Rit dicatat</div>
                      </td>

                      {/* Total Uang Kas */}
                      <td className="py-3.5 px-4">
                        <span className="font-black text-slate-900 text-sm block">
                          {formatRupiah(r.total_collected_amount)}
                        </span>
                      </td>

                      {/* Metode Setoran */}
                      <td className="py-3.5 px-4">
                        {r.settlement_method === 'BANK_TRANSFER' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                              <Building className="w-3 h-3" />
                              Transfer Bank
                            </span>
                            {r.receipt_image_url && (
                              <button
                                type="button"
                                onClick={() => setSelectedReceiptUrl(r.receipt_image_url)}
                                className="text-[11px] text-blue-600 hover:text-blue-800 font-extrabold hover:underline flex items-center gap-0.5"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Lihat Struk</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                              <UserCheck className="w-3 h-3" />
                              Petugas Loket
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              PIN: {r.officer_pin_code || 'Verified'}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            r.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : r.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {r.status === 'APPROVED'
                            ? '✓ Disetujui'
                            : r.status === 'REJECTED'
                            ? '✕ Ditolak'
                            : 'Pending'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {formatDateTime(r.created_at)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleApprove(r.id)}
                              title="Setujui Setoran"
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 transition shadow-sm active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => setRejectingId(r.id)}
                              title="Tolak Setoran"
                              className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1 transition shadow-sm active:scale-95"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Selesai diproses
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POP-UP MODAL: Image Viewer for Bank Receipts */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-600" />
                Bukti Struk Transfer Bank Supir
              </h3>
              <button
                onClick={() => setSelectedReceiptUrl(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center min-h-[300px]">
              <img
                src={selectedReceiptUrl}
                alt="Receipt Full View"
                className="max-h-[70vh] rounded-xl object-contain shadow"
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-500">
                Pastikan nama pengirim, nominal transfer, dan tanggal transaksi cocok.
              </span>
              <button
                onClick={() => setSelectedReceiptUrl(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-black text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Tolak Pengajuan Setoran</span>
            </div>
            <p className="text-xs text-slate-600">
              Berikan alasan penolakan agar pengemudi dapat mengunggah bukti ulang atau melapor ke pos pengawas Dishub:
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black"
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
