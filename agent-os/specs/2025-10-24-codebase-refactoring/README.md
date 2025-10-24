# Codebase Refactoring Specification

**Spec ID**: 2025-10-24-codebase-refactoring
**Created**: October 24, 2025
**Status**: Planning Phase
**Type**: Infrastructure Refactoring
**Estimated Effort**: 60-90 minutes
**Risk Level**: Low

## Overview

This specification outlines a comprehensive refactoring of the Firesearch codebase to achieve a clean, minimalist file system where every file has a clear purpose and related files are logically grouped.

## Problem Statement

The current codebase has:
- 24 files in lib/ root directory with mixed concerns (core search, HRDD, utilities)
- Scattered documentation across multiple directories
- Backup files and build artifacts committed to git
- 3 completed spec directories mixed with active work
- No clear separation between core functionality and domain-specific features

This makes navigation difficult, onboarding confusing, and maintenance error-prone.

## Solution Summary

Reorganize the codebase into a domain-based structure:

1. **lib/ directory**: Organize into 5 subdirectories (core, synthesis, hrdd, export, utils)
2. **Documentation**: Consolidate into docs/ with logical subdirectories
3. **Specs**: Archive completed specs to separate from active work
4. **Cleanup**: Remove backup files and ignore build artifacts

## Documentation

### Quick Start

New to this refactoring? Start here:

1. **[quick-reference.md](planning/quick-reference.md)** - TL;DR guide with before/after structure
2. **[spec.md](spec.md)** - Complete specification with requirements and success criteria
3. **[migration-commands.md](planning/migration-commands.md)** - Step-by-step bash commands
4. **[file-inventory.md](planning/file-inventory.md)** - Detailed file-by-file analysis

### For Implementers

If you're executing the refactoring:

1. Read [quick-reference.md](planning/quick-reference.md) to understand the scope
2. Follow [migration-commands.md](planning/migration-commands.md) step-by-step
3. Use [file-inventory.md](planning/file-inventory.md) as a checklist
4. Refer to [spec.md](spec.md) for rollback procedures if needed

### For Reviewers

If you're reviewing the refactoring:

1. Check [file-inventory.md](planning/file-inventory.md) for expected file moves
2. Review [spec.md](spec.md) success criteria
3. Use validation commands in [quick-reference.md](planning/quick-reference.md)
4. Verify import path changes are consistent

## Key Deliverables

### New Directory Structure

```
lib/
├── core/              # Core search engine (4 files)
├── synthesis/         # Multi-pass synthesis (3 files)
├── hrdd/              # HRDD-specific logic (9 files)
├── export/            # Export utilities (2 files)
├── utils/             # Shared utilities (4 files)
└── __tests__/         # Tests organized by domain (19 files)
    ├── core/
    ├── synthesis/
    └── hrdd/
```

### Documentation Organization

```
docs/
├── README.md          # Documentation index (NEW)
├── hrdd/              # HRDD documentation (4 files)
├── audits/            # Audit documentation (2 files)
└── archive/           # Historical data
    └── audit-logs/    # Audit logs (5 files)
```

### Spec Archive

```
agent-os/
├── specs/             # Active specs only
│   └── 2025-10-24-codebase-refactoring/
└── archive/           # Completed specs
    └── specs/
        ├── 2025-10-21-hrdd-research-orchestration/
        ├── 2025-10-23-hrdd-search-optimization/
        └── 2025-10-23-hybrid-rag-multi-pass-synthesis/
```

## Impact Summary

### Files

- **Moved**: 58 files (reorganization)
- **Deleted**: 3 files (backup/temp)
- **Created**: 1 file (docs/README.md)
- **Updated**: 2 files (.gitignore, CLAUDE.md)

### Directories

- **Created**: 12 directories
- **Removed**: 3 directories (empty after moves)

### Code Changes

- **Breaking changes**: None (all imports updated)
- **New features**: None (pure refactoring)
- **Test changes**: None (tests moved, not modified)

## Success Criteria

### Validation Checklist

- [ ] TypeScript compilation passes: `npx tsc --noEmit`
- [ ] All tests pass: `npm test`
- [ ] Production build succeeds: `npm run build`
- [ ] Dev server runs: `npm run dev`
- [ ] No backup files in repository
- [ ] No build artifacts committed
- [ ] CLAUDE.md updated with new structure
- [ ] docs/README.md created
- [ ] Git history preserved for all moved files

### Quality Metrics

- **Discoverability**: Find any file in under 30 seconds by domain
- **Clarity**: Each directory has single clear purpose
- **Maintainability**: Documentation updates in one logical location
- **Cleanliness**: Zero backup/build artifacts in git

## Timeline

### Planning Phase (Current)

- [x] Analyze current codebase structure
- [x] Design target directory structure
- [x] Document file inventory and migration plan
- [x] Create step-by-step migration commands
- [ ] Review and approve specification

### Implementation Phase (Next)

- [ ] Execute migration commands
- [ ] Update import statements
- [ ] Validate TypeScript compilation
- [ ] Run test suite
- [ ] Manual testing
- [ ] Commit changes

### Verification Phase (Final)

- [ ] Code review
- [ ] Verify all acceptance criteria met
- [ ] Document any lessons learned
- [ ] Close specification

## Risk Assessment

### Low Risk

- All operations are reversible (git mv preserves history)
- No code logic changes (pure reorganization)
- TypeScript compiler catches import errors
- Comprehensive rollback plan documented

### Mitigation Strategies

1. **Backup**: Git stash and tag before starting
2. **Validation**: TypeScript + tests catch errors immediately
3. **Rollback**: Simple `git reset --hard` if issues arise
4. **Incremental**: Can pause and resume at any phase

## Dependencies

### Prerequisites

- Clean git working directory
- All tests currently passing
- Node.js and npm installed
- Git command-line tools

### No External Dependencies

This refactoring:
- Does not require new packages
- Does not change package.json
- Does not modify database schemas
- Does not affect deployed environments

## Future Considerations

Not included in this refactoring (separate specs):

1. **Barrel exports**: Add index.ts files for cleaner imports
2. **Monorepo**: Consider splitting HRDD into separate package
3. **Test co-location**: Move tests adjacent to source files
4. **Documentation site**: Consider Docusaurus for docs/
5. **Import linting**: ESLint rules for import ordering

## Resources

### Specification Documents

- **[spec.md](spec.md)** - Complete specification (8,000+ words)
- **[file-inventory.md](planning/file-inventory.md)** - File-by-file analysis (3,000+ words)
- **[migration-commands.md](planning/migration-commands.md)** - Bash commands (2,000+ words)
- **[quick-reference.md](planning/quick-reference.md)** - Quick lookup guide (1,500+ words)

### Related Files

- **Root documentation**: /README.md, /CLAUDE.md, /TESTING.md
- **Git history**: Use `git log --follow <file>` to trace moves
- **Test baseline**: Create with `npm test > test-baseline.txt` before migration

## Questions & Answers

### Q: Will this break anything?

**A**: No. All imports are updated, tests must pass, and rollback is instant.

### Q: How long will this take?

**A**: 60-90 minutes following the step-by-step guide.

### Q: What if I find a bug during migration?

**A**: Run `git reset --hard pre-refactoring-backup` to instantly rollback.

### Q: Do I need to update my editor configuration?

**A**: No. TypeScript path resolution works the same, just with new paths.

### Q: Will this affect the running application?

**A**: No. Users see no changes - this is pure internal reorganization.

### Q: Can I do this refactoring in multiple commits?

**A**: Yes, but recommended to do in one atomic commit for easy rollback.

## Contact

For questions about this specification:

1. Review the planning documents first
2. Check the spec.md rollback section if issues arise
3. Document any unexpected issues for future reference

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-10-24 | Initial specification created | Claude Code (spec-writer) |
| 2025-10-24 | Planning documents completed | Claude Code (spec-writer) |

---

**Specification Status**: Planning Phase Complete
**Next Step**: Implementation Phase
**Approval Required**: Yes
**Estimated Completion**: Same day as approval
