---
name: peec-weekly-assessment
description: Produce a weekly PEEC AI performance assessment from project, brand, prompt, citation, and action data. Use when Hermes needs to explain what changed week over week, which numbers improved or declined, what likely caused the movement, and what actions should happen next.
---

# PEEC Weekly Assessment

## Purpose

Use this skill to turn PEEC dashboard and MCP data into a weekly operator brief.
The goal is not just to report numbers; it is to connect metric movement to
plausible actions, risks, and next steps.

## Data Sources

Prefer MCP read tools when available. Start by listing available PEEC read tools,
then call the narrowest tools needed for project, brand, prompt, citation,
competitor, and activity data. If MCP is unavailable, use the dashboard report
surface as the minimum baseline:

- `GET /api/peec/projects`
- `GET /api/peec/brands-report?projectId=...&startDate=...&endDate=...`

Compare the completed week against the immediately previous equal-length period
unless the user gives different dates. Keep exact date ranges in the output.

## Core Numbers

Always calculate these from the current period and prior period where data
exists:

- **Visibility:** how often each brand is surfaced in AI answers. Higher is
  better. Report absolute value, percentage-point delta, relative delta, rank,
  and rank movement.
- **Share of voice:** the brand's relative presence against competitors. Higher
  is better. Report absolute value, percentage-point delta, competitor spread,
  and whether gains came from the tracked brand rising or competitors falling.
- **Sentiment:** the tone AI systems use when describing the brand. Higher is
  better unless the source defines a different scale. Report absolute delta,
  direction, and the prompts/topics where tone changed most.
- **Position:** average answer placement. Lower is better. Report absolute
  position, delta, rank movement, and whether the brand entered or left the top
  3.
- **Market rank:** rank all returned brands for visibility, share of voice,
  sentiment, and position. Call out leaders, laggards, and rank changes.
- **Coverage:** count brands/prompts/rows with missing metric values. Treat data
  gaps as a finding, not as zero performance.

When MCP exposes more granular data, also include:

- **Prompt coverage:** prompt count, prompts where the brand appears, prompts
  gained, prompts lost, and strongest/weakest prompt clusters.
- **Citation count and cited URLs:** citations gained/lost, top cited pages,
  new pages cited, pages that disappeared, and citation concentration risk.
- **Competitor mentions:** which competitors gained or lost inclusion in the
  same prompts and whether they displaced the tracked brand.
- **Tag/category movement:** movement by product category, use case, geography,
  audience, funnel stage, or custom prompt tag.
- **Source/action log:** shipped content, page updates, schema/technical
  changes, PR/earned mentions, backlinks, profile updates, campaigns, and any
  MCP task/action-item status changes from the period.

## Attribution Rules

Be strict about causality. Do not say an action caused an improvement unless the
data directly supports it. Use these labels:

- **Likely contributed:** action timing, affected page/topic, and metric movement
  align.
- **Possible contributor:** timing aligns but page/topic or prompt evidence is
  partial.
- **Unclear:** movement exists but there is no supporting action or citation
  evidence.
- **External factor:** competitor movement, seasonality, model behavior, news,
  market events, or data coverage changes are more plausible than owned actions.

Check whether the improvement is real before explaining it:

- Compare like-for-like periods.
- Separate absolute percentage-point movement from relative percentage movement.
- Flag small-sample or missing-data movement.
- For position, remember that negative delta is improvement.
- Check whether average gains hide prompt/category losses.
- Compare against competitor movement, not just the tracked brand's own trend.

## Workflow

1. Identify the selected project, tracked own brand, competitors, and exact week.
2. Fetch current and previous period brand reports.
3. Fetch granular MCP data if available: prompts, citations, URLs, tags,
   competitor mentions, action items, tasks, and activity logs.
4. Normalize metrics and calculate deltas, relative deltas, ranks, rank
   movement, winners, losers, and missing-data counts.
5. Determine the strongest improvements and declines.
6. Map movements to actions shipped during or shortly before the period.
7. Classify attribution strength using the labels above.
8. Produce recommendations that Hermes can act on next week.

## Output Shape

Return:

- **Executive summary:** 3-5 bullets with the most important movement.
- **Scorecard:** visibility, share of voice, sentiment, position, rank, and
  coverage for own brand and main competitors.
- **What improved:** metric-by-metric wins with exact current value, previous
  value, delta, and affected prompt/category/page evidence.
- **What declined:** exact losses, risk level, and where to inspect first.
- **Likely drivers:** actions or external factors classified as likely,
  possible, unclear, or external.
- **Recommended actions:** 3-7 specific actions for the next week, each tied to
  a metric, prompt/category/page, owner/workstream, and expected leading
  indicator.
- **Data gaps:** missing MCP tools, missing rows, unavailable action logs, or
  weak evidence that limits confidence.

## Action Patterns

Recommend actions in this form:

`Action -> target metric -> target prompt/topic/page -> why this should move the number -> how to verify next week`

Examples:

- Refresh the cited comparison page -> share of voice -> "best [category]
  software" prompts -> competitors gained inclusion with fresher evidence ->
  verify citations and prompt inclusion next week.
- Add methodology and original data to the pricing guide -> visibility and
  citations -> evaluation-stage prompts -> AI answers need citeable evidence ->
  verify cited URL count and top-3 answer position.
- Fix entity consistency across profiles -> sentiment and inclusion -> branded
  and competitor-comparison prompts -> inconsistent descriptions may weaken
  confidence -> verify sentiment movement and fewer ambiguous mentions.

## Rules

- Do not invent numbers. If data is unavailable, state what is missing.
- Do not treat dashboard averages as the whole story when prompt or citation
  granularity is available.
- Do not report position improvement as a positive numerical delta; lower
  position is better.
- Do not promise that recommended actions will produce specific metric gains.
- Keep the assessment operational: every recommendation must name the number it
  is meant to improve.
