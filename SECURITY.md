# Security Policy

## 🔒 Security Best Practices

This project follows security best practices for public repositories:

### Secrets Management

**Never commit sensitive information to git:**

- ✅ `wrangler.jsonc` - Contains database IDs (excluded from git)
- ✅ `.dev.vars` - Contains development secrets (excluded from git)
- ✅ `.env` files - Contains environment variables (excluded from git)

**Safe to commit:**

- ✅ `wrangler.jsonc.example` - Template with placeholders
- ✅ Source code without credentials
- ✅ Database schema (no data)
- ✅ Configuration templates

### Configuration Files

This repository provides example configuration files:

1. **wrangler.jsonc.example** - Template for Wrangler configuration
   - Copy to `wrangler.jsonc`
   - Replace placeholders with your values
   - Never commit the actual `wrangler.jsonc`

2. **.dev.vars.example** (if needed) - Template for development variables
   - Copy to `.dev.vars`
   - Add your API keys and secrets
   - Never commit the actual `.dev.vars`

### What Gets Committed

**Included in repository:**
- Source code (`.ts` files)
- Tests (`*.test.ts` files)
- Documentation (`.md` files)
- Configuration templates (`*.example` files)
- Database migrations (schema only, no data)
- GitHub Actions workflows

**Excluded from repository (.gitignore):**
- `wrangler.jsonc` - Contains database IDs
- `.dev.vars` - Contains secrets
- `.env*` - Contains environment variables
- `node_modules/` - Dependencies
- `.wrangler/` - Build artifacts
- `coverage/` - Test coverage reports

### For Contributors

When contributing:

1. **Never commit credentials** - Use environment variables or `.dev.vars`
2. **Use example files** - Provide templates, not actual configs
3. **Review before push** - Check `git diff` for sensitive data
4. **Use .gitignore** - Ensure secrets are excluded
5. **Rotate exposed secrets** - If accidentally committed, rotate immediately

### Database Security

- Database IDs are considered **sensitive** (included in `.gitignore`)
- Use Cloudflare's access controls for production databases
- Separate databases for development, staging, and production
- Regular backups of production data

### Cloudflare Workers Security

This project uses:

- **D1 Database** - Serverless SQL database (database ID kept private)
- **Workers AI** - AI inference binding (no API keys needed)
- **Durable Objects** - Stateful coordination (configuration is public)

The Cloudflare Workers runtime provides:
- Automatic HTTPS
- DDoS protection
- Edge security
- Request validation

## 🚨 Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT open a public issue**
2. Email: security@semanticintent.dev (or repository owner)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## 🔐 Security Features

This project implements:

- ✅ **TypeScript** - Type safety prevents runtime errors
- ✅ **Input validation** - Domain entities validate business rules
- ✅ **CORS headers** - Controlled cross-origin access
- ✅ **Error handling** - Graceful degradation without leaking info
- ✅ **Dependency audits** - `npm audit` in CI/CD pipeline
- ✅ **Automated testing** - 70 tests prevent regressions

## 📋 Security Checklist for Deployment

Before deploying to production:

- [ ] `wrangler.jsonc` is in `.gitignore`
- [ ] Database ID is not in git history
- [ ] No `.env` or `.dev.vars` files committed
- [ ] All tests passing (`npm test`)
- [ ] No `npm audit` vulnerabilities
- [ ] Secrets rotated if ever exposed
- [ ] Production database access restricted
- [ ] Monitoring and alerts configured

## 🔄 Regular Maintenance

- Update dependencies monthly: `npm update`
- Run security audits: `npm audit`
- Review access logs periodically
- Rotate credentials every 90 days
- Keep Wrangler CLI updated: `npm install -g wrangler@latest`

---

**Last Updated:** 2025-10-06
**Security Contact:** security@semanticintent.dev
