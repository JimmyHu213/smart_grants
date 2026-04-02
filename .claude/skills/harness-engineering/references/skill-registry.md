# Skill Registry — Agent Role Assignments

This reference maps installed skills to agent roles in the GAN loop. The Planner
reads this to assign skills in the specification. The Generator and Evaluator
consult it to know what capabilities they can invoke.

## How Skill Invocation Works

Skills use progressive disclosure — agents only load skill instructions when they
actually need them. This keeps context lean and prevents wasting tokens on
irrelevant instructions.

**Pattern**: When an agent needs a skill, it reads the skill's SKILL.md, follows
its instructions for the specific task, then continues with the GAN loop.

---

## Planner Skills

The Planner (with integrated Researcher) can use:

| Skill | When to Use |
|---|---|
| `engineering:system-design` | Designing system architecture, service boundaries, API design |
| `engineering:architecture` | Creating or evaluating Architecture Decision Records |
| `engineering:testing-strategy` | Planning test approaches for the Generator to implement |

---

## Generator Skills

The Generator can invoke any skill needed to produce deliverables:

### Engineering Skills
| Skill | When to Use |
|---|---|
| `engineering:system-design` | When implementing architectural components |
| `engineering:documentation` | Writing technical docs, READMEs, runbooks |
| `engineering:testing-strategy` | Implementing tests per the Planner's test plan |
| `engineering:deploy-checklist` | Pre-deployment verification |
| `engineering:incident` | If addressing a production incident |
| `engineering:debug` | Structured debugging when stuck |

### Document Creation Skills
| Skill | When to Use |
|---|---|
| `docx` | Producing Word documents as deliverables |
| `xlsx` | Producing spreadsheets, data tables, financial models |
| `pptx` | Creating presentations |
| `pdf` | Working with PDF files |

### Domain Skills (if task requires)
| Skill | When to Use |
|---|---|
| `finance:*` | Financial modeling, statements, reconciliation |
| `legal:*` | Contract review, compliance, NDA triage |
| `marketing:*` | Content creation, campaigns, analytics |
| `sales:*` | Outreach, research, competitive intel |

---

## Evaluator Skills

The Evaluator uses skills to systematically assess Generator output:

| Skill | When to Use |
|---|---|
| `engineering:code-review` | Systematic code quality, security, and performance review |
| `engineering:testing-strategy` | Verifying test coverage and test quality |
| `engineering:tech-debt` | Identifying technical debt in Generator output |

---

## Adding Custom Skills

If you have additional installed skills not listed here, the Planner can assign
them to any agent role by adding them to the specification's Skills Assignment
section. The key constraints:

1. **Generator gets production skills** — skills that create or modify deliverables
2. **Evaluator gets assessment skills** — skills that review, test, or analyze
3. **Planner gets planning skills** — skills that help design and research

A skill can be assigned to multiple roles if it serves different purposes in each
(e.g., `testing-strategy` helps the Planner design a test plan and helps the
Evaluator verify test adequacy).

---

## Skill Discovery

To check what skills are currently installed, the Planner should look at the
available skills list in the system context. Skills are identified by their
`name` field in the SKILL.md frontmatter.

If a needed capability isn't available as an installed skill, the agent should:
1. Check if an MCP tool provides the capability
2. If not, implement the capability directly (write the code/script needed)
3. Note in the progress log that a skill gap exists — this helps the team
   decide whether to install or create additional skills
