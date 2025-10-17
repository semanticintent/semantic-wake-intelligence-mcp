/**
 * 🎯 SEMANTIC INTENT: Layer 3 - Propagation Engine Service
 *
 * PURPOSE: Predict WHAT contexts will be needed next
 *
 * WAKE INTELLIGENCE LAYER 3 (FUTURE):
 * - Analyzes access patterns to predict future needs
 * - Combines temporal, causal, and frequency signals
 * - Enables proactive pre-fetching and caching
 *
 * OBSERVABLE ANCHORING:
 * - All predictions based on measurable access data
 * - Deterministic scoring algorithms
 * - No subjective interpretation
 *
 * DOMAIN SERVICE RESPONSIBILITY:
 * - Orchestrates prediction workflow
 * - Calculates composite scores
 * - Manages prediction staleness
 * - Coordinates with CausalityService for causal strength
 */

import type { IContextRepository } from '../../application/ports/IContextRepository';
import type { ContextSnapshot, PropagationMetadata } from '../../types';
import { ContextSnapshot as ContextSnapshotModel } from '../models/ContextSnapshot';
import { CausalityService } from './CausalityService';

/**
 * Propagation Engine service for Layer 3: Future prediction
 */
export class PropagationService {
  constructor(
    private readonly repository: IContextRepository,
    private readonly causalityService: CausalityService
  ) {}

  /**
   * 🎯 WAKE INTELLIGENCE: Calculate prediction for a context
   *
   * PURPOSE: Compute composite prediction score and metadata
   *
   * ALGORITHM:
   * 1. Calculate temporal score (40% weight) - based on access recency
   * 2. Calculate causal score (30% weight) - based on causal chain position
   * 3. Calculate frequency score (30% weight) - based on access count
   * 4. Combine into composite score
   * 5. Estimate next access time
   * 6. Generate prediction reasons
   *
   * @param context - Context to predict for
   * @returns PropagationMetadata with prediction results
   */
  async predictContext(context: ContextSnapshot): Promise<PropagationMetadata> {
    // Convert to domain model if needed
    const contextModel = context instanceof ContextSnapshotModel
      ? context
      : ContextSnapshotModel.fromDatabase(context);

    // Calculate causal strength by analyzing position in causal chains
    const causalStrength = await this.calculateCausalStrength(context);

    // Calculate composite prediction score
    const predictionScore = ContextSnapshotModel.calculatePropagationScore(
      contextModel,
      causalStrength
    );

    // Estimate next access time based on patterns
    const predictedNextAccess = this.estimateNextAccess(context);

    // Generate human-readable reasons for prediction
    const propagationReason = this.generatePropagationReasons(
      context,
      predictionScore,
      causalStrength
    );

    return {
      predictionScore,
      lastPredicted: new Date().toISOString(),
      predictedNextAccess,
      propagationReason,
    };
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Calculate causal strength score
   *
   * PURPOSE: Determine how important this context is in causal chains
   *
   * HEURISTICS:
   * - Root of chain (no causedBy) → high score (many dependents)
   * - Middle of chain (has causedBy, has dependents) → medium score
   * - Leaf of chain (has causedBy, no dependents) → lower score
   * - Not in chain → low score
   *
   * @param context - Context to analyze
   * @returns Causal strength score (0.0-1.0)
   */
  private async calculateCausalStrength(context: ContextSnapshot): Promise<number> {
    // If no causality metadata, not part of causal chains
    if (!context.causality) {
      return 0.0;
    }

    // Check if this context is referenced by others (has dependents)
    // For now, use simple heuristic: contexts with dependencies are more important
    const dependencyCount = context.causality.dependencies.length;

    // Root contexts (no causedBy, has dependencies) are important
    const isRoot = context.causality.causedBy === null;

    if (isRoot && dependencyCount > 0) {
      // Root with dependents → high causal importance
      return Math.min(1.0, 0.5 + (dependencyCount * 0.1));
    }

    if (dependencyCount > 0) {
      // Middle of chain → moderate importance
      return Math.min(0.7, 0.3 + (dependencyCount * 0.1));
    }

    // Leaf node or minimal dependencies → lower importance
    return 0.2;
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Estimate next access time
   *
   * PURPOSE: Predict when context will likely be accessed next
   *
   * HEURISTICS:
   * - If never accessed → return null (no pattern)
   * - If accessed once → estimate based on age
   * - If accessed multiple times → detect pattern
   *
   * PATTERN DETECTION:
   * - Calculate average time between accesses
   * - Use as prediction interval
   * - Cap at reasonable maximum (7 days)
   *
   * @param context - Context to estimate for
   * @returns Predicted next access time (ISO string) or null
   */
  private estimateNextAccess(context: ContextSnapshot): string | null {
    // Never accessed → no pattern
    if (!context.lastAccessed || context.accessCount === 0) {
      return null;
    }

    // Single access → use simple heuristic (next day)
    if (context.accessCount === 1) {
      const nextAccess = new Date(context.lastAccessed);
      nextAccess.setDate(nextAccess.getDate() + 1);
      return nextAccess.toISOString();
    }

    // Multiple accesses → estimate based on average interval
    // Approximate: assume even distribution from creation to last access
    const createdTime = new Date(context.timestamp).getTime();
    const lastAccessTime = new Date(context.lastAccessed).getTime();
    const totalDuration = lastAccessTime - createdTime;
    const averageInterval = totalDuration / context.accessCount;

    // Predict next access based on average interval
    const nextAccessTime = lastAccessTime + averageInterval;

    // Cap at 7 days from now
    const maxFutureTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
    const cappedTime = Math.min(nextAccessTime, maxFutureTime);

    return new Date(cappedTime).toISOString();
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Generate prediction reasons
   *
   * PURPOSE: Provide human-readable explanation for prediction
   *
   * OBSERVABLE ANCHORING:
   * - Reasons derived from measurable factors
   * - Transparent decision-making
   * - Helps users understand WHY context is predicted
   *
   * @param context - Context being predicted
   * @param score - Composite prediction score
   * @param causalStrength - Causal chain strength
   * @returns Array of reason strings
   */
  private generatePropagationReasons(
    context: ContextSnapshot,
    score: number,
    causalStrength: number
  ): string[] {
    const reasons: string[] = [];

    // High overall score
    if (score >= 0.7) {
      reasons.push('high_composite_score');
    }

    // Temporal signals
    if (context.lastAccessed) {
      const hoursSinceAccess = (Date.now() - new Date(context.lastAccessed).getTime()) / (1000 * 60 * 60);
      if (hoursSinceAccess < 1) {
        reasons.push('recently_accessed');
      } else if (hoursSinceAccess < 24) {
        reasons.push('accessed_today');
      }
    }

    // Frequency signals
    if (context.accessCount >= 10) {
      reasons.push('high_access_frequency');
    } else if (context.accessCount >= 3) {
      reasons.push('moderate_access_frequency');
    }

    // Causal signals
    if (causalStrength >= 0.5) {
      reasons.push('causal_chain_root');
    } else if (causalStrength >= 0.3) {
      reasons.push('causal_chain_member');
    }

    // Memory tier signals
    if (context.memoryTier === 'active') {
      reasons.push('active_memory_tier');
    }

    // If no specific reasons, add default
    if (reasons.length === 0) {
      reasons.push('baseline_prediction');
    }

    return reasons;
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Update predictions for project
   *
   * PURPOSE: Refresh predictions for all contexts in a project
   *
   * WORKFLOW:
   * 1. Find stale predictions (or never predicted)
   * 2. Calculate new predictions for each
   * 3. Persist updated predictions to database
   *
   * @param project - Project to update predictions for
   * @param stalehThreshold - Hours before prediction is stale (default: 24)
   * @param limit - Maximum contexts to update (default: 100)
   * @returns Number of contexts updated
   */
  async updateProjectPredictions(
    project: string,
    staleThreshold: number = 24,
    limit: number = 100
  ): Promise<number> {
    // Find contexts with stale predictions
    const staleContexts = await this.repository.findStalePredictions(staleThreshold, limit);

    // Filter to specified project
    const projectContexts = staleContexts.filter(ctx => ctx.project === project);

    // Update predictions for each context
    let updateCount = 0;
    for (const context of projectContexts) {
      const propagation = await this.predictContext(context);

      await this.repository.updatePropagation(
        context.id,
        propagation.predictionScore,
        propagation.lastPredicted!,
        propagation.predictedNextAccess,
        propagation.propagationReason
      );

      updateCount++;
    }

    return updateCount;
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Get high-value contexts for pre-fetching
   *
   * PURPOSE: Retrieve contexts most likely to be accessed soon
   *
   * USE CASE:
   * - Pre-fetch these contexts for faster retrieval
   * - Cache them in memory
   * - Prioritize in query results
   *
   * @param project - Project to search within
   * @param minScore - Minimum prediction score (default: 0.6)
   * @param limit - Maximum contexts (default: 10)
   * @returns High-value contexts ordered by prediction score
   */
  async getHighValueContexts(
    project: string,
    minScore: number = 0.6,
    limit: number = 10
  ): Promise<ContextSnapshot[]> {
    return await this.repository.findByPredictionScore(minScore, project, limit);
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Refresh predictions if stale
   *
   * PURPOSE: Ensure predictions are fresh before using them
   *
   * WORKFLOW:
   * 1. Check if context has stale prediction (or none)
   * 2. If stale, recalculate and persist
   * 3. Return updated context with fresh prediction
   *
   * @param context - Context to check/refresh
   * @param staleThreshold - Hours before prediction is stale (default: 24)
   * @returns Context with fresh prediction
   */
  async refreshPredictionIfStale(
    context: ContextSnapshot,
    staleThreshold: number = 24
  ): Promise<ContextSnapshot> {
    // Check if prediction is stale
    const needsRefresh = this.isPredictionStale(context, staleThreshold);

    if (!needsRefresh) {
      return context;
    }

    // Calculate new prediction
    const propagation = await this.predictContext(context);

    // Persist to database
    await this.repository.updatePropagation(
      context.id,
      propagation.predictionScore,
      propagation.lastPredicted!,
      propagation.predictedNextAccess,
      propagation.propagationReason
    );

    // Return updated context (immutable pattern)
    const contextModel = ContextSnapshotModel.fromDatabase(context);
    return contextModel.updatePropagation(propagation);
  }

  /**
   * 🎯 WAKE INTELLIGENCE: Check if prediction is stale
   *
   * PURPOSE: Determine if prediction needs refresh
   *
   * STALE CONDITIONS:
   * - No prediction metadata
   * - lastPredicted is null
   * - lastPredicted older than threshold
   *
   * @param context - Context to check
   * @param staleThreshold - Hours before considered stale
   * @returns true if prediction is stale
   */
  private isPredictionStale(context: ContextSnapshot, staleThreshold: number): boolean {
    // No propagation metadata → stale
    if (!context.propagation || !context.propagation.lastPredicted) {
      return true;
    }

    // Check age of prediction
    const lastPredictedTime = new Date(context.propagation.lastPredicted).getTime();
    const hoursSincePrediction = (Date.now() - lastPredictedTime) / (1000 * 60 * 60);

    return hoursSincePrediction >= staleThreshold;
  }
}
