-- Create the context_snapshots table
CREATE TABLE IF NOT EXISTS context_snapshots (
  id TEXT PRIMARY KEY,
  project TEXT NOT NULL,
  summary TEXT NOT NULL,
  source TEXT DEFAULT 'unknown',
  metadata TEXT,
  tags TEXT DEFAULT '',
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project ON context_snapshots(project);
CREATE INDEX IF NOT EXISTS idx_timestamp ON context_snapshots(timestamp);
CREATE INDEX IF NOT EXISTS idx_project_timestamp ON context_snapshots(project, timestamp);