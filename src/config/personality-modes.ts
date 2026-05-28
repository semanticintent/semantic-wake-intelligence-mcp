/**
 * 🎯 WAKE INTELLIGENCE: Temporal Personality Modes (Layer 5)
 *
 * PURPOSE: Define temporal postures that shape how context is retrieved
 * and presented. Each mode answers a different question about the project.
 *
 * DESIGN: Follows the same pattern as semantic-chirp-intelligence-mcp —
 * a config object per mode, typed as part of the request contract,
 * applied in the service and handler layers.
 *
 * MODES:
 * - historian   (default) — factual, causal, timestamp-heavy
 * - prophet               — ranked by Layer 4 prediction scores
 * - archaeologist         — surfaces dormant/forgotten threads
 * - minimalist            — raw context, no framing
 */

export const PERSONALITY_MODES = {
  historian: {
    focus: 'decision_history',
    tone: 'factual',
    depth: 'causal_chain',
    verbosity: 'high',
    description: 'Factual, timestamp-heavy, causal. Reconstructs what happened and why.',
  },
  prophet: {
    focus: 'next_session',
    tone: 'predictive',
    depth: 'propagation',
    verbosity: 'medium',
    description: 'Forward-looking. Surfaces what Layer 4 predicts you will need next.',
  },
  archaeologist: {
    focus: 'dormant_threads',
    tone: 'exploratory',
    depth: 'full_archive',
    verbosity: 'high',
    description: 'Ignores recency bias. Surfaces the most-forgotten contexts first.',
  },
  minimalist: {
    focus: 'raw_context',
    tone: 'silent',
    depth: 'surface',
    verbosity: 'none',
    description: 'Raw context only. No framing, no commentary.',
  },
  auditor: {
    focus: 'authorship',
    tone: 'analytical',
    depth: 'attribution',
    verbosity: 'medium',
    description: 'Groups contexts by author type: human, ai-agent, ai-compositor. Surfaces who created what.',
  },
} as const;

export type PersonalityMode = keyof typeof PERSONALITY_MODES;
