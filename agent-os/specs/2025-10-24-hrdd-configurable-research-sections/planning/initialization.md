# Initial Spec Idea

## User's Initial Description

I want to introduce checkboxes into the dossier to specify which parts of the research the research agent will conduct. This would be the preliminary checks and the three risk factors. When user ticks only the preliminary check, the research agent should only conduct research related to those and then compile the report based on only that risk factor. The output should be just for the specified section.

## Metadata
- Date Created: 2025-10-24
- Spec Name: hrdd-configurable-research-sections
- Spec Path: /home/hughbrown/code/firecrawl/firesearch/agent-os/specs/2025-10-24-hrdd-configurable-research-sections

## Context Provided by User
- This is for the HRDD (Human Rights Due Diligence) assessment feature
- The dossier form is in app/chat.tsx
- Current implementation has:
  - 3 preliminary checks (controversial weapons, sanctions, jurisdiction)
  - 3 risk factors (geographic context, customer profile, end-use application)
- All sections are currently mandatory and hard-coded
- The workflow uses LangGraph state machine (lib/hrdd/hrdd-workflow-engine.ts)
