# Report Templates

This directory contains markdown templates for generating structured reports from research data.

## Files

- `hrdd-assessment-template.md` - HRDD assessment report template

## Using Templates

1. Run research to gather data:
   ```bash
   npm run research -- erc-research-runner/configs/my-config.yml
   ```

2. Generate report from template:
   ```bash
   npm run generate-report -- \
     erc-research-runner/data/research-123.json \
     erc-research-runner/templates/hrdd-assessment-template.md
   ```

## Template Syntax

### Simple Variables

```markdown
{{VARIABLE_NAME}}
```

Replaced with values from the variables dictionary.

### Section References

```markdown
{{SECTION:section_name:query_id}}
```

Automatically pulls and formats sources from research data.

### Special Placeholders

- `{{ALL_SOURCES}}` - Complete bibliography
- `{{SESSION_ID}}` - Research session ID
- `{{GENERATION_DATE}}` - Report generation timestamp

## Creating Custom Templates

1. Copy an existing template
2. Modify structure and sections
3. Use placeholders to reference research data
4. Mark manual completion fields with `{{TBD_*}}` or `_[TBD]_`

## Documentation

See `../docs/GUIDE.md` for complete documentation.
