# Figma Design System Extraction

Source: `DO-_-Plan-Listing-Page-Documentation`

Figma file key: `Vnpt9f6suwKBGidjGQObSL`

Target node: `1:201`, page `🟢 Plans Listing Page Final Design 7.7.2025`

## Sections Found

| Section | Node |
| --- | --- |
| Desktop | `9102:25170` |
| Prototypes | `9102:25644` |
| Plan card variations | `10652:18250` |
| Extended Component | `9102:25682` |
| Mobile | `9102:25842` |
| Feedback addressed | `9102:26272` |

## Extracted Color Tokens

| Token | Hex | Figma usage |
| --- | --- | --- |
| `tw-navy-900` | `#000330` | Primary text, icons, plan content |
| `tw-navy-500` | `#26358B` | Brand blue / supporting accent |
| `tw-teal-400` | `#00C8B7` | Promo and savings accent |
| `tw-teal-50` | `#E6FCF4` | "All plans include" surface |
| `tw-red-600` | `#DB0000` | Active tab indicator and CTA |
| `tw-red-900` | `#880D1E` | Error text |
| `tw-red-50` | `#FFCDD2` | Error surface |
| `tw-gray-500` | `#666666` | Secondary text |
| `tw-gray-300` | `#C2C2C2` | Borders |
| `tw-gray-100` | `#F2F2F2` | Page background |

## Extracted Typography

Figma uses `Galano Grotesque` heavily, with `Open Sans` in nested imported/global components and a few `Inter` annotation frames.

Primary product UI text styles observed:

| Style | Size / Line height |
| --- | --- |
| Body small | `13px / 18px` |
| Body default | `16px / 24px` |
| Label / title | `18px / 28px` |
| Section heading | `24px / 32px` |
| Large heading | `30px / 38px` |
| Price display | `72px / 90px`, `96px / 88px` |

The codebase now prefers `Galano Grotesque` with `Inter` fallback through `--font-sans` and `--font-heading`.

## Component Coverage

Already represented in the shadcn registry:

| Figma component | Code component |
| --- | --- |
| `[VVO] Button` | `components/ui/button.tsx` |
| `[VVO] Plan Card Content` | `components/ui/plan-card.tsx` |
| `[VVO] Input Stepper` | `components/ui/line-counter.tsx` |
| `[VVO] Tabs` | `components/ui/tabs.tsx` |
| `[VVO] Badge` | `components/ui/badge.tsx` |
| All plans include | `components/ui/savings-bar.tsx` is currently the closest utility surface |
| Plan context switcher | `components/ui/segmented-control.tsx` |
| Phone/device selection | `components/ui/phone-option.tsx` |

## Follow-Up Extraction Targets

- Split "All plans include" into its own component instead of overloading `SavingsBar`.
- Add plan card landscape/mobile variants from `Plan card variations`.
- Add mobile sticky navigation/cart summary from the `Mobile` section.
- Add explicit Code Connect mappings once final React component names are stable.
