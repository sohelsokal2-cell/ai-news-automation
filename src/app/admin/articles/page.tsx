"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

const CATEGORIES = [
  { slug: "politics", label: "রাজনীতি" },
  { slug: "sports", label: "খেলাধুলা" },
  { slug: "technology", label: "প্রযুক্তি" },
  { slug: "business", label: "বাণিজ্য" },
  { slug: "international", label: "আন্তর্জাতিক" },
  { slug: "entertainment", label: "বিনোদন" },
  { slug: "health", label: "স্বাস্থ্য" },
  { slug: "other", label: "অন্যান্য" },
];

type ArticleRow = {
  id: number;
  bnHeadline: string;
  status: string;
  pubDate: string | null;
  sourceName: string | null;
  slug: string;
  categoryId: number | null;
  categorySlug: string | null;
  categoryName: string | null;
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  // Debounced search: wait 300ms after user stops typing
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onFilterChange(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(0);
  }

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(0);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      if (debouncedSearch) params.set("q", debouncedSearch);

      params.set("limit", "50");
      params.set("offset", String(page * 50));

      const res = await fetch(`/api/admin/articles?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (!cancelled) {
          setArticles(data.items ?? []);
          setTotal(data.total ?? 0);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [category, status, debouncedSearch, page]);

  async function handleUnpublish(id: number) {
    if (!confirm("এই আর্টিকেলটি প্রকাশনা বন্ধ করতে চান?")) return;
    const res = await fetch(`/api/admin/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "held" }),
    });
    if (res.ok) {
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "held" } : a)),
      );
    }
  }

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Articles</h1>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Headline খুঁজুন..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={category}
          onChange={(e) => onFilterChange(setCategory, e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">সব ক্যাটেগরি</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => onFilterChange(setStatus, e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">সব স্ট্যাটাস</option>
          <option value="published">Published</option>
          <option value="held">Held</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3">Headline</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Pub Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  কোনো আর্টিকেল পাওয়া যায়নি
                </td>
              </tr>
            ) : (
              articles.map((a) => (
                <tr
                  key={a.id}
                  className={a.status === "held" ? "bg-gray-50 opacity-70" : ""}
                >
                  <td className="max-w-[300px] truncate px-4 py-3 font-medium">
                    {a.bnHeadline}
                  </td>
                  <td className="px-4 py-3">
                    {a.categoryName ? (
                      <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {a.categoryName}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{a.sourceName || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {formatDate(a.pubDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.status === "published"
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/articles/${a.id}/edit`}
                      className="mr-3 text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    {a.status === "published" && (
                      <button
                        onClick={() => handleUnpublish(a.id)}
                        className="text-sm text-orange-600 hover:underline"
                      >
                        Unpublish
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <span>{total} articles</span>
        {total > 50 ? (
          <span className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="rounded border border-gray-200 px-2 py-1 disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="px-1 py-1">Page {page + 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * 50 >= total || loading}
              className="rounded border border-gray-200 px-2 py-1 disabled:opacity-40"
            >
              Next →
            </button>
          </span>
        ) : null}
      </div>
    </div>
  );
}
