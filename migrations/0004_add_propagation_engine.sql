/**
 * 🎯 SEMANTIC INTENT: Layer 3 - Propagation Engine Schema
 *
 * PURPOSE: Add propagation prediction metadata to context_snapshots
 *
 * WAKE INTELLIGENCE LAYER 3 (FUTURE):
 * - Predicts WHAT contexts will be needed next
 * - Based on temporal patterns, causal chains, and usage frequency
 * - Enables proactive pre-fetching and caching
 *
 * NEW COLUMNS:
 * - prediction_score: 0.0-1.0 likelihood of future access (composite score)
 * - last_predicted: When prediction was last calculated (ISO timestamp)
 * - predicted_next_access: Estimated next access time (ISO timestamp)
 * - propagation_reason: Why predicted (JSON array of reasons)
 *
 * MIGRATION STRATEGY:
 * - Add columns with default NULL (all existing contexts unpredicted)
 * - No data migration needed (predictions computed on-demand)
 * - Backward compatible (can query with/without predictions)
 *
 * OBSERVABLE ANCHORING:
 * - All predictions based on measurable access patterns
 * - Deterministic scoring algorithms
 * - No subjective interpretation
 */

-- Add Layer 3: Propagation Engine columns
ALTER TABLE context_snapshots ADD COLUMN prediction_score REAL DEFAULT NULL;
ALTER TABLE context_snapshots ADD COLUMN last_predicted TEXT DEFAULT NULL;
ALTER TABLE context_snapshots ADD COLUMN predicted_next_access TEXT DEFAULT NULL;
ALTER TABLE context_snapshots ADD COLUMN propagation_reason TEXT DEFAULT NULL;

-- Create index for prediction-based queries (find high-score contexts)
CREATE INDEX IF NOT EXISTS idx_context_snapshots_prediction_score
ON context_snapshots(prediction_score DESC)
WHERE prediction_score IS NOT NULL;

-- Create index for prediction staleness queries (find contexts needing re-prediction)
CREATE INDEX IF NOT EXISTS idx_context_snapshots_last_predicted
ON context_snapshots(last_predicted ASC)
WHERE last_predicted IS NOT NULL;

-- Create composite index for project + prediction score (fetch top predictions per project)
CREATE INDEX IF NOT EXISTS idx_context_snapshots_project_prediction
ON context_snapshots(project, prediction_score DESC)
WHERE prediction_score IS NOT NULL;
