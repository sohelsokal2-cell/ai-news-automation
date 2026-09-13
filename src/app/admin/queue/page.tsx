"use client";

import { Fragment, useEffect, useState } from "react";

const STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "permanently_failed", label: "Permanently Failed" },
  { value: "duplicate", label: "Duplicate" },
  { value: "written", label: "Written" },
  { value: "published", label: "Published" },
];

const PAGE_SIZE = 50;

type QueueItem = {
  id: number;
  sourceName: string;
  sourceLink: string;
  title: string;
  excerpt: string;
  fullTextPreview: string | null;
  hasFullText: boolean;
  imageUrl: string | null;
  pubDate: string | null;
  categoryHint: string | null;
  status: string;
  duplicateOf: number | null;
  retryCount: number;
  createdAt: string;
};

export default function QueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/admin/queue?status=${activeTab}&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`);
      if (res.ok) {
        const data = await res.json();
        if (!cancelled) {
          setItems(data.items ?? []);
          setTotal(data.total ?? 0);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, page]);

  async function handleRetry(id: number) {
    setRetryingId(id);
    const res = await fetch(`/api/admin/queue/${id}/retry`, {
      method: "POST",
    });
    if (res.ok) {
      // Remove from current list since it's now "pending"
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
    setRetryingId(null);
  }

  function toggleExpand(id: number) {
    setExpandedId(expandedId === id ? null : id);
  }

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function statusColor(status: string) {
    switch (status) {
      case "pending":
        return "bg-blue-50 text-blue-700";
      case "processing":
        return "bg-yellow-50 text-yellow-700";
      case "failed":
        return "bg-orange-50 text-orange-700";
      case "permanently_failed":
        return "bg-red-50 text-red-700";
      case "duplicate":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-50 text-gray-500";
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Collection Queue</h1>

      {/* Status tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              setExpandedId(null);
              setPage(0);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeTab === tab.value
                ? "bg-[#8d1a1a] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Pub Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Retries</th>
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
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No items
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <Fragment key={item.id}>
                  <tr
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <td className="max-w-[300px] truncate px-4 py-3 font-medium">
                      {item.title}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.sourceName}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {formatDate(item.pubDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.retryCount}</td>
                    <td className="px-4 py-3 text-right">
                      {(item.status === "failed" ||
                        item.status === "permanently_failed") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetry(item.id);
                          }}
                          disabled={retryingId === item.id}
                          className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                        >
                          {retryingId === item.id ? "Retrying..." : "Retry"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedId === item.id && (
                    <tr>
                      <td colSpan={6} className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Title:</span>{" "}
                            {item.title}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Source Link:</span>{" "}
                            <a
                              href={item.sourceLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {item.sourceLink}
                            </a>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Excerpt:</span>{" "}
                            <span className="text-gray-600">{item.excerpt}</span>
                          </div>
                          {item.fullTextPreview && (
                            <div>
                              <span className="font-medium text-gray-700">Full Text (preview):</span>{" "}
                              <span className="text-gray-600 whitespace-pre-wrap">{item.fullTextPreview}</span>
                            </div>
                          )}
                          {item.imageUrl && (
                            <div>
                              <span className="font-medium text-gray-700">Image:</span>{" "}
                              <a
                                href={item.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {item.imageUrl}
                              </a>
                            </div>
                          )}
                          {item.categoryHint && (
                            <div>
                              <span className="font-medium text-gray-700">Category Hint:</span>{" "}
                              {item.categoryHint}
                            </div>
                          )}
                          {item.duplicateOf && (
                            <div>
                              <span className="font-medium text-gray-700">Duplicate of:</span>{" "}
                              <span className="text-orange-600">Item #{item.duplicateOf}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <span>{total} items</span>
        {total > PAGE_SIZE ? (
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
              disabled={(page + 1) * PAGE_SIZE >= total || loading}
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

