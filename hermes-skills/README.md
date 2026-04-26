# Hermes Skills

Repo-local Hermes skills for acting on PEEC AI dashboard and MCP data.

See [references/peec-mcp-tool-contract.md](references/peec-mcp-tool-contract.md)
for the live PEEC MCP tool inventory and action workflow.

## Available Skills

- `$seo-geo-strategy`: broad SEO/GEO strategy for search and AI answer
  visibility.
- `$peec-weekly-assessment`: weekly PEEC scorecard with metric movement,
  likely drivers, and next actions.
- `$peec-action-prioritization`: ranked action backlog from PEEC findings.
- `$peec-competitor-movement-review`: competitor movement, displacement, and
  response planning.
- `$peec-content-opportunity-brief`: content/page briefs from prompt, citation,
  and metric gaps.
- `$peec-data-quality-check`: readiness audit for MCP, dashboard, and report
  data before acting.

## Data Contract

The dashboard baseline metrics are:

- `visibility`: how often a brand is surfaced in AI answers; higher is better.
- `shareOfVoice`: relative presence against the market; higher is better.
- `sentiment`: tone used when AI systems describe the brand; higher is better
  unless a source defines another scale.
- `position`: average answer placement; lower is better.

Hermes should prefer PEEC MCP read tools for granular data such as prompts,
citations, cited URLs, tags, competitors, actions, and project profile data.
When MCP is unavailable, use the dashboard's brand report API as the minimum
baseline and call out missing evidence.
