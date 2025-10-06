# Database Migrations

## 🎯 Semantic Intent

This directory contains **versioned database migrations** following semantic anchoring principles:

- Migration files express **TEMPORAL INTENT** (numbered sequence)
- Schema changes preserve **SEMANTIC CONTRACTS** (documented intent)
- Migration commands follow **OBSERVABLE PATTERNS** (clear wrangler commands)

## Migration Files

| Migration | Description | Status |
|-----------|-------------|--------|
| `0001_initial_schema.sql` | Initial context snapshots table with semantic indexes | ✅ Applied |

## Running Migrations

### Production Environment

```bash
# Apply a specific migration
wrangler d1 execute mcp-context --file=./migrations/0001_initial_schema.sql

# Verify migration success
wrangler d1 execute mcp-context --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### Local Development

```bash
# Apply migration locally
wrangler d1 execute mcp-context --local --file=./migrations/0001_initial_schema.sql

# Verify local schema
wrangler d1 execute mcp-context --local --command="SELECT name FROM sqlite_master WHERE type='table'"
```

## Migration Best Practices

### 🎯 Semantic Anchoring Principles

1. **Number Sequentially**: `0001_`, `0002_`, etc. (temporal semantic order)
2. **Descriptive Names**: Express WHAT the migration does
3. **Document Intent**: Explain WHY each change preserves semantic meaning
4. **Preserve Contracts**: Never break existing semantic interfaces
5. **Idempotent**: Use `IF NOT EXISTS` and `IF EXISTS` clauses

### Creating New Migrations

When adding a new migration:

1. **Create numbered file**:
   ```
   migrations/0002_add_feature_name.sql
   ```

2. **Document semantic intent**:
   ```sql
   -- ========================================
   -- 🎯 MIGRATION: 0002_add_feature_name
   -- ========================================
   -- SEMANTIC INTENT: [Explain WHY this change preserves/extends meaning]
   -- CREATED: YYYY-MM-DD
   -- DESCRIPTION: [WHAT semantic capability does this add?]
   ```

3. **Make changes idempotent**:
   ```sql
   ALTER TABLE context_snapshots ADD COLUMN IF NOT EXISTS new_field TEXT;
   ```

4. **Update this README**:
   - Add entry to migration files table
   - Document new semantic capabilities

5. **Update types.ts**:
   - Ensure TypeScript interfaces match new schema
   - Maintain semantic type safety

## Rollback Strategy

D1 doesn't support automatic rollbacks. For safe migrations:

1. **Test locally first**: Always test with `--local` flag
2. **Backup data**: Export critical data before production migrations
3. **Write reverse migrations**: Document how to undo changes if needed

### Example Rollback Pattern

```sql
-- Forward migration (0002_add_field.sql)
ALTER TABLE context_snapshots ADD COLUMN IF NOT EXISTS new_field TEXT;

-- Reverse migration (0002_add_field_rollback.sql)
-- Note: SQLite doesn't support DROP COLUMN easily
-- Alternative: Create new table without column, copy data, rename
```

## Schema Inspection

### View Current Schema

```bash
# Production
wrangler d1 execute mcp-context --command="SELECT sql FROM sqlite_master WHERE type='table' AND name='context_snapshots'"

# Local
wrangler d1 execute mcp-context --local --command="SELECT sql FROM sqlite_master WHERE type='table' AND name='context_snapshots'"
```

### View Indexes

```bash
wrangler d1 execute mcp-context --command="SELECT name, sql FROM sqlite_master WHERE type='index'"
```

### Check Data

```bash
# Count records
wrangler d1 execute mcp-context --command="SELECT COUNT(*) as total FROM context_snapshots"

# Sample recent contexts
wrangler d1 execute mcp-context --command="SELECT project, summary, timestamp FROM context_snapshots ORDER BY timestamp DESC LIMIT 5"
```

## Semantic Contract Enforcement

### Migration Validation Checklist

Before applying a migration, verify:

- [ ] Does this preserve semantic intent of existing data?
- [ ] Are semantic anchors (project, timestamp) maintained?
- [ ] Do TypeScript types in `src/types.ts` match new schema?
- [ ] Are indexes optimized for semantic query patterns?
- [ ] Is the migration idempotent (safe to run multiple times)?
- [ ] Does documentation explain semantic purpose?

### Type Safety Alignment

After schema changes:

1. Update `src/types.ts` interfaces
2. Update `src/index.ts` if semantic contracts changed
3. Run `npm run type-check` to verify type safety
4. Test with sample data to verify semantic preservation

## Migration History Tracking

Track applied migrations manually:

```bash
# Create a simple migration tracking approach
# Option 1: Git tags
git tag -a db-0001 -m "Applied migration 0001_initial_schema"

# Option 2: Store in D1 (future enhancement)
# Could create migrations_history table to track applied migrations
```

## Future Enhancements

Potential improvements to migration system:

- [ ] Automated migration tracking table
- [ ] Migration status verification script
- [ ] TypeScript migration generator
- [ ] Automatic type file updates from schema
- [ ] Schema diff tool for semantic contract validation

---

## 🏗️ Semantic Architecture

This migration system follows **Semantic Intent as Single Source of Truth** principles:

- **Observable Properties**: Database schema defines directly observable semantic fields
- **Intent Preservation**: Migrations maintain semantic meaning through transformations
- **Domain Boundaries**: Clear separation between storage (D1) and runtime (TypeScript)
- **Type Safety**: Compile-time validation of semantic contracts via TypeScript

See [SEMANTIC_ANCHORING_GOVERNANCE.md](../SEMANTIC_ANCHORING_GOVERNANCE.md) for broader architectural principles.
