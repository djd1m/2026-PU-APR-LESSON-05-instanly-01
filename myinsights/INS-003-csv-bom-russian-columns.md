# INS-003: CSV import must handle BOM and Russian column names

**Status:** Active
**Created:** 2026-04-29
**Hits:** 0

## Error Signature
- CSV import fails silently: 0 imported, all errors
- First column name has invisible BOM prefix (U+FEFF)
- Russian column names ("имя", "компания") not recognized

## Root Cause
Excel saves CSV with BOM (Byte Order Mark) prefix. Russian users use Cyrillic column headers. Default CSV parser doesn't strip BOM or map Russian column names.

## Solution
In `src/leads/csv-import.service.ts`:
- `csv-parse` with `bom: true` option strips BOM automatically
- Flexible column mapping: `first_name`, `firstname`, `имя` all map to `first_name`
- Unknown columns captured as `custom_fields` JSON

## Prevention
- Always use `bom: true` with csv-parse
- Maintain column mapping table for EN/camelCase/RU variants
- Log unmapped columns for future mapping additions
