# Design QA

## Comparison target

- Source visual truth: `/Users/jonasdu/.codex/generated_images/019fa22c-e25f-7803-a215-ee46334d2028/exec-e236b942-fcba-419e-a5b9-4e232fa48db2.png`
- Implementation screenshot: `/private/tmp/football-header-implementation-dark-v5.png`
- Combined comparison: `/private/tmp/football-header-reference-vs-implementation-v5.png`
- Viewport: `390 × 844` CSS px
- State: dark theme, real-time tab active, menus closed
- Source pixels: `853 × 1844`
- Implementation pixels: `390 × 844`
- Density normalization: source resized to `390 × 844`; implementation captured at `390 × 844`, device scale factor 1

## Full-view comparison evidence

The normalized source and implementation were placed side by side in the combined comparison image. The header baseline, top region height, divider position, two-column feed start, masthead-to-date balance, and dark/blue/ivory palette were compared in one view.

## Focused region comparison evidence

The header occupies the top 171 px in both normalized views and remains legible in the combined comparison, so an additional crop was not necessary. The comparison confirms:

- the masthead begins at the same left margin and uses comparable visual width;
- the two-line editorial strapline sits above the blue date on the right;
- the blue day number is the dominant right-side element;
- the full dynamic date and weekday sit directly below the number in the foreground color;
- menu and search are intentionally located on the tab row, per the user's explicit implementation requirement.

## Required fidelity surfaces

- Fonts and typography: the implementation uses the project's Chinese serif stack for the masthead, date, and headlines. The exact generated-image font is unavailable, but scale, weight, tracking, and hierarchy match closely. Residual glyph-shape variance is P3.
- Spacing and layout rhythm: header height, divider position, masthead/date alignment, and feed start now match the normalized source. The implementation keeps a slightly wider center tab gap to accommodate the required menu and search controls.
- Colors and visual tokens: graphite background, warm ivory foreground, muted gray, and restrained ultramarine accent match the source direction in both hierarchy and contrast.
- Image quality and asset fidelity: runtime news imagery intentionally differs from the fictional concept imagery because the production feed supplies live images. Images remain sharp, use the same two-column editorial crop strategy, and are not replaced with placeholders or code-drawn assets.
- Copy and content: the static concept date was replaced by the real dynamic date in the same source format (`07月27日　星期一`). The editorial strapline matches the selected concept. The removed `FOOTBALL JOURNAL` line eliminates the unintended vertical gap called out by the user.

## Comparison history

### Iteration 1

- [P1] Masthead and English subtitle formed two disconnected blocks with excessive vertical space.
- [P1] Date was too small, too technical, and visually secondary.
- [P2] Search and menu crowded the date region.
- Fixes: removed the English subtitle, restored the source strapline, enlarged the blue date, moved utilities to the tab row, and rebalanced the header grid.

### Iteration 2

- [P1] The live-edition hint row pushed the first news cards materially lower than the source.
- [P2] The date column sat too high and the blue number was too wide.
- Fixes: removed the extra hint row, shifted the date column down, reduced the date width, and increased the dynamic date label size.

### Iteration 3

- [P1] The right-side strapline was right-aligned instead of matching the source's left alignment.
- [P1] The date label incorrectly included the year and did not match the source's `月日 + 星期` format.
- [P2] The strapline, blue day number, and date label did not preserve the source's vertical spacing.
- Fixes: left-aligned the strapline, restored `07月27日　星期一`, removed the year, added explicit vertical gaps, and narrowed the right column so the strapline and blue day align with the source.
- Post-fix evidence: `/private/tmp/football-header-reference-vs-implementation-v5.png`

## Interaction and runtime checks

- Real-time and hot tabs switch and update `aria-current`.
- Search opens, exposes the expected input, and closes normally.
- Menu opens and exposes the current theme control.
- Browser console contains an existing development-only `/sw.js` 404 registration error; no new header or interaction errors were observed.
- Automated tests: 73 passed.
- Production build: passed.
- Lint: passed with four pre-existing Fast Refresh warnings.

## Follow-up polish

- [P3] A licensed or bundled display serif closer to the generated concept could further reduce glyph-shape differences.
- [P3] Live news imagery cannot match the fictional concept assets exactly; this is expected product content variance.

final result: passed
