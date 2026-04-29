---
name: feature-navigator
description: >
  Sprint progress tracker and feature suggestion system. Reads feature-roadmap.json,
  git log, and TODO scan to present current sprint status and suggest next actions.
  Use when: checking sprint progress, deciding what to work on next, updating feature statuses.
  Triggers: "what's next", "sprint status", "feature progress", "next feature".
---

# Feature Navigator

Read the feature roadmap and suggest the best next action.

## When to Activate

- User asks "what should I work on?"
- User runs `/next`
- Session starts (via SessionStart hook)
- Feature is completed and user needs next task

## Protocol

### Step 1: Read Current State

```
Read .claude/feature-roadmap.json
Read recent git log (last 10 commits)
Scan for TODO/FIXME in source code (optional)
```

### Step 2: Analyze Sprint

Categorize features by status: done, in_progress, next, planned, blocked.

Priority rules:
1. `in_progress` features first (finish what you started)
2. `next` features ordered by: Must > Should > Could
3. Check `depends_on` — skip features with unmet dependencies
4. `planned` features only if no `next` remain

### Step 3: Present Progress

```
📊 Sprint: X/Y features done (Z%)
🔨 In Progress: [feature list]
⏭️ Next Up: [top 3 features]
🚫 Blocked: [blocked features with reasons]
```

### Step 4: Suggest Actions

Suggest top 3 actionable next steps (3-8 words each):
1. Continue/complete in-progress feature
2. Start next priority feature
3. Unblock a blocked feature (if possible)

### Step 5: Update Roadmap (on completion)

When a feature is marked as done:
1. Set status to "done"
2. Cascade: check all features that `depends_on` the completed feature
3. If all dependencies met → change from "blocked"/"planned" to "next"
4. Save updated roadmap
5. Commit: `docs(roadmap): mark <feature> as done`
