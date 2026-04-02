# Claude Teams — Organizational Best Practices

This reference covers how to set up and manage Claude for engineering teams at scale,
drawn from Anthropic's internal usage patterns and enterprise best practices.

## Table of Contents
1. Access & Subscription Setup
2. Credential Hierarchy & Access Control
3. Project Visibility & Privacy
4. Task Delegation & Prompt Engineering
5. CLAUDE.md Continuous Improvement
6. Workflow Patterns for Engineering Teams
7. Security Engineering Use Cases

---

## 1. Access & Subscription Setup

Claude is available via subscription plans (Pro, Max, Team, Enterprise) or API-based
pay-as-you-go access. For engineering teams, the key decision is:

**Subscription-based** — fixed usage allocation shared between Claude web/desktop and
Claude Code. Simple to set up but usage is a "black box" with no per-developer
token consumption visibility.

**API-based** — pay-as-you-go with dedicated token limits and full cost visibility
in the Anthropic Console dashboard.

**Recommendation for teams**: Layer an AI gateway (such as Portkey) between Claude Code
and the LLM provider. This adds credential management, per-team budget limits, request
logging, and provider fallback routing — solving the visibility gap in subscription access.

---

## 2. Credential Hierarchy & Access Control

**Never distribute raw API keys to individual developers.** Instead, build a tiered
credential hierarchy:

- Store provider API keys centrally (org level)
- Issue scoped team/project keys with budget and rate limits
- Let developers inherit their team's access

Additional controls:
- Admins on Team and Enterprise plans can set per-user spend caps and enable
  extra usage at API rates
- For compliance-sensitive teams, enable audit trails — logging every request with
  metadata (user, team, project, model, token count, cost, latency)

---

## 3. Project Visibility & Privacy

The first configuration decision: whether to enable or disable **public projects**.
Public projects let any team member create a workspace visible to the entire
organization, which can inadvertently expose confidential documents.

| Organization Type | Recommendation | Rationale |
|---|---|---|
| Large organizations | Disable public projects | Higher user count, complex security, greater exposure risk |
| Small trusted teams | May enable | Strong trust, sharing benefits outweigh risks |
| All teams | Use shared/private projects for sensitive work | Controlled sharing ensures only authorized members access confidential knowledge bases |

---

## 4. Task Delegation & Prompt Engineering

The quality of Claude's output is directly proportional to how well tasks are framed.

**Describe finished outcomes, not steps.** Instead of "help me with expense reports,"
write "Process every PDF receipt in ~/receipts/. Create a single Excel spreadsheet
with columns for date, vendor, amount, and category. Sort by date."

**Set explicit boundaries.** Before every task, specify what Claude can create,
what it must not touch, and what format/naming constraints apply.

**Batch related work** into single sessions to avoid token overhead from multiple
separate sessions.

**Use standard chat for simple tasks.** Reserve Cowork/Code for tasks requiring
file access, extended execution, or multi-step coordination. The rule: "Chat for
thinking, Cowork for doing, Claude Code for building."

**Monitor and steer mid-task.** Check early steps to verify Claude understood
intent. Course-correct immediately if it drifts — mistakes compound quickly in
autonomous tasks.

---

## 5. CLAUDE.md Continuous Improvement

Anthropic's internal teams extensively use CLAUDE.md files for persistent project
context. This creates a continuous improvement loop: Claude Code helps refine
the CLAUDE.md documentation and workflow instructions based on actual usage.

Best practice: Ask Claude to suggest improvements to the CLAUDE.md at the end
of each task to keep documentation current.

Contents to include:
- Project directory structure and conventions
- Testing commands and expected behaviors
- Architectural constraints and patterns
- Common workflows and their expected outcomes
- What Claude should and should not modify

---

## 6. Workflow Patterns for Engineering Teams

Anthropic's internal teams use two primary workflow patterns:

### Asynchronous (Auto-Accept) Mode
For peripheral features and prototyping:
- Enable auto-accept mode (shift+tab in Claude Code)
- Set up autonomous loops where Claude writes code, runs tests, and iterates
- Start from a clean git state and commit frequently
- Succeeds on the first attempt about one-third of the time, but saves significant
  development time when it works

### Synchronous Collaboration Mode
For critical features and core business logic:
- Work alongside Claude Code in real time, providing detailed prompts with
  specific implementation instructions
- Monitor the process to ensure code quality and architectural alignment
  while delegating repetitive coding
- Use this hybrid model for anything touching the production code path

### Usage Patterns Observed at Anthropic
- Engineering teams use Claude in approximately 60% of their work
- Self-reported 50% productivity boost (2-3x increase year-over-year)
- Debugging and code understanding are the most common use cases
- Claude now handles around 20 consecutive actions autonomously before
  needing human input (up from ~10 six months ago)
- Engineers increasingly use Claude for complex tasks: new features (up from
  14% to 37%) and code design/planning (up from 1% to 10%)

---

## 7. Security Engineering Use Cases

The Security Engineering team at Anthropic uses Claude Code for three high-value workflows:

1. **Infrastructure debugging** — Copying stack traces and relevant logs into
   Claude Code for root cause analysis, reducing 10-15 minute manual code-scanning
   tasks to ~5 minutes

2. **Terraform review** — Pasting Terraform plans into Claude Code with the prompt
   "what's this going to do? Am I going to regret this?" to create tighter feedback
   loops for security approvals

3. **Documentation synthesis** — Ingesting multiple documentation sources to generate
   markdown runbooks and troubleshooting guides, used as compressed context for
   debugging real incidents

The security team uses custom slash commands for 50% of all interactions,
standardizing repetitive review workflows across the team.
