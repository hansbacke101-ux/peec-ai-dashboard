---
name: peec-competitor-movement-review
description: Analyze competitor movement in PEEC AI reports. Use when Hermes needs to know who gained or lost visibility, share of voice, sentiment, answer position, prompt inclusion, or citations, and how to respond.
---

# PEEC Competitor Movement Review

## Purpose

Use this skill to explain competitor changes that matter to the tracked brand.
Focus on displacement, topic ownership, citation gains, and answer-position
movement instead of broad competitor summaries.

## Workflow

1. Fetch current and previous period brand reports.
2. Rank all brands by visibility, share of voice, sentiment, and position.
3. Identify competitors with the largest positive and negative movement.
4. If MCP exposes prompt or citation data, locate the prompts, topics, tags,
   and URLs behind the movement.
5. Decide whether the tracked brand was displaced, unaffected, or gained from
   competitor weakness.
6. Recommend counter-actions tied to the exact metric and prompt/category.

## Numbers To Report

- Visibility value and delta.
- Share-of-voice value and percentage-point delta.
- Sentiment value and delta.
- Position value and delta, with lower position treated as better.
- Rank movement for each metric.
- Prompt/category wins and losses where available.
- Citation count, cited URL movement, and citation source concentration where
  available.

## Output Shape

Return:

- **Competitor leaderboard:** current ranks and week-over-week movement.
- **Biggest threats:** competitors gaining where the tracked brand wants to win.
- **Openings:** competitor declines the tracked brand can exploit.
- **Why it changed:** evidence from prompts, citations, pages, or external
  factors.
- **Response plan:** specific actions to regain or defend PEEC metrics.

## Rules

- Do not assume every competitor gain is harmful; check whether the tracked
  brand lost the same prompts or categories.
- Do not compare position like other metrics; lower position is better.
- Distinguish competitor growth from data coverage changes.
