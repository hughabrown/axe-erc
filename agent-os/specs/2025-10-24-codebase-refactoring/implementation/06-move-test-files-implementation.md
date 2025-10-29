# Task 6: Move Test Files

## Overview
**Task Reference:** Task #6 from `/home/hughbrown/code/firecrawl/firesearch/agent-os/specs/2025-10-24-codebase-refactoring/tasks.md`
**Implemented By:** testing-engineer
**Date:** 2025-10-24
**Status:** ✅ Complete

### Task Description
Reorganize all test files from the flat lib/__tests__/ directory structure into domain-specific subdirectories (core, synthesis, hrdd) that mirror the new lib/ source code organization. This task ensures that tests are easy to locate and maintain by placing them adjacent to their corresponding source code domains.

## Implementation Summary
Successfully moved 19 test files from the lib/__tests__/ root directory into three domain-specific subdirectories using `git mv` to preserve file history. The test organization now mirrors the source code structure established in Task Group 5, making it immediately clear which tests correspond to which code domains. All files were moved as git renames (not delete + add), ensuring complete history preservation for debugging and code archaeology purposes.

The reorganization separates tests into three logical domains:
- **core/** (3 files): Tests for core configuration and content storage functionality
- **synthesis/** (10 files): Tests for multi-pass synthesis, citation validation, and integration workflows
- **hrdd/** (6 files): Tests for HRDD-specific configuration, state management, and acceptance criteria

## Files Changed/Created

### New Files
None - this task only moved existing files

### Modified Files
None - files were moved without content changes

### Moved Files (19 total)

#### Core Test Files (3 files)
- `lib/__tests__/synthesis-config.test.ts` → `lib/__tests__/core/synthesis-config.test.ts` - Tests for SYNTHESIS_CONFIG validation
- `lib/__tests__/content-store.test.ts` → `lib/__tests__/core/content-store.test.ts` - Tests for content storage functionality
- `lib/__tests__/content-population.test.ts` → `lib/__tests__/core/content-population.test.ts` - Tests for content population logic

#### Synthesis Test Files (10 files)
- `lib/__tests__/citation-validator.test.ts` → `lib/__tests__/synthesis/citation-validator.test.ts` - Citation validation tests
- `lib/__tests__/multi-pass-synthesis-pass1.test.ts` → `lib/__tests__/synthesis/multi-pass-synthesis-pass1.test.ts` - Pass 1 synthesis tests
- `lib/__tests__/multi-pass-synthesis-pass2.test.ts` → `lib/__tests__/synthesis/multi-pass-synthesis-pass2.test.ts` - Pass 2 synthesis tests
- `lib/__tests__/multi-pass-synthesis-pass3-pass4.test.ts` → `lib/__tests__/synthesis/multi-pass-synthesis-pass3-pass4.test.ts` - Pass 3 & 4 synthesis tests
- `lib/__tests__/multi-pass-integration.test.ts` → `lib/__tests__/synthesis/multi-pass-integration.test.ts` - Multi-pass integration tests
- `lib/__tests__/contentstore-pass2-integration.test.ts` → `lib/__tests__/synthesis/contentstore-pass2-integration.test.ts` - Content store pass 2 integration tests
- `lib/__tests__/conflict-detection-integration.test.ts` → `lib/__tests__/synthesis/conflict-detection-integration.test.ts` - Conflict detection integration tests
- `lib/__tests__/token-limit-handling.test.ts` → `lib/__tests__/synthesis/token-limit-handling.test.ts` - Token limit handling tests
- `lib/__tests__/end-to-end-workflow.test.ts` → `lib/__tests__/synthesis/end-to-end-workflow.test.ts` - End-to-end workflow tests
- `lib/__tests__/acceptance-criteria.test.ts` → `lib/__tests__/synthesis/acceptance-criteria.test.ts` - Synthesis acceptance criteria tests

#### HRDD Test Files (6 files)
- `lib/__tests__/hrdd-config.test.ts` → `lib/__tests__/hrdd/hrdd-config.test.ts` - HRDD configuration tests
- `lib/__tests__/hrdd-state.test.ts` → `lib/__tests__/hrdd/hrdd-state.test.ts` - HRDD state management tests
- `lib/__tests__/hrdd-preliminary.test.ts` → `lib/__tests__/hrdd/hrdd-preliminary.test.ts` - HRDD preliminary screening tests
- `lib/__tests__/hrdd-risk-factors.test.ts` → `lib/__tests__/hrdd/hrdd-risk-factors.test.ts` - HRDD risk factor tests
- `lib/__tests__/hrdd-synthesis.test.ts` → `lib/__tests__/hrdd/hrdd-synthesis.test.ts` - HRDD synthesis tests
- `lib/__tests__/hrdd-acceptance.test.ts` → `lib/__tests__/hrdd/hrdd-acceptance.test.ts` - HRDD acceptance criteria tests

## Key Implementation Details

### Test Organization Strategy
**Location:** `lib/__tests__/` subdirectories

The test file organization follows a mirror pattern of the source code structure:
- Tests for `lib/core/*` files → `lib/__tests__/core/*`
- Tests for `lib/synthesis/*` files → `lib/__tests__/synthesis/*`
- Tests for `lib/hrdd/*` files → `lib/__tests__/hrdd/*`

This pattern makes it immediately obvious where to find tests for any given source file and simplifies test maintenance.

**Rationale:** Mirroring source code structure in tests is a widely-adopted best practice that reduces cognitive load when navigating the codebase. Developers can instantly locate relevant tests by following the same directory path pattern.

### Git History Preservation
**Location:** All moved test files

Used `git mv` for all file moves to preserve complete git history. This ensures that:
- `git log --follow <file>` shows full commit history from original location
- `git blame` continues to work correctly for all lines
- Code archaeology and debugging can trace changes across the rename

**Rationale:** Preserving git history is critical for understanding why code was written a certain way and for debugging issues that may have been introduced in earlier commits.

### Domain Classification
**Location:** Test file categorization

Test files were classified into three domains:

1. **Core Domain (3 files)**: Tests for fundamental configuration and content storage that underpins both synthesis and HRDD functionality. These tests validate core infrastructure.

2. **Synthesis Domain (10 files)**: Tests for multi-pass synthesis workflow, citation validation, conflict detection, and integration testing. This is the largest test suite due to the complexity of the synthesis pipeline.

3. **HRDD Domain (6 files)**: Tests specific to Human Rights Due Diligence workflows including configuration, state management, screening, risk factors, and synthesis.

**Rationale:** Clear domain boundaries help developers quickly locate relevant tests and understand the scope of testing for each functional area.

## Database Changes (if applicable)
N/A - This task involved only test file organization, no database changes.

## Dependencies (if applicable)
N/A - No new dependencies added.

## Testing

### Test Files Created/Updated
All 19 test files were moved but not modified. No test content changes were made.

### Test Coverage
- Unit tests: ✅ Complete (moved without modification)
- Integration tests: ✅ Complete (moved without modification)
- Edge cases covered: Maintained existing coverage from moved tests

### Manual Testing Performed
1. Verified all 19 test files were successfully moved using `git status | grep "__tests__" | grep renamed | wc -l`
2. Confirmed lib/__tests__/ root directory contains no .test.ts files using `ls lib/__tests__/*.test.ts`
3. Verified directory structure using `find lib/__tests__/ -type f -name "*.test.ts" | sort`
4. Confirmed git recognizes moves as renames (not delete + add) by checking git status output

**Results:**
- 19 renamed test files confirmed in git status
- lib/__tests__/*.test.ts returns "No such file or directory" (as expected)
- Test files properly organized into core/ (3), synthesis/ (10), and hrdd/ (6) subdirectories
- Git status shows "R" (rename) prefix for all moved files

## User Standards & Preferences Compliance

### Test Writing Standards
**File Reference:** `/home/hughbrown/code/firecrawl/firesearch/agent-os/standards/testing/test-writing.md`

**How Your Implementation Complies:**
This implementation follows the test organization principles by maintaining clear test structure and making tests easy to locate. The domain-based organization supports the standard of "Write Minimal Tests During Development" by making it obvious where new tests should be placed when they are needed. Tests are grouped by functional domain (core, synthesis, HRDD) which aligns with testing behavior over implementation.

**Deviations (if any):**
None - this task only reorganized existing tests without modifying test content or coverage.

### Coding Style Standards
**File Reference:** `/home/hughbrown/code/firecrawl/firesearch/agent-os/standards/global/coding-style.md`

**How Your Implementation Complies:**
No code changes were made, only file moves. The organization follows consistent naming patterns and directory structure conventions established in the specification.

**Deviations (if any):**
None

### Conventions Standards
**File Reference:** `/home/hughbrown/code/firecrawl/firesearch/agent-os/standards/global/conventions.md`

**How Your Implementation Complies:**
File organization follows the established convention of mirroring test structure to source code structure. Test file names remain unchanged, maintaining existing naming conventions (e.g., `*.test.ts` suffix).

**Deviations (if any):**
None

## Integration Points (if applicable)

### Test Discovery
Jest automatically discovers test files in the new locations since they maintain the `*.test.ts` naming pattern. No jest.config.js changes were required.

### Import Paths
Test import statements still reference the old source file paths (e.g., `from '@/lib/config'`). These will be updated in Task Group 11 by the testing-engineer to reflect the new source code structure (e.g., `from '@/lib/core/config'`).

## Known Issues & Limitations

### Issues
None identified

### Limitations
1. **Import Statements Not Updated**
   - Description: Test files still import from old source paths (e.g., `from '@/lib/config'`)
   - Reason: This task only moves test files. Import updates are handled in Task Group 11
   - Future Consideration: Task Group 11 will update all test imports to match new source structure

## Performance Considerations
No performance impact - file moves are metadata-only operations that don't affect runtime performance. Test discovery and execution times remain unchanged.

## Security Considerations
No security implications - this is a pure organizational refactoring with no changes to test logic or access patterns.

## Dependencies for Other Tasks
- **Task Group 11** depends on this task's completion to update test file imports to match new source code paths
- **Task Group 12** will validate that all moved tests continue to pass after import updates

## Notes

### Verification Commands Used
```bash
# Counted renamed test files
git status | grep "__tests__" | grep renamed | wc -l
# Result: 19

# Verified lib/__tests__/ root is empty
ls /home/hughbrown/code/firecrawl/firesearch/lib/__tests__/*.test.ts 2>&1
# Result: No such file or directory (as expected)

# Listed all test files in new structure
find /home/hughbrown/code/firecrawl/firesearch/lib/__tests__/ -type f -name "*.test.ts" | sort
# Result: All 19 files properly organized in subdirectories

# Confirmed file counts per domain
ls /home/hughbrown/code/firecrawl/firesearch/lib/__tests__/core/*.test.ts | wc -l      # Result: 3
ls /home/hughbrown/code/firecrawl/firesearch/lib/__tests__/synthesis/*.test.ts | wc -l # Result: 10
ls /home/hughbrown/code/firecrawl/firesearch/lib/__tests__/hrdd/*.test.ts | wc -l      # Result: 6
```

### Git History Preservation
All test files maintain complete git history. Example verification:
```bash
git log --follow --oneline lib/__tests__/core/synthesis-config.test.ts
```
This will show all commits from the file's original location at `lib/__tests__/synthesis-config.test.ts`.

### Next Steps
The next implementer (testing-engineer) will handle Task Group 11 to update all test import statements to match the new source code structure. After import updates, Task Group 12 will validate that all tests continue to pass.
