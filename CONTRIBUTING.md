# Contributing to Semantic Context MCP

Thank you for your interest in contributing! This project serves as a **reference implementation** of Semantic Intent patterns, so contributions should maintain these principles.

## 🎯 Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@semanticintent.dev.

## 🚀 How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Environment details** (Node version, OS, Wrangler version)
- **Code samples or test cases**

**Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Run command '...'
2. See error

**Expected behavior**
What you expected to happen.

**Environment**
- Node.js version: [e.g., 20.x]
- Wrangler version: [e.g., 4.27.0]
- OS: [e.g., Windows 11]
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Include:

- **Clear title and description**
- **Use case** - WHY is this needed?
- **Semantic intent** - HOW does this preserve semantic meaning?
- **Examples** of how it would work

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/semanticintent/semantic-context-mcp.git
   cd semantic-context-mcp
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes following our standards:**

   - ✅ Follow semantic intent patterns
   - ✅ Add tests for new functionality
   - ✅ Update documentation
   - ✅ Follow TypeScript best practices
   - ✅ Include semantic comments (WHY, not just WHAT)

4. **Run all checks locally**
   ```bash
   npm run type-check  # TypeScript compilation
   npm test            # All 70+ tests
   npm run format      # Code formatting
   ```

5. **Commit with semantic intent**
   ```bash
   git commit -m "feat: Add semantic feature X

   🎯 SEMANTIC INTENT: Explain WHY this preserves semantic meaning

   - What problem does this solve?
   - How does it maintain semantic integrity?
   - What business value does it provide?"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/amazing-feature
   ```

## 📋 Development Standards

### Semantic Intent Documentation

Every significant code addition should include semantic intent comments:

```typescript
/**
 * 🎯 SEMANTIC INTENT: Brief purpose statement
 *
 * WHY: Why does this exist? What semantic meaning does it preserve?
 * WHAT: What business value does it provide?
 * HOW: How does it maintain semantic integrity?
 */
```

### Architectural Layers

Maintain the hexagonal architecture:

```
domain/        - Pure business logic (no infrastructure dependencies)
application/   - Orchestration and use cases
infrastructure/- Technical adapters (D1, AI, HTTP)
presentation/  - Routing and HTTP concerns
```

**Rules:**
- ✅ Domain layer NEVER depends on infrastructure
- ✅ Use dependency injection
- ✅ Program to interfaces (ports), not implementations

### Testing Requirements

All contributions must include tests:

- **Unit tests** for business logic
- **Mock external dependencies** (D1, AI services)
- **Test coverage** should not decrease
- **Follow AAA pattern** (Arrange, Act, Assert)

Example:
```typescript
describe('FeatureName', () => {
  it('should preserve semantic intent when...', () => {
    // Arrange
    const input = createTestInput();

    // Act
    const result = feature.execute(input);

    // Assert
    expect(result).toPreserveSemanticIntent();
  });
});
```

### Commit Message Format

We follow semantic commit messages:

```
<type>(<scope>): <subject>

<body - explain WHY, not just WHAT>

<footer - breaking changes, references>
```

**Types:**
- `feat`: New feature (semantic enhancement)
- `fix`: Bug fix
- `refactor`: Code restructuring (preserving semantics)
- `test`: Adding/updating tests
- `docs`: Documentation updates
- `ci`: CI/CD changes
- `security`: Security improvements

**Example:**
```
feat(domain): Add context versioning support

🎯 SEMANTIC INTENT: Preserve historical context evolution

Enables tracking of how context meaning evolves over time,
maintaining semantic integrity across versions.

- Adds ContextVersion entity
- Implements version comparison logic
- Maintains backward compatibility

Closes #123
```

## 🏗️ Project Structure

```
semantic-context-mcp/
├── .github/
│   ├── workflows/           # CI/CD automation
│   ├── ISSUE_TEMPLATE/      # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md
├── migrations/              # Database schema versions
├── src/
│   ├── domain/             # Business logic (pure)
│   ├── application/        # Use cases & orchestration
│   ├── infrastructure/     # Technical adapters
│   └── presentation/       # HTTP routing
├── docs/                   # Additional documentation
└── tests/                  # Integration tests (if any)
```

## 🔍 Code Review Process

All PRs require:

1. ✅ **All CI checks passing** (tests, type-check, lint)
2. ✅ **Code review approval** from maintainer
3. ✅ **Semantic intent documentation**
4. ✅ **Tests included**
5. ✅ **No breaking changes** (or documented if necessary)

Reviewers will check:

- Semantic intent clarity
- Architectural consistency
- Test coverage
- Documentation quality
- Type safety

## 🎨 Style Guide

### TypeScript

- Use **strict mode** (`strict: true` in tsconfig)
- Prefer **readonly** for immutability
- Use **interfaces** for contracts
- Avoid `any` - use `unknown` if needed
- **Explicit return types** for public methods

### Naming Conventions

- **Classes**: PascalCase (`ContextSnapshot`)
- **Interfaces**: PascalCase with `I` prefix for ports (`IContextRepository`)
- **Variables/functions**: camelCase (`generateSummary`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Files**: Match class name (`ContextSnapshot.ts`)

### File Organization

- Co-locate tests: `FeatureName.test.ts` next to `FeatureName.ts`
- One class per file
- Export at file level, not inline
- Group imports: stdlib → external → internal

## 🧪 Testing Guidelines

### What to Test

- ✅ Business logic in domain layer
- ✅ Orchestration in application layer
- ✅ Adapter implementations
- ✅ Error handling
- ✅ Edge cases
- ✅ Validation rules

### What NOT to Test

- ❌ External services (mock them)
- ❌ TypeScript type system
- ❌ Third-party libraries

### Test Naming

```typescript
describe('ClassName', () => {
  describe('methodName()', () => {
    it('should <expected behavior> when <condition>', () => {
      // Test implementation
    });
  });
});
```

## 📚 Documentation Standards

### Code Comments

**Good:**
```typescript
// 🎯 SEMANTIC INTENT: Preserve summary when content changes
// WHY: Summaries represent semantic essence, must be immutable
const snapshot = ContextSnapshot.create({ summary });
```

**Bad:**
```typescript
// Create snapshot
const snapshot = ContextSnapshot.create({ summary });
```

### README Updates

When adding features, update:

- Feature list
- Usage examples
- Architecture diagrams (if structure changes)
- API documentation

## 🔒 Security

- Never commit secrets or credentials
- Use `wrangler.jsonc.example` for templates
- Follow SECURITY.md guidelines
- Report vulnerabilities privately

## 🤝 Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Create an issue with bug template
- **Security**: Email security@semanticintent.dev
- **Chat**: Join our community (link TBD)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors are recognized in:

- GitHub contributors page
- CHANGELOG.md (for significant contributions)
- Release notes

Thank you for helping make this project a world-class reference implementation! 🚀

---

**Questions?** Open a discussion or reach out to maintainers.
