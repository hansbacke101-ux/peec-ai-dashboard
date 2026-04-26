---
name: peec-data-quality-check
description: Audit whether PEEC dashboard, MCP, and report data are complete enough for Hermes to act. Use when reports look empty, stale, inconsistent, missing action evidence, or too thin for confident weekly assessment.
---

# PEEC Data Quality Check

## Purpose

Use this skill before making strategic claims when PEEC data appears missing,
stale, partial, or inconsistent. The output should tell Hermes whether it can
act now or must first fix data access and instrumentation.

Load [../references/peec-mcp-tool-contract.md](../references/peec-mcp-tool-contract.md)
for the expected PEEC MCP read and write tools.

## Checks

- MCP authentication status and read-tool availability.
- Presence of the expected read tools: `list_projects`, `list_brands`,
  `list_prompts`, `list_topics`, `list_tags`, `list_models`, `list_chats`,
  `get_chat`, `get_brand_report`, `get_domain_report`, `get_url_report`,
  `get_url_content`, `get_actions`, and `get_project_profile`.
- Presence of write tools when Hermes is expected to mutate PEEC data:
  brand, prompt, tag, topic, and project-profile write tools.
- Selected project and own-brand detection.
- Date range validity and equal-period comparison.
- Brand report row count and missing values for visibility, share of voice,
  sentiment, and position.
- Prompt, tag, citation, cited URL, and competitor data availability when MCP
  exposes those resources.
- `get_actions` overview and drill-down availability for PEEC-native
  recommendations.
- Action/task/activity data availability for attribution when separate from
  `get_actions`.
- Freshness of the latest report and whether data changed since the previous
  run.
- Dashboard/API errors, empty responses, or schema shape changes.

## Output Shape

Return:

- **Ready state:** ready, partially ready, or blocked.
- **Findings:** exact missing or suspicious data.
- **Impact:** which assessments or actions are unsafe because of the gap.
- **Fixes:** concrete next steps such as authorizing MCP, exporting action logs,
  selecting a project, adjusting date ranges, or adding missing report fields.
- **Minimum viable assessment:** what can still be reported with confidence.

## Rules

- Do not treat missing metric values as zero.
- Do not produce a weekly assessment if current and previous periods cannot be
  compared fairly; produce a data-quality report instead.
- Do not expose secrets or token values while reporting configuration problems.
