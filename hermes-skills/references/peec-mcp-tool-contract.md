# PEEC MCP Tool Contract

Live MCP authorization on 2026-04-26 exposed 37 tools: 16 read tools and 21
write tools.

## Read Tools

- `list_projects`: active projects; call first to resolve `project_id`.
- `list_brands`: own brand and competitors; use `is_own` to find the tracked
  brand.
- `list_topics`: topic folders for prompts.
- `list_tags`: cross-cutting prompt labels.
- `list_models`: AI engines tracked by the project.
- `list_prompts`: tracked prompts with topic, tag, and volume metadata.
- `list_chats`: individual AI responses by prompt, model, and date.
- `get_chat`: full chat content, mentioned brands, sources, queries, and
  products.
- `list_search_queries`: sub-queries issued by AI engines while answering.
- `list_shopping_queries`: product/shopping sub-queries and returned products.
- `get_brand_report`: visibility, mention count, share of voice, sentiment,
  position, raw counts, and dimensions such as prompt, model, tag, topic, date,
  country, and chat.
- `get_domain_report`: source-domain visibility and citation performance.
- `get_url_report`: source-URL visibility and citation performance.
- `get_url_content`: scraped markdown for a PEEC-indexed source URL.
- `get_actions`: opportunity-scored action recommendations. Always call
  `scope=overview` first, then drill into `owned`, `editorial`, `reference`, or
  `ugc`.
- `get_project_profile`: project brand profile used for prompt suggestions.

## Write Tools

These mutate PEEC project data and require explicit user confirmation:

- Brand management: `create_brand`, `create_brands`, `update_brand`,
  `delete_brand`, `delete_brands`.
- Prompt management: `create_prompt`, `create_prompts`, `update_prompt`,
  `delete_prompt`, `delete_prompts`.
- Tag management: `create_tag`, `create_tags`, `update_tag`, `delete_tag`,
  `delete_tags`.
- Topic management: `create_topic`, `create_topics`, `update_topic`,
  `delete_topic`, `delete_topics`.
- Project profile: `set_project_profile`. First call `get_project_profile`,
  merge changes, and send the complete profile.

## Report Metrics

`get_brand_report` returns:

- `visibility`: 0-1 ratio; fraction of AI responses that mention the brand.
- `mention_count`: number of brand mentions.
- `share_of_voice`: 0-1 ratio; brand fraction of total tracked-brand mentions.
- `sentiment`: 0-100 scale; most brands are typically in the 65-85 range.
- `position`: average ranking when mentioned; lower is better, `1` means first.
- Raw fields: `visibility_count`, `visibility_total`, `sentiment_sum`,
  `sentiment_count`, `position_sum`, `position_count`.

Useful dimensions:

- `prompt_id`
- `model_id`
- `model_channel_id`
- `tag_id`
- `topic_id`
- `date`
- `country_code`
- `chat_id`

## Actions Workflow

`get_actions` is the PEEC-native opportunity/task source.

1. Call `get_actions` with `project_id` and `scope=overview`.
2. Sort overview rows by `opportunity_score`.
3. Drill into high-opportunity rows:
   - `action_group_type=OWNED` plus `url_classification=X` ->
     `scope=owned`, `url_classification=X`
   - `action_group_type=EDITORIAL` plus `url_classification=X` ->
     `scope=editorial`, `url_classification=X`
   - `action_group_type=REFERENCE` plus `domain=Y` ->
     `scope=reference`, `domain=Y`
   - `action_group_type=UGC` plus `domain=Y` -> `scope=ugc`, `domain=Y`
4. Treat drill-down `text` rows as the source of truth for recommendations.
5. Label `relative_opportunity_score` as Low, Medium, or High, but rank by
   continuous `opportunity_score`.
