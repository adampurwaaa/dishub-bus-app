'use client';

import React, { useState, useEffect } from 'react';
import { dataStore } from '@/lib/store';
import { User, Bus } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { 
  Users, 
  Bus as BusIcon, 
  Plus, 
  KeyRound, 
  Check, 
  X, 
  Edit3, 
  ShieldCheck, 
  AlertCircle,
  MapPin
} from 'lucide-react';

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<'DRIVERS' | 'BUSES'>('DRIVERS');

  // Drivers State
  const [drivers, setDrivers] = useState<User[]>([]);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [driverNip, setDriverNip] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPin, setDriverPin] = useState('');
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);

  // Buses State
  const [buses, setBuses] = useState<Bus[]>([]);
  const [showBusModal, setShowBusModal] = useState(false);
  const [plateNumber, setPlateNumber] = useState('');
  const [routeName, setRouteName] = useState('');
  const [farePrice, setFarePrice] = useState(5000);
  const [capacity, setCapacity] = useState(40);
  const [busStatus, setBusStatus] = useState<'OPERATIONAL' | 'MAINTENANCE'>('OPERATIONAL');
  const [editingBusId, setEditingBusId] = useState<string | null>(null);

  const refreshData = () => {
    const allUsers = dataStore.getUsers();
    setDrivers(allUsers.filter((u) => u.role === 'DRIVER'));
    setBuses(dataStore.getBuses());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Driver Handlers
  const handleOpenAddDriver = () => {
    setEditingDriverId(null);
    setDriverNip(`D-${Math.floor(100 + Math.random() * 900)}`);
    setDriverName('');
    setDriverPin('123456');
    setShowDriverModal(true);
  };

  const handleOpenEditDriver = (driver: User) => {
    setEditingDriverId(driver.id);
    setDriverNip(driver.nip_or_id);
    setDriverName(driver.full_name);
    setDriverPin(driver.pin_code);
    setShowDriverModal(true);
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim()) return;

    if (editingDriverId) {
      dataStore.updateUser(editingDriverId, {
        nip_or_id: driverNip,
        full_name: driverName,
        pin_code: driverPin,
      });
    } else {
      dataStore.addUser({
        nip_or_id: driverNip,
        full_name: driverName,
        pin_code: driverPin,
        role: 'DRIVER',
        status: 'ACTIVE',
      });
    }

    setShowDriverModal(false);
    refreshData();
  };

  const handleToggleDriverStatus = (driver: User) => {
    const nextStatus = driver.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    dataStore.updateUser(driver.id, { status: nextStatus });
    refreshData();
  };

  // Bus Handlers
  const handleOpenAddBus = () => {
    setEditingBusId(null);
    setPlateNumber('');
    setRouteName('');
    setFarePrice(5000);
    setCapacity(40);
    setBusStatus('OPERATIONAL');
    setShowBusModal(true);
  };

  const handleOpenEditBus = (bus: Bus) => {
    setEditingBusId(bus.id);
    setPlateNumber(bus.plate_number);
    setRouteName(bus.route_name);
    setFarePrice(bus.fare_price);
    setCapacity(bus.capacity);
    setBusStatus(bus.status);
    setShowBusModal(true);
  };

  const handleSaveBus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim() || !routeName.trim()) return;

    if (editingBusId) {
      dataStore.updateBus(editingBusId, {
        plate_number: plateNumber.toUpperCase(),
        route_name: routeName,
        fare_price: farePrice,
        capacity: capacity,
        status: busStatus,
      });
    } else {
      dataStore.addBus({
        plate_number: plateNumber.toUpperCase(),
        route_name: routeName,
        fare_price: farePrice,
        capacity: capacity,
        status: busStatus,
      });
    }

    setShowBusModal(false);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            Pengelolaan Data Referensi
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
            Master Data Dishub
          </h1>
          <p className="text-sm text-slate-500">
            Kelola data pengemudi resmi, pengaturan PIN akses, serta registrasi armada & tarif rute.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl border border-slate-300">
          <button
            onClick={() => setActiveTab('DRIVERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === 'DRIVERS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Data Supir Bus ({drivers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('BUSES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === 'BUSES'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BusIcon className="w-4 h-4 text-emerald-600" />
            <span>Data Armada & Rute ({buses.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DRIVERS MANAGEMENT */}
      {activeTab === 'DRIVERS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-extrabold text-slate-800">
              Daftar Pengemudi Terdaftar
            </h2>
            <button
              onClick={handleOpenAddDriver}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Supir Baru</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">ID Supir</th>
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Kode PIN Masuk</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4 text-center">Aksi / Reset PIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {drivers.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {d.nip_or_id}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{d.full_name}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-800 border border-slate-200">
                          {d.pin_code}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleDriverStatus(d)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {d.status} (Klik Ubah)
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenEditDriver(d)}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold inline-flex items-center gap-1 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit / Reset PIN</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUSES MANAGEMENT */}
      {activeTab === 'BUSES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-extrabold text-slate-800">
              Daftar Bus & Rute Trayek
            </h2>
            <button
              onClick={handleOpenAddBus}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Bus Baru</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nomor Polisi</th>
                    <th className="py-3 px-4">Nama Rute / Koridor</th>
                    <th className="py-3 px-4">Tarif Tiket Resmi</th>
                    <th className="py-3 px-4">Kapasitas</th>
                    <th className="py-3 px-4">Status Operasional</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {buses.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-black text-slate-900">{b.plate_number}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                        <span>{b.route_name}</span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-emerald-700">
                        {formatRupiah(b.fare_price)} / pax
                      </td>
                      <td className="py-3 px-4 text-slate-600">{b.capacity} Seat</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'OPERATIONAL'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenEditBus(b)}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold inline-flex items-center gap-1 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Ubah Tarif / Status</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DRIVER MODAL */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveDriver}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">
                {editingDriverId ? 'Ubah Profil Supir' : 'Registrasi Supir Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowDriverModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ID Supir</label>
              <input
                type="text"
                required
                value={driverNip}
                onChange={(e) => setDriverNip(e.target.value.toUpperCase())}
                placeholder="D-105"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap Supir
              </label>
              <input
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Misal: Joko Susilo"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PIN 4-6 Angka (Akses Masuk)
              </label>
              <input
                type="text"
                required
                minLength={4}
                maxLength={6}
                value={driverPin}
                onChange={(e) => setDriverPin(e.target.value)}
                placeholder="123456"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                PIN digunakan oleh supir untuk login melalui papan tombol angka layar sentuh.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDriverModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow"
              >
                Simpan Supir
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BUS MODAL */}
      {showBusModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveBus}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">
                {editingBusId ? 'Ubah Rute / Armada Bus' : 'Registrasi Armada Bus Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowBusModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Plat Nomor Kendaraan
              </label>
              <input
                type="text"
                required
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder="B 1234 ABC"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Koridor / Rute
              </label>
              <input
                type="text"
                required
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="Koridor 5: Kampung Melayu - Ancol"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tarif Resmi (Rp)
                </label>
                <input
                  type="number"
                  step="500"
                  required
                  value={farePrice}
                  onChange={(e) => setFarePrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kapasitas Kursi
                </label>
                <input
                  type="number"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status Armada
              </label>
              <select
                value={busStatus}
                onChange={(e: any) => setBusStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              >
                <option value="OPERATIONAL">OPERATIONAL (Dapat Dipilih Supir)</option>
                <option value="MAINTENANCE">MAINTENANCE (Bengkel / Perawatan)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBusModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow"
              >
                Simpan Armada
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
