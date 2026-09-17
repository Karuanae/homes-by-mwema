import React, { useEffect, useState } from "react";
import { FaCalendarAlt, FaTrash, FaPlus } from "react-icons/fa";
import api from "../services/api";

export default function AdminDateBlocks() {
  const [blocks, setBlocks] = useState([]);
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({ property_id: "", check_in: "", check_out: "", reason: "" });
  const [manualForm, setManualForm] = useState({ property_id: "", check_in: "", check_out: "", guest_name: "", guest_email: "", guest_phone: "", total_amount: "", reference: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [blockRes, propertyRes] = await Promise.all([
        api.admin.getDateBlocks(),
        api.admin.getProperties(),
      ]);
      setBlocks(blockRes.data || []);
      setProperties(propertyRes.data || []);
      setForm((current) => ({ ...current, property_id: current.property_id || String(propertyRes.data?.[0]?.id || "") }));
    } catch (err) {
      setError(err.response?.data?.error || "Could not load date blocks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addBlock = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.admin.createDateBlock(form);
      setForm((current) => ({ ...current, check_in: "", check_out: "", reason: "" }));
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not block these dates");
    } finally {
      setSaving(false);
    }
  };

  const removeBlock = async (id) => {
    if (!window.confirm("Unblock these dates?")) return;
    try {
      await api.admin.deleteDateBlock(id);
      setBlocks((current) => current.filter((block) => block.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || "Could not unblock these dates");
    }
  };

  const addManualBooking = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.admin.createManualBooking(manualForm);
      setManualForm((current) => ({ ...current, check_in: "", check_out: "", guest_name: "", guest_email: "", guest_phone: "", total_amount: "", reference: "" }));
      window.alert("Offline booking added and dates are now unavailable online.");
    } catch (err) {
      setError(err.response?.data?.error || "Could not add the offline booking");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-serif text-[#1C2321]">Blocked dates</h2>
        <p className="text-sm text-stone-500 mt-1">Keep unavailable dates out of the booking calendar.</p>
      </div>
      <form onSubmit={addBlock} className="bg-white border border-stone-100 p-5 grid gap-4 md:grid-cols-5 items-end">
        <label className="text-xs text-stone-500">Property
          <select required value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value })} className="mt-1 w-full border border-stone-200 p-2.5 text-sm">
            <option value="">Select property</option>
            {properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
          </select>
        </label>
        <label className="text-xs text-stone-500">From
          <input required type="date" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} className="mt-1 w-full border border-stone-200 p-2.5 text-sm" />
        </label>
        <label className="text-xs text-stone-500">Until
          <input required type="date" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} className="mt-1 w-full border border-stone-200 p-2.5 text-sm" />
        </label>
        <label className="text-xs text-stone-500">Reason
          <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Maintenance" className="mt-1 w-full border border-stone-200 p-2.5 text-sm" />
        </label>
        <button disabled={saving} className="bg-[#093A3E] text-white p-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50"><FaPlus /> {saving ? "Blocking..." : "Block dates"}</button>
      </form>
      <form onSubmit={addManualBooking} className="bg-white border border-stone-100 p-5 space-y-4">
        <div><h3 className="font-serif text-lg text-[#1C2321]">Add an in-person booking</h3><p className="text-xs text-stone-500 mt-1">Use this for reservations made outside the website. The dates become unavailable immediately.</p></div>
        <div className="grid gap-4 md:grid-cols-4">
          <label className="text-xs text-stone-500 md:col-span-2">Property
            <select required value={manualForm.property_id} onChange={(e) => setManualForm({ ...manualForm, property_id: e.target.value })} className="mt-1 w-full border border-stone-200 p-2.5 text-sm"><option value="">Select property</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}</select>
          </label>
          <label className="text-xs text-stone-500">Check-in<input required type="date" value={manualForm.check_in} onChange={(e) => setManualForm({ ...manualForm, check_in: e.target.value })} className="mt-1 w-full border border-stone-200 p-2.5 text-sm" /></label>
          <label className="text-xs text-stone-500">Check-out<input required type="date" value={manualForm.check_out} onChange={(e) => setManualForm({ ...manualForm, check_out: e.target.value })} className="mt-1 w-full border border-stone-200 p-2.5 text-sm" /></label>
          <label className="text-xs text-stone-500">Guest name<input required value={manualForm.guest_name} onChange={(e) => setManualForm({ ...manualForm, guest_name: e.target.value })} className="mt-1 w-full border border-stone-200 p-2.5 text-sm" /></label>
          <label className="text-xs text-stone-500">Guest email<input type="email" value={manualForm.guest_email} onChange={(e) => setManualForm({ ...manualForm, guest_email: e.target.value })} className="mt-1 w-full border border-stone-200 p-2.5 text-sm" /></label>
          <label className="text-xs text-stone-500">Guest phone<input value={manualForm.guest_phone} onChange={(e) => setManualForm({ ...manualForm, guest_phone: e.target.value })} className="mt-1 w-full border border-stone-200 p-2.5 text-sm" /></label>
          <label className="text-xs text-stone-500">Amount (optional)<input type="number" min="0" value={manualForm.total_amount} onChange={(e) => setManualForm({ ...manualForm, total_amount: e.target.value })} placeholder="Uses property price" className="mt-1 w-full border border-stone-200 p-2.5 text-sm" /></label>
          <label className="text-xs text-stone-500">Reference<input value={manualForm.reference} onChange={(e) => setManualForm({ ...manualForm, reference: e.target.value })} placeholder="Receipt or note" className="mt-1 w-full border border-stone-200 p-2.5 text-sm" /></label>
        </div>
        <button disabled={saving} className="bg-[#ED9B40] text-[#093A3E] px-4 py-2.5 text-sm font-medium flex items-center gap-2 disabled:opacity-50"><FaPlus /> {saving ? "Adding..." : "Add offline booking"}</button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="bg-white border border-stone-100 divide-y divide-stone-100">
        {loading ? <p className="p-6 text-sm text-stone-500">Loading...</p> : blocks.length === 0 ? <p className="p-6 text-sm text-stone-500">No dates are manually blocked.</p> : blocks.map((block) => (
          <div key={block.id} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3"><FaCalendarAlt className="text-[#ED9B40] mt-1" /><div><p className="font-medium text-sm">{block.property_name}</p><p className="text-sm text-stone-600">{block.check_in} to {block.check_out}</p>{block.reason && <p className="text-xs text-stone-400">{block.reason}</p>}</div></div>
            <button onClick={() => removeBlock(block.id)} title="Unblock dates" className="p-2 text-stone-400 hover:text-red-600"><FaTrash /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
