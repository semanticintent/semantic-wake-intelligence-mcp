# Repository Rename Migration Guide

## Overview

The repository has been renamed to better reflect its evolution into a production-ready temporal intelligence system:

**Old Name:** `context-mcp-server`
**New Name:** `semantic-wake-intelligence-mcp`

This migration guide helps existing users, contributors, and integrations update to the new repository name.

---

## For Repository Clones & Forks

### Update Your Local Repository

GitHub automatically redirects old URLs, but it's best to update your remote URL:

```bash
# Navigate to your local repository
cd context-mcp-server  # or wherever you cloned it

# Update the remote URL
git remote set-url origin https://github.com/semanticintent/semantic-wake-intelligence-mcp.git

# Verify the change
git remote -v
```

**Expected output:**
```
origin  https://github.com/semanticintent/semantic-wake-intelligence-mcp.git (fetch)
origin  https://github.com/semanticintent/semantic-wake-intelligence-mcp.git (push)
```

### Optional: Rename Your Local Directory

```bash
# Go up one directory level
cd ..

# Rename the directory
mv context-mcp-server semantic-wake-intelligence-mcp

# Navigate into the renamed directory
cd semantic-wake-intelligence-mcp
```

---

## For Package Consumers

### npm/pnpm/yarn Installs

**No action required!** The package name was already `@semanticintent/semantic-wake-intelligence-mcp` and hasn't changed.

If you were using a git URL directly:

**Old (still works due to GitHub redirect):**
```json
{
  "dependencies": {
    "@semanticintent/semantic-wake-intelligence-mcp": "github:semanticintent/context-mcp-server"
  }
}
```

**New (recommended):**
```json
{
  "dependencies": {
    "@semanticintent/semantic-wake-intelligence-mcp": "github:semanticintent/semantic-wake-intelligence-mcp"
  }
}
```

---

## For MCP Client Configurations

### Claude Desktop Configuration

Update your `claude_desktop_config.json`:

**Old:**
```json
{
  "mcpServers": {
    "semantic-context": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse"
      ]
    }
  }
}
```

**New (no change needed - uses deployed URL):**
```json
{
  "mcpServers": {
    "wake-intelligence": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://semantic-wake-intelligence-mcp.michshat.workers.dev/sse"
      ]
    }
  }
}
```

The deployed worker URL remains the same: `semantic-wake-intelligence-mcp.michshat.workers.dev`

---

## For CI/CD Pipelines

### GitHub Actions

If you reference this repository in workflows:

**Old:**
```yaml
- uses: actions/checkout@v4
  with:
    repository: semanticintent/context-mcp-server
```

**New:**
```yaml
- uses: actions/checkout@v4
  with:
    repository: semanticintent/semantic-wake-intelligence-mcp
```

### Badges & Links

Update any README badges or documentation links:

**Old:**
```markdown
[![CI](https://github.com/semanticintent/context-mcp-server/actions/workflows/ci.yml/badge.svg)]
```

**New:**
```markdown
[![CI](https://github.com/semanticintent/semantic-wake-intelligence-mcp/actions/workflows/ci.yml/badge.svg)]
```

---

## For Contributors

### Existing Pull Requests

**No action required!** GitHub automatically updates PR URLs when repositories are renamed. Your existing PRs will continue to work.

### New Pull Requests

Fork the repository using the new name:
```
https://github.com/semanticintent/semantic-wake-intelligence-mcp
```

---

## For Deployed Instances

### Wrangler Configuration

Your `wrangler.jsonc` already uses the correct worker name:

```jsonc
{
  "name": "semantic-wake-intelligence-mcp",
  // ... other config
}
```

**No changes needed!**

### Environment Variables

If you hardcoded the repository name in environment variables, update them:

**Old:**
```bash
REPO_NAME=context-mcp-server
```

**New:**
```bash
REPO_NAME=semantic-wake-intelligence-mcp
```

---

## What Changed?

### Repository Name ✅
- Old: `context-mcp-server`
- New: `semantic-wake-intelligence-mcp`

### Package Name ✅ (No Change)
- Still: `@semanticintent/semantic-wake-intelligence-mcp`

### Worker Name ✅ (No Change)
- Still: `semantic-wake-intelligence-mcp.michshat.workers.dev`

### Database Name ✅ (No Change)
- Still: `wake-intelligence`

### Git History ✅ (Preserved)
- All commits, branches, tags, and releases preserved
- Commit hashes unchanged

---

## Version Bump

This rename coincides with the **v3.0.0 release**, which completes the 3-layer Wake Intelligence brain:

- ✅ **Layer 1 (Past):** Causality Engine - v1.0.0
- ✅ **Layer 2 (Present):** Memory Manager - v2.0.0
- ✅ **Layer 3 (Future):** Propagation Engine - v3.0.0

See [CHANGELOG.md](CHANGELOG.md) for full release notes.

---

## GitHub Redirects

GitHub automatically redirects old URLs to the new repository:

**These URLs still work:**
```
https://github.com/semanticintent/context-mcp-server
https://github.com/semanticintent/context-mcp-server/issues
https://github.com/semanticintent/context-mcp-server/pulls
```

**They redirect to:**
```
https://github.com/semanticintent/semantic-wake-intelligence-mcp
https://github.com/semanticintent/semantic-wake-intelligence-mcp/issues
https://github.com/semanticintent/semantic-wake-intelligence-mcp/pulls
```

**However**, it's best practice to update bookmarks and references to use the new URL directly.

---

## Troubleshooting

### "Repository not found" error when pushing

**Cause:** Your local repository still uses the old remote URL.

**Fix:**
```bash
git remote set-url origin https://github.com/semanticintent/semantic-wake-intelligence-mcp.git
```

### Badges showing 404

**Cause:** Hardcoded old repository name in badge URLs.

**Fix:** Update badge URLs to use `semantic-wake-intelligence-mcp` instead of `context-mcp-server`.

### CI/CD pipeline failures

**Cause:** Workflow files reference old repository name.

**Fix:** Update `.github/workflows/*.yml` files to use new repository name.

---

## Questions?

If you encounter any issues with the migration:

1. **Check the [Discussions](https://github.com/semanticintent/semantic-wake-intelligence-mcp/discussions)** - Others may have already solved your issue
2. **Open an [Issue](https://github.com/semanticintent/semantic-wake-intelligence-mcp/issues)** - We're here to help
3. **Review [CHANGELOG.md](CHANGELOG.md)** - See what changed in v3.0.0

---

## Timeline

- **2025-10-16:** Repository renamed from `context-mcp-server` to `semantic-wake-intelligence-mcp`
- **2025-10-16:** v3.0.0 released with Layer 3 (Propagation Engine) complete
- **2025-10-16:** Documentation updated with Wake Intelligence branding

---

## Thank You!

Thanks for being part of the Wake Intelligence journey. The rename better reflects our evolution from a simple context server to a production-ready temporal intelligence brain for AI agents.

🧠 Past → Present → Future
