-- Agent task coordination (v3.7.0)
-- Lightweight work delegation between agents via Wake as shared coordination layer.
-- Tasks are transient coordination state; contexts are durable knowledge.

CREATE TABLE IF NOT EXISTS agent_tasks (
  id                 TEXT NOT NULL PRIMARY KEY,
  project            TEXT NOT NULL,
  objective          TEXT NOT NULL,
  requested_by       TEXT NOT NULL,
  assigned_to        TEXT,                          -- NULL = any agent may claim
  status             TEXT NOT NULL DEFAULT 'queued',-- queued|claimed|completed|failed
  source_context_id  TEXT,                          -- context that motivated this task
  result_context_ids TEXT NOT NULL DEFAULT '[]',    -- JSON array of discovery context IDs
  failure_reason     TEXT,
  claimed_at         TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

-- Project + time: primary list query
CREATE INDEX IF NOT EXISTS idx_agent_tasks_project
  ON agent_tasks(project, created_at DESC);

-- Status + time: claimNext and queue inspection
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status
  ON agent_tasks(status, created_at ASC);

-- Agent + status: get_tasks filtered by assignedTo
CREATE INDEX IF NOT EXISTS idx_agent_tasks_assigned
  ON agent_tasks(assigned_to, status);
