import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminConsultations() {
  const [consults, setConsults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.consultations.list();
        setConsults(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load consultations');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <p className="p-8">Loading…</p>;
  if (error) return <p className="p-8 text-red-600">{error}</p>;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-serif mb-4">Consultation Requests</h2>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-stone-100">
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">User</th>
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Time</th>
            <th className="border px-2 py-1">Notes</th>
            <th className="border px-2 py-1">Status</th>
          </tr>
        </thead>
        <tbody>
          {consults.map(c => (
            <tr key={c.id} className="even:bg-white odd:bg-stone-50">
              <td className="border px-2 py-1">{c.id}</td>
              <td className="border px-2 py-1">{c.user_id}</td>
              <td className="border px-2 py-1">{new Date(c.date).toLocaleDateString()}</td>
              <td className="border px-2 py-1">{c.hour != null ? `${c.hour}:${String(c.minute||0).padStart(2,'0')}` : '-'}</td>
              <td className="border px-2 py-1">{c.notes || '-'}</td>
              <td className="border px-2 py-1">{c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
