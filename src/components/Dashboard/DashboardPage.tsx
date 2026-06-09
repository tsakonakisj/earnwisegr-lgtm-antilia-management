import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isDemoMode } from '../../lib/supabase';
import {
  CalendarDaysIcon,
  CurrencyEuroIcon,
  TruckIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SourceStat {
  source: string;
  count: number;
  revenue: number;
}

interface StatusStat {
  status: string;
  count: number;
}

interface FleetStat {
  available: number;
  reserved: number;
  active: number;
  service: number;
  total: number;
}

interface TodayEntry {
  id: string;
  customerName: string;
  vehicleLabel: string;
  time: string;
  station: string;
}

const SOURCE_LABELS: Record<string, string> = {
  'store': 'Κατάστημα',
  'walk-in': 'Κατάστημα',
  'phone': 'Τηλέφωνο',
  'instagram': 'Instagram',
  'whatsapp': 'WhatsApp',
  'website': 'Ιστοσελίδα',
  'repeat': 'Επαναλαμβανόμενος Πελάτης',
  'other': 'Άλλο'
};

const STATUS_LABELS: Record<string, string> = {
  'upcoming': 'Επερχόμενες',
  'active': 'Ενεργές',
  'completed': 'Ολοκληρωμένες',
  'cancelled': 'Ακυρωμένες'
};

const STATUS_COLORS: Record<string, string> = {
  'upcoming': 'bg-blue-100 text-blue-800',
  'active': 'bg-green-100 text-green-800',
  'completed': 'bg-gray-100 text-gray-800',
  'cancelled': 'bg-red-100 text-red-800'
};

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [sourceStats, setSourceStats] = useState<SourceStat[]>([]);
  const [statusStats, setStatusStats] = useState<StatusStat[]>([]);
  const [fleetStats, setFleetStats] = useState<FleetStat>({ available: 0, reserved: 0, active: 0, service: 0, total: 0 });
  const [todayPickups, setTodayPickups] = useState<TodayEntry[]>([]);
  const [todayReturns, setTodayReturns] = useState<TodayEntry[]>([]);

  const fetchDashboard = useCallback(async () => {
    if (isDemoMode || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch reservations with customer source
      const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select(`
          id, status, total_amount, pickup_date, return_date,
          customer:customers!customer_id(name, source),
          vehicle:vehicles!vehicle_id(plate, brand, model),
          pickup_station:stations!pickup_station_id(name),
          return_station:stations!return_station_id(name)
        `);

      if (resError) {
        console.error('Reservations query error:', resError);
      }

      // Fetch vehicles
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, status');

      // Process source stats
      const sourceMap = new Map<string, { count: number; revenue: number }>();
      (reservations || []).forEach((r: any) => {
        const source = r.customer?.source || 'other';
        const existing = sourceMap.get(source) || { count: 0, revenue: 0 };
        existing.count += 1;
        existing.revenue += Number(r.total_amount) || 0;
        sourceMap.set(source, existing);
      });
      const sourceData: SourceStat[] = Array.from(sourceMap.entries()).map(([source, data]) => ({
        source,
        ...data
      }));
      setSourceStats(sourceData);

      // Process status stats
      const statusMap = new Map<string, number>();
      (reservations || []).forEach((r: any) => {
        statusMap.set(r.status, (statusMap.get(r.status) || 0) + 1);
      });
      const statusData: StatusStat[] = ['upcoming', 'active', 'completed', 'cancelled'].map(status => ({
        status,
        count: statusMap.get(status) || 0
      }));
      setStatusStats(statusData);

      // Process fleet stats
      const fleet: FleetStat = { available: 0, reserved: 0, active: 0, service: 0, total: 0 };
      (vehicles || []).forEach((v: any) => {
        fleet.total += 1;
        if (v.status === 'available') fleet.available += 1;
        else if (v.status === 'reserved') fleet.reserved += 1;
        else if (v.status === 'service') fleet.service += 1;
      });
      // Count active rentals from reservations
      fleet.active = statusMap.get('active') || 0;
      setFleetStats(fleet);

      // Today's pickups
      const pickups: TodayEntry[] = (reservations || [])
        .filter((r: any) => r.pickup_date && r.pickup_date.startsWith(today) && r.status !== 'cancelled')
        .map((r: any) => ({
          id: r.id,
          customerName: r.customer?.name || '-',
          vehicleLabel: r.vehicle ? `${r.vehicle.plate} ${r.vehicle.brand} ${r.vehicle.model}` : '-',
          time: r.pickup_date ? new Date(r.pickup_date).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' }) : '-',
          station: r.pickup_station?.name || '-'
        }));
      setTodayPickups(pickups);

      // Today's returns
      const returns: TodayEntry[] = (reservations || [])
        .filter((r: any) => r.return_date && r.return_date.startsWith(today) && r.status !== 'cancelled')
        .map((r: any) => ({
          id: r.id,
          customerName: r.customer?.name || '-',
          vehicleLabel: r.vehicle ? `${r.vehicle.plate} ${r.vehicle.brand} ${r.vehicle.model}` : '-',
          time: r.return_date ? new Date(r.return_date).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' }) : '-',
          station: r.return_station?.name || '-'
        }));
      setTodayReturns(returns);
    } catch (err) {
      console.error('Dashboard load failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <ArrowPathIcon className="h-6 w-6 text-blue-600 animate-spin mr-3" />
        <span className="text-gray-600">Φόρτωση ταμπλό...</span>
      </div>
    );
  }

  if (isDemoMode) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Κεντρικό Ταμπλό</h1>
        <div className="text-center py-12 bg-white shadow-sm rounded-lg">
          <p className="text-gray-500">Το ταμπλό χρειάζεται σύνδεση βάσης δεδομένων.</p>
        </div>
      </div>
    );
  }

  const totalReservations = statusStats.reduce((s, st) => s + st.count, 0);
  const totalRevenue = sourceStats.reduce((s, st) => s + st.revenue, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Κεντρικό Ταμπλό</h1>
        <button
          onClick={fetchDashboard}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4 mr-1.5" />
          Ανανέωση
        </button>
      </div>

      {/* Reservation Status Overview */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Κατάσταση Κρατήσεων</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statusStats.map((st) => (
            <div key={st.status} className="bg-white shadow-sm rounded-lg p-5">
              <div className="flex items-center justify-between mb-2">
                {st.status === 'upcoming' && <ClockIcon className="h-5 w-5 text-blue-600" />}
                {st.status === 'active' && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
                {st.status === 'completed' && <CalendarDaysIcon className="h-5 w-5 text-gray-500" />}
                {st.status === 'cancelled' && <XMarkIcon className="h-5 w-5 text-red-500" />}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[st.status] || 'bg-gray-100 text-gray-800'}`}>
                  {STATUS_LABELS[st.status] || st.status}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{st.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet Availability */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Στόλος</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white shadow-sm rounded-lg p-5">
            <div className="flex items-center mb-2">
              <TruckIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">Σύνολο</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{fleetStats.total}</p>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-5">
            <div className="flex items-center mb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm text-gray-600">Διαθέσιμα</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{fleetStats.available}</p>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-5">
            <div className="flex items-center mb-2">
              <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-sm text-gray-600">Κρατημένα</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{fleetStats.reserved}</p>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-5">
            <div className="flex items-center mb-2">
              <TruckIcon className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm text-gray-600">Ενεργά</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{fleetStats.active}</p>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-5">
            <div className="flex items-center mb-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-sm text-gray-600">Συντήρηση</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{fleetStats.service}</p>
          </div>
        </div>
      </div>

      {/* Reservations by Source + Revenue by Source */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-medium text-gray-900">Κρατήσεις ανά Πηγή</h3>
          </div>
          <div className="p-6">
            {sourceStats.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Δεν υπάρχουν δεδομένα</p>
            ) : (
              <div className="space-y-3">
                {sourceStats.map((s) => (
                  <div key={s.source} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{SOURCE_LABELS[s.source] || s.source}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${totalReservations > 0 ? (s.count / totalReservations) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{s.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-medium text-gray-900">Έσοδα ανά Πηγή</h3>
          </div>
          <div className="p-6">
            {sourceStats.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Δεν υπάρχουν δεδομένα</p>
            ) : (
              <div className="space-y-3">
                {sourceStats.map((s) => (
                  <div key={s.source} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{SOURCE_LABELS[s.source] || s.source}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${totalRevenue > 0 ? (s.revenue / totalRevenue) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-green-700 w-20 text-right">
                        {'\u20AC'}{s.revenue.toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Pickups & Returns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <TruckIcon className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-base font-medium text-gray-900">Παραλαβές Σήμερα</h3>
              <span className="ml-2 text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {todayPickups.length}
              </span>
            </div>
          </div>
          <div className="p-4">
            {todayPickups.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Δεν υπάρχουν παραλαβές σήμερα</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {todayPickups.map((entry) => (
                  <div key={entry.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{entry.customerName}</p>
                      <p className="text-xs text-gray-500">{entry.vehicleLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{entry.time}</p>
                      <p className="text-xs text-gray-500">{entry.station}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-base font-medium text-gray-900">Επιστροφές Σήμερα</h3>
              <span className="ml-2 text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {todayReturns.length}
              </span>
            </div>
          </div>
          <div className="p-4">
            {todayReturns.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Δεν υπάρχουν επιστροφές σήμερα</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {todayReturns.map((entry) => (
                  <div key={entry.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{entry.customerName}</p>
                      <p className="text-xs text-gray-500">{entry.vehicleLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{entry.time}</p>
                      <p className="text-xs text-gray-500">{entry.station}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary footer */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-sm text-gray-500">Σύνολο Κρατήσεων</p>
            <p className="text-2xl font-bold text-gray-900">{totalReservations}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Συνολικά Έσοδα</p>
            <p className="text-2xl font-bold text-green-600">{'\u20AC'}{totalRevenue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Οχήματα Στόλου</p>
            <p className="text-2xl font-bold text-gray-900">{fleetStats.total}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;