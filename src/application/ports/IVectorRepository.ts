/**
 * Repository port for vector similarity operations.
 *
 * Decouples domain from Vectorize specifics — could be swapped for
 * Pinecone, pgvector, or any other ANN backend.
 */
export interface IVectorRepository {
  /**
   * Store or update the embedding for a context snapshot.
   * project metadata enables per-project filtered queries.
   */
  upsert(id: string, vector: number[], project: string): Promise<void>;

  /**
   * Find the IDs of the most semantically similar contexts.
   * Returns IDs ordered by similarity (highest first).
   * Optional project filter scopes results to a single project.
   */
  query(vector: number[], limit: number, project?: string): Promise<string[]>;

  /**
   * Remove the embedding for a deleted context.
   */
  delete(id: string): Promise<void>;
}
