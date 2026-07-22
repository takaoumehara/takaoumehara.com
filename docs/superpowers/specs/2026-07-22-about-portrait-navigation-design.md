# About portrait and portfolio navigation

## Goal

Add Takao Umehara's supplied portrait to the About page while keeping the portfolio's navigation focused and easy to scan.

## Decisions

- Keep `work.html` as the current Product Design URL. It already has many internal and case-study references; its visible label remains `Product Design`.
- Do not add an all-projects page or search yet. The homepage's selected work and four category pages are sufficient at the present portfolio size.
- Add the supplied portrait as an editorial companion to the About hero: text on the left, portrait on the right at desktop widths; portrait follows the text in a single column on mobile.
- Copy the supplied image to `assets/about/TakaoUmehara_passport.png` and use an `img` element with descriptive alt text. Crop with `object-fit: cover` in a restrained 4:5 frame, keeping the face centered.
- Retain the warm neutral palette, serif display headline, responsive navigation, and reduced-motion behavior already present on `about.html`.

## Verification

- Add a static test that confirms the portrait asset and semantic image markup exist.
- Run the focused About test and the existing portfolio test suite when unrelated in-progress work is not affecting it.
