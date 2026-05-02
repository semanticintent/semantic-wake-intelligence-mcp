import type { IContextRepository } from '../../application/ports/IContextRepository';
import type { ContextSnapshot, PredictionOutcome, ProjectWeights, LearningStats } from '../../types';

const DEFAULT_WEIGHTS: Omit<ProjectWeights, 'project' | 'sampleSize' | 'lastTuned'> = {
  temporalWeight: 0.4,
  causalWeight: 0.3,
  frequencyWeight: 0.3,
};

const MIN_SAMPLE_SIZE = 20;
const MAX_WEIGHT = 0.6;
const MIN_WEIGHT = 0.1;

export class MetaLearningService {
  constructor(private readonly repository: IContextRepository) {}

  /**
   * Record a prediction outcome when a context is accessed.
   * Calculates component scores at access time and persists the outcome.
   * Fire-and-forget — caller should not await.
   */
  async recordOutcome(context: ContextSnapshot): Promise<void> {
    if (!context.propagation) return;

    const temporal = this.calculateTemporalComponent(context);
    const causal = this.calculateCausalComponent(context);
    const frequency = this.calculateFrequencyComponent(context);

    const outcome: PredictionOutcome = {
      id: `outcome-${context.id}-${Date.now()}`,
      contextId: context.id,
      project: context.project,
      predictedScore: context.propagation.predictionScore,
      temporalComponent: temporal,
      causalComponent: causal,
      frequencyComponent: frequency,
      actuallyAccessed: true,
      recordedAt: new Date().toISOString(),
    };

    await this.repository.recordPredictionOutcome(outcome);
  }

  /**
   * Tune weights for a project based on accumulated outcomes.
   * Skipped if sample size is below MIN_SAMPLE_SIZE.
   * Returns the resulting weights (learned or unchanged defaults).
   */
  async tuneWeights(project: string): Promise<ProjectWeights> {
    const outcomes = await this.repository.findOutcomesByProject(project, 500);

    if (outcomes.length < MIN_SAMPLE_SIZE) {
      return this.defaultWeights(project);
    }

    const avgTemporal = avg(outcomes.map(o => o.temporalComponent));
    const avgCausal = avg(outcomes.map(o => o.causalComponent));
    const avgFrequency = avg(outcomes.map(o => o.frequencyComponent));
    const total = avgTemporal + avgCausal + avgFrequency;

    // Normalise then clamp each weight
    const rawTemporal = total > 0 ? avgTemporal / total : DEFAULT_WEIGHTS.temporalWeight;
    const rawCausal = total > 0 ? avgCausal / total : DEFAULT_WEIGHTS.causalWeight;
    const rawFrequency = total > 0 ? avgFrequency / total : DEFAULT_WEIGHTS.frequencyWeight;

    const [temporalWeight, causalWeight, frequencyWeight] = redistribute(
      clamp(rawTemporal, MIN_WEIGHT, MAX_WEIGHT),
      clamp(rawCausal, MIN_WEIGHT, MAX_WEIGHT),
      clamp(rawFrequency, MIN_WEIGHT, MAX_WEIGHT)
    );

    const weights: ProjectWeights = {
      project,
      temporalWeight: round(temporalWeight),
      causalWeight: round(causalWeight),
      frequencyWeight: round(frequencyWeight),
      sampleSize: outcomes.length,
      lastTuned: new Date().toISOString(),
    };

    await this.repository.saveProjectWeights(weights);
    return weights;
  }

  /**
   * Get learned weights for a project, falling back to 0.4/0.3/0.3 defaults.
   */
  async getProjectWeights(project: string): Promise<ProjectWeights> {
    const learned = await this.repository.getProjectWeights(project);
    return learned ?? this.defaultWeights(project);
  }

  /**
   * Get full learning stats for a project (weights + component averages).
   */
  async getLearningStats(project: string): Promise<LearningStats> {
    const [weights, outcomes] = await Promise.all([
      this.getProjectWeights(project),
      this.repository.findOutcomesByProject(project, 500),
    ]);

    const avgTemporalComponent = outcomes.length > 0 ? avg(outcomes.map(o => o.temporalComponent)) : 0;
    const avgCausalComponent = outcomes.length > 0 ? avg(outcomes.map(o => o.causalComponent)) : 0;
    const avgFrequencyComponent = outcomes.length > 0 ? avg(outcomes.map(o => o.frequencyComponent)) : 0;

    return {
      project,
      currentWeights: weights,
      sampleSize: outcomes.length,
      lastTuned: weights.lastTuned,
      avgTemporalComponent,
      avgCausalComponent,
      avgFrequencyComponent,
    };
  }

  // ─── Component calculators (mirrors PropagationService logic) ──────────────

  calculateTemporalComponent(context: ContextSnapshot): number {
    if (!context.lastAccessed) {
      const tierDefaults: Record<string, number> = {
        active: 0.3, recent: 0.2, archived: 0.1, expired: 0.0,
      };
      return tierDefaults[context.memoryTier] ?? 0.1;
    }
    const hoursSince = (Date.now() - new Date(context.lastAccessed).getTime()) / 3_600_000;
    return Math.exp(-hoursSince / 24);
  }

  calculateCausalComponent(context: ContextSnapshot): number {
    if (!context.causality) return 0;
    const hasDependencies = context.causality.dependencies.length > 0;
    const isRoot = !context.causality.causedBy;
    if (isRoot && hasDependencies) return 0.7;
    if (hasDependencies) return 0.5;
    if (isRoot) return 0.3;
    return 0.2;
  }

  calculateFrequencyComponent(context: ContextSnapshot): number {
    if (context.accessCount === 0) return 0;
    return Math.log(context.accessCount + 1) / Math.log(101);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private defaultWeights(project: string): ProjectWeights {
    return {
      project,
      ...DEFAULT_WEIGHTS,
      sampleSize: 0,
      lastTuned: null,
    };
  }
}

function redistribute(t: number, c: number, f: number): [number, number, number] {
  const deficit = 1.0 - (t + c + f);
  if (Math.abs(deficit) < 1e-9) return [t, c, f];
  const notPinned = (w: number) => deficit > 0 ? w < MAX_WEIGHT - 1e-9 : w > MIN_WEIGHT + 1e-9;
  const count = [t, c, f].filter(notPinned).length;
  if (count === 0) return [t, c, f];
  const share = deficit / count;
  return [
    notPinned(t) ? clamp(t + share, MIN_WEIGHT, MAX_WEIGHT) : t,
    notPinned(c) ? clamp(c + share, MIN_WEIGHT, MAX_WEIGHT) : c,
    notPinned(f) ? clamp(f + share, MIN_WEIGHT, MAX_WEIGHT) : f,
  ];
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
