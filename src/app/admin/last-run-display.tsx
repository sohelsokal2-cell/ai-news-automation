"use client";

import { useEffect, useState } from "react";

function formatRelativeTimeAt(iso: string | null, now: number): string {
  if (!iso) return "Never";
  const diff = now - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const STATUS_LABEL: Record<string, string> = {
  ok: "✓",
  failed: "✗",
  running: "…",
};

export default function LastRunDisplay({ lastRunAt, lastRunStatus }: { lastRunAt: string | null; lastRunStatus?: string | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const display = formatRelativeTimeAt(lastRunAt, now);

  return (
    <span>
      {display}
      {lastRunStatus && STATUS_LABEL[lastRunStatus] ? (
        <span
          className={`ml-2 text-base ${
            lastRunStatus === "ok" ? "text-green-600" : lastRunStatus === "failed" ? "text-red-600" : "text-gray-400"
          }`}
          title={lastRunStatus}
        >
          {STATUS_LABEL[lastRunStatus]}
        </span>
      ) : null}
    </span>
  );
}
