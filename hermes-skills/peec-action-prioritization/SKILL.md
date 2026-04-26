---
name: peec-action-prioritization
description: Prioritize PEEC AI visibility actions from dashboard and MCP data. Use when Hermes needs to decide what to do next from weak metrics, competitor gaps, prompt opportunities, citations, or open PEEC action items.
---

# PEEC Action Prioritization

## Purpose

Use this skill to convert PEEC findings into a ranked action backlog. Every
action must be tied to a measurable PEEC number and a concrete prompt, topic,
page, citation source, or competitor gap.

Load [../references/peec-mcp-tool-contract.md](../references/peec-mcp-tool-contract.md)
for the current MCP action workflow.

## Inputs

Gather as much of this as available:

- Current brand report: visibility, share of voice, sentiment, and position.
- Prompt-level or tag-level performance from MCP read tools.
- Citation and cited URL data.
- Competitor inclusion and rank movement.
- PEEC-native opportunities from `get_actions`; call `scope=overview` first,
  then drill into `owned`, `editorial`, `reference`, or `ugc`.
- Existing MCP tasks, action items, or notes when exposed outside `get_actions`.
- Recent shipped work, content changes, PR, technical fixes, or campaigns.

## Prioritization Score

Score each action from 1-5 on:

- **Impact:** expected effect on visibility, share of voice, sentiment,
  position, citations, or prompt inclusion.
- **Evidence:** how directly PEEC data identifies the opportunity.
- **Effort:** lower effort scores higher.
- **Confidence:** likelihood the action can move the intended leading
  indicator.
- **Strategic fit:** alignment with target market, category, ICP, or campaign.

Prefer actions with strong evidence and a verifiable leading indicator over
large vague campaigns.

When `get_actions` returns recommendations, treat drill-down `text` rows as the
source of truth. Do not invent targets that are not in the action text or
underlying PEEC reports.

## Output Shape

Return:

- **Priority backlog:** ranked actions with score, metric target, evidence,
  effort, and confidence.
- **This week:** 3-5 actions Hermes should act on now.
- **Later:** useful but lower-confidence or higher-effort actions.
- **Do not do:** actions that are unsupported, low value, or risky.
- **Verification plan:** what to check in the next PEEC report.

## Rules

- Do not recommend generic SEO work unless PEEC data points to it.
- Do not optimize only for visibility if share of voice, sentiment, position, or
  citations show a larger risk.
- Treat missing data as an action when it blocks confident prioritization.
- Keep each action small enough for a single owner or agent to execute.
