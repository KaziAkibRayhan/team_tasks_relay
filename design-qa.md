# Design QA — task status menu

## Comparison target

- Source visual truth: `docs/screenshots/status-menu-before.png`
- Revised implementation: `docs/screenshots/status-menu-after.jpg`
- State: desktop task row, status menu open, **To do** selected
- Browser viewport: 1280 × 720 CSS px at device pixel ratio 1
- Source pixels: 332 × 115; implementation crop: 380 × 240 from a 1280 × 720 capture
- Density normalization: both artifacts were reviewed at their native 1× pixel size. The source is a tight issue crop, so geometry outside the menu was excluded from fidelity judgments.

## Full-view comparison

The revised menu stays anchored to the same compact status control without changing the task table’s hierarchy, row spacing, or surrounding status colors. The popup clears the neighboring row content and remains visually subordinate to the task title.

## Focused comparison

The supplied screenshot showed an OS-rendered charcoal popup with a bright blue selected row, which conflicted with the app’s light neutral and green palette. The revised popup uses an explicit white surface, dark green text, pale green highlighted and selected states, a restrained border and shadow, and a green checkmark. Labels and ordering remain unchanged.

## Findings and comparison history

1. **Initial P1 — inconsistent native popup palette**
   - Evidence: the opened menu used dark system chrome and a blue selection color inside an otherwise light green interface.
   - Fix: replaced the inline native status selector with the existing headless select foundation so the popup, hover, selected, focus, and open states use application tokens.
   - Post-fix evidence: `docs/screenshots/status-menu-after.jpg` shows the corrected light menu. Keyboard selection, outside close, and filtered-row focus recovery were also verified.

No actionable P0, P1, or P2 differences remain.

## Required fidelity surfaces

- Typography: existing task-control font size, weight, and labels are preserved.
- Spacing and layout: trigger footprint is unchanged; popup spacing and alignment are consistent with the surrounding controls.
- Colors and tokens: dark gray and system blue are removed in favor of Relay’s white, neutral, and green tokens.
- Image quality: no raster or generated assets are used by this control; the existing icon library supplies the chevron and checkmark.
- Copy and content: **To do**, **In progress**, and **Done** are unchanged.

## Implementation checklist

- [x] Replace OS-colored popup with an application-controlled menu.
- [x] Preserve accessible combobox and listbox semantics.
- [x] Verify selection, close behavior, keyboard focus recovery, and visual states.
- [x] Keep the trigger and popup options at least 44px tall at touch breakpoints.
- [x] Confirm no console errors and no surrounding layout regression.

final result: passed
