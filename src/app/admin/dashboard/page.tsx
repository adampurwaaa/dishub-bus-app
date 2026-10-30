'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { dataStore } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { 
  DollarSign, 
  Bus, 
  Clock, 
  CreditCard, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Building,
  UserCheck,
  RefreshCw,
  Radio
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardOverview() {
  const [records, setRecords] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [stats, setStats] = useState({
    totalIncome: 0,
    operationalBusesCount: 0,
    pendingApprovalsCount: 0,
    bankIncome: 0,
    cashOfficerIncome: 0,
    anomaliesCount: 0,
  });

  const computeAndSetData = useCallback((recs: any[], busList: any[]) => {
    setRecords(recs);
    setBuses(busList);

    // Calculate metrics
    const totalInc = recs.reduce((acc, r) => acc + Number(r.total_collected_amount || 0), 0);
    const pendingCount = recs.filter((r) => r.status === 'PENDING').length;
    const anomalyCount = recs.filter((r) => r.isAnomaly).length;
    const opBuses = busList.filter((b) => b.status === 'OPERATIONAL').length;

    const bankInc = recs
      .filter((r) => r.settlement_method === 'BANK_TRANSFER')
      .reduce((acc, r) => acc + Number(r.total_collected_amount || 0), 0);

    const officerInc = recs
      .filter((r) => r.settlement_method === 'FIELD_OFFICER')
      .reduce((acc, r) => acc + Number(r.total_collected_amount || 0), 0);

    setStats({
      totalIncome: totalInc,
      operationalBusesCount: opBuses,
      pendingApprovalsCount: pendingCount,
      bankIncome: bankInc,
      cashOfficerIncome: officerInc,
      anomaliesCount: anomalyCount,
    });
    setLastUpdated(new Date());
  }, []);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const recs = await dataStore.fetchReconciliationRecords();
      const busList = dataStore.getBuses();
      computeAndSetData(recs, busList);
    } catch (err) {
      console.error('[Admin Dashboard] Gagal load data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [computeAndSetData]);

  useEffect(() => {
    loadData();

    // Supabase Realtime Subscription for trips and settlements
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      console.log('[Realtime] Mengaktifkan Realtime Subscription untuk tabel "trips" dan "settlements"...');

      const channel = client
        .channel('admin-dashboard-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'trips' },
          (payload) => {
            console.log('[Realtime Event] Perubahan tabel "trips" terdeteksi:', payload);
            loadData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'settlements' },
          (payload) => {
            console.log('[Realtime Event] Perubahan tabel "settlements" terdeteksi:', payload);
            loadData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'shifts' },
          (payload) => {
            console.log('[Realtime Event] Perubahan tabel "shifts" terdeteksi:', payload);
            loadData();
          }
        )
        .subscribe((status) => {
          console.log('[Realtime Status]:', status);
          if (status === 'SUBSCRIBED') {
            setRealtimeConnected(true);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setRealtimeConnected(false);
          }
        });

      return () => {
        console.log('[Realtime] Menutup channel realtime subscription dashboard.');
        client.removeChannel(channel);
      };
    }
  }, [loadData]);

  const totalCalculated = stats.bankIncome + stats.cashOfficerIncome;
  const bankPercent = totalCalculated > 0 ? Math.round((stats.bankIncome / totalCalculated) * 100) : 50;
  const cashPercent = 100 - bankPercent;

  return (
    <div className="space-y-6">
      {/* Page Title & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            Monitoring Pendapatan & Armada
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
            Dashboard Pengawasan Dishub
          </h1>
          <p className="text-sm text-slate-500">
            Laporan agregat pendapatan tiket kas bus, verifikasi setoran, dan indikator anomali.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Live Sync Indicator */}
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
            onClick={loadData}
            disabled={isRefreshing}
            title="Tarik pembaruan data dari Supabase"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <Link
            href="/admin/reconcile"
            className="bg-blue-700 hover:bg-blue-800 text-white text-xs md:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-700/20 flex items-center gap-1.5 transition"
          >
            <span>Verifikasi Setoran ({stats.pendingApprovalsCount})</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Anomaly Notification Bar if any */}
      {stats.anomaliesCount > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-900">
              Peringatan Anomali Pendapatan Terdeteksi ({stats.anomaliesCount} Laporan):
            </span>
            <p className="text-amber-800 mt-0.5">
              Terdapat rit bus dengan durasi panjang namun jumlah penumpang kas sangat minim. Silakan periksa di menu Rekonsiliasi.
            </p>
          </div>
        </div>
      )}

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pendapatan Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Total Pendapatan Terkumpul
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatRupiah(stats.totalIncome)}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Terakumulasi dari seluruh rit aktif</span>
          </div>
        </div>

        {/* Card 2: Jumlah Bus Beroperasi */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Bus Beroperasi
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Bus className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.operationalBusesCount} <span className="text-sm font-semibold text-slate-400">/ {buses.length} Unit</span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-2">
            Tersedia untuk rute operasional kota
          </div>
        </div>

        {/* Card 3: Pending Approvals */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Menunggu Approval
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">
            {stats.pendingApprovalsCount} <span className="text-sm font-semibold text-slate-400">Setoran</span>
          </div>
          <div className="text-xs text-amber-700 font-medium mt-2">
            Perlu diverifikasi oleh petugas
          </div>
        </div>

        {/* Card 4: Cash vs Bank Ratio */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Rasio Bank vs Petugas
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {bankPercent}% <span className="text-sm font-semibold text-slate-400">Bank</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden flex">
            <div className="bg-blue-600 h-2" style={{ width: `${bankPercent}%` }} />
            <div className="bg-emerald-500 h-2" style={{ width: `${cashPercent}%` }} />
          </div>
          <div className="text-[10px] text-slate-400 flex justify-between mt-1">
            <span>Bank: {bankPercent}%</span>
            <span>Petugas: {cashPercent}%</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Submissions & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table of Latest Submissions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Aktivitas Setoran Terbaru
              </h2>
              <p className="text-xs text-slate-500">Rekap transaksi setoran yang masuk ke sistem</p>
            </div>
            <Link
              href="/admin/reconcile"
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              Lihat Semua →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Plat / Bus</th>
                  <th className="py-2.5 px-3">Nama Supir</th>
                  <th className="py-2.5 px-3">Total Setoran</th>
                  <th className="py-2.5 px-3">Metode</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {records.slice(0, 5).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {r.bus?.plate_number || '-'}
                    </td>
                    <td className="py-3 px-3">{r.driver?.full_name || '-'}</td>
                    <td className="py-3 px-3 font-black text-slate-900">
                      {formatRupiah(r.total_collected_amount)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                        {r.settlement_method === 'BANK_TRANSFER' ? 'Transfer Bank' : 'Petugas Dishub'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Channel Breakdown Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-slate-900">
            Komposisi Kanal Penyetoran
          </h2>

          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
            <div className="flex items-center justify-between text-xs text-blue-900 font-bold">
              <span className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-600" />
                Transfer Bank (Rek. Kasda)
              </span>
              <span>{bankPercent}%</span>
            </div>
            <div className="text-xl font-black text-blue-950">
              {formatRupiah(stats.bankIncome)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between text-xs text-emerald-900 font-bold">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Serah Terima Petugas Loket
              </span>
              <span>{cashPercent}%</span>
            </div>
            <div className="text-xl font-black text-emerald-950">
              {formatRupiah(stats.cashOfficerIncome)}
            </div>
          </div>

          <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 leading-relaxed">
            Penyetoran via Bank diverifikasi secara manual berdasarkan struk mutasi. Penyetoran petugas langsung tercatat melalui otorisasi PIN mandiri di loket terminal.
          </div>
        </div>
      </div>
    </div>
  );
}
