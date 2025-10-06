# 🏛️ Semantic Anchoring Governance Rules

## 🚨 **MANDATORY COMPLIANCE**

**All development on this codebase MUST follow semantic anchoring and intent mapping principles established in the breakthrough solution.**

---

## 📜 **Core Governance Rules**

### **Rule 1: Semantic Over Structural**
```typescript
// ❌ PROHIBITED: Using technical characteristics for behavioral decisions
const isExecutiveBrief = analysisDepth === 'quick';

// ✅ REQUIRED: Using semantic meaning for behavioral decisions  
const semanticExecutiveVersion = title.includes('executive') || title.includes('brief');
```

### **Rule 2: Intent Preservation**
- **NEVER override semantic intent** in transformation layers
- **ALWAYS preserve** original document type semantics
- **MAINTAIN** semantic contracts through all pipeline stages

### **Rule 3: Observable Anchoring**
- Base behavior on **directly observable semantic properties**
- Use **semantic markers** (titles, content types, explicit flags)
- Avoid **derived or inferred** behavioral triggers

### **Rule 4: Immutability Protection**
```typescript
// ✅ REQUIRED: Freeze options to prevent semantic violations
const frozenOptions = Object.freeze({...options});
const protectedOptions = new Proxy(frozenOptions, {
  set() { throw new Error('Semantic contract violation') }
});
```

---

## 🛡️ **APPROVAL REQUIRED FOR DEVIATIONS**

### **When Approval is Required**
- Any pattern that uses **technical depth** instead of **semantic meaning**
- Transformation logic that **overrides** document type intent
- Behavioral decisions based on **structural characteristics**
- Changes to the **executiveVersion** semantic anchoring pattern

### **Approval Process**
1. **Document the deviation** with technical justification
2. **Prove semantic intent** is preserved through alternative means
3. **Add compensating controls** (immutability protection, validation)
4. **Update governance rules** if deviation becomes a new pattern

---

## ✅ **Compliance Checklist**

### **Before ANY code change, verify:**
- [ ] Does this preserve semantic intent?
- [ ] Are we using semantic markers instead of technical characteristics?
- [ ] Is document type meaning maintained through transformations?
- [ ] Are semantic contracts protected with immutability patterns?
- [ ] Would this change break the `executiveVersion` anchoring pattern?

### **RED FLAGS - Immediate Review Required:**
- Using `analysisDepth` for document type decisions
- Overriding semantic flags in transformation layers  
- Adding logic that ignores document title/type semantics
- Removing immutability protection from semantic contracts
- Creating new behavioral patterns without semantic anchoring

---

## 🏗️ **Architecture Boundaries**

### **Semantic Domain Ownership**
```
Document Type Domain: 
  - Owns: executiveVersion, document titles, semantic markers
  - Responsibility: Preserve document type intent

Analysis Domain:
  - Owns: analysisDepth, complexity levels, processing tiers  
  - Responsibility: Content analysis, NOT document type decisions

Transformation Domain:
  - Owns: Pipeline processing, format conversion
  - Responsibility: Preserve semantic contracts, NEVER override intent
```

### **Forbidden Cross-Domain Violations**
- ❌ Analysis Domain determining document types
- ❌ Transformation Domain overriding semantic intent
- ❌ Technical characteristics driving semantic behavior

---

## 🎯 **The Semantic Anchoring Philosophy**

### **Established Principles**
1. **Semantic meaning drives behavior** - not technical implementation details
2. **Intent preservation is sacred** - protect through all transformations  
3. **Observable properties anchor decisions** - use what you can directly see
4. **Domain boundaries must be respected** - each domain owns its semantics

### **Success Pattern: executiveVersion**
The `executiveVersion` boolean flag represents **perfect semantic anchoring**:
- Based on **observable document semantics** (title content)
- **Preserved through transformations** without override
- **Protected by immutability** patterns
- **Drives consistent behavior** across the entire pipeline

---

## 🚀 **Enforcement**

### **Code Review Requirements**
- All PRs must demonstrate semantic anchoring compliance
- Semantic contract violations result in **automatic rejection**
- New behavioral patterns require explicit semantic anchoring design

### **Automated Protection**
- Immutability protection patterns in critical semantic areas
- Runtime validation of semantic contract preservation
- Debug logging to detect semantic violations

### **Documentation Standards**
- Document semantic intent for all behavioral decisions
- Explain how semantic anchoring is preserved in transformations
- Maintain examples of compliant vs non-compliant patterns

---

## 📚 **Reference Implementation**

**The Breakthrough Solution** (commit `7de571c`) serves as the **canonical example** of proper semantic anchoring. All future development must follow this pattern.

**Location**: `src/reportProcessing/OrchestratorTransformer.ts:1000-1025`

---

## ⚖️ **Violations and Consequences**

### **Immediate Rollback Required:**
- Any change that breaks PDF differentiation
- Semantic intent overrides in transformation layers
- Removal of immutability protection from semantic contracts

### **Architecture Review Required:**
- New patterns that don't follow semantic anchoring
- Cross-domain semantic violations
- Performance optimizations that compromise semantic integrity

---

**This governance ensures the semantic anchoring breakthrough remains the foundation for all future development, preserving the clean, predictable, and maintainable behavior patterns we established.** 🏛️

---

*Established: September 10, 2025*  
*Authority: Semantic Anchoring Breakthrough (commit 7de571c)*  
*Enforcement: Mandatory for all codebase changes*