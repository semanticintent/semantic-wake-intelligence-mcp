import type { IVectorRepository } from '../../application/ports/IVectorRepository';

export class VectorizeRepository implements IVectorRepository {
  constructor(private readonly index: VectorizeIndex) {}

  async upsert(id: string, vector: number[], project: string): Promise<void> {
    await this.index.upsert([{ id, values: vector, metadata: { project } }]);
  }

  async query(vector: number[], limit: number, project?: string): Promise<string[]> {
    const options: VectorizeQueryOptions = { topK: limit, returnMetadata: 'none' };
    if (project) options.filter = { project };
    const result = await this.index.query(vector, options);
    return result.matches.map(m => m.id);
  }

  async delete(id: string): Promise<void> {
    await this.index.deleteByIds([id]);
  }
}
