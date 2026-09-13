"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

type ArticleDetail = {
  id: number;
  bnHeadline: string;
  bnSummary: string;
  bnBody: string;
  enHeadline: string;
  enSummary: string;
  enBody: string;
  slug: string;
  imageUrl: string | null;
  status: string;
  categoryId: number | null;
  categorySlug: string | null;
};

async function fetchArticle(id: string): Promise<ArticleDetail | null> {
  try {
    const res = await fetch(`/api/admin/articles/${id}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [bnHeadline, setBnHeadline] = useState("");
  const [bnSummary, setBnSummary] = useState("");
  const [bnBody, setBnBody] = useState("");
  const [enHeadline, setEnHeadline] = useState("");
  const [enSummary, setEnSummary] = useState("");
  const [enBody, setEnBody] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // BUG FIX: resolve params outside useEffect to avoid [params] in deps
  useEffect(() => {
    let cancelled = false;
    params.then(({ id: pid }) => {
      setId(pid);
      fetchArticle(pid).then((data) => {
        if (cancelled) return;
        if (!data) {
          setError("Failed to load article");
          setLoading(false);
          return;
        }
        setArticle(data);
        setBnHeadline(data.bnHeadline);
        setBnSummary(data.bnSummary);
        setBnBody(data.bnBody);
        setEnHeadline(data.enHeadline);
        setEnSummary(data.enSummary);
        setEnBody(data.enBody);
        setCategorySlug(data.categorySlug || "");
        setImageUrl(data.imageUrl || "");
        setLoading(false);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bnHeadline,
        bnSummary,
        bnBody,
        enHeadline,
        enSummary,
        enBody,
        categorySlug,
        imageUrl,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
      setSaving(false);
      return;
    }
    // BUG FIX: refresh article state so status badge updates
    const updated = await fetchArticle(id);
    if (updated) setArticle(updated);
    setSaving(false);
    alert("সংরক্ষিত হয়েছে!");
  }

  async function handleUnpublish() {
    if (!confirm("এই আর্টিকেলটি প্রকাশনা বন্ধ করতে চান?")) return;
    setSaving(true);
    const res = await fetch(`/api/admin/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "held" }),
    });
    if (res.ok) {
      // BUG FIX: refresh article state so status badge updates
      const updated = await fetchArticle(id);
      if (updated) setArticle(updated);
      alert("প্রকাশনা বন্ধ হয়েছে");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("এই আর্টিকেলটি স্থায়ীভাবে মুছে ফেলতে চান? এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।")) return;
    setSaving(true);
    const res = await fetch(`/api/admin/articles/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      alert("স্থায়ীভাবে মুছে ফেলা হয়েছে");
      router.push("/admin/articles");
    } else {
      setError("Failed to delete");
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!article) return <p className="text-red-600">Article not found</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Article</h1>
        <div className="flex gap-2">
          <button
            onClick={handleUnpublish}
            disabled={saving || article.status !== "published"}
            className="rounded border border-orange-300 bg-orange-50 px-4 py-2 text-sm text-orange-700 hover:bg-orange-100 disabled:opacity-50"
          >
            Unpublish
          </button>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            Delete permanently
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-6 rounded border border-gray-200 bg-white p-6 shadow-sm">
        {/* Bengali fields */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#8d1a1a]">বাংলা</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Headline</label>
              <input
                value={bnHeadline}
                onChange={(e) => setBnHeadline(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Summary</label>
              <textarea
                value={bnSummary}
                onChange={(e) => setBnSummary(e.target.value)}
                rows={3}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Body</label>
              <textarea
                value={bnBody}
                onChange={(e) => setBnBody(e.target.value)}
                rows={12}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        {/* English fields */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#8d1a1a]">English</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Headline</label>
              <input
                value={enHeadline}
                onChange={(e) => setEnHeadline(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Summary</label>
              <textarea
                value={enSummary}
                onChange={(e) => setEnSummary(e.target.value)}
                rows={3}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Body</label>
              <textarea
                value={enBody}
                onChange={(e) => setEnBody(e.target.value)}
                rows={12}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        {/* Meta */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#8d1a1a]">Meta</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">— নির্বাচন করুন —</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Image URL</label>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center gap-4 border-t border-gray-100 pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-[#8d1a1a] px-6 py-2 text-sm text-white hover:bg-[#a32626] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <span className="text-xs text-gray-400">
            Status:{" "}
            <span
              className={`font-medium ${
                article.status === "published" ? "text-green-600" : "text-yellow-600"
              }`}
            >
              {article.status}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
