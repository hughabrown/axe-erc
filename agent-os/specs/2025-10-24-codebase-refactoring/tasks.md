# Task Breakdown: Codebase Refactoring for Clean Minimalist File System

## Overview

**Total Tasks:** 48 individual tasks across 12 task groups
**Assigned Implementers:** api-engineer, testing-engineer
**Estimated Time:** 60-90 minutes
**Risk Level:** Low (fully reversible with git)

## Execution Strategy

This refactoring is organized into sequential phases with validation checkpoints. Each phase groups related file operations to minimize context switching and enable easy rollback if issues arise.

**Key Principles:**
- Use `git mv` to preserve file history
- Validate after each major phase
- Update imports immediately after file moves
- Test at critical checkpoints
- Document rollback procedures

---

## Task List

### Task Group 1: Backup and Preparation
**Assigned Implementer:** api-engineer
**Dependencies:** None
**Risk Level:** None (safety setup)
**Estimated Time:** 5 minutes

> This group establishes safety checkpoints for rollback and validates the starting state.

- [ ] 1.0 Create backup and prepare environment
  - [ ] 1.1 Create git stash backup
    ```bash
    git stash push -u -m "Pre-refactoring backup $(date +%Y%m%d-%H%M%S)"
    ```
  - [ ] 1.2 Create git tag for rollback point
    ```bash
    git tag pre-refactoring-backup-$(date +%Y%m%d)
    ```
  - [ ] 1.3 Document current HEAD commit
    ```bash
    git log -1 --oneline > /tmp/refactoring-baseline-commit.txt
    ```
  - [ ] 1.4 Verify clean working directory
    ```bash
    git status --short
    # Should show only expected uncommitted files
    ```
  - [ ] 1.5 Update .gitignore to prevent future clutter
    - Add `*.tsbuildinfo` (build artifacts)
    - Add `*.bak` and `*.backup` (backup files)
    - Add `*.Zone.Identifier` (Windows metadata)

**Acceptance Criteria:**
- Git stash backup created successfully
- Git tag `pre-refactoring-backup-YYYYMMDD` exists
- .gitignore updated with new patterns
- Working directory status documented

**Rollback:** `git stash pop` to restore if needed

---

### Task Group 2: Baseline Test Execution
**Assigned Implementer:** testing-engineer
**Dependencies:** Task Group 1
**Risk Level:** None (validation only)
**Estimated Time:** 5 minutes

> Establish test baseline to compare against post-refactoring results.

- [ ] 2.0 Establish test baseline
  - [ ] 2.1 Run full test suite and capture results
    ```bash
    npm test 2>&1 | tee /tmp/test-baseline.txt
    ```
  - [ ] 2.2 Document test pass/fail counts
    - Count passing tests
    - Document any pre-existing failures
    - Note total test execution time
  - [ ] 2.3 Verify TypeScript compilation baseline
    ```bash
    npx tsc --noEmit 2>&1 | tee /tmp/tsc-baseline.txt
    ```
  - [ ] 2.4 Document any pre-existing TypeScript errors
    - Count existing errors (if any)
    - Note: These should match post-refactoring

**Acceptance Criteria:**
- Test baseline captured in `/tmp/test-baseline.txt`
- TypeScript baseline captured in `/tmp/tsc-baseline.txt`
- Pre-existing issues documented for comparison

**Validation:**
```bash
# Verify baseline files created
ls -lh /tmp/test-baseline.txt /tmp/tsc-baseline.txt
```

---

### Task Group 3: Delete Obsolete Files
**Assigned Implementer:** api-engineer
**Dependencies:** Task Groups 1-2
**Risk Level:** Low (only removing backup/temp files)
**Estimated Time:** 2 minutes

> Remove files that provide no value: backups, OS metadata, build artifacts.

- [ ] 3.0 Clean obsolete files
  - [ ] 3.1 Delete backup file
    ```bash
    rm /home/hughbrown/code/firecrawl/firesearch/lib/langgraph-search-engine.ts.bak
    ```
  - [ ] 3.2 Delete Windows metadata file
    ```bash
    rm "/home/hughbrown/code/firecrawl/firesearch/public/favicon.ico:Zone.Identifier"
    ```
  - [ ] 3.3 Delete build artifact (will regenerate)
    ```bash
    rm /home/hughbrown/code/firecrawl/firesearch/tsconfig.tsbuildinfo
    ```
  - [ ] 3.4 Verify deletions
    ```bash
    git status --short | grep -E "deleted|D "
    ```

**Acceptance Criteria:**
- 3 files deleted: .bak, .Zone.Identifier, .tsbuildinfo
- `git status` shows deletions
- No obsolete files remain in working directory

**Validation:**
```bash
# Verify no backup/metadata files remain
find /home/hughbrown/code/firecrawl/firesearch -type f \( -name "*.bak" -o -name "*.Zone.Identifier" -o -name "*.tsbuildinfo" \) 2>/dev/null | grep -v node_modules
# Should return nothing
```

---

### Task Group 4: Create Directory Structure
**Assigned Implementer:** api-engineer
**Dependencies:** Task Group 3
**Risk Level:** None (only creating directories)
**Estimated Time:** 2 minutes

> Create all new directories before moving files to ensure clean organization.

- [ ] 4.0 Create new directory structure
  - [ ] 4.1 Create lib/ subdirectories for code organization
    ```bash
    mkdir -p /home/hughbrown/code/firecrawl/firesearch/lib/core
    mkdir -p /home/hughbrown/code/firecrawl/firesearch/lib/synthesis
    mkdir -p /home/hughbrown/code/firecrawl/firesearch/lib/hrdd
    mkdir -p /home/hughbrown/code/firecrawl/firesearch/lib/export
    mkdir -p /home/hughbrown/code/firecrawl/firesearch/lib/utils
    ```
  - [ ] 4.2 Create lib/__tests__/ subdirectories mirroring code structure
    ```bash
    mkdir -p /home/hughbrown/code/firecrawl/firesearch/lib/__tests__/core
    mkdir -p /home/hughbrown/code/firecrawl/firesearch/lib/__tests__/synthesis
    mkdir -p /home/hughbrown/code/firecrawl/firesearch/lib/__tests__/hrdd
    ```
  - [ ] 4.3 Create docs/ subdirectories for documentation organization
    ```bash
    mkdir -p /home/hughbrown/code/firecrawl/firesearch/docs/hrdd
    mkdir -p /home/hughbrown/code/firecrawl/firesearch/docs/audits
    mkdir -p /home/hughbrown/code/firecrawl/firesearch/docs/archive/audit-logs
    ```
  - [ ] 4.4 Create agent-os/archive/ for completed specs
    ```bash
    mkdir -p /home/hughbrown/code/firecrawl/firesearch/agent-os/archive/specs
    ```
  - [ ] 4.5 Verify directory creation
    ```bash
    tree -L 3 -d /home/hughbrown/code/firecrawl/firesearch/lib /home/hughbrown/code/firecrawl/firesearch/docs /home/hughbrown/code/firecrawl/firesearch/agent-os/archive
    ```

**Acceptance Criteria:**
- 12 new directories created
- Directory structure matches target design
- All directories ready to receive files

**Validation:**
```bash
# Verify all directories exist
for dir in lib/core lib/synthesis lib/hrdd lib/export lib/utils lib/__tests__/core lib/__tests__/synthesis lib/__tests__/hrdd docs/hrdd docs/audits docs/archive/audit-logs agent-os/archive/specs; do
  [ -d "/home/hughbrown/code/firecrawl/firesearch/$dir" ] && echo "OK: $dir" || echo "MISSING: $dir"
done
```

---

### Task Group 5: Move Core Library Files
**Assigned Implementer:** api-engineer
**Dependencies:** Task Group 4
**Risk Level:** Medium (core functionality files)
**Estimated Time:** 10 minutes

> Move core search engine files, synthesis files, HRDD files, and utilities using git mv to preserve history.

- [ ] 5.0 Reorganize lib/ directory files
  - [ ] 5.1 Move core search engine files (4 files)
    ```bash
    cd /home/hughbrown/code/firecrawl/firesearch
    git mv lib/langgraph-search-engine.ts lib/core/
    git mv lib/context-processor.ts lib/core/
    git mv lib/config.ts lib/core/
    git mv lib/firecrawl.ts lib/core/
    ```
  - [ ] 5.2 Move synthesis files (3 files)
    ```bash
    git mv lib/multi-pass-synthesis.ts lib/synthesis/
    git mv lib/content-store.ts lib/synthesis/
    git mv lib/citation-validator.ts lib/synthesis/
    ```
  - [ ] 5.3 Move HRDD files (8 TypeScript files)
    ```bash
    git mv lib/hrdd-workflow-engine.ts lib/hrdd/
    git mv lib/hrdd-state.ts lib/hrdd/
    git mv lib/hrdd-config.ts lib/hrdd/
    git mv lib/hrdd-prompts.ts lib/hrdd/
    git mv lib/hrdd-preliminary-screening.ts lib/hrdd/
    git mv lib/hrdd-risk-factors.ts lib/hrdd/
    git mv lib/hrdd-synthesis.ts lib/hrdd/
    git mv lib/hrdd-test-mode.ts lib/hrdd/
    ```
  - [ ] 5.4 Move HRDD JSON configuration
    ```bash
    git mv config/hrdd-sources.json lib/hrdd/
    ```
  - [ ] 5.5 Move export utilities (2 files)
    ```bash
    git mv lib/audit-trail-export.ts lib/export/
    git mv lib/search-results-export.ts lib/export/
    ```
  - [ ] 5.6 Move utility files (4 files)
    ```bash
    git mv lib/error-handler.ts lib/utils/
    git mv lib/rate-limit.ts lib/utils/
    git mv lib/favicon-utils.ts lib/utils/
    git mv lib/utils.ts lib/utils/
    ```
  - [ ] 5.7 Remove empty config/ directory
    ```bash
    rmdir config/
    ```
  - [ ] 5.8 Verify all files moved successfully
    ```bash
    git status | grep renamed | wc -l
    # Should show 22 renamed files
    ```

**Acceptance Criteria:**
- 22 files moved (4 core + 3 synthesis + 9 hrdd + 2 export + 4 utils)
- Git recognizes files as renamed (not deleted + added)
- Empty config/ directory removed
- lib/ root directory contains only __tests__/ subdirectory

**Validation:**
```bash
# Verify lib/ root is clean (no .ts files except in subdirectories)
ls /home/hughbrown/code/firecrawl/firesearch/lib/*.ts 2>/dev/null
# Should return nothing

# Verify git history preserved for key file
git log --follow --oneline /home/hughbrown/code/firecrawl/firesearch/lib/core/langgraph-search-engine.ts | head -5
```

---

### Task Group 6: Move Test Files
**Assigned Implementer:** testing-engineer
**Dependencies:** Task Group 5
**Risk Level:** Medium (test files)
**Estimated Time:** 8 minutes

> Organize test files to mirror the new lib/ structure for easy navigation.

- [ ] 6.0 Reorganize test files by domain
  - [ ] 6.1 Move core-related tests (3 files)
    ```bash
    cd /home/hughbrown/code/firecrawl/firesearch
    git mv lib/__tests__/synthesis-config.test.ts lib/__tests__/core/
    git mv lib/__tests__/content-store.test.ts lib/__tests__/core/
    git mv lib/__tests__/content-population.test.ts lib/__tests__/core/
    ```
  - [ ] 6.2 Move synthesis tests (10 files)
    ```bash
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
    ```
  - [ ] 6.3 Move HRDD tests (6 files)
    ```bash
    git mv lib/__tests__/hrdd-config.test.ts lib/__tests__/hrdd/
    git mv lib/__tests__/hrdd-state.test.ts lib/__tests__/hrdd/
    git mv lib/__tests__/hrdd-preliminary.test.ts lib/__tests__/hrdd/
    git mv lib/__tests__/hrdd-risk-factors.test.ts lib/__tests__/hrdd/
    git mv lib/__tests__/hrdd-synthesis.test.ts lib/__tests__/hrdd/
    git mv lib/__tests__/hrdd-acceptance.test.ts lib/__tests__/hrdd/
    ```
  - [ ] 6.4 Verify test file moves
    ```bash
    git status | grep "__tests__" | grep renamed | wc -l
    # Should show 19 renamed test files
    ```
  - [ ] 6.5 Verify lib/__tests__/ root is empty
    ```bash
    ls /home/hughbrown/code/firecrawl/firesearch/lib/__tests__/*.test.ts 2>/dev/null
    # Should return nothing
    ```

**Acceptance Criteria:**
- 19 test files moved (3 core + 10 synthesis + 6 hrdd)
- Test structure mirrors code structure
- lib/__tests__/ root contains no test files
- Git recognizes files as renamed

**Validation:**
```bash
# Verify test organization
tree /home/hughbrown/code/firecrawl/firesearch/lib/__tests__/
# Should show three subdirectories: core/, synthesis/, hrdd/
```

---

### Task Group 7: Move Documentation Files
**Assigned Implementer:** api-engineer
**Dependencies:** Task Group 4
**Risk Level:** Low (documentation only)
**Estimated Time:** 8 minutes

> Consolidate documentation into organized docs/ structure.

- [ ] 7.0 Consolidate documentation
  - [ ] 7.1 Move HRDD documentation (4 files)
    ```bash
    cd /home/hughbrown/code/firecrawl/firesearch
    git mv docs/hrdd-guide.md docs/hrdd/
    git mv docs/esg-policy.md docs/hrdd/
    git mv docs/Safran-example.md docs/hrdd/safran-example.md
    git mv docs/sites.md docs/hrdd/
    ```
  - [ ] 7.2 Move audit documentation (2 files)
    ```bash
    git mv docs/AUDIT-TRAIL.md docs/audits/
    git mv docs/firecrawl-audit-log.md docs/audits/
    ```
  - [ ] 7.3 Move audit logs to archive (5 files)
    ```bash
    git mv audit-logs/README.md docs/archive/audit-logs/
    git mv audit-logs/hrdd-2025-10-22-asd-asd.json docs/archive/audit-logs/
    git mv audit-logs/hrdd-2025-10-22-e-d.json docs/archive/audit-logs/
    git mv audit-logs/hrdd-2025-10-22-saab-sweden.json docs/archive/audit-logs/
    git mv audit-logs/hrdd-2025-10-22-sd-asd.json docs/archive/audit-logs/
    ```
  - [ ] 7.4 Move remaining audit log (check for latest)
    ```bash
    # Check if exists in current audit-logs/
    [ -f audit-logs/hrdd-2025-10-23-saab-sweden.json ] && git mv audit-logs/hrdd-2025-10-23-saab-sweden.json docs/archive/audit-logs/ || echo "File not in audit-logs, checking root"
    [ -f hrdd-2025-10-23-saab-sweden.json ] && git mv hrdd-2025-10-23-saab-sweden.json docs/archive/audit-logs/ || echo "Already moved or not present"
    ```
  - [ ] 7.5 Remove empty audit-logs/ directory
    ```bash
    rmdir audit-logs/ 2>/dev/null || echo "Directory not empty or already removed"
    ```
  - [ ] 7.6 Verify documentation moves
    ```bash
    git status | grep "docs/" | grep renamed | wc -l
    # Should show moved documentation files
    ```

**Acceptance Criteria:**
- HRDD docs consolidated in docs/hrdd/
- Audit docs consolidated in docs/audits/
- Historical audit logs in docs/archive/audit-logs/
- Empty audit-logs/ directory removed
- Old docs/ files moved to subdirectories

**Validation:**
```bash
# Verify docs organization
tree /home/hughbrown/code/firecrawl/firesearch/docs/
# Should show hrdd/, audits/, archive/audit-logs/ subdirectories

# Verify old directories removed
[ ! -d /home/hughbrown/code/firecrawl/firesearch/audit-logs ] && echo "OK: audit-logs removed" || echo "ERROR: audit-logs still exists"
```

---

### Task Group 8: Archive Completed Specs
**Assigned Implementer:** api-engineer
**Dependencies:** Task Group 4
**Risk Level:** Low (archiving completed work)
**Estimated Time:** 3 minutes

> Move completed spec directories to archive to separate from active work.

- [ ] 8.0 Archive completed specifications
  - [ ] 8.1 Move HRDD research orchestration spec
    ```bash
    cd /home/hughbrown/code/firecrawl/firesearch
    git mv agent-os/specs/2025-10-21-hrdd-research-orchestration agent-os/archive/specs/
    ```
  - [ ] 8.2 Move HRDD search optimization spec
    ```bash
    git mv agent-os/specs/2025-10-23-hrdd-search-optimization agent-os/archive/specs/
    ```
  - [ ] 8.3 Move hybrid RAG multi-pass synthesis spec
    ```bash
    git mv agent-os/specs/2025-10-23-hybrid-rag-multi-pass-synthesis agent-os/archive/specs/
    ```
  - [ ] 8.4 Verify spec moves
    ```bash
    git status | grep "agent-os/" | grep renamed
    # Should show 3 spec directories moved
    ```
  - [ ] 8.5 Verify agent-os/specs/ only contains active spec
    ```bash
    ls /home/hughbrown/code/firecrawl/firesearch/agent-os/specs/
    # Should only show 2025-10-24-codebase-refactoring
    ```

**Acceptance Criteria:**
- 3 completed spec directories archived
- agent-os/specs/ contains only active refactoring spec
- Git recognizes directories as renamed

**Validation:**
```bash
# Verify archive contains 3 specs
ls /home/hughbrown/code/firecrawl/firesearch/agent-os/archive/specs/ | wc -l
# Should return 3

# Verify active specs directory is clean
find /home/hughbrown/code/firecrawl/firesearch/agent-os/specs/ -maxdepth 1 -type d | grep -v "2025-10-24-codebase-refactoring" | grep -v "specs/$" | wc -l
# Should return 0
```

---

### Task Group 9: Update Import Statements - Core and Synthesis
**Assigned Implementer:** api-engineer
**Dependencies:** Task Groups 5-6
**Risk Level:** High (breaking changes if incorrect)
**Estimated Time:** 15 minutes

> Update import paths in core and synthesis files to reflect new structure.

- [ ] 9.0 Update imports for core and synthesis files
  - [ ] 9.1 Update imports in lib/core/ files
    - Update lib/core/langgraph-search-engine.ts
      - Change: `from '@/lib/config'` → `from '@/lib/core/config'`
      - Change: `from '@/lib/firecrawl'` → `from '@/lib/core/firecrawl'`
      - Change: `from '@/lib/context-processor'` → `from '@/lib/core/context-processor'`
      - Change: `from '@/lib/error-handler'` → `from '@/lib/utils/error-handler'`
      - Change: `from '@/lib/multi-pass-synthesis'` → `from '@/lib/synthesis/multi-pass-synthesis'`
    - Update lib/core/context-processor.ts (verify imports if any)
    - Update lib/core/config.ts (verify imports if any)
    - Update lib/core/firecrawl.ts
      - Change: `from '@/lib/error-handler'` → `from '@/lib/utils/error-handler'`
      - Change: `from '@/lib/rate-limit'` → `from '@/lib/utils/rate-limit'`
  - [ ] 9.2 Update imports in lib/synthesis/ files
    - Update lib/synthesis/multi-pass-synthesis.ts
      - Change: `from '@/lib/content-store'` → `from '@/lib/synthesis/content-store'`
      - Change: `from '@/lib/citation-validator'` → `from '@/lib/synthesis/citation-validator'`
      - Change: `from '@/lib/config'` → `from '@/lib/core/config'`
    - Update lib/synthesis/content-store.ts (verify imports)
    - Update lib/synthesis/citation-validator.ts (verify imports)
  - [ ] 9.3 Update imports in lib/utils/ files
    - Update lib/utils/error-handler.ts (likely no imports to update)
    - Update lib/utils/rate-limit.ts (verify imports)
    - Update lib/utils/favicon-utils.ts (verify imports)
    - Update lib/utils/utils.ts (verify imports)
  - [ ] 9.4 Verify TypeScript compilation for core/synthesis
    ```bash
    npx tsc --noEmit 2>&1 | grep -E "(lib/core|lib/synthesis|lib/utils)"
    # Should show no errors for these modules
    ```

**Acceptance Criteria:**
- All core/ files import from correct new paths
- All synthesis/ files import from correct new paths
- All utils/ files import from correct new paths
- No circular dependencies introduced
- TypeScript compilation succeeds for these modules

**Validation:**
```bash
# Check for old import patterns in moved files
grep -r "from '@/lib/config'" /home/hughbrown/code/firecrawl/firesearch/lib/core/ /home/hughbrown/code/firecrawl/firesearch/lib/synthesis/ 2>/dev/null
# Should only find correct new paths

# Verify no absolute path errors
npx tsc --noEmit | grep -i "cannot find module"
```

---

### Task Group 10: Update Import Statements - HRDD and Export
**Assigned Implementer:** api-engineer
**Dependencies:** Task Groups 5, 9
**Risk Level:** High (breaking changes if incorrect)
**Estimated Time:** 12 minutes

> Update import paths in HRDD and export files, plus app/ directory files.

- [ ] 10.0 Update imports for HRDD, export, and app files
  - [ ] 10.1 Update imports in lib/hrdd/ files (8 files)
    - Update lib/hrdd/hrdd-workflow-engine.ts
      - Change: `from '@/lib/hrdd-state'` → `from '@/lib/hrdd/hrdd-state'`
      - Change: `from '@/lib/hrdd-config'` → `from '@/lib/hrdd/hrdd-config'`
      - Change: `from '@/lib/hrdd-prompts'` → `from '@/lib/hrdd/hrdd-prompts'`
      - Change: `from '@/lib/hrdd-preliminary-screening'` → `from '@/lib/hrdd/hrdd-preliminary-screening'`
      - Change: `from '@/lib/hrdd-risk-factors'` → `from '@/lib/hrdd/hrdd-risk-factors'`
      - Change: `from '@/lib/hrdd-synthesis'` → `from '@/lib/hrdd/hrdd-synthesis'`
      - Change: `from '@/lib/config'` → `from '@/lib/core/config'`
      - Change: `from '@/lib/firecrawl'` → `from '@/lib/core/firecrawl'`
    - Update remaining lib/hrdd/*.ts files following same pattern
    - Update lib/hrdd/hrdd-config.ts
      - Change: `from '@/config/hrdd-sources.json'` → `from '@/lib/hrdd/hrdd-sources.json'`
  - [ ] 10.2 Update imports in lib/export/ files (2 files)
    - Update lib/export/audit-trail-export.ts
      - Change any `from '@/lib/hrdd-*'` → `from '@/lib/hrdd/hrdd-*'`
      - Change any `from '@/lib/utils'` → `from '@/lib/utils/utils'`
    - Update lib/export/search-results-export.ts (verify imports)
  - [ ] 10.3 Update imports in app/ directory
    - Update app/chat.tsx
      - Change: `from '@/lib/langgraph-search-engine'` → `from '@/lib/core/langgraph-search-engine'`
      - Change any other lib imports to new paths
    - Check app/api/check-env/route.ts (likely no lib imports)
  - [ ] 10.4 Verify TypeScript compilation for all updated modules
    ```bash
    npx tsc --noEmit 2>&1 | grep -E "(lib/hrdd|lib/export|app/)"
    # Should show no import errors
    ```

**Acceptance Criteria:**
- All HRDD files import from correct new paths
- All export files import from correct new paths
- app/chat.tsx imports from new core/ paths
- hrdd-sources.json path updated in hrdd-config.ts
- No broken imports remain

**Validation:**
```bash
# Search for old import patterns that should be updated
grep -r "from '@/lib/hrdd-" /home/hughbrown/code/firecrawl/firesearch/lib/hrdd/ 2>/dev/null | grep -v "from '@/lib/hrdd/"
# Should return nothing (all should use new paths)

grep -r "from '@/config/" /home/hughbrown/code/firecrawl/firesearch/lib/ 2>/dev/null
# Should return nothing
```

---

### Task Group 11: Update Test File Imports
**Assigned Implementer:** testing-engineer
**Dependencies:** Task Groups 6, 9, 10
**Risk Level:** High (test failures if incorrect)
**Estimated Time:** 10 minutes

> Update import paths in all test files to match new code structure.

- [ ] 11.0 Update test file imports
  - [ ] 11.1 Update core test imports (3 files)
    - Update lib/__tests__/core/synthesis-config.test.ts
      - Change: `from '@/lib/config'` → `from '@/lib/core/config'`
    - Update lib/__tests__/core/content-store.test.ts
      - Change: `from '@/lib/content-store'` → `from '@/lib/synthesis/content-store'`
    - Update lib/__tests__/core/content-population.test.ts
      - Update to new paths for any imports
  - [ ] 11.2 Update synthesis test imports (10 files)
    - Update lib/__tests__/synthesis/citation-validator.test.ts
      - Change: `from '@/lib/citation-validator'` → `from '@/lib/synthesis/citation-validator'`
    - Update lib/__tests__/synthesis/multi-pass-synthesis-pass1.test.ts
      - Change: `from '@/lib/multi-pass-synthesis'` → `from '@/lib/synthesis/multi-pass-synthesis'`
      - Change: `from '@/lib/content-store'` → `from '@/lib/synthesis/content-store'`
    - Update remaining 8 synthesis test files following same pattern
  - [ ] 11.3 Update HRDD test imports (6 files)
    - Update lib/__tests__/hrdd/hrdd-config.test.ts
      - Change: `from '@/lib/hrdd-config'` → `from '@/lib/hrdd/hrdd-config'`
    - Update lib/__tests__/hrdd/hrdd-state.test.ts
      - Change: `from '@/lib/hrdd-state'` → `from '@/lib/hrdd/hrdd-state'`
    - Update remaining 4 HRDD test files following same pattern
  - [ ] 11.4 Verify test imports compile
    ```bash
    npx tsc --noEmit 2>&1 | grep "__tests__"
    # Should show no import errors in test files
    ```

**Acceptance Criteria:**
- All 19 test files have updated import paths
- Test files can locate modules under test
- No broken imports in test files
- TypeScript compilation succeeds for tests

**Validation:**
```bash
# Search for old import patterns in test files
grep -r "from '@/lib/[^/]*'" /home/hughbrown/code/firecrawl/firesearch/lib/__tests__/ 2>/dev/null | grep -v "from '@/lib/core/" | grep -v "from '@/lib/synthesis/" | grep -v "from '@/lib/hrdd/" | grep -v "from '@/lib/utils/"
# Should return nothing (all imports should use new subdirectory paths)
```

---

### Task Group 12: Comprehensive Validation and Testing
**Assigned Implementer:** testing-engineer
**Dependencies:** Task Groups 9-11
**Risk Level:** None (validation only)
**Estimated Time:** 12 minutes

> Verify refactoring success with comprehensive testing and validation.

- [ ] 12.0 Validate refactoring completeness
  - [ ] 12.1 TypeScript compilation check
    ```bash
    npx tsc --noEmit 2>&1 | tee /tmp/tsc-post-refactoring.txt
    diff /tmp/tsc-baseline.txt /tmp/tsc-post-refactoring.txt
    # Should show no new errors
    ```
  - [ ] 12.2 Run full test suite
    ```bash
    npm test 2>&1 | tee /tmp/test-post-refactoring.txt
    # Compare to baseline
    ```
  - [ ] 12.3 Compare test results to baseline
    - Count passing tests (should match baseline)
    - Verify no new test failures
    - Document any differences
  - [ ] 12.4 Run production build
    ```bash
    npm run build
    # Should succeed without errors
    ```
  - [ ] 12.5 Manual smoke test
    ```bash
    npm run dev
    # Verify dev server starts without errors
    # Test core search functionality in browser
    ```
  - [ ] 12.6 Verify git history preservation
    ```bash
    # Check that moved files maintain history
    git log --follow --oneline /home/hughbrown/code/firecrawl/firesearch/lib/core/langgraph-search-engine.ts | head -10
    git log --follow --oneline /home/hughbrown/code/firecrawl/firesearch/lib/synthesis/multi-pass-synthesis.ts | head -10
    # Should show full commit history from original location
    ```
  - [ ] 12.7 Verify no obsolete files remain
    ```bash
    # Check for backup files
    find /home/hughbrown/code/firecrawl/firesearch -type f -name "*.bak" -o -name "*.backup" -o -name "*.Zone.Identifier" | grep -v node_modules
    # Should return nothing

    # Check for files in old locations
    ls /home/hughbrown/code/firecrawl/firesearch/lib/*.ts 2>/dev/null
    # Should return nothing
    ```
  - [ ] 12.8 Verify directory structure matches target
    ```bash
    tree -L 3 -I 'node_modules|.next|.git' /home/hughbrown/code/firecrawl/firesearch > /tmp/final-structure.txt
    # Review to ensure matches target design
    ```

**Acceptance Criteria:**
- TypeScript compilation matches baseline (no new errors)
- All tests pass (matches baseline results)
- Production build succeeds
- Dev server runs without errors
- Git history preserved for moved files
- No obsolete files remain
- Directory structure matches target design

**Validation:**
```bash
# Final sanity check
echo "TypeScript: $(npx tsc --noEmit 2>&1 | wc -l) issues"
echo "Tests: $(npm test 2>&1 | grep -E "passed|failed" | head -1)"
echo "Build: $(npm run build 2>&1 | tail -5)"
```

---

## Post-Migration Activities

### Create Documentation Index
**Assigned Implementer:** api-engineer
**Time:** 5 minutes (included in total estimate)

After validation passes, create `docs/README.md`:

```markdown
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
```

### Update CLAUDE.md
**Assigned Implementer:** api-engineer
**Time:** 3 minutes (included in total estimate)

Update the "Code Organization" section in CLAUDE.md to reflect new structure (see spec Phase 8 for content).

---

## Rollback Procedures

### Immediate Rollback (During Migration)

If issues discovered during any task group:

```bash
# Abort current state
git reset --hard HEAD
git clean -fd

# Restore from stash
git stash list | grep "Pre-refactoring"
git stash pop stash@{0}  # Use appropriate stash index

# Verify restoration
npm test
git status
```

### Post-Migration Rollback (After Completion)

If issues discovered after all tasks complete:

```bash
# Revert to tagged backup
git tag | grep pre-refactoring
git reset --hard pre-refactoring-backup-YYYYMMDD

# Verify restoration
npm test
npm run build
git status
```

### Partial Rollback (Specific Files)

If only specific moves need reversal:

```bash
# Example: Reverting a specific file
git log --follow /home/hughbrown/code/firecrawl/firesearch/lib/core/config.ts
git mv /home/hughbrown/code/firecrawl/firesearch/lib/core/config.ts /home/hughbrown/code/firecrawl/firesearch/lib/config.ts

# Update affected imports and re-test
npx tsc --noEmit
npm test
```

---

## Success Metrics

**Quantitative:**
- 0 new TypeScript errors
- 0 test regressions (all tests pass)
- 58 files moved successfully
- 3 files deleted
- 12 new directories created
- 100% import paths updated

**Qualitative:**
- Directory structure immediately understandable
- Each file has clear purpose and location
- Related files logically grouped
- No clutter (backups, build artifacts, metadata)

**Timeline:**
- Total time: 60-90 minutes
- Checkpoint validations: After groups 2, 6, 11, 12
- Final validation: Comprehensive (Task Group 12)
