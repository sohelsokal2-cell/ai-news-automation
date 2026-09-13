import { getDashboardStats } from "@/lib/admin/stats";
import RunPipelineButton from "./run-pipeline-button";
import LastRunDisplay from "./last-run-display";

// Stats must be live, not frozen at build time.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Today's Collection" value={stats.todayCollected} color="blue" />
        <StatCard label="Published Articles" value={stats.published} color="green" />
        <StatCard label="Pending" value={stats.pending} color="yellow" />
        <StatCard label="Retryable Failures" value={stats.retryable} color="orange" />
        <StatCard label="Permanently Failed" value={stats.permanentlyFailed} color="red" />
        <div className="rounded border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Last Pipeline Run</p>
          <p className="mt-2 text-3xl font-bold bg-gray-50 text-gray-700">
            <LastRunDisplay lastRunAt={stats.lastRunAt} lastRunStatus={stats.lastRunStatus} />
          </p>
        </div>
      </div>

      <div className="mt-8">
        <RunPipelineButton />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    orange: "bg-orange-50 text-orange-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className="rounded border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${colorMap[color] || ""}`}>{value}</p>
    </div>
  );
}
