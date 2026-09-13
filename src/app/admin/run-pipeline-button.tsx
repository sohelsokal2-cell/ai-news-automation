"use client";

import { useState } from "react";

export default function RunPipelineButton() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleRun() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/trigger-run", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setResult(`Done in ${data.elapsed} — collected: ${data.collected}, published: ${data.published}, held: ${data.held}, failed: ${data.failed}`);
      } else {
        const errMsg = data.errors?.join(", ") || data.error || "Unknown error";
        setResult(`Error: ${errMsg}`);
      }
    } catch {
      setResult("Network error — is the dev server running?");
    }
    setRunning(false);
  }

  return (
    <div>
      <button
        onClick={handleRun}
        disabled={running}
        className="rounded bg-[#8d1a1a] px-6 py-3 text-sm font-medium text-white hover:bg-[#a32626] disabled:opacity-50"
      >
        {running ? "Running pipeline..." : "Run Pipeline Now"}
      </button>
      {result && (
        <p className="mt-3 rounded bg-gray-50 px-4 py-2 text-sm text-gray-600">{result}</p>
      )}
    </div>
  );
}
