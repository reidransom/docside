---
name: Docifly
description: A restrained Basecoat Vega documentation system with bounded prose and persistent wayfinding.
colors:
  background: "var(--background)"
  foreground: "var(--foreground)"
  primary: "var(--primary)"
  primary-foreground: "var(--primary-foreground)"
  muted: "var(--muted)"
  muted-foreground: "var(--muted-foreground)"
  border: "var(--border)"
  ring: "var(--ring)"
typography:
  display:
    fontFamily: "Geist, Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.8125rem, calc(0.25rem + 5vw), 4rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist, Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.625rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Geist, Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  code:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    lineHeight: 1.75
rounded:
  control: "var(--radius-md)"
  card: "var(--radius-xl)"
spacing:
  half: "0.5rem"
  base: "1rem"
  panel: "1.5rem"
---

# Design System: Docifly

## Authority and intent

Docifly is a **Read-mode** documentation surface. The shared visual authority is the pinned, unmodified **Basecoat 1.1.0 default Vega** distribution, not the old Starlight skin. Vega supplies the reset, semantic Light/Dark tokens, component geometry, radii, control states, focus treatment, and font stacks. Docifly retains its folded-D identity artwork, documentation topology, prose hierarchy, and supported author APIs.

Readability and predictable wayfinding take priority over decoration. Do not recreate the former blue/pill/Urbanist styling through overrides. The intentional changes include neutral stock themes, system-fallback typography, Vega cards/alerts/badges/buttons, and the default filled/raised Vega tab selection rather than an underline skin. Punk and Ice retain their own colors on these same components.

This record reflects actual local headless inspection of documentation, long guides, components, tabs, code, splash, not-found, Arabic RTL, enlarged text, search, and installed consumers at root and `/docs/`. The maintained browser gate covers pinned Chromium, Firefox, and WebKit on Linux; it does not certify accessibility, real Safari, physical devices, or visual/interaction parity with another documentation framework. Historical captures are not current visual baselines.

## Delivery and cascade

All layouts load `assets/vendor/basecoat/basecoat.cdn.min.css` before `assets/docifly.css`, with prefix-safe escaped asset URLs. The synchronous color-mode bootstrap runs before both. The vendor asset is local and immutable; `tools/styles/basecoat.py` imports/checks the pinned archive separately from the offline documentation Sass build.

Basecoat's layers are `properties`, `theme`, `base`, `components`, and `utilities`; Docifly adaptations follow in `docifly`. Vendor semantic `:root`/`.dark` values are unlayered. Custom palette rules are screen-only, more specific `html:root` rules; the unlayered light print baseline wins independently. No second reset, old token adapter, Basecoat JavaScript, compatibility pack, Tailwind runtime, or consumer frontend build is shipped.

## Color and themes

Use shared semantic pairs directly: `background`/`foreground`, `card`/`card-foreground`, `popover`/`popover-foreground`, `primary`/`primary-foreground`, `secondary`/`secondary-foreground`, `muted`/`muted-foreground`, `accent`/`accent-foreground`, and corresponding sidebar roles. Borders, inputs, and rings use their named roles. `accent` is an interaction surface, not a universal colored-text token.

Stock Light and Dark use vendor defaults without palette JSON. Punk and Ice, and registered custom choices, define exactly the 26 six-digit semantic colors documented in `docs/color-modes.md`. Dark schemes also set `html.dark`; Auto resolves only to stock Light/Dark and follows live system changes. One Docifly controller owns selection, cached restoration, fresh registry/palette authority, stale-response protection, and optional preference storage. Returning to stock clears custom overrides.

Only documentation-specific properties use `--docifly-*`: reading geometry/type, syntax/markers, semantic statuses, and the optional hero-depth effect. Notes, tips, cautions, dangers, and success labels retain distinct semantic color pairs. Their colors extend Vega, not replace its geometry. Check foregrounds against actual composited surfaces, including both code-marker stripe phases. Syntax text retains a 4.5:1 target on the shipped examples; arbitrary author palettes require their own contrast review.

The purple folded-D logo is identity artwork, not the stock interaction accent. Theme changes do not recolor content images.

## Typography

Use Basecoat's Geist/Geist Sans and Geist Mono preferences with installed system fallbacks. No fonts are bundled or downloaded. Runtime vendor stacks, including emoji fallbacks, are authoritative; the compact frontmatter records only the principal families.

Article headings retain the documentation-specific scale and weight 700. H1 is 2.1875rem in the compact shell and 2.625rem in the wide shell; H2 is 1.8125rem → 2.1875rem, H3 1.5rem → 1.8125rem, and H4 1.25rem → 1.5rem. Prose uses a 1.75 reading line height, with code at 0.875rem and smaller code labels at 0.8125rem. Hero titles remain fluid and bounded. Component titles retain Vega typography rather than inheriting article-heading rules.

Each `.sl-markdown-content` is a prose scope that stops at components, tabs, and code frames. Explicit nested Markdown starts a fresh scope. Existing `sl-*` names for actual prose/icon/steps responsibilities are not a compatibility token interface or an alternate component skin.

## Layout and responsive behavior

Preserve the fixed header, left navigation, bounded 45rem reading column, and optional right TOC rail. The header is 3.5rem in compact layout and 4rem in the wide shell; the sidebar is 18.75rem. Logical inline properties mirror the shell for RTL. Splash pages omit sidebars, retain shared controls, and allow an 80rem hero width. Hero actions wrap with readable labels.

Navigation changes at 50rem (800 CSS pixels with a 16px browser font); the TOC changes at 72rem (1152px). Enlarged root text can activate the compact-shell guards even at a desktop viewport. The one set of global controls moves between header and Menu without cloning. Preserve focus during relocation and clear overlay/inert state at transitions.

Wide source, tables, file trees, and long tab labels scroll locally rather than widening the page. Inline prose literals wrap. Inspect 320/390px widths, both sides of each breakpoint, 200% text, long labels, and native localized RTL content.

## Components and interaction

- **Actions:** public primary/secondary/minimal variants map to Vega default/outline/ghost buttons. Keep validated destinations, icon position, escaping, focus, and new-window safety. Documentation adaptations provide wrapping and touch geometry, not a pill skin.
- **Cards:** Vega header/content structure with scoped nested Markdown. Ordinary cards are not clickable; link cards expose one semantic whole-card link without nested interactive controls.
- **Badges and callouts:** Vega geometry with narrow status/size extensions. Static callouts are labeled asides, not unsolicited live alerts.
- **Tabs:** one Docifly controller enhances source sections into Vega's direct-child tablist/panels. Keep deterministic IDs, RTL arrows, Home/End, exact-label sync, optional persistence, local overflow, focus, and scroll stability. Nested groups remain unsupported. All panels remain readable without JavaScript and in print.
- **Navigation:** native disclosures and popover with recursive links, current-page semantics, optional storage, keyboard focus trapping, and Escape restoration. Language/version pickers remain native disclosures with ordinary links.
- **Search:** native modal dialog and Vega controls. Real MiniSearch 7.2.0 loads from the documented SRI-pinned production CDN, unlike locally shipped Basecoat. Keep disabled-library, corpus-error/Retry, empty, and no-result states distinct. Results and their padding have one destination; Escape returns focus to the opener.
- **Code:** server-highlighted source and frame metadata are authoritative. Vega copy buttons report actual browser copy success/denial, preferring the Clipboard API with a legacy copy-command fallback when the API is absent. Copy excludes captions, marker decoration, and gutters and retains the source newline. Normal selection remains available without the API.

Basecoat's standalone utility subset is not all of Tailwind. Copied upstream demos may need missing utilities or interaction controllers; they are not automatically supported Docifly includes. Do not add a second controller to make a pasted demo work.

## Motion, fallback, and paper

Retain native/Vega state transitions rather than inventing page transitions or ambient motion. Opt-in folded-D hero depth has a finite entrance and bounded pointer response; touch, reduced motion, and no JavaScript keep it static. Page navigation remains ordinary document loads.

Without JavaScript, Light content, links, images, native disclosures, server TOC/code, and all tab panels remain readable. Search is disabled; theme selection, copy controls, active-section feedback, enhanced tabs, and focus management need their existing controllers. Denied storage must not break current-page operation.

Print uses an explicit light semantic/status/code baseline even if `html.dark` is set. Hide interactive/fixed chrome, expand tab panels and disclosure paint, wrap code/tables, retain frames and canonical URLs, and append HTTP(S) article destinations. Inspect saved paper/PDF, not only layout boxes. Return to the exact screen palette, selection, disclosure state, and preference without print-time writes.

## Change discipline

Prefer vendor semantics and existing public includes. Keep narrow documentation adaptations scoped to their purpose; do not hard-code the discarded appearance, introduce token aliases, duplicate controllers, or turn historical evidence into parity/certification claims. Rebuild shipped CSS after Sass changes, run relevant real-consumer gates, and inspect rendered states before updating this record.
