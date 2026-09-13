"use client";

import { useEffect, useState } from "react";

type Source = {
  id: number;
  sourceName: string;
  feedUrl: string;
  region: string;
  websiteUrl: string | null;
  isActive: boolean;
  categoryHint: string | null;
  lastFetchedAt: string | null;
  createdAt: string;
};

type SourceFormData = {
  sourceName: string;
  feedUrl: string;
  region: string;
  websiteUrl: string;
  categoryHint: string;
};

const EMPTY_FORM: SourceFormData = { sourceName: "", feedUrl: "", region: "bangladesh", websiteUrl: "", categoryHint: "" };

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<SourceFormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/admin/sources");
      if (res.ok) {
        const data = await res.json();
        if (!cancelled) setSources(data);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  async function refetch() {
    const res = await fetch("/api/admin/sources");
    if (res.ok) setSources(await res.json());
  }

  async function handleSave() {
    if (!form.sourceName || !form.feedUrl) {
      setError("Name and Feed URL are required");
      return;
    }
    setSaving(true);
    setError(null);
    const url = editingId ? `/api/admin/sources/${editingId}` : "/api/admin/sources";
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
      setSaving(false);
      return;
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setSaving(false);
    refetch();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this source?")) return;
    const res = await fetch(`/api/admin/sources/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete source");
      return;
    }
    refetch();
  }

  async function handleToggle(id: number, current: boolean) {
    const res = await fetch(`/api/admin/sources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    if (!res.ok) {
      alert("Failed to update source");
      return;
    }
    refetch();
  }

  function startEdit(s: Source) {
    setForm({
      sourceName: s.sourceName,
      feedUrl: s.feedUrl,
      region: s.region,
      websiteUrl: s.websiteUrl || "",
      categoryHint: s.categoryHint || "",
    });
    setEditingId(s.id);
    setShowForm(true);
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">RSS Sources</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY_FORM); setError(null); }}
          className="rounded bg-[#8d1a1a] px-4 py-2 text-sm text-white hover:bg-[#a32626]"
        >
          {showForm ? "Cancel" : "+ Add Source"}
        </button>
      </div>

      {showForm && (
        <div className="mt-6 rounded border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">{editingId ? "Edit Source" : "Add Source"}</h2>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Name *</label>
              <input
                value={form.sourceName}
                onChange={(e) => setForm({ ...form, sourceName: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. BBC News"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Feed URL *</label>
              <input
                value={form.feedUrl}
                onChange={(e) => setForm({ ...form, feedUrl: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Region</label>
              <select
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="bangladesh">Bangladesh</option>
                <option value="international">International</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Category Hint</label>
              <input
                value={form.categoryHint}
                onChange={(e) => setForm({ ...form, categoryHint: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. politics, sports"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 rounded bg-[#8d1a1a] px-4 py-2 text-sm text-white hover:bg-[#a32626] disabled:opacity-50"
          >
            {saving ? "Saving..." : editingId ? "Update" : "Add"}
          </button>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Feed URL</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Fetched</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sources.map((s) => (
              <tr key={s.id} className={!s.isActive ? "bg-gray-50 opacity-60" : ""}>
                <td className="px-4 py-3 font-medium">{s.sourceName}</td>
                <td className="max-w-[300px] truncate px-4 py-3 text-gray-500">{s.feedUrl}</td>
                <td className="px-4 py-3">
                  <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
                    {s.region}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(s.id, s.isActive)}
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {s.isActive ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {s.lastFetchedAt ? new Date(s.lastFetchedAt).toLocaleString() : "Never"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => startEdit(s)} className="mr-2 text-sm text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="text-sm text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-gray-400">{sources.length} sources total</p>
    </div>
  );
}
