# Task 5: Move Core Library Files

## Overview
**Task Reference:** Task #5 from `/home/hughbrown/code/firecrawl/firesearch/agent-os/specs/2025-10-24-codebase-refactoring/tasks.md`
**Implemented By:** api-engineer
**Date:** 2025-10-24
**Status:** ✅ Complete

### Task Description
Move 22 core library files from the flat lib/ directory structure into organized subdirectories by functional domain (core, synthesis, HRDD, export, utils). Use `git mv` to preserve full git history for all moved files.

## Implementation Summary
Successfully reorganized the lib/ directory from a flat structure with 22 files in the root to a hierarchical structure with five functional domains. All files were moved using `git mv` to preserve their complete git history, ensuring that future developers can trace the evolution of each file back to its original creation.

The reorganization separated core search engine functionality from domain-specific features (HRDD), synthesis logic from utilities, and export functionality into its own space. This creates clear boundaries between different concerns and makes the codebase immediately navigable. The lib/ root directory now contains only the __tests__/ subdirectory, eliminating clutter and establishing a clean organizational pattern.

## Files Changed/Created

### New Files
No new files were created - all files were moved from existing locations.

### Modified Files
No file contents were modified - only file locations changed.

### Moved Files (22 files total)

#### Core Search Engine (4 files)
- `lib/langgraph-search-engine.ts` → `lib/core/langgraph-search-engine.ts` - Main search orchestration engine
- `lib/context-processor.ts` → `lib/core/context-processor.ts` - Conversation context handling
- `lib/config.ts` → `lib/core/config.ts` - Search and model configuration
- `lib/firecrawl.ts` → `lib/core/firecrawl.ts` - Firecrawl API client

#### Synthesis (3 files)
- `lib/multi-pass-synthesis.ts` → `lib/synthesis/multi-pass-synthesis.ts` - Multi-pass synthesis orchestrator
- `lib/content-store.ts` → `lib/synthesis/content-store.ts` - Content storage and retrieval
- `lib/citation-validator.ts` → `lib/synthesis/citation-validator.ts` - Citation validation logic

#### HRDD (9 files: 8 TypeScript + 1 JSON)
- `lib/hrdd-workflow-engine.ts` → `lib/hrdd/hrdd-workflow-engine.ts` - HRDD workflow orchestrator
- `lib/hrdd-state.ts` → `lib/hrdd/hrdd-state.ts` - HRDD state management
- `lib/hrdd-config.ts` → `lib/hrdd/hrdd-config.ts` - HRDD configuration
- `lib/hrdd-prompts.ts` → `lib/hrdd/hrdd-prompts.ts` - HRDD prompt templates
- `lib/hrdd-preliminary-screening.ts` → `lib/hrdd/hrdd-preliminary-screening.ts` - Preliminary screening logic
- `lib/hrdd-risk-factors.ts` → `lib/hrdd/hrdd-risk-factors.ts` - Risk factor analysis
- `lib/hrdd-synthesis.ts` → `lib/hrdd/hrdd-synthesis.ts` - HRDD-specific synthesis
- `lib/hrdd-test-mode.ts` → `lib/hrdd/hrdd-test-mode.ts` - HRDD test mode utilities
- `config/hrdd-sources.json` → `lib/hrdd/hrdd-sources.json` - HRDD data sources configuration

#### Export Utilities (2 files)
- `lib/audit-trail-export.ts` → `lib/export/audit-trail-export.ts` - Audit trail export functionality
- `lib/search-results-export.ts` → `lib/export/search-results-export.ts` - Search results export functionality

#### Utilities (4 files)
- `lib/error-handler.ts` → `lib/utils/error-handler.ts` - Centralized error handling
- `lib/rate-limit.ts` → `lib/utils/rate-limit.ts` - Rate limiting utilities
- `lib/favicon-utils.ts` → `lib/utils/favicon-utils.ts` - Favicon extraction utilities
- `lib/utils.ts` → `lib/utils/utils.ts` - General utility functions

### Deleted Directories
- `config/` - Removed after hrdd-sources.json was moved to lib/hrdd/

## Key Implementation Details

### Core Search Engine Consolidation
**Location:** `lib/core/`

Moved the four foundational files that implement the core search functionality: the LangGraph-based search engine orchestrator, context processor for conversation memory, configuration for search/model parameters, and the Firecrawl API client. These files form the backbone of the application and are used by all other features.

**Rationale:** Grouping core search engine files together makes it immediately clear which files are fundamental to the application. This separation also makes it easier to maintain the core search functionality independently from domain-specific features like HRDD.

### Synthesis Module Separation
**Location:** `lib/synthesis/`

Moved the three files responsible for multi-pass synthesis: the main orchestrator that coordinates the four synthesis passes, the content store that manages document content during synthesis, and the citation validator that ensures proper attribution.

**Rationale:** Synthesis is a distinct feature that builds on top of the core search engine. Separating it into its own module makes the architecture clearer and allows the synthesis logic to evolve independently.

### HRDD Module Consolidation
**Location:** `lib/hrdd/`

Moved all eight HRDD TypeScript files plus the hrdd-sources.json configuration into a dedicated HRDD module. This includes the workflow engine, state management, configuration, prompts, preliminary screening, risk factor analysis, synthesis, and test mode utilities.

**Rationale:** HRDD is a domain-specific feature built on top of the core search engine. Consolidating all HRDD-related code into a single module makes it easier to understand, maintain, and potentially extract into a separate package in the future. Moving hrdd-sources.json from the config/ directory to lib/hrdd/ keeps all HRDD-related files together.

### Export Utilities Module
**Location:** `lib/export/`

Moved the two export utility files that handle exporting audit trails and search results in various formats.

**Rationale:** Export functionality is a distinct concern that can be developed and tested independently. Grouping these files together makes it clear where to add new export formats or modify existing ones.

### Shared Utilities Module
**Location:** `lib/utils/`

Moved four utility files that provide shared functionality used across the application: error handling, rate limiting, favicon utilities, and general utilities.

**Rationale:** Utilities are cross-cutting concerns used by multiple modules. Grouping them together in a utils/ directory is a standard pattern that makes them easy to discover and prevents duplication.

### Git History Preservation
All 22 files were moved using `git mv` which preserves the complete commit history. This means developers can use `git log --follow <filepath>` to trace the evolution of any moved file back to its original creation. Git recognizes these moves as "renames" rather than "delete + add" operations.

**Rationale:** Preserving git history is critical for understanding why code was written a certain way, tracking down when bugs were introduced, and maintaining institutional knowledge about the codebase.

## Database Changes
Not applicable - this is a Next.js/TypeScript project with no database.

## Dependencies
No new dependencies added. This task only relocates existing files.

## Testing

### Test Files Created/Updated
No test files were modified in this task. Test files will be moved in Task Group 6.

### Test Coverage
Not applicable - no code logic was changed, only file locations.

### Manual Testing Performed
1. Verified all 22 files were moved using `git status | grep renamed | wc -l` - confirmed 22 renames
2. Verified lib/ root directory has no .ts files using `ls lib/*.ts` - confirmed no files
3. Verified git history preservation using `git log --follow --oneline lib/core/langgraph-search-engine.ts | head -5` - confirmed full history visible
4. Verified empty config/ directory was removed successfully

## User Standards & Preferences Compliance

### Global Conventions (`/home/hughbrown/code/firecrawl/firesearch/agent-os/standards/global/conventions.md`)

**How Implementation Complies:**
Files are organized by functional domain (core, synthesis, hrdd, export, utils) which follows the principle of grouping related files together. The directory structure is hierarchical and logical, making it easy to navigate. Used `git mv` to preserve history, which aligns with best practices for maintaining codebase evolution context.

**Deviations:** None

### Backend API Standards (`/home/hughbrown/code/firecrawl/firesearch/agent-os/standards/backend/api.md`)

**How Implementation Complies:**
While this task doesn't create new API endpoints, organizing the codebase by functional domain makes it easier to follow API standards when adding new endpoints. The separation of concerns (core vs domain-specific features) supports clean API design.

**Deviations:** None - file relocation doesn't affect API implementation

### Coding Style (`/home/hughbrown/code/firecrawl/firesearch/agent-os/standards/global/coding-style.md`)

**How Implementation Complies:**
The organizational structure supports coding style guidelines by creating clear module boundaries. Each directory has a single, well-defined purpose, which encourages writing focused, cohesive modules.

**Deviations:** None

## Integration Points

### File Dependencies
After this move, import statements throughout the codebase need to be updated to reflect new paths. This will be handled in:
- Task Group 9: Update Import Statements - Core and Synthesis
- Task Group 10: Update Import Statements - HRDD and Export
- Task Group 11: Update Test File Imports

### Git Integration
All file moves are staged as renames in git, ready to be committed. Git recognizes these as rename operations, preserving the connection to the file's history.

## Known Issues & Limitations

### Issues
None - all files moved successfully with git history preserved.

### Limitations
1. **Import statements are now broken** - All files that import from the moved files will have broken imports until Task Groups 9-11 are completed. This is expected and part of the planned workflow.
2. **TypeScript compilation will fail** - The project won't compile until import paths are updated. This is intentional - we're moving all files first, then updating all imports.

## Performance Considerations
File relocation has no runtime performance impact. It only affects development-time operations like importing modules and navigating the codebase.

## Security Considerations
No security implications. File contents were not modified, and file permissions remain unchanged.

## Dependencies for Other Tasks
This task is a prerequisite for:
- Task Group 9: Update Import Statements - Core and Synthesis (depends on Task 5)
- Task Group 10: Update Import Statements - HRDD and Export (depends on Task 5)
- Task Group 11: Update Test File Imports (depends on Task 5 and 6)

This task depends on:
- Task Group 4: Create Directory Structure (directories must exist before files can be moved)

## Notes

### Verification Results
- Total renamed files: 22 (confirmed via `git status | grep renamed | wc -l`)
- lib/ root .ts files: 0 (confirmed via `ls lib/*.ts`)
- Git history preserved: Yes (confirmed via `git log --follow`)
- Empty directories removed: config/ directory successfully removed

### Next Steps
The next critical steps are to update all import statements to reflect the new file locations. This will be handled by Task Groups 9-11, which will update imports in:
1. Core and synthesis files
2. HRDD and export files
3. Test files

Until those tasks are complete, the project will not compile due to broken imports. This is expected and part of the planned refactoring workflow.
