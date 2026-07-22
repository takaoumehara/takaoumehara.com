# AI Tools & Infrastructure — Design Specification

Date: 2026-07-20  
Status: Approved

## Goal

Make Takao's applied AI capability understandable within seconds to hiring managers, design leaders, clients, and non-technical visitors. Present `cross-model-handoff` and `snap-pair-core` as evidence that he can identify AI-era workflow problems, design systems around them, and ship working open-source infrastructure.

## Positioning

Section and page title: **AI Tools & Infrastructure**  
Short navigation label: **AI Tools**  
Supporting statement:

- EN: “I design and build practical tools, skills, and systems for people working with AI agents.”
- JP: “AIエージェントと働く人のための、ツール・スキル・基盤を設計し、実装しています。”

This is broader and more accurate than “Agent Design.” `cross-model-handoff` is an agent workflow and skill system; `snap-pair-core` is real-time product infrastructure that includes an agent-readable implementation skill.

## Information Architecture

1. Add a homepage section between `Selected Work` and `AI Products`.
2. Add `AI Tools` to the primary navigation on all main pages.
3. Create `v3/ai-tools.html` as a dedicated portfolio page.
4. Remove `cross-model-handoff` from `v3/ai-products.html` to avoid duplicate classification and correct the displayed product count.
5. Keep both GitHub repositories as explicit external calls to action.

## Homepage Section

Use a restrained editorial layout rather than a generic equal-card grid.

- Section header: `AI Tools & Infrastructure`
- One-sentence bilingual positioning statement
- Two wide project rows with asymmetric hierarchy
- Each row shows: project name, plain-language outcome, classification, selected technologies, and `View project →`
- `cross-model-handoff`: “Carry AI coding work across tools without rebuilding context.”
- `snap-pair-core`: “Turn many phones into one live, shared experience—without an app install.”
- Section-level link: `Explore AI tools →`

The established warm-neutral palette, editorial typography, thin rules, and restrained 5-3C'02 Rich hover language remain unchanged.

## Dedicated Page

The page opens with the title and supporting statement, followed by two substantial project stories.

### cross-model-handoff

- Problem: switching AI coding tools or clearing context causes expensive re-explanation and lost running state.
- System: a lightweight `.handoff/` note convention, passphrases, `AGENTS.md`, three reusable skills, and Claude Code hooks.
- Evidence: works across Claude Code, Codex, Gemini CLI, Antigravity, Cursor, and other tools that read project instructions; five-language documentation; MIT licensed.
- Classification: `Agent workflow · Plugin · Skill system`
- CTA: GitHub repository.

### snap-pair-core

- Problem: building safe, temporary multi-device experiences repeatedly requires pairing, presence, shared state, capacity, and authorization infrastructure.
- System: React hook, Firebase Auth, callable Cloud Functions, Realtime Database rules, cleanup, tests, one-file Lite example, and an AI-agent skill for generating integrations.
- Evidence: QR or six-character pairing, rooms up to 300 participants, server-assisted membership, emulator and production paths, multilingual documentation, MIT licensed.
- Classification: `Realtime infrastructure · React · Firebase · Agent skill`
- CTA: GitHub repository.

Do not claim user adoption, production usage, performance, or business outcomes that the repositories do not document.

## Interaction and Responsive Behavior

- Preserve the current EN/JP toggle behavior and author bilingual copy for all new content.
- Use semantic links and articles, visible keyboard focus, descriptive external-link labels, and `rel="noopener"`.
- Adapt wide project rows into a single-column reading order below 768px.
- Respect `prefers-reduced-motion`; no essential information depends on hover or animation.
- Add the navigation item without breaking the existing mobile menu.

## Verification

- Confirm the new page and all new internal/external links resolve.
- Confirm `cross-model-handoff` appears only in the new classification.
- Confirm desktop and mobile layouts at representative widths.
- Confirm EN/JP switching includes every new string.
- Confirm keyboard focus and reduced-motion behavior.
- Confirm no existing page references are broken.

## Out of Scope

- Repository changes, new screenshots, fabricated usage metrics, analytics, deployment, and redesigning the existing visual system.
