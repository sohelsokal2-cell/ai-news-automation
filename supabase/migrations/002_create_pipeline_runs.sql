-- Track pipeline runs: real timestamps for the dashboard "last run" stat,
-- plus an atomic single-active-run lock via the partial unique index.
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id serial PRIMARY KEY,
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  collected integer,
  duplicates integer,
  published integer,
  held integer,
  failed integer,
  errors text
);

-- At most one active run across all instances. The claim INSERT fails with
-- 23505 when a run is already active; stale runs are reaped before claiming.
CREATE UNIQUE INDEX IF NOT EXISTS pipeline_runs_one_active_idx
  ON pipeline_runs ((1))
  WHERE status = 'running';
