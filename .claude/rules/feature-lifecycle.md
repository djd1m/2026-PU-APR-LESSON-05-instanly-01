# Feature Lifecycle: ColdMail.ru

## 4-Phase Protocol

Every feature follows this strict sequence:

```
PLAN -> VALIDATE -> IMPLEMENT -> REVIEW
```

No phase may be skipped. Each phase has a defined entry criteria, process, and exit gate.

---

## Phase 1: PLAN

### Entry Criteria
- Feature request exists (issue, user story, or explicit instruction)

### Process

1. **Read SPARC documentation first**: Before writing any plan, read the relevant docs in `docs/` (Architecture.md, Specification.md, Refinement.md). Understand where this feature fits in the system
2. **Identify affected modules**: Map the feature to ColdMail modules (auth, accounts, campaigns, sequences, leads, warmup, email, ai, unibox, analytics, compliance)
3. **Write a plan document** in `docs/plans/{feature-slug}.md` containing:
   - **Goal**: One sentence describing what the feature achieves
   - **Affected modules**: List of modules that will be created or modified
   - **Database changes**: New tables, columns, indexes, migrations
   - **API endpoints**: New or modified endpoints with request/response shapes
   - **UI changes**: New pages, components, or modifications to existing ones
   - **Background jobs**: New BullMQ queues or workers
   - **Edge cases**: Reference relevant items from Refinement.md Edge Cases Matrix
   - **Dependencies**: External services, libraries, or other features required
   - **Estimated scope**: S (< 4 hours), M (4-16 hours), L (16-40 hours), XL (40+ hours -- split it)

### Planning Rules

- SPARC docs are mandatory reading -- never plan a feature without understanding the existing architecture
- Plans for L/XL features must break work into independent tasks that can be implemented in parallel
- If the feature requires a new NestJS module, define its full structure (controller, service, repository, DTOs)
- If the feature touches the database, draft the Prisma schema changes in the plan
- Security implications must be called out explicitly (new auth rules, new input validation, new rate limits)

### Exit Gate
- Plan document exists in `docs/plans/`
- All affected modules identified
- No unresolved questions (if questions exist, resolve them before proceeding)

---

## Phase 2: VALIDATE

### Entry Criteria
- Plan document complete from Phase 1

### Process

1. **Validation review**: Review the plan against Architecture.md for consistency
2. **Check constraints**: Verify the plan respects:
   - Performance targets from Specification.md (p50/p95/p99 latencies)
   - Security requirements (encryption, rate limiting, input validation)
   - 152-FZ and 38-FZ compliance requirements
   - Docker Compose deployment model (no Kubernetes assumptions)
3. **Identify risks**: List anything that could cause rework
4. **Score the plan** on these criteria (1-10 each):
   - Completeness: Are all affected modules covered?
   - Consistency: Does it align with existing architecture?
   - Testability: Can each piece be independently tested?
   - Security: Are all security implications addressed?

### Validation Rules

- Minimum passing score: 70% (28/40 total points)
- If score < 70%, revise the plan and re-validate
- Maximum 3 validation iterations -- if the plan cannot pass after 3 rounds, escalate for architectural review
- Document validation results in the plan file itself (append a "Validation" section)

### Exit Gate
- Validation score >= 70%
- No critical risks without mitigation
- Plan updated with any changes from validation feedback

---

## Phase 3: IMPLEMENT

### Entry Criteria
- Validated plan from Phase 2 (score >= 70%)

### Process

1. **Re-read the plan**: Always re-read `docs/plans/{feature-slug}.md` before writing code. Never code from memory
2. **Create feature branch**: `feat/{ticket}-{short-description}`
3. **Implement in order**:
   a. Database: Prisma schema changes + migration
   b. Backend: Repository -> Service -> Controller -> DTOs
   c. Workers: BullMQ processors if needed
   d. Frontend: Components -> Hooks -> Pages
   e. Tests: Unit -> Integration -> E2E
4. **Commit incrementally**: One logical change per commit (see git-workflow.md)

### Implementation Rules

- **Read docs before coding**: Re-read Architecture.md section for the module you are touching
- **Modular implementation**: Each module (controller, service, repository) is a separate commit
- **Parallel tasks**: Independent modules can be implemented in parallel (e.g., backend API and frontend components if the API contract is defined)
- **Test as you go**: Write unit tests alongside the implementation, not after
- **No dead code**: Do not commit commented-out code, console.logs, or TODO placeholders without a linked issue
- **Follow coding-style.md**: All naming, structure, and pattern conventions apply
- **Follow security.md**: Encryption, validation, rate limiting rules apply to every endpoint

### Exit Gate
- All planned modules implemented
- Unit tests pass with coverage >= 80% for new code
- No TypeScript errors (`tsc --noEmit` passes)
- No lint errors (`eslint` passes)
- Feature works end-to-end in local Docker Compose environment

---

## Phase 4: REVIEW

### Entry Criteria
- Implementation complete from Phase 3
- All tests passing
- PR created

### Process

1. **Self-review**: Author reviews their own diff before requesting review
2. **Code review criteria** (brutal-honesty mode):
   - Does the code match the validated plan?
   - Are there security vulnerabilities? (SQL injection, XSS, credential exposure, missing auth checks)
   - Are error cases handled? (network failures, timeouts, invalid input)
   - Are there performance concerns? (N+1 queries, missing indexes, unbounded queries)
   - Is the code testable and tested?
   - Does it follow coding-style.md?
3. **Classify findings**:
   - **Critical**: Security vulnerability, data loss risk, broken functionality -- MUST fix before merge
   - **Major**: Performance issue, missing error handling, missing tests -- SHOULD fix before merge
   - **Minor**: Style inconsistency, naming improvement, comment quality -- MAY fix, not blocking
4. **Fix criticals**: All critical findings must be resolved. Create new commits (do not amend)

### Review Rules

- Fix ALL critical findings before merge -- no exceptions
- Major findings should be fixed unless there is a documented reason to defer (create an issue)
- Minor findings are optional but encouraged
- After fixes, re-run all tests to confirm nothing broke
- Squash merge to main

### Exit Gate
- Zero critical findings
- All major findings resolved or tracked as issues
- CI pipeline green (lint + type check + tests)
- PR approved and merged
