# Migration Commands - Step-by-Step Guide

This document provides the exact bash commands to execute the refactoring migration.

## Prerequisites

Before starting, ensure:
- Clean working directory: `git status` shows no uncommitted changes
- All tests passing: `npm test`
- Development server works: `npm run dev`

## Phase 1: Backup and Preparation

```bash
# Create stash backup
git stash push -u -m "Pre-refactoring backup $(date +%Y-%m-%d)"

# Create git tag
git tag pre-refactoring-backup

# Document current state
git log -1 --oneline > migration-baseline.txt
echo "HEAD commit: $(git rev-parse HEAD)" >> migration-baseline.txt

# Run test baseline
npm test > test-baseline.txt 2>&1

# Verify clean status
git status
```

## Phase 2: Update .gitignore

```bash
# Add build artifacts and backup files to .gitignore
cat >> .gitignore <<'EOF'

# Build artifacts (generated)
*.tsbuildinfo

# Backup files
*.bak
*.backup

# OS metadata files
*.Zone.Identifier
EOF

# Verify additions
git diff .gitignore
```

## Phase 3: Delete Obsolete Files

```bash
# Remove backup file
rm lib/langgraph-search-engine.ts.bak

# Remove Windows metadata
rm "public/favicon.ico:Zone.Identifier"

# Remove build artifact
rm tsconfig.tsbuildinfo

# Verify deletions
git status --short
```

## Phase 4: Create Directory Structure

```bash
# Create lib/ subdirectories
mkdir -p lib/core
mkdir -p lib/synthesis
mkdir -p lib/hrdd
mkdir -p lib/export
mkdir -p lib/utils

# Create test subdirectories
mkdir -p lib/__tests__/core
mkdir -p lib/__tests__/synthesis
mkdir -p lib/__tests__/hrdd

# Create docs/ structure
mkdir -p docs/hrdd
mkdir -p docs/audits
mkdir -p docs/archive/audit-logs

# Create agent-os archive
mkdir -p agent-os/archive/specs

# Verify directory creation
tree -L 3 -d lib/ docs/ agent-os/archive/
```

## Phase 5: Move lib/ Source Files

### Core Search Engine Files

```bash
# Move core files
git mv lib/langgraph-search-engine.ts lib/core/
git mv lib/context-processor.ts lib/core/
git mv lib/config.ts lib/core/
git mv lib/firecrawl.ts lib/core/

# Verify moves
git status --short | grep "R  lib/"
```

### Synthesis Files

```bash
# Move synthesis files
git mv lib/multi-pass-synthesis.ts lib/synthesis/
git mv lib/content-store.ts lib/synthesis/
git mv lib/citation-validator.ts lib/synthesis/

# Verify moves
git status --short | grep "R  lib/"
```

### HRDD Files

```bash
# Move HRDD files
git mv lib/hrdd-workflow-engine.ts lib/hrdd/
git mv lib/hrdd-state.ts lib/hrdd/
git mv lib/hrdd-config.ts lib/hrdd/
git mv lib/hrdd-prompts.ts lib/hrdd/
git mv lib/hrdd-preliminary-screening.ts lib/hrdd/
git mv lib/hrdd-risk-factors.ts lib/hrdd/
git mv lib/hrdd-synthesis.ts lib/hrdd/
git mv lib/hrdd-test-mode.ts lib/hrdd/

# Move HRDD config from config/ directory
git mv config/hrdd-sources.json lib/hrdd/

# Verify moves
git status --short | grep "hrdd"
```

### Export and Utility Files

```bash
# Move export utilities
git mv lib/audit-trail-export.ts lib/export/
git mv lib/search-results-export.ts lib/export/

# Move utilities
git mv lib/error-handler.ts lib/utils/
git mv lib/rate-limit.ts lib/utils/
git mv lib/favicon-utils.ts lib/utils/
git mv lib/utils.ts lib/utils/

# Verify all lib/ moves
git status --short | grep "R  lib/"
```

## Phase 6: Move Test Files

### Core Tests

```bash
# Move core tests
git mv lib/__tests__/synthesis-config.test.ts lib/__tests__/core/
git mv lib/__tests__/content-store.test.ts lib/__tests__/core/
git mv lib/__tests__/content-population.test.ts lib/__tests__/core/

# Verify
git status --short | grep "__tests__/core"
```

### Synthesis Tests

```bash
# Move synthesis tests
git mv lib/__tests__/citation-validator.test.ts lib/__tests__/synthesis/
git mv lib/__tests__/multi-pass-synthesis-pass1.test.ts lib/__tests__/synthesis/
git mv lib/__tests__/multi-pass-synthesis-pass2.test.ts lib/__tests__/synthesis/
git mv lib/__tests__/multi-pass-synthesis-pass3-pass4.test.ts lib/__tests__/synthesis/
git mv lib/__tests__/multi-pass-integration.test.ts lib/__tests__/synthesis/
git mv lib/__tests__/contentstore-pass2-integration.test.ts lib/__tests__/synthesis/
git mv lib/__tests__/conflict-detection-integration.test.ts lib/__tests__/synthesis/
git mv lib/__tests__/token-limit-handling.test.ts lib/__tests__/synthesis/
git mv lib/__tests__/end-to-end-workflow.test.ts lib/__tests__/synthesis/
git mv lib/__tests__/acceptance-criteria.test.ts lib/__tests__/synthesis/

# Verify
git status --short | grep "__tests__/synthesis"
```

### HRDD Tests

```bash
# Move HRDD tests
git mv lib/__tests__/hrdd-config.test.ts lib/__tests__/hrdd/
git mv lib/__tests__/hrdd-state.test.ts lib/__tests__/hrdd/
git mv lib/__tests__/hrdd-preliminary.test.ts lib/__tests__/hrdd/
git mv lib/__tests__/hrdd-risk-factors.test.ts lib/__tests__/hrdd/
git mv lib/__tests__/hrdd-synthesis.test.ts lib/__tests__/hrdd/
git mv lib/__tests__/hrdd-acceptance.test.ts lib/__tests__/hrdd/

# Verify all test moves
git status --short | grep "__tests__"
```

## Phase 7: Move Documentation Files

### HRDD Documentation

```bash
# Move HRDD docs
git mv docs/hrdd-guide.md docs/hrdd/
git mv docs/esg-policy.md docs/hrdd/
git mv docs/Safran-example.md docs/hrdd/safran-example.md  # Rename to lowercase
git mv docs/sites.md docs/hrdd/

# Verify
git status --short | grep "docs/hrdd"
```

### Audit Documentation

```bash
# Move audit docs
git mv docs/AUDIT-TRAIL.md docs/audits/
git mv docs/firecrawl-audit-log.md docs/audits/

# Verify
git status --short | grep "docs/audits"
```

### Audit Logs Archive

```bash
# Move audit logs
git mv audit-logs/README.md docs/archive/audit-logs/
git mv audit-logs/hrdd-2025-10-22-asd-asd.json docs/archive/audit-logs/
git mv audit-logs/hrdd-2025-10-22-e-d.json docs/archive/audit-logs/
git mv audit-logs/hrdd-2025-10-22-saab-sweden.json docs/archive/audit-logs/
git mv audit-logs/hrdd-2025-10-22-sd-asd.json docs/archive/audit-logs/
git mv audit-logs/hrdd-2025-10-23-saab-sweden.json docs/archive/audit-logs/

# Verify all audit-logs moved
ls audit-logs/  # Should be empty

# Remove empty directory
rmdir audit-logs/
rmdir config/  # Also remove empty config directory

# Verify
git status --short | grep "docs/archive"
```

## Phase 8: Archive Completed Specs

```bash
# Move completed specs to archive
git mv agent-os/specs/2025-10-21-hrdd-research-orchestration agent-os/archive/specs/
git mv agent-os/specs/2025-10-23-hrdd-search-optimization agent-os/archive/specs/
git mv agent-os/specs/2025-10-23-hybrid-rag-multi-pass-synthesis agent-os/archive/specs/

# Verify
ls agent-os/specs/  # Should only show current spec
ls agent-os/archive/specs/  # Should show 3 archived specs

# Check git status
git status --short | grep "specs/"
```

## Phase 9: Update Import Statements

This phase requires manual editing. Use your editor's find-and-replace feature.

### Find-and-Replace Patterns

**Pattern 1: Core imports**
- Find: `from '@/lib/langgraph-search-engine'`
- Replace: `from '@/lib/core/langgraph-search-engine'`

**Pattern 2: Core imports**
- Find: `from '@/lib/context-processor'`
- Replace: `from '@/lib/core/context-processor'`

**Pattern 3: Core imports**
- Find: `from '@/lib/config'`
- Replace: `from '@/lib/core/config'`

**Pattern 4: Core imports**
- Find: `from '@/lib/firecrawl'`
- Replace: `from '@/lib/core/firecrawl'`

**Pattern 5: Synthesis imports**
- Find: `from '@/lib/multi-pass-synthesis'`
- Replace: `from '@/lib/synthesis/multi-pass-synthesis'`

**Pattern 6: Synthesis imports**
- Find: `from '@/lib/content-store'`
- Replace: `from '@/lib/synthesis/content-store'`

**Pattern 7: Synthesis imports**
- Find: `from '@/lib/citation-validator'`
- Replace: `from '@/lib/synthesis/citation-validator'`

**Pattern 8: HRDD imports**
- Find: `from '@/lib/hrdd-`
- Replace: `from '@/lib/hrdd/hrdd-`

**Pattern 9: Export imports**
- Find: `from '@/lib/audit-trail-export'`
- Replace: `from '@/lib/export/audit-trail-export'`

**Pattern 10: Export imports**
- Find: `from '@/lib/search-results-export'`
- Replace: `from '@/lib/export/search-results-export'`

**Pattern 11: Utility imports**
- Find: `from '@/lib/error-handler'`
- Replace: `from '@/lib/utils/error-handler'`

**Pattern 12: Utility imports**
- Find: `from '@/lib/rate-limit'`
- Replace: `from '@/lib/utils/rate-limit'`

**Pattern 13: Utility imports**
- Find: `from '@/lib/favicon-utils'`
- Replace: `from '@/lib/utils/favicon-utils'`

**Pattern 14: Utility imports**
- Find: `from '@/lib/utils'` and NOT already `from '@/lib/utils/`
- Replace: `from '@/lib/utils/utils'`

**Pattern 15: Test imports (relative paths)**
- Find: `from '../`
- Review each manually and update based on new structure

### Files to Update (Approximate)

```bash
# Find all files that import from lib/
grep -r "from '@/lib/" app/ lib/ --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort -u

# Expected files to update:
# - app/chat.tsx
# - lib/core/*.ts
# - lib/synthesis/*.ts
# - lib/hrdd/*.ts
# - lib/export/*.ts
# - lib/__tests__/**/*.test.ts
```

### VS Code Find-and-Replace Command

If using VS Code:
1. Open Find in Files (Cmd/Ctrl + Shift + F)
2. Enable regex mode
3. Use the patterns above
4. Preview changes before replacing
5. Replace all for each pattern

## Phase 10: Create Documentation Index

```bash
# Create docs/README.md
cat > docs/README.md <<'EOF'
# Firesearch Documentation

## Core Documentation
- [README.md](../README.md) - Project overview and setup
- [CLAUDE.md](../CLAUDE.md) - Development guide for Claude Code
- [TESTING.md](../TESTING.md) - Testing guide and test mode documentation

## HRDD Documentation
- [HRDD Guide](hrdd/hrdd-guide.md) - Human Rights Due Diligence overview
- [ESG Policy](hrdd/esg-policy.md) - ESG policy framework
- [Safran Example](hrdd/safran-example.md) - Complete HRDD example
- [Sites Reference](hrdd/sites.md) - Data sources for HRDD research

## Audit Trails
- [Audit Trail](audits/AUDIT-TRAIL.md) - HRDD audit trail documentation
- [Firecrawl Audit Log](audits/firecrawl-audit-log.md) - Firecrawl API usage logs

## Archive
- [Audit Logs](archive/audit-logs/) - Historical audit data (2025-10-22 to 2025-10-23)
EOF

# Verify file created
cat docs/README.md
```

## Phase 11: Validation

### TypeScript Compilation

```bash
# Check for compilation errors
npx tsc --noEmit

# If errors, review and fix import paths
# Expected: 0 errors (same as before migration)
```

### Test Suite

```bash
# Run all tests
npm test

# Compare to baseline
diff test-baseline.txt <(npm test 2>&1)

# Expected: All tests pass (same as before migration)
```

### Production Build

```bash
# Build for production
npm run build

# Expected: Build succeeds with no errors
```

### Development Server

```bash
# Start dev server
npm run dev

# Manual checks:
# 1. Visit http://localhost:3000
# 2. Enter a search query
# 3. Verify search results display
# 4. Check console for errors
```

## Phase 12: Update CLAUDE.md

Update the "Code Organization" section in CLAUDE.md:

```bash
# Edit CLAUDE.md manually or use sed
# Update the Code Organization section to match new structure
```

## Phase 13: Final Cleanup

```bash
# Verify no empty directories remain
find . -type d -empty | grep -v node_modules | grep -v .git

# Check git status
git status

# Review all changes
git status --short

# Expected output:
# M  .gitignore
# M  CLAUDE.md
# D  audit-logs/...
# D  config/hrdd-sources.json
# D  lib/langgraph-search-engine.ts.bak
# D  lib/...
# R  lib/... -> lib/core/...
# R  lib/... -> lib/synthesis/...
# R  lib/... -> lib/hrdd/...
# ... many more renames
```

## Phase 14: Stage and Commit

```bash
# Stage all changes
git add -A

# Review staged changes
git status

# Commit with descriptive message
git commit -m "Refactor: Reorganize codebase into clean minimalist structure

- Organize lib/ into domain-based subdirectories (core, synthesis, hrdd, export, utils)
- Consolidate documentation into docs/ with logical subdirectories
- Archive completed specs to agent-os/archive/specs/
- Remove backup files and build artifacts
- Update all import paths to reflect new structure
- Add .gitignore rules for *.bak, *.tsbuildinfo, *.Zone.Identifier

Tests: All tests passing
Build: Production build successful
Breaking changes: None (all imports updated)
"

# Tag the refactoring
git tag refactoring-complete-$(date +%Y%m%d)
```

## Rollback Commands

If you need to rollback:

### During Migration (Before Commit)

```bash
# Reset all changes
git reset --hard HEAD

# Clean untracked files
git clean -fd

# Restore from stash if needed
git stash pop
```

### After Commit

```bash
# Revert to pre-refactoring backup
git reset --hard pre-refactoring-backup

# Force clean
git clean -fd

# Verify restoration
npm test
git status
```

## Verification Checklist

After completing migration, verify:

- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `npm test` passes all tests
- [ ] `npm run build` completes successfully
- [ ] `npm run dev` starts without errors
- [ ] Core search functionality works (manual test)
- [ ] No backup files in repository: `find . -name "*.bak" | grep -v node_modules`
- [ ] No Zone.Identifier files: `find . -name "*.Zone.Identifier"`
- [ ] .gitignore updated with build artifacts
- [ ] CLAUDE.md updated with new structure
- [ ] docs/README.md created
- [ ] All git changes committed
- [ ] Migration complete tag created

## Time Tracking

Track your progress:

```bash
# Start timer
echo "Migration started: $(date)" > migration-log.txt

# After each phase, log completion
echo "Phase X completed: $(date)" >> migration-log.txt

# End timer
echo "Migration completed: $(date)" >> migration-log.txt

# Review time taken
cat migration-log.txt
```

Expected total time: 60-90 minutes
