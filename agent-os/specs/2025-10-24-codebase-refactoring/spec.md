# Specification: Codebase Refactoring for Clean Minimalist File System

## Goal

Transform the Firesearch codebase into a clean, minimalist file system where every file has a clear purpose, related files are logically grouped, and the project structure is immediately understandable to new contributors.

## User Stories

- As a developer, I want to quickly locate files by domain (core search, HRDD, utilities) so that I can navigate the codebase efficiently
- As a new contributor, I want a clear file structure so that I understand the project organization immediately
- As a maintainer, I want minimal duplication so that I can update documentation in one place
- As a team member, I want obsolete files removed so that I don't accidentally reference deprecated code

## Core Requirements

### Functional Requirements

- Organize lib/ directory into logical subdirectories by functional domain
- Consolidate all documentation into a single docs/ directory
- Archive completed spec directories to separate them from active work
- Remove backup files and temporary artifacts
- Clean up audit logs with clear retention policy
- Maintain clear separation between core search engine and HRDD-specific features
- Preserve all working code and active tests

### Non-Functional Requirements

- Zero breaking changes to application functionality
- All existing imports must be updated to new paths
- Git history preserved for all moved files
- Migration must be reversible with documented rollback steps
- Clear migration documentation for team members

## Current State Analysis

### Directory Structure Inventory

**Root Level (16 directories, 19 files):**
- Configuration files: 13 files (package.json, tsconfig.json, next.config.ts, etc.)
- Documentation: 3 files (README.md, CLAUDE.md, TESTING.md)
- Environment: .env.local, .env.local.example
- Build artifacts: tsconfig.tsbuildinfo (should be gitignored)

**lib/ Directory (24 files, 1 directory):**
- Core search engine: 5 files (60KB langgraph-search-engine.ts, 28KB multi-pass-synthesis.ts, etc.)
- HRDD-specific: 8 files (hrdd-*.ts totaling ~100KB)
- Utilities: 6 files (firecrawl.ts, error-handler.ts, utils.ts, etc.)
- Export utilities: 2 files (audit-trail-export.ts, search-results-export.ts)
- Test directory: __tests__/ with 19 test files (188KB total)
- Backup file: langgraph-search-engine.ts.bak (51KB - DELETE)

**app/ Directory (12 files, 3 directories):**
- Well-organized, no changes needed
- Components: chat.tsx (26KB), search-display.tsx (49KB), etc.
- API routes: api/check-env/route.ts
- Nested components: app/components/ and app/__tests__/

**docs/ Directory (6 files):**
- AUDIT-TRAIL.md (8KB)
- Safran-example.md (35KB HRDD example)
- esg-policy.md (17KB)
- firecrawl-audit-log.md (6KB)
- hrdd-guide.md (15KB)
- sites.md (14KB)

**agent-os/specs/ (3 spec directories, 40+ markdown files):**
- 2025-10-21-hrdd-research-orchestration: 13 files (COMPLETED - archive)
- 2025-10-23-hrdd-search-optimization: 5 files (COMPLETED - archive)
- 2025-10-23-hybrid-rag-multi-pass-synthesis: 14 files (COMPLETED - archive)

**audit-logs/ Directory (5 files):**
- README.md
- 4 JSON files (hrdd-2025-10-22-*.json and hrdd-2025-10-23-*.json)
- Total: 400KB of audit data

**search-results/ Directory:**
- README.md only
- Purpose unclear, consider removing or documenting

**Other Directories:**
- components/ui/: 10 Radix UI components (well-organized)
- hooks/: 1 file (use-mobile.ts)
- config/: 1 file (hrdd-sources.json - should move to lib/hrdd/)
- public/: 8 files including Zone.Identifier file (DELETE)

### File Categorization

**DELETE (Backup/Temporary Files):**
- /lib/langgraph-search-engine.ts.bak (51KB)
- /public/favicon.ico:Zone.Identifier (Windows metadata file)
- /tsconfig.tsbuildinfo (should be in .gitignore)

**ARCHIVE (Completed Specs):**
- /agent-os/specs/2025-10-21-hrdd-research-orchestration/ (entire directory)
- /agent-os/specs/2025-10-23-hrdd-search-optimization/ (entire directory)
- /agent-os/specs/2025-10-23-hybrid-rag-multi-pass-synthesis/ (entire directory)

**CONSOLIDATE (Documentation):**
- Move /docs/ contents into organized subdirectories
- Keep root documentation (README.md, CLAUDE.md, TESTING.md) at root
- Organize by type: HRDD docs, audit logs, examples

**REORGANIZE (lib/ Directory):**
- Create lib/core/ for core search engine
- Create lib/hrdd/ for HRDD-specific logic
- Create lib/synthesis/ for multi-pass synthesis
- Create lib/utils/ for shared utilities
- Create lib/export/ for export utilities
- Organize lib/__tests__/ to mirror new structure

## Target State Design

### Proposed Directory Structure

```
firesearch/
├── .claude/                      # Claude Code agent definitions (no change)
├── .git/                         # Git metadata (no change)
├── .next/                        # Next.js build output (no change)
├── node_modules/                 # Dependencies (no change)
│
├── app/                          # Next.js App Router (no change)
│   ├── api/
│   ├── components/
│   ├── __tests__/
│   ├── chat.tsx
│   ├── citation-tooltip.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── markdown-renderer.tsx
│   ├── page.tsx
│   ├── search-display.tsx
│   └── search.tsx
│
├── components/                   # Reusable UI components (no change)
│   └── ui/
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── pagination.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
│
├── lib/                          # Reorganized core business logic
│   ├── core/                     # Core search engine
│   │   ├── langgraph-search-engine.ts
│   │   ├── context-processor.ts
│   │   ├── config.ts
│   │   └── firecrawl.ts
│   │
│   ├── synthesis/                # Multi-pass synthesis
│   │   ├── multi-pass-synthesis.ts
│   │   ├── content-store.ts
│   │   └── citation-validator.ts
│   │
│   ├── hrdd/                     # HRDD-specific logic
│   │   ├── hrdd-workflow-engine.ts
│   │   ├── hrdd-state.ts
│   │   ├── hrdd-config.ts
│   │   ├── hrdd-prompts.ts
│   │   ├── hrdd-preliminary-screening.ts
│   │   ├── hrdd-risk-factors.ts
│   │   ├── hrdd-synthesis.ts
│   │   ├── hrdd-test-mode.ts
│   │   └── hrdd-sources.json     # Moved from /config/
│   │
│   ├── export/                   # Export utilities
│   │   ├── audit-trail-export.ts
│   │   └── search-results-export.ts
│   │
│   ├── utils/                    # Shared utilities
│   │   ├── error-handler.ts
│   │   ├── rate-limit.ts
│   │   ├── favicon-utils.ts
│   │   └── utils.ts
│   │
│   └── __tests__/                # Tests organized by domain
│       ├── core/
│       │   ├── synthesis-config.test.ts
│       │   ├── content-store.test.ts
│       │   └── content-population.test.ts
│       │
│       ├── synthesis/
│       │   ├── citation-validator.test.ts
│       │   ├── multi-pass-synthesis-pass1.test.ts
│       │   ├── multi-pass-synthesis-pass2.test.ts
│       │   ├── multi-pass-synthesis-pass3-pass4.test.ts
│       │   ├── multi-pass-integration.test.ts
│       │   ├── contentstore-pass2-integration.test.ts
│       │   ├── conflict-detection-integration.test.ts
│       │   ├── token-limit-handling.test.ts
│       │   ├── end-to-end-workflow.test.ts
│       │   └── acceptance-criteria.test.ts
│       │
│       └── hrdd/
│           ├── hrdd-config.test.ts
│           ├── hrdd-state.test.ts
│           ├── hrdd-preliminary.test.ts
│           ├── hrdd-risk-factors.test.ts
│           ├── hrdd-synthesis.test.ts
│           └── hrdd-acceptance.test.ts
│
├── hooks/                        # React hooks (no change)
│   └── use-mobile.ts
│
├── public/                       # Static assets (cleanup)
│   ├── assets/
│   │   └── twemoji-fire.svg
│   ├── favicon.ico
│   ├── file.svg
│   ├── firecrawl-logo-with-fire.png
│   ├── firecrawl-logo.svg
│   ├── globe.svg
│   └── window.svg
│   # DELETE: favicon.ico:Zone.Identifier
│
├── docs/                         # Consolidated documentation
│   ├── hrdd/                     # HRDD-specific documentation
│   │   ├── hrdd-guide.md
│   │   ├── esg-policy.md
│   │   ├── safran-example.md
│   │   └── sites.md
│   │
│   ├── audits/                   # Audit trails and logs
│   │   ├── AUDIT-TRAIL.md
│   │   └── firecrawl-audit-log.md
│   │
│   └── archive/                  # Historical audit data
│       └── audit-logs/           # Moved from /audit-logs/
│           ├── README.md
│           ├── hrdd-2025-10-22-asd-asd.json
│           ├── hrdd-2025-10-22-e-d.json
│           ├── hrdd-2025-10-22-saab-sweden.json
│           ├── hrdd-2025-10-22-sd-asd.json
│           └── hrdd-2025-10-23-saab-sweden.json
│
├── agent-os/                     # Agent OS framework (reorganized)
│   ├── config.yml
│   ├── agents-registry.yml
│   │
│   ├── roles/                    # Agent role definitions (no change)
│   │
│   ├── standards/                # Code standards (no change)
│   │
│   ├── specs/                    # Active specs only
│   │   └── 2025-10-24-codebase-refactoring/
│   │       ├── spec.md
│   │       └── planning/
│   │
│   └── archive/                  # Completed specs
│       └── specs/
│           ├── 2025-10-21-hrdd-research-orchestration/
│           ├── 2025-10-23-hrdd-search-optimization/
│           └── 2025-10-23-hybrid-rag-multi-pass-synthesis/
│
├── search-results/               # Search results storage (document or remove)
│   └── README.md
│
├── [Root Config Files]           # Configuration (no change)
│   ├── .env.local
│   ├── .env.local.example
│   ├── .gitignore                # Update to include *.tsbuildinfo
│   ├── components.json
│   ├── eslint.config.mjs
│   ├── jest.config.js
│   ├── next.config.ts
│   ├── package.json
│   ├── package-lock.json
│   ├── pnpm-lock.yaml
│   ├── postcss.config.mjs
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vercel.json
│
└── [Root Documentation]          # Project documentation (no change)
    ├── README.md
    ├── CLAUDE.md
    └── TESTING.md
```

## Reusable Components

### Existing Code to Leverage

**No new code required** - this is a pure refactoring task that:
- Moves existing files to new locations
- Updates import statements
- Removes obsolete files
- Archives completed work

### Tools and Patterns

- Git mv for file moves (preserves history)
- Find and replace for import statement updates
- Git archive for creating rollback snapshots
- TypeScript compiler for validating all imports resolve

## Technical Approach

### Phase 1: Preparation and Backup

1. Create complete backup:
   - Run: `git stash push -u -m "Pre-refactoring backup"`
   - Tag: `git tag pre-refactoring-backup`
   - Document current HEAD commit hash

2. Update .gitignore:
   - Add `*.tsbuildinfo` to ignore build artifacts
   - Add `*.bak` to ignore backup files
   - Add `*.Zone.Identifier` to ignore Windows metadata

3. Run full test suite to establish baseline:
   - `npm test` - ensure all tests pass
   - Document any pre-existing failures

### Phase 2: Remove Obsolete Files

Delete files that provide no value:

```bash
# Backup file
rm lib/langgraph-search-engine.ts.bak

# Windows metadata
rm public/favicon.ico:Zone.Identifier

# Build artifact (will regenerate)
rm tsconfig.tsbuildinfo
```

### Phase 3: Reorganize lib/ Directory

Create new directory structure:

```bash
mkdir -p lib/core
mkdir -p lib/synthesis
mkdir -p lib/hrdd
mkdir -p lib/export
mkdir -p lib/utils
mkdir -p lib/__tests__/core
mkdir -p lib/__tests__/synthesis
mkdir -p lib/__tests__/hrdd
```

Move files using git mv (preserves history):

```bash
# Core search engine
git mv lib/langgraph-search-engine.ts lib/core/
git mv lib/context-processor.ts lib/core/
git mv lib/config.ts lib/core/
git mv lib/firecrawl.ts lib/core/

# Synthesis
git mv lib/multi-pass-synthesis.ts lib/synthesis/
git mv lib/content-store.ts lib/synthesis/
git mv lib/citation-validator.ts lib/synthesis/

# HRDD
git mv lib/hrdd-workflow-engine.ts lib/hrdd/
git mv lib/hrdd-state.ts lib/hrdd/
git mv lib/hrdd-config.ts lib/hrdd/
git mv lib/hrdd-prompts.ts lib/hrdd/
git mv lib/hrdd-preliminary-screening.ts lib/hrdd/
git mv lib/hrdd-risk-factors.ts lib/hrdd/
git mv lib/hrdd-synthesis.ts lib/hrdd/
git mv lib/hrdd-test-mode.ts lib/hrdd/
git mv config/hrdd-sources.json lib/hrdd/

# Export utilities
git mv lib/audit-trail-export.ts lib/export/
git mv lib/search-results-export.ts lib/export/

# Utilities
git mv lib/error-handler.ts lib/utils/
git mv lib/rate-limit.ts lib/utils/
git mv lib/favicon-utils.ts lib/utils/
git mv lib/utils.ts lib/utils/

# Tests
git mv lib/__tests__/synthesis-config.test.ts lib/__tests__/core/
git mv lib/__tests__/content-store.test.ts lib/__tests__/core/
git mv lib/__tests__/content-population.test.ts lib/__tests__/core/

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

git mv lib/__tests__/hrdd-config.test.ts lib/__tests__/hrdd/
git mv lib/__tests__/hrdd-state.test.ts lib/__tests__/hrdd/
git mv lib/__tests__/hrdd-preliminary.test.ts lib/__tests__/hrdd/
git mv lib/__tests__/hrdd-risk-factors.test.ts lib/__tests__/hrdd/
git mv lib/__tests__/hrdd-synthesis.test.ts lib/__tests__/hrdd/
git mv lib/__tests__/hrdd-acceptance.test.ts lib/__tests__/hrdd/
```

Remove empty config/ directory:

```bash
rmdir config/
```

### Phase 4: Update Import Statements

Update all import paths to reflect new structure. Files to update:

**app/ directory:**
- app/chat.tsx
- app/api/check-env/route.ts
- Any HRDD-related components

**lib/ directory:**
- All moved files that import from each other
- Cross-domain imports (e.g., HRDD importing core config)

**Test files:**
- Update all test imports to match new paths

Example import transformations:

```typescript
// Before
import { searchEngine } from '@/lib/langgraph-search-engine'
import { SEARCH_CONFIG } from '@/lib/config'
import { handleError } from '@/lib/error-handler'

// After
import { searchEngine } from '@/lib/core/langgraph-search-engine'
import { SEARCH_CONFIG } from '@/lib/core/config'
import { handleError } from '@/lib/utils/error-handler'
```

### Phase 5: Consolidate Documentation

Create documentation structure:

```bash
mkdir -p docs/hrdd
mkdir -p docs/audits
mkdir -p docs/archive/audit-logs
```

Move documentation files:

```bash
# HRDD documentation
git mv docs/hrdd-guide.md docs/hrdd/
git mv docs/esg-policy.md docs/hrdd/
git mv docs/Safran-example.md docs/hrdd/safran-example.md
git mv docs/sites.md docs/hrdd/

# Audit documentation
git mv docs/AUDIT-TRAIL.md docs/audits/
git mv docs/firecrawl-audit-log.md docs/audits/

# Archive audit logs
git mv audit-logs/README.md docs/archive/audit-logs/
git mv audit-logs/*.json docs/archive/audit-logs/

# Remove old directories
rmdir audit-logs/
rmdir docs/ # Will be empty after moves
```

### Phase 6: Archive Completed Specs

Create archive structure:

```bash
mkdir -p agent-os/archive/specs
```

Move completed specs:

```bash
git mv agent-os/specs/2025-10-21-hrdd-research-orchestration agent-os/archive/specs/
git mv agent-os/specs/2025-10-23-hrdd-search-optimization agent-os/archive/specs/
git mv agent-os/specs/2025-10-23-hybrid-rag-multi-pass-synthesis agent-os/archive/specs/
```

### Phase 7: Validation and Testing

1. TypeScript compilation check:
   ```bash
   npx tsc --noEmit
   ```
   - Fix any import errors
   - Verify all paths resolve correctly

2. Run test suite:
   ```bash
   npm test
   ```
   - All tests should pass
   - Compare results to Phase 1 baseline

3. Build verification:
   ```bash
   npm run build
   ```
   - Ensure production build succeeds
   - No new errors or warnings

4. Manual verification:
   ```bash
   npm run dev
   ```
   - Test core search functionality
   - Test HRDD workflow (if applicable)
   - Verify UI renders correctly

### Phase 8: Update Documentation

Update CLAUDE.md with new structure:

```markdown
## Code Organization

firesearch/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── *.tsx              # Pages and client components
│   └── globals.css        # Global styles
├── lib/                   # Core business logic
│   ├── core/              # Core search engine
│   │   ├── langgraph-search-engine.ts
│   │   ├── context-processor.ts
│   │   ├── config.ts
│   │   └── firecrawl.ts
│   ├── synthesis/         # Multi-pass synthesis
│   │   ├── multi-pass-synthesis.ts
│   │   ├── content-store.ts
│   │   └── citation-validator.ts
│   ├── hrdd/              # HRDD-specific logic
│   │   └── [8 HRDD modules]
│   ├── export/            # Export utilities
│   ├── utils/             # Shared utilities
│   └── __tests__/         # Tests organized by domain
│       ├── core/
│       ├── synthesis/
│       └── hrdd/
├── components/ui/         # Reusable UI components (Radix/shadcn)
├── hooks/                 # React hooks
├── docs/                  # Consolidated documentation
│   ├── hrdd/              # HRDD documentation
│   ├── audits/            # Audit trails
│   └── archive/           # Historical data
├── agent-os/              # Agent OS configuration
│   ├── roles/             # Agent role definitions
│   ├── standards/         # Code standards by domain
│   ├── specs/             # Active specs
│   └── archive/           # Completed specs
└── public/                # Static assets
```

Create docs/README.md as documentation index:

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

### Phase 9: Final Cleanup

Update .gitignore to prevent future clutter:

```gitignore
# Build artifacts
*.tsbuildinfo
next-env.d.ts

# Backup files
*.bak
*.backup

# OS metadata
*.Zone.Identifier
.DS_Store

# Search results (optional - uncomment to exclude from git)
# search-results/
```

Verify directory cleanliness:

```bash
# Should show no untracked backup or metadata files
git status --short | grep -E '\.(bak|backup|Zone\.Identifier|tsbuildinfo)$'
```

## Migration Plan

### Pre-Migration Checklist

- [ ] Create git stash backup: `git stash push -u -m "Pre-refactoring backup"`
- [ ] Create git tag: `git tag pre-refactoring-backup`
- [ ] Document current HEAD: `git log -1 --oneline`
- [ ] Run test suite baseline: `npm test > test-baseline.txt`
- [ ] Verify clean working directory: `git status`

### Migration Steps (Sequential)

**Step 1: Backup and Preparation (5 minutes)**
- Create backups
- Update .gitignore
- Run baseline tests

**Step 2: Delete Obsolete Files (2 minutes)**
- Remove .bak, .Zone.Identifier, .tsbuildinfo files
- Verify deletions: `git status`

**Step 3: Create Directory Structure (2 minutes)**
- Create all lib/ subdirectories
- Create all docs/ subdirectories
- Create agent-os/archive/ structure

**Step 4: Move lib/ Files (15 minutes)**
- Move core files (4 files)
- Move synthesis files (3 files)
- Move HRDD files (9 files including hrdd-sources.json)
- Move export files (2 files)
- Move utility files (4 files)
- Move test files (19 files)
- Verify: `git status | grep renamed`

**Step 5: Update Import Statements (30 minutes)**
- Update app/chat.tsx imports
- Update lib/core/ cross-imports
- Update lib/synthesis/ cross-imports
- Update lib/hrdd/ cross-imports
- Update lib/export/ imports
- Update lib/utils/ imports
- Update all test file imports
- Verify: `npx tsc --noEmit`

**Step 6: Move Documentation (10 minutes)**
- Move HRDD docs to docs/hrdd/
- Move audit docs to docs/audits/
- Move audit logs to docs/archive/audit-logs/
- Create docs/README.md
- Verify: `git status | grep renamed`

**Step 7: Archive Specs (5 minutes)**
- Move 3 completed spec directories to agent-os/archive/specs/
- Verify: `git status | grep renamed`

**Step 8: Validation (15 minutes)**
- Run TypeScript compilation: `npx tsc --noEmit`
- Run test suite: `npm test`
- Run production build: `npm run build`
- Manual testing: `npm run dev`

**Step 9: Documentation Update (10 minutes)**
- Update CLAUDE.md with new structure
- Create docs/README.md
- Update any spec references to new paths

**Step 10: Final Cleanup (5 minutes)**
- Remove empty directories (config/, old docs/, audit-logs/)
- Verify .gitignore updated
- Final git status check

**Total Estimated Time: 90 minutes**

### Post-Migration Checklist

- [ ] TypeScript compilation passes: `npx tsc --noEmit`
- [ ] All tests pass: `npm test`
- [ ] Production build succeeds: `npm run build`
- [ ] Dev server runs: `npm run dev`
- [ ] Core search functionality works
- [ ] HRDD workflow functional (if applicable)
- [ ] No broken imports in codebase
- [ ] Documentation updated (CLAUDE.md, docs/README.md)
- [ ] Git status clean (all changes staged)

## Rollback Plan

### Immediate Rollback (During Migration)

If issues discovered during migration:

1. Abort current state:
   ```bash
   git reset --hard HEAD
   git clean -fd
   ```

2. Restore from stash:
   ```bash
   git stash pop
   ```

3. Verify restoration:
   ```bash
   npm test
   git status
   ```

### Post-Commit Rollback (After Migration Complete)

If issues discovered after committing:

1. Revert to tagged backup:
   ```bash
   git reset --hard pre-refactoring-backup
   ```

2. Verify restoration:
   ```bash
   npm test
   npm run build
   git status
   ```

3. Document rollback reason in git log:
   ```bash
   git tag refactoring-rollback-$(date +%Y%m%d)
   ```

### Partial Rollback (Specific Files)

If only specific moves need reversal:

1. Identify problematic file:
   ```bash
   # Example: Reverting lib/core/config.ts
   git log --follow lib/core/config.ts
   ```

2. Restore file to original location:
   ```bash
   git mv lib/core/config.ts lib/config.ts
   ```

3. Update affected imports and re-test

## Out of Scope

### Not Included in This Refactoring

- **Code refactoring** - No changes to actual implementation logic
- **Performance optimization** - No changes to algorithm efficiency
- **Dependency updates** - Package versions remain unchanged
- **Test additions** - No new tests written (existing tests moved only)
- **Feature additions** - No new functionality added
- **Database migrations** - No database changes (project has no database)
- **API changes** - No changes to public API surface
- **Configuration changes** - No changes to SEARCH_CONFIG, MODEL_CONFIG, etc.
- **UI/UX changes** - No changes to user interface

### Future Enhancements (Separate Specs)

- **lib/ barrel exports** - Add index.ts files for cleaner imports (e.g., `@/lib/core`)
- **Monorepo structure** - Consider splitting HRDD into separate package
- **Test organization** - Consider moving tests adjacent to source files
- **Documentation website** - Consider Docusaurus or similar for docs/
- **Code quality tools** - Add Prettier, ESLint rules for import ordering
- **Dependency cleanup** - Audit and remove unused dependencies

## Success Criteria

### Quantitative Metrics

- **Zero breaking changes**: All tests pass before and after migration
- **Zero new errors**: TypeScript compilation succeeds with same error count
- **100% file accountability**: Every file either moved, deleted, or explicitly kept
- **Import path updates**: All imports updated to new paths (0 broken imports)
- **Directory reduction**: lib/ goes from 24 files in root to 0 files in root
- **Documentation consolidation**: 6 scattered docs consolidated into organized docs/ structure
- **Spec archive**: 3 completed specs moved to archive (0 active specs clutter)

### Qualitative Goals

- **Discoverability**: New contributor can locate files by domain in under 30 seconds
- **Clarity**: Each directory has clear single purpose
- **Maintainability**: Documentation updates happen in one logical location
- **Cleanliness**: No backup files, no build artifacts, no OS metadata in git
- **Separation of concerns**: Core search engine clearly separated from HRDD features
- **Test organization**: Tests mirror source code structure for easy navigation

### Acceptance Criteria

- [ ] All TypeScript files compile without new errors
- [ ] All 19 test files pass with same results as baseline
- [ ] Production build succeeds: `npm run build`
- [ ] Dev server runs without errors: `npm run dev`
- [ ] Core search functionality works (manual test)
- [ ] HRDD workflow works if enabled (manual test)
- [ ] CLAUDE.md updated with new structure
- [ ] docs/README.md created as documentation index
- [ ] No backup files in repository (.bak, .backup)
- [ ] No OS metadata files (.Zone.Identifier, .DS_Store)
- [ ] No build artifacts committed (.tsbuildinfo)
- [ ] .gitignore updated to prevent future clutter
- [ ] Git history preserved for all moved files (use git log --follow to verify)
- [ ] All empty directories removed (config/, old docs/, audit-logs/)
- [ ] Rollback plan tested and documented
- [ ] Migration time under 2 hours

### Validation Commands

```bash
# Type checking
npx tsc --noEmit

# Test suite
npm test

# Production build
npm run build

# Clean git status
git status --short

# Verify no backup files
find . -type f \( -name "*.bak" -o -name "*.backup" -o -name "*.Zone.Identifier" \) | grep -v node_modules

# Verify directory structure
tree -L 3 -I 'node_modules|.next|.git' .

# Verify git history preserved
git log --follow lib/core/langgraph-search-engine.ts | head -10
```
