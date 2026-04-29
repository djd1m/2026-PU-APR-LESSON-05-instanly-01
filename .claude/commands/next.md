---
description: Show next features to work on from the project roadmap.
  Quick overview of sprint progress and top suggested tasks.
  $ARGUMENTS: optional — "update" to refresh statuses, or feature-id to mark as done
---

# /next $ARGUMENTS

## Default: Show Next Steps

1. Read `.claude/feature-roadmap.json`
2. Show current sprint progress (% complete)
3. List top 3 suggested next tasks based on priority and dependencies
4. Show any blocking issues
5. Ask which task to start

Format output as:

```
Sprint: <sprint-name> — N/M complete (X%)

In Progress:
   <feature-name> — <description>
     Files: <file paths>

Next Up:
   1. <feature-name> — <description>
      Depends on: none | <feature-id>
   2. <feature-name> — <description>
   3. <feature-name> — <description>

Blocked:
   <feature-name> — waiting on: <dependency>

Which one shall we tackle? (1/2/3 or describe your own)
```

## /next update

Review the current codebase state and conversation history:
1. Check which features appear to be implemented (scan for key files in src/)
2. Scan for TODO/FIXME in codebase: `grep -rn "TODO\|FIXME" src/ --include="*.ts" --include="*.tsx" -l | head -5`
3. Run `git log --oneline -10` for recent progress context
4. Suggest status updates for features that may be done
5. Apply updates after user confirmation

## /next [feature-id]

Mark a specific feature as done:
1. Update status to `"done"` in `.claude/feature-roadmap.json`
2. Check if this unblocks any dependent features → update their status to `"next"`
3. Show updated sprint progress
4. Suggest the next feature to work on

Report:
```
Marked as done: <feature-name>
Unblocked: <feature-1>, <feature-2> (if any)

Sprint: <sprint-name> — N/M complete (X%)
Next suggested: <feature-name> — <description>

Start it now? /go <feature-name>
```
