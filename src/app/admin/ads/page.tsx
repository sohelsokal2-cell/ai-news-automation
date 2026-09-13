"use client";
import { useEffect, useState } from "react";
type AdRow = {
  id: number; name: string; slot: string;
  imageUrl: string | null; linkUrl: string | null; html: string | null;
  isActive: boolean; priority: number;
};
const SLOTS = ["header", "sidebar", "in-article", "footer"];
const EMPTY = { name: "", slot: "sidebar", imageUrl: "", linkUrl: "", html: "", priority: "0" };
export default function AdsPage() {
  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let c = false;
    (async () => {
      const r = await fetch("/api/admin/ads");
      if (r.ok && !c) setAds(await r.json());
      if (!c) setLoading(false);
    })();
    return () => { c = true; };
  }, []);
  async function refetch() {
    const r = await fetch("/api/admin/ads");
    if (r.ok) setAds(await r.json());
  }

  async function save() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.imageUrl.trim() && !form.html.trim()) { setError("Image URL / Ad HTML"); return; }
    setSaving(true); setError(null);
    const url = editingId ? "/api/admin/ads/" + editingId : "/api/admin/ads";
    const r = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, slot: form.slot, imageUrl: form.imageUrl, linkUrl: form.linkUrl, html: form.html, priority: Number(form.priority) || 0 }),
    });
    if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error || "Failed"); setSaving(false); return; }
    setForm(EMPTY); setEditingId(null); setShowForm(false); setSaving(false); refetch();
  }
  async function del(id: number) {
    if (!confirm("Delete?")) return;
    const r = await fetch("/api/admin/ads/" + id, { method: "DELETE" });
    if (r.ok) refetch();
  }
  async function toggle(id: number, cur: boolean) {
    const r = await fetch("/api/admin/ads/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !cur }) });
    if (r.ok) refetch();
  }
  function edit(a: AdRow) {
    setForm({ name: a.name, slot: a.slot, imageUrl: a.imageUrl || "", linkUrl: a.linkUrl || "", html: a.html || "", priority: String(a.priority || 0) });
    setEditingId(a.id); setShowForm(true);
  }
  if (loading) return <p className="text-gray-500">Loading...</p>;
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ads</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY); }} className="rounded bg-[#8d1a1a] px-4 py-2 text-sm text-white">{showForm ? "Cancel" : "Add Ad"}</button>
      </div>
      {error ? <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {showForm ? (
        <div className="mt-4 rounded border bg-white p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-sm font-medium">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded border px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-sm font-medium">Slot</label>
              <select value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })} className="w-full rounded border px-3 py-2 text-sm">
                {SLOTS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select></div>
            <div><label className="mb-1 block text-sm font-medium">Image URL</label>
              <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full rounded border px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-sm font-medium">Link URL</label>
              <input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} className="w-full rounded border px-3 py-2 text-sm" /></div>
            <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium">Ad HTML</label>
              <textarea value={form.html} onChange={(e) => setForm({ ...form, html: e.target.value })} rows={3} className="w-full rounded border px-3 py-2 font-mono text-xs" /></div>
            <div><label className="mb-1 block text-sm font-medium">Priority</label>
              <input value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} type="number" className="w-full rounded border px-3 py-2 text-sm" /></div>
          </div>
          <button onClick={save} disabled={saving} className="mt-4 rounded bg-[#8d1a1a] px-4 py-2 text-sm text-white">{saving ? "Saving..." : editingId ? "Update" : "Add"}</button>
        </div>
      ) : null}
      <div className="mt-6 overflow-hidden rounded border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600"><tr>
            <th className="px-4 py-3">Name</th><th className="px-4 py-3">Slot</th><th className="px-4 py-3">Creative</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {ads.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-medium">{a.name}</td>
                <td className="px-4 py-3">{a.slot}</td>
                <td className="px-4 py-3 text-gray-500">{a.imageUrl || (a.html ? "HTML" : "-")}</td>
                <td className="px-4 py-3"><button onClick={() => toggle(a.id, a.isActive)} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{a.isActive ? "Active" : "Off"}</button></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => edit(a)} className="mr-2 text-sm text-blue-600">Edit</button>
                  <button onClick={() => del(a.id)} className="text-sm text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
