# Rebranding to Wake Intelligence

**Status**: In Progress
**Target**: semantic-wake-intelligence-mcp
**Domain**: wakeiqx.com
**Dimension**: Time (Memory, Continuity, Causality)

---

## Rebranding Checklist

### Phase 1: Repository & Package ✅ In Progress

- [ ] Update `package.json` name: `@semanticintent/semantic-wake-intelligence-mcp`
- [ ] Update `package.json` description with Wake Intelligence branding
- [ ] Update `package.json` keywords (add: wake-intelligence, temporal-intelligence, memory-management)
- [ ] Update repository URL references
- [ ] Update `README.md` with Wake Intelligence branding
- [ ] Update `CHANGELOG.md` with rebranding entry

### Phase 2: Documentation Updates

- [ ] Update main README.md
  - Hero section: "Wake Intelligence MCP"
  - Tagline: "Temporal Intelligence for AI Context Management"
  - Add "Part of the Cormorant Trinity" badge
- [ ] Create `about-mascot.md` (Meet the Wake Cormorant)
- [ ] Update architecture diagrams with 3-layer brain
- [ ] Add Trinity framework references
- [ ] Update all "semantic-context" → "semantic-wake-intelligence" references

### Phase 3: Code Updates

- [ ] Update `wrangler.jsonc` name field
- [ ] Update worker route (if applicable)
- [ ] Update environment variable references
- [ ] Update test descriptions and comments
- [ ] Update TypeScript interfaces with Wake branding

### Phase 4: Brain Architecture Integration

- [ ] Implement Layer 1: Causality Engine
  - Add CausalityService.ts
  - Update ContextSnapshot with causality metadata
  - Migration: 0002_add_causality.sql
- [ ] Enhance Layer 2: Memory Manager
  - Add memory tier classification
  - Add LRU tracking
  - Migration: 0003_add_memory_tiers.sql
- [ ] Implement Layer 3: Propagation Engine
  - Add PropagationEngine.ts
  - Temporal decay algorithm
  - Pattern detection
  - Context priming

### Phase 5: Deployment

- [ ] Test locally: `npm run dev`
- [ ] Run migrations on production D1
- [ ] Deploy to Cloudflare Workers: `npm run deploy`
- [ ] Configure wakeiqx.com DNS (Cloudflare Pages or Workers custom domain)
- [ ] Update GitHub repository name and description
- [ ] Update npm package (if published)

### Phase 6: Marketing & Documentation

- [ ] Update semanticintent.dev with Wake Intelligence
- [ ] Create wakeiqx.com landing page
- [ ] Announce on Twitter/LinkedIn
- [ ] Update Trinity research docs to reference live deployment
- [ ] Create demo video showing 3-layer brain in action

---

## Key Changes Summary

### Name Changes

| Old | New |
|-----|-----|
| semantic-context-mcp | semantic-wake-intelligence-mcp |
| Context Management | Wake Intelligence / Temporal Intelligence |
| N/A | "The wake persists. The wake remembers." (tagline) |
| N/A | Part of the Cormorant Trinity (Sound-Space-Time) |

### Architecture Changes

| Layer | Current State | Target State |
|-------|--------------|--------------|
| **Layer 1: Causality** | 40% (timestamps only) | 100% (full causal tracking) |
| **Layer 2: Memory** | 90% (save/load works) | 100% (memory tiers, LRU) |
| **Layer 3: Propagation** | 0% (missing) | 100% (decay, patterns, priming) |

### Domain Setup

- **Primary**: wakeiqx.com
- **Docs**: wakeiqx.com/docs (or docs.wakeiqx.com)
- **API**: api.wakeiqx.com or wakeiqx.com/api
- **Status**: Domain purchased ✅, DNS pending

---

## Timeline

**Week 1**: Phase 1-2 (Repository & Documentation)
**Week 2**: Phase 3-4 (Code Updates & Brain Architecture)
**Week 3**: Phase 5-6 (Deployment & Marketing)

**Target Launch**: End of Week 3

---

## Post-Launch

### Validate Trinity Framework
- [ ] All three systems live: ChirpIQX ✅, PerchIQX ✅, WakeIQX 🎯
- [ ] Layer counts documented: 7 (Sound), 4 (Space), 3 (Time)
- [ ] Research paper ready for submission

### Community Building
- [ ] GitHub Discussions for WakeIQX
- [ ] Example use cases and tutorials
- [ ] Integration guides (Claude Desktop, AI Playground)

---

**Current Status**: Ready to begin Phase 1 rebranding! 🐦
