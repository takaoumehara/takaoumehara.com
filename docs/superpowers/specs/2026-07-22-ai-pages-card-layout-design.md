# AI pages card layout

## Goal

Make `ai-products.html` and `ai-tools.html` scannable portfolio indexes that use the same thumbnail-led card language as `work.html`, while preserving the current bilingual content and existing destinations.

## Design

- Use a shared `.work-grid` / `.work-card` pattern: three columns on desktop, two on medium screens, one on small screens.
- Each card has a 260px thumbnail, category pills, title, short bilingual description, and a compact metadata footer.
- Preserve the current page header, language switch, mobile navigation, footer, and existing links.
- AI product cards use restrained CSS artwork/available project imagery to give every item a distinct thumbnail without inventing unsupported case-study claims.
- AI tool cards retain their three existing GitHub destinations and present the current tool summaries as compact portfolio cards.
- Keep the current visual tone: warm off-white page, editorial serif headings, thin rules, restrained motion, and focus-visible states.
- Use `assets/konosaki/KONOSAKI_WEWORK-VERTICAL.svg` for the Konosaki thumbnail and update its `data-href` to `https://konosaki-co.vercel.app/`.

## Implementation boundaries

- Introduce a small shared stylesheet and behavior script for the new card index treatment.
- Keep legacy content in place where practical so existing anchors and content tests remain stable, but hide the old presentation-only deck from the rendered AI Tools page.
- Do not change unrelated project pages or the existing uncommitted Verizon work.

## Verification

- Run the existing Node test suite.
- Assert the new grid/card counts, Konosaki image path, and new Konosaki URL in the HTML.
- Check that the shared CSS includes responsive breakpoints and reduced-motion handling.
