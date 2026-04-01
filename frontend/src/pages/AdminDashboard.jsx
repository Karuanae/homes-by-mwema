import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBuilding, FaCalendarAlt, FaCalendarCheck, FaMoneyBillWave, FaUsers, FaChartLine, FaSignOutAlt, FaSync } from "react-icons/fa";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const formatCurrency = (value) => {
  if (typeof value !== "number" && typeof value !== "bigint") return "Ksh 0";
  return `Ksh ${Number(value).toLocaleString()}`;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_properties: 0,
    total_users: 0,
    active_bookings: 0,
    completed_bookings: 0,
    total_revenue: 0,
    pending_payments: 0,
    occupancy_rate: 0,
    consultation_total: 0,
    consultation_pending: 0,
    consultation_confirmed: 0,
    consultation_completed: 0,
  });

  const [lastUpdated, setLastUpdated] = useState(null);

  const refreshStats = async () => {
    setLoading(true);
    try {
      const [statsRes, bookingRes, propertyRes, userRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getBookings(),
        api.properties.getAll(),
        api.admin.getUsers(),
      ]);

      const consultation = statsRes.data?.stats || {};
      const bookings = bookingRes.data || [];
      const properties = propertyRes.data || [];
      const users = userRes.data || [];

      const activeBookings = bookings.filter((b) => ['pending', 'confirmed', 'upcoming', 'active'].includes(b.status)).length;
      const completedBookings = bookings.filter((b) => b.status === 'completed').length;
      const totalRevenue = bookings
        .filter((b) => b.payment_status === 'completed')
        .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
      const pendingPayments = bookings
        .filter((b) => b.payment_status !== 'completed')
        .reduce((sum, b) => sum + Number(b.pending_amount || b.total_amount || 0), 0);
      const occupancy = properties.length ? Math.min(100, Math.round((activeBookings / (properties.length * 30)) * 100)) : 0;

      setStats({
        total_properties: properties.length,
        total_users: users.length,
        active_bookings: activeBookings,
        completed_bookings: completedBookings,
        total_revenue: totalRevenue,
        pending_payments: pendingPayments,
        occupancy_rate: occupancy,
        consultation_total: consultation.total || 0,
        consultation_pending: consultation.pending || 0,
        consultation_confirmed: consultation.confirmed || 0,
        consultation_completed: consultation.completed || 0,
      });

      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error("Admin stats refresh failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.warn("Logout request failed:", e);
    } finally {
      logout();
      navigate('/login');
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-stone-200 border-t-[#093A3E] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-serif text-stone-600 tracking-widest uppercase text-sm">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9F8F6] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif text-[#093A3E]">Admin Dashboard</h1>
            <p className="text-sm text-stone-500 mt-1">Updated at {lastUpdated || 'just now'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refreshStats} className="px-4 py-2 bg-[#093A3E] text-white rounded-md hover:bg-[#0b4f56] transition">
              <FaSync className="inline mr-2" /> Refresh
            </button>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition">
              <FaSignOutAlt className="inline mr-2" /> Logout
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Total Properties', value: stats.total_properties, icon: FaBuilding },
            { label: 'Total Users', value: stats.total_users, icon: FaUsers },
            { label: 'Active Bookings', value: stats.active_bookings, icon: FaCalendarAlt },
            { label: 'Completed Bookings', value: stats.completed_bookings, icon: FaCalendarCheck },
            { label: 'Total Revenue', value: formatCurrency(stats.total_revenue), icon: FaMoneyBillWave },
            { label: 'Pending Payments', value: formatCurrency(stats.pending_payments), icon: FaChartLine }
          ].map((item, idx) => (
            <article key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{item.label}</p>
                <item.icon className="text-stone-400" />
              </div>
              <p className="text-2xl font-bold text-[#093A3E]">{item.value}</p>
            </article>
          ))}
        </section>

        <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Consultation Insights</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-stone-50 rounded-lg">Total: <strong>{stats.consultation_total}</strong></div>
            <div className="p-3 bg-stone-50 rounded-lg">Pending: <strong>{stats.consultation_pending}</strong></div>
            <div className="p-3 bg-stone-50 rounded-lg">Confirmed: <strong>{stats.consultation_confirmed}</strong></div>
            <div className="p-3 bg-stone-50 rounded-lg">Completed: <strong>{stats.consultation_completed}</strong></div>
          </div>
        </section>
      </div>
    </main>
  );
}
