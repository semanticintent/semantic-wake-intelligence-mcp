/**
 * 🎯 SEMANTIC INTENT: Layer 4 - Meta-Learning Schema
 *
 * PURPOSE: Add prediction outcome tracking and per-project learned weights
 *
 * WAKE INTELLIGENCE LAYER 4 (META-LEARNING):
 * - Tracks whether predicted contexts were actually accessed
 * - Stores per-project tuned weights (falls back to 0.4/0.3/0.3 defaults)
 * - Enables adaptive prediction scoring per project over time
 *
 * NEW TABLES:
 * - prediction_outcomes: records access events with component scores
 * - project_weights: per-project learned weights, updated by cron
 *
 * WEIGHT TUNING ALGORITHM:
 * - After MIN_SAMPLE_SIZE outcomes, normalise avg component scores
 * - newWeight = avgComponent / sum(avgComponents)
 * - Cap each weight: min 0.1, max 0.6
 * - Weights adjust toward whichever dimension predicts access in this project
 *
 * MIGRATION STRATEGY:
 * - New tables only — no changes to context_snapshots
 * - Backward compatible (system works with 0 outcomes, uses defaults)
 * - Predictions still calculated from existing data
 */

-- prediction_outcomes: one row per context access event
-- Records the component scores at access time for weight tuning
CREATE TABLE IF NOT EXISTS prediction_outcomes (
  id              TEXT    PRIMARY KEY,
  context_id      TEXT    NOT NULL,
  project         TEXT    NOT NULL,
  predicted_score REAL    NOT NULL,
  temporal_component  REAL NOT NULL,
  causal_component    REAL NOT NULL,
  frequency_component REAL NOT NULL,
  actually_accessed   INTEGER NOT NULL DEFAULT 1,
  recorded_at     TEXT    NOT NULL
);

-- project_weights: one row per project, upserted after each tuning run
CREATE TABLE IF NOT EXISTS project_weights (
  project          TEXT  PRIMARY KEY,
  temporal_weight  REAL  NOT NULL DEFAULT 0.4,
  causal_weight    REAL  NOT NULL DEFAULT 0.3,
  frequency_weight REAL  NOT NULL DEFAULT 0.3,
  sample_size      INTEGER NOT NULL DEFAULT 0,
  last_tuned       TEXT
);

-- Index for per-project outcome queries (tuning reads newest first)
CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_project
ON prediction_outcomes(project, recorded_at DESC);

-- Index for context-level outcome lookup
CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_context
ON prediction_outcomes(context_id);
