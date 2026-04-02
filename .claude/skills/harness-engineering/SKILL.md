---
name: harness-engineering
description: >
  Orchestrate complex software engineering tasks using Anthropic's GAN-inspired
  three-agent architecture (Planner → Generator → Evaluator). This skill implements
  the harness engineering patterns from Anthropic's research — separating planning,
  building, and evaluation into distinct agent roles to eliminate self-evaluation bias
  and produce production-quality output. It also includes Claude Teams organizational
  best practices for credential management, project visibility, task delegation, and
  workflow patterns. ALWAYS use this skill when the user mentions: "harness", "GAN loop",
  "planner generator evaluator", "multi-agent build", "autonomous build", "sprint loop",
  "agent architecture", or wants to build a complex feature/app/system with structured
  agent coordination. Also trigger when users ask about Claude Teams setup, harness
  engineering patterns, or want to run a long-running autonomous coding session.
---

# Harness Engineering — GAN-Inspired Agent Orchestration

This skill implements Anthropic's three-agent harness architecture for software engineering
tasks. The core insight: making a generator self-critical is fundamentally harder than
building a separate, dedicated critic. By separating concerns into distinct agent roles,
each with clear responsibilities and access to specialized skills, you get dramatically
better output than a single agent working alone.

## When to Use This Skill

Use the full GAN loop for tasks that are:
- Multi-step (3+ distinct implementation phases)
- Require both planning and execution (new features, apps, systems)
- Benefit from independent quality evaluation
- Need to produce tested, working output

For simpler tasks (single-file edits, quick fixes, explanations), skip the GAN loop
and work directly — don't add orchestration overhead where it isn't needed.

## The Three-Agent Architecture

```
User Prompt
    │
    ▼
┌─────────────────────────┐
│   PLANNER (+ Research)  │  ← Expands prompt into full spec
│   Reads: web, files,    │    Researches context first
│   installed skills list  │    Outputs: specification.md
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│      GENERATOR          │  ← Builds sprint-by-sprint
│   Reads: spec, skills   │    Negotiates sprint contracts
│   Uses: code, docx,     │    Commits after each sprint
│   xlsx, pptx, etc.      │    Outputs: working artifacts
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│      EVALUATOR          │  ← Grades against criteria
│   Reads: spec, outputs  │    Tests like a real user
│   Uses: code-review,    │    Skeptical by design
│   testing-strategy      │    Outputs: grading.json
└──────────┬──────────────┘
           │
     ┌─────┴─────┐
     │  PASS?    │
     └─────┬─────┘
       Yes │  No ──► Back to Generator with feedback
           ▼
       ✅ Done
```

## How to Run the GAN Loop

### Step 0: Assess Complexity

Before spinning up agents, decide if the task warrants the full loop.

| Task Complexity | Approach |
|---|---|
| Simple (single file, quick fix) | Do it directly, no agents |
| Medium (2-3 files, clear scope) | Use Planner + Generator, skip Evaluator |
| Complex (multi-file, new feature/system) | Full GAN loop |

### Step 1: Run the Planner

Read `agents/planner.md` for full instructions. The Planner's job:

1. **Research phase** — gather context before planning. Search the codebase, read
   relevant files, check web for patterns/libraries. The Planner is also the
   Researcher — it gathers what it needs before writing the spec.

2. **Specification phase** — expand the user's prompt (even if it's just 1-4 sentences)
   into a complete specification including:
   - Feature list with pass/fail acceptance criteria
   - Technical architecture (high-level only — avoid granular implementation details
     that cascade errors downstream)
   - Which installed skills each agent should use
   - Sprint breakdown with priorities

3. **Output** — save `specification.md` in the working directory.

**Skill access**: The Planner reads the installed skills list (see `references/skill-registry.md`)
and assigns relevant skills to the Generator and Evaluator in the spec.

### Step 2: Run the Generator

Read `agents/generator.md` for full instructions. The Generator's job:

1. **Read the spec** — understand what needs to be built and in what order.

2. **Sprint loop** — work one feature at a time:
   - Before each sprint, negotiate a **sprint contract** with the Evaluator:
     agree on what "done" looks like before writing any code
   - Invoke installed skills as needed (e.g., call `docx` to produce a report,
     `xlsx` for data work, `system-design` for architecture)
   - Self-evaluate at end of each sprint before handoff
   - Commit with descriptive messages after each sprint

3. **Output** — working artifacts (code, files, docs) plus a progress log.

### Step 3: Run the Evaluator

Read `agents/evaluator.md` for full instructions. The Evaluator's job:

1. **Read the spec and sprint contract** — know exactly what was promised.

2. **Test like a real user** — interact with the output the way an end user would.
   Navigate pages, test API endpoints, verify database state, open documents.

3. **Grade against criteria** — score each sprint on predefined dimensions:
   - **Functionality**: Does it work? Can users complete primary actions?
   - **Code quality**: Clean, maintainable, follows project conventions?
   - **Design quality** (if UI): Coherent whole, not a collection of parts?
   - **Originality**: Custom decisions, or generic AI-default patterns?

4. **Be skeptical** — the Evaluator is tuned to be critical. This is the entire
   point of separating evaluation from generation. A hard pass/fail threshold
   on any criterion sends work back to the Generator.

5. **Output** — `grading.json` with per-criterion scores and evidence.

### Step 4: Iterate or Ship

- If all criteria pass → done. Commit final state, update progress log.
- If any criterion fails → send grading feedback to Generator, repeat from Step 2.
- Cap at 3 iteration cycles. If still failing after 3 rounds, surface the
  issues to the user for guidance rather than looping indefinitely.

## Context Management

For long-running tasks that approach context limits:

- **Prefer compaction over reset** — Claude Opus 4.6 handles compaction well
  across 2+ hour sessions without "context anxiety"
- **Use git as state backbone** — commit frequently with descriptive messages
  so any agent can reconstruct state from git history
- **Progress log** — maintain a `progress.md` file that tracks what's done,
  what's in progress, and what's next
- **One feature per sprint** — prevents context exhaustion

## Claude Teams Organizational Setup

For teams adopting this skill across an organization, read `references/teams-setup.md`
for best practices on:
- Credential hierarchy and access control
- Project visibility and privacy settings
- Task delegation and prompt engineering patterns
- CLAUDE.md continuous improvement loops
- Async vs. synchronous workflow patterns

## Harness Engineering Patterns

For deeper understanding of harness design principles, read `references/harness-patterns.md`
covering:
- The harness simplification principle
- Context reset vs. compaction tradeoffs
- Evaluator grading criteria design
- Cost and performance benchmarks
- CI/CD integration patterns

## Installed Skills Integration

Read `references/skill-registry.md` for the mapping of which installed skills
each agent role can invoke. The key principle: skills are loaded progressively —
agents only read skill instructions when they actually need them, keeping context lean.
