import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VectorizeRepository } from './VectorizeRepository';

const makeIndex = () => ({
  upsert: vi.fn().mockResolvedValue(undefined),
  query: vi.fn(),
  deleteByIds: vi.fn().mockResolvedValue(undefined),
  describe: vi.fn(),
  getByIds: vi.fn(),
  insert: vi.fn(),
});

describe('VectorizeRepository', () => {
  let repo: VectorizeRepository;
  let mockIndex: ReturnType<typeof makeIndex>;

  beforeEach(() => {
    mockIndex = makeIndex();
    repo = new VectorizeRepository(mockIndex as unknown as VectorizeIndex);
  });

  describe('upsert()', () => {
    it('should upsert vector with id, values, and project metadata', async () => {
      const vector = Array.from({ length: 768 }, (_, i) => i / 768);
      await repo.upsert('ctx-1', vector, 'my-project');

      expect(mockIndex.upsert).toHaveBeenCalledWith([{
        id: 'ctx-1',
        values: vector,
        metadata: { project: 'my-project' },
      }]);
    });
  });

  describe('query()', () => {
    it('should return matched IDs in order', async () => {
      mockIndex.query.mockResolvedValue({
        matches: [
          { id: 'ctx-1', score: 0.95 },
          { id: 'ctx-2', score: 0.88 },
          { id: 'ctx-3', score: 0.72 },
        ],
      });
      const vector = new Array(768).fill(0.1);

      const ids = await repo.query(vector, 3);

      expect(ids).toEqual(['ctx-1', 'ctx-2', 'ctx-3']);
      expect(mockIndex.query).toHaveBeenCalledWith(vector, {
        topK: 3,
        returnMetadata: 'none',
      });
    });

    it('should apply project filter when provided', async () => {
      mockIndex.query.mockResolvedValue({ matches: [] });
      const vector = new Array(768).fill(0.1);

      await repo.query(vector, 5, 'my-project');

      expect(mockIndex.query).toHaveBeenCalledWith(vector, {
        topK: 5,
        returnMetadata: 'none',
        filter: { project: 'my-project' },
      });
    });

    it('should return empty array when no matches', async () => {
      mockIndex.query.mockResolvedValue({ matches: [] });

      const ids = await repo.query(new Array(768).fill(0), 10);

      expect(ids).toEqual([]);
    });
  });

  describe('delete()', () => {
    it('should delete by ID', async () => {
      await repo.delete('ctx-1');

      expect(mockIndex.deleteByIds).toHaveBeenCalledWith(['ctx-1']);
    });
  });
});
