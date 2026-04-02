# Harness Engineering Patterns

This reference covers advanced harness engineering concepts — the design patterns,
tradeoffs, and principles behind building reliable multi-agent systems.

## Table of Contents
1. What Is a Harness?
2. The Multi-Context Window Problem
3. The Two-Agent Foundation
4. Context Management: Reset vs. Compaction
5. The Harness Simplification Principle
6. Evaluator Grading Criteria Design
7. Cost & Performance Benchmarks
8. CI/CD Integration with Harness.io
9. AI Deployment Pipeline Patterns

---

## 1. What Is a Harness?

An agent harness is everything surrounding the model that turns it into a reliable
system — the scaffolding, tools, prompts, state management, and orchestration logic.

The analogy: the model is the engine; the harness is the car. Without the car, the
engine just revs but goes nowhere. For complex tasks, the harness design is as
important as the model itself.

---

## 2. The Multi-Context Window Problem

The fundamental challenge of long-running agents: each new session begins with
no memory of previous sessions. Without a structured harness, frontier models
running in a loop exhibit two failure modes:

1. **Attempting to one-shot the entire task** — running out of context mid-implementation
   and leaving the next session to find half-finished, undocumented work

2. **Premature completion** — a later session looks around, sees progress has been made,
   and declares the project done before it actually is

Both failures stem from the same root cause: without structured state management,
agents have no way to accurately assess where they are in a multi-session project.

---

## 3. The Two-Agent Foundation (November 2025)

Anthropic's foundational harness architecture splits work into two agent roles:

### Initializer Agent (runs once, first session)
- Sets up an init.sh script to run the development server
- Creates a progress log file for all future agents to read
- Generates a comprehensive feature list in JSON format — all marked "failing"
  initially, so future agents have a clear definition of complete
- Makes an initial git commit documenting what files were added

### Coding Agent (runs every subsequent session)
- Begins by reading init.sh, git logs, progress file, and feature list to orient itself
- Starts the dev server and runs basic end-to-end tests to detect bugs left by
  the previous session
- Works on only one feature at a time — this incremental approach prevents context exhaustion
- Ends each session with a descriptive git commit and progress file update,
  leaving the environment in a clean "mergeable" state

### How This Solves the Failure Modes

| Failure Mode | Initializer Solution | Coding Agent Solution |
|---|---|---|
| Declares project done too early | Creates feature list with pass/fail status | Reads feature list; picks highest-priority failing feature |
| Leaves bugs or undocumented progress | Sets up git repo and progress notes | Reads progress notes; runs dev server smoke test at session start |
| Marks features done without testing | Feature list uses structured JSON (harder to modify) | Self-verifies all features before marking passing |
| Wastes time figuring out how to run the app | Writes init.sh startup script | Reads init.sh at session start |

---

## 4. Context Management: Reset vs. Compaction

A critical architectural decision for long runs:

**Compaction** summarizes earlier parts of the conversation in-place, allowing the same
agent to continue. It preserves continuity but doesn't eliminate "context anxiety" —
the tendency for models to start wrapping up prematurely as they approach what they
perceive as their context limit.

**Context reset** clears the window entirely and starts a fresh agent with a structured
handoff artifact. This gives the model a clean slate and eliminates context anxiety,
but adds orchestration complexity, token overhead, and latency.

**Model-specific guidance**: Claude Sonnet 4.5 exhibited strong context anxiety requiring
resets. Claude Opus 4.6 largely removed this behavior, allowing the harness to use
compaction alone across a full 2+ hour autonomous build session.

**The lesson**: Re-examine your harness with each new model release — components that
were load-bearing may become unnecessary overhead.

---

## 5. The Harness Simplification Principle

Every component in a harness encodes an assumption about what the model cannot do
on its own. Those assumptions are worth stress-testing periodically.

The principle from Anthropic's "Building Effective Agents" post: **"find the simplest
solution possible, and only increase complexity when needed."**

When a new model releases, the recommended approach is to remove one component at a
time and measure its impact on output quality — rather than stripping the harness
radically all at once (which risks losing multiple load-bearing pieces simultaneously).

---

## 6. Evaluator Grading Criteria Design

For frontend design tasks, four criteria were found effective for steering generators
away from generic "AI-default" outputs:

1. **Design quality** — Does the design feel like a coherent whole rather than a
   collection of parts?

2. **Originality** — Are there custom decisions, or is this template layouts and
   AI-default patterns? (Explicitly penalizes "purple gradients over white cards")

3. **Craft** — Technical execution: typography hierarchy, spacing, color harmony,
   contrast ratios

4. **Functionality** — Can users understand the interface, find primary actions,
   and complete tasks?

Design quality and originality should be weighted more heavily since models already
score well on craft and functionality by default.

---

## 7. Cost & Performance Benchmarks

Running production harnesses is expensive but yields qualitatively superior output:

| Harness Type | Duration | Cost | Quality |
|---|---|---|---|
| Single agent (solo) | 20 min | $9 | Core features broken |
| Full 3-agent harness (Opus 4.5) | 6 hours | $200 | Full-featured, tested, working |
| Simplified harness (Opus 4.6) | ~4 hours | $12.70 | Full-featured DAW with AI agent integration |

The dramatic cost reduction with Opus 4.6 reflects model improvements that eliminated
the need for context resets and reduced evaluation cycles.

---

## 8. CI/CD Integration with Harness.io

Beyond Anthropic's "harness" concept, Harness.io is a software delivery platform
that complements agent-built code:

**Key practices**:
- Commit early and often — trunk-based development with small, frequent changes
- Build only once, promote the artifact — same immutable artifact through dev, staging, production
- Use Test Intelligence — run only tests affected by a code change
- Enable Build Intelligence — AI-assisted build caching and optimization
- Make the pipeline the only path to production — enforce via governance, RBAC, policy-as-code
- Clean environments after each deployment — use IaC tools via Harness IaCM

**Policy as Code**:
- Start in WARN mode — flag violations without blocking
- Graduate to ERROR mode — once teams adapt, block non-compliant builds
- Create environment-based Policy Sets — separate policies for dev, staging, production
- Test custom policies in staging first

**Harness MCP + Claude Code**:
Harness supports Model Context Protocol (MCP) for Feature Management and
Experimentation, allowing developers to manage feature flags directly from
AI-powered IDEs. Teams can list flags, compare configurations between environments,
identify flags safe to remove, and give non-technical stakeholders flag visibility.

---

## 9. AI Deployment Pipeline Patterns

For teams shipping AI systems to production in 2026:

1. **Version prompts, configs, and policies as code** — treat prompt changes with
   the same rigor as code changes

2. **Build an eval suite** — golden set tests plus safety regression tests for
   every model/prompt change

3. **CI: semantic evaluation** — automated semantic evaluation with regression
   thresholds before merge

4. **Security gates** — PII redaction checks and prompt injection tests in the pipeline

5. **CD: canary rollouts** — progressive delivery for prompt, model, and RAG
   changes to limit blast radius

6. **Observability** — monitor quality, safety, and cost signals in production,
   not just infrastructure metrics
