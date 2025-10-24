# Quick Reference Guide - Codebase Refactoring

## TL;DR

**Goal**: Reorganize lib/ directory and consolidate documentation into a clean, domain-based structure.

**Time**: 60-90 minutes

**Risk**: Low (reversible, no breaking changes)

**Impact**: 58 files moved, 3 files deleted, 12 directories created

## Before & After Structure

### lib/ Directory

**BEFORE:**
```
lib/
├── langgraph-search-engine.ts (60KB)
├── langgraph-search-engine.ts.bak (51KB) ← DELETE
├── config.ts
├── firecrawl.ts
├── context-processor.ts
├── multi-pass-synthesis.ts (28KB)
├── content-store.ts
├── citation-validator.ts
├── hrdd-workflow-engine.ts
├── hrdd-state.ts
├── hrdd-config.ts
├── hrdd-prompts.ts (36KB)
├── hrdd-preliminary-screening.ts
├── hrdd-risk-factors.ts
├── hrdd-synthesis.ts
├── hrdd-test-mode.ts
├── audit-trail-export.ts
├── search-results-export.ts
├── error-handler.ts
├── rate-limit.ts
├── favicon-utils.ts
├── utils.ts
└── __tests__/
    └── [19 test files mixed together]
```

**AFTER:**
```
lib/
├── core/                   # Core search engine
│   ├── langgraph-search-engine.ts
│   ├── context-processor.ts
│   ├── config.ts
│   └── firecrawl.ts
│
├── synthesis/              # Multi-pass synthesis
│   ├── multi-pass-synthesis.ts
│   ├── content-store.ts
│   └── citation-validator.ts
│
├── hrdd/                   # HRDD-specific logic
│   ├── hrdd-workflow-engine.ts
│   ├── hrdd-state.ts
│   ├── hrdd-config.ts
│   ├── hrdd-prompts.ts
│   ├── hrdd-preliminary-screening.ts
│   ├── hrdd-risk-factors.ts
│   ├── hrdd-synthesis.ts
│   ├── hrdd-test-mode.ts
│   └── hrdd-sources.json
│
├── export/                 # Export utilities
│   ├── audit-trail-export.ts
│   └── search-results-export.ts
│
├── utils/                  # Shared utilities
│   ├── error-handler.ts
│   ├── rate-limit.ts
│   ├── favicon-utils.ts
│   └── utils.ts
│
└── __tests__/              # Tests organized by domain
    ├── core/               # 3 test files
    ├── synthesis/          # 10 test files
    └── hrdd/               # 6 test files
```

### Documentation Structure

**BEFORE:**
```
docs/
├── hrdd-guide.md
├── esg-policy.md
├── Safran-example.md
├── sites.md
├── AUDIT-TRAIL.md
└── firecrawl-audit-log.md

audit-logs/
├── README.md
└── [5 JSON files]
```

**AFTER:**
```
docs/
├── README.md               # NEW: Documentation index
├── hrdd/                   # HRDD documentation
│   ├── hrdd-guide.md
│   ├── esg-policy.md
│   ├── safran-example.md
│   └── sites.md
│
├── audits/                 # Audit documentation
│   ├── AUDIT-TRAIL.md
│   └── firecrawl-audit-log.md
│
└── archive/                # Historical data
    └── audit-logs/
        ├── README.md
        └── [5 JSON files]
```

### Specs Structure

**BEFORE:**
```
agent-os/specs/
├── 2025-10-21-hrdd-research-orchestration/         (COMPLETED)
├── 2025-10-23-hrdd-search-optimization/            (COMPLETED)
├── 2025-10-23-hybrid-rag-multi-pass-synthesis/     (COMPLETED)
└── 2025-10-24-codebase-refactoring/                (CURRENT)
```

**AFTER:**
```
agent-os/
├── specs/
│   └── 2025-10-24-codebase-refactoring/            (CURRENT - ACTIVE)
│
└── archive/
    └── specs/
        ├── 2025-10-21-hrdd-research-orchestration/
        ├── 2025-10-23-hrdd-search-optimization/
        └── 2025-10-23-hybrid-rag-multi-pass-synthesis/
```

## Import Path Changes

### Quick Reference Table

| Old Import | New Import |
|------------|-----------|
| `@/lib/langgraph-search-engine` | `@/lib/core/langgraph-search-engine` |
| `@/lib/context-processor` | `@/lib/core/context-processor` |
| `@/lib/config` | `@/lib/core/config` |
| `@/lib/firecrawl` | `@/lib/core/firecrawl` |
| `@/lib/multi-pass-synthesis` | `@/lib/synthesis/multi-pass-synthesis` |
| `@/lib/content-store` | `@/lib/synthesis/content-store` |
| `@/lib/citation-validator` | `@/lib/synthesis/citation-validator` |
| `@/lib/hrdd-*` | `@/lib/hrdd/hrdd-*` |
| `@/lib/audit-trail-export` | `@/lib/export/audit-trail-export` |
| `@/lib/search-results-export` | `@/lib/export/search-results-export` |
| `@/lib/error-handler` | `@/lib/utils/error-handler` |
| `@/lib/rate-limit` | `@/lib/utils/rate-limit` |
| `@/lib/favicon-utils` | `@/lib/utils/favicon-utils` |
| `@/lib/utils` | `@/lib/utils/utils` |

## Command Summary

### Backup
```bash
git stash push -u -m "Pre-refactoring backup"
git tag pre-refactoring-backup
```

### Delete Obsolete
```bash
rm lib/langgraph-search-engine.ts.bak
rm "public/favicon.ico:Zone.Identifier"
rm tsconfig.tsbuildinfo
```

### Create Directories
```bash
mkdir -p lib/{core,synthesis,hrdd,export,utils}
mkdir -p lib/__tests__/{core,synthesis,hrdd}
mkdir -p docs/{hrdd,audits,archive/audit-logs}
mkdir -p agent-os/archive/specs
```

### Move Files (Key Commands)
```bash
# Core files
git mv lib/{langgraph-search-engine,context-processor,config,firecrawl}.ts lib/core/

# Synthesis files
git mv lib/{multi-pass-synthesis,content-store,citation-validator}.ts lib/synthesis/

# HRDD files
git mv lib/hrdd-*.ts lib/hrdd/
git mv config/hrdd-sources.json lib/hrdd/

# Export files
git mv lib/{audit-trail-export,search-results-export}.ts lib/export/

# Utility files
git mv lib/{error-handler,rate-limit,favicon-utils,utils}.ts lib/utils/

# Tests (move individually based on domain)
# See migration-commands.md for detailed test moves

# Documentation
git mv docs/hrdd-*.md docs/Safran-*.md docs/esg-*.md docs/sites.md docs/hrdd/
git mv docs/{AUDIT-TRAIL,firecrawl-audit-log}.md docs/audits/
git mv audit-logs/* docs/archive/audit-logs/

# Archive specs
git mv agent-os/specs/2025-10-2[1-3]-* agent-os/archive/specs/
```

### Validate
```bash
npx tsc --noEmit      # TypeScript check
npm test              # Test suite
npm run build         # Production build
npm run dev           # Dev server
```

### Commit
```bash
git add -A
git commit -m "Refactor: Reorganize codebase into clean minimalist structure"
git tag refactoring-complete-$(date +%Y%m%d)
```

## File Count Summary

| Category | Before | After | Change |
|----------|--------|-------|--------|
| lib/ root files | 24 | 0 | -24 (reorganized) |
| lib/ subdirectories | 1 (__tests__) | 5 (core, synthesis, hrdd, export, utils) | +4 |
| Test subdirectories | 0 | 3 (core, synthesis, hrdd) | +3 |
| docs/ root files | 6 | 1 (README.md) | -5 (reorganized) |
| docs/ subdirectories | 0 | 3 (hrdd, audits, archive) | +3 |
| Backup files | 1 | 0 | -1 (deleted) |
| Build artifacts tracked | 1 | 0 | -1 (gitignored) |
| Active specs | 4 | 1 | -3 (archived) |

## Validation Checklist

Quick checklist after migration:

```bash
# 1. TypeScript compiles
npx tsc --noEmit && echo "✓ TypeScript OK" || echo "✗ TypeScript FAIL"

# 2. Tests pass
npm test && echo "✓ Tests OK" || echo "✗ Tests FAIL"

# 3. Build succeeds
npm run build && echo "✓ Build OK" || echo "✗ Build FAIL"

# 4. No backup files
! find . -name "*.bak" -o -name "*.backup" | grep -v node_modules && echo "✓ No backups" || echo "✗ Backups found"

# 5. No Zone.Identifier files
! find . -name "*.Zone.Identifier" && echo "✓ No Zone files" || echo "✗ Zone files found"

# 6. Git status clean
git status --short | wc -l  # Should be 0 after commit
```

## Rollback Quick Commands

If something goes wrong:

```bash
# During migration (before commit)
git reset --hard HEAD
git clean -fd
git stash pop

# After commit
git reset --hard pre-refactoring-backup
git clean -fd
```

## Benefits Summary

### Developer Experience

- **Navigation**: Find files by domain in seconds (core vs HRDD vs utils)
- **Onboarding**: New contributors understand structure immediately
- **Maintenance**: Update related files together (all HRDD logic in one place)
- **Testing**: Tests mirror source structure for easy discovery

### Code Quality

- **Separation of concerns**: Core engine separate from domain-specific logic
- **Module boundaries**: Clear boundaries between core, synthesis, HRDD
- **Documentation**: All docs organized and discoverable
- **Historical data**: Archives separated from active work

### Codebase Health

- **No duplication**: Single source of truth for each file type
- **No clutter**: Backup files and build artifacts removed
- **Clear history**: Completed specs archived for reference
- **Scalability**: Easy to add new domains (e.g., lib/analytics/)

## Common Issues & Solutions

### Issue: Import errors after moving files
**Solution**: Use find-and-replace patterns in migration-commands.md

### Issue: Tests can't find modules
**Solution**: Verify test imports updated to match new paths

### Issue: Build fails with module not found
**Solution**: Check TypeScript compilation errors for missed imports

### Issue: Git shows too many changes
**Solution**: Normal - expect 50+ file moves, use `git status --short` for clarity

### Issue: Want to pause mid-migration
**Solution**: Commit current state with WIP message, continue later

## Key Files to Review After Migration

1. **app/chat.tsx** - Main app component with many lib/ imports
2. **lib/core/langgraph-search-engine.ts** - Core engine with cross-domain imports
3. **lib/synthesis/multi-pass-synthesis.ts** - Synthesis with core/content imports
4. **lib/hrdd/hrdd-workflow-engine.ts** - HRDD with state/config imports
5. **All test files** - Verify test imports updated

## Success Metrics

### Immediate Success
- [ ] All tests passing
- [ ] Production build successful
- [ ] Dev server runs without errors
- [ ] No TypeScript compilation errors

### Long-term Success
- [ ] New contributors find files faster
- [ ] Code reviews focus on logic, not structure questions
- [ ] Related changes grouped in same directory
- [ ] Documentation easy to discover and update

## Next Steps After Refactoring

Optional future improvements (not in this spec):

1. **Add barrel exports**: Create index.ts files for cleaner imports
2. **Update CI/CD**: Ensure pipelines work with new structure
3. **Add path aliases**: Consider shorter import paths (@core, @synthesis)
4. **Documentation site**: Consider Docusaurus for docs/
5. **Lint rules**: Add import ordering rules to ESLint

## Resources

- **Full spec**: `spec.md` - Complete specification document
- **File inventory**: `file-inventory.md` - Detailed file-by-file analysis
- **Migration commands**: `migration-commands.md` - Step-by-step bash commands
- **This guide**: `quick-reference.md` - Quick lookup reference

## Contact / Questions

If you encounter issues during migration:

1. Check validation commands in this guide
2. Review migration-commands.md for detailed steps
3. Use rollback commands if needed
4. Document any unexpected issues for future reference

---

**Last Updated**: 2025-10-24
**Spec Status**: Planning Phase
**Estimated Effort**: 60-90 minutes
**Risk Level**: Low (reversible, well-tested)
