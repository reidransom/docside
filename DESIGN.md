---
name: Docifly
description: A clear, calm, technical documentation system with expressive headings and restrained controls.
colors:
  reference-blue-light: "hsl(234, 90%, 60%)"
  reference-blue-dark: "hsl(224, 100%, 60%)"
  reference-blue-dark-text: "hsl(224, 100%, 85%)"
  reference-blue-light-deep: "hsl(234, 80%, 30%)"
  reference-blue-light-tint: "hsl(234, 88%, 90%)"
  reference-blue-dark-shade: "hsl(224, 54%, 20%)"
  paper: "hsl(0, 0%, 100%)"
  paper-nav: "hsl(224, 19%, 97%)"
  cool-gray-1: "hsl(224, 20%, 94%)"
  cool-gray-2: "hsl(224, 6%, 77%)"
  cool-gray-3: "hsl(224, 6%, 56%)"
  cool-gray-4: "hsl(224, 7%, 36%)"
  cool-gray-5: "hsl(224, 10%, 23%)"
  cool-gray-6: "hsl(224, 14%, 16%)"
  cool-ink: "hsl(224, 10%, 10%)"
  code-light-bg: "#f6f7f9"
  code-light-text: "#403f53"
  code-dark-bg: "#23262f"
  code-dark-text: "#d6deeb"
typography:
  display:
    fontFamily: "Urbanist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans', Arial, sans-serif"
    fontSize: "clamp(1.8125rem, calc(0.25rem + 5vw), 4rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Urbanist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans', Arial, sans-serif"
    fontSize: "2.625rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Urbanist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans', Arial, sans-serif"
    fontSize: "2.1875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans', Arial, sans-serif"
    fontSize: "0.875rem"
    lineHeight: 1.4
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
    fontSize: "0.875rem"
    lineHeight: 1.75
rounded:
  code: "1px"
  compact: "0.25rem"
  field: "0.5rem"
  action: "999rem"
spacing:
  quarter: "0.25rem"
  half: "0.5rem"
  three-quarter: "0.75rem"
  base: "1rem"
  panel: "1.5rem"
components:
  button-primary-light:
    backgroundColor: "{colors.reference-blue-light}"
    textColor: "{colors.paper}"
    rounded: "{rounded.action}"
    padding: "0.9375rem 1.25rem"
  button-primary-dark:
    backgroundColor: "{colors.reference-blue-dark-text}"
    textColor: "{colors.cool-ink}"
    rounded: "{rounded.action}"
    padding: "0.9375rem 1.25rem"
  button-secondary-light:
    textColor: "{colors.cool-ink}"
    rounded: "{rounded.action}"
    padding: "0.9375rem 1.25rem"
  button-minimal-light:
    textColor: "{colors.cool-ink}"
    rounded: "{rounded.action}"
    padding: "0.9375rem 0"
  search-input-light:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.cool-ink}"
    rounded: "{rounded.field}"
    padding: "0.75rem 1rem"
---

# Design System: Docifly

## Overview

**Creative North Star: "The Clear Reference Desk"**

A clear, calm, technical system that puts documentation ahead of interface decoration. Strong Urbanist headings establish signposts; system-font prose and compact supporting controls keep sustained reading familiar. The purple folded-D artwork carries identity without replacing the blue interaction palette.

Components are precise and restrained. The workspace is flat, while selected utilities are lifted: borders and cool neutral layers organize persistent regions; small shadows distinguish link cards and larger shadows separate overlays. Light and dark are complete semantic themes, not simple color inversion.

**Key Characteristics:**
- Heavy geometric headings with familiar system-font prose.
- Blue interaction accents and cool neutral surfaces in both themes.
- Persistent desktop wayfinding that collapses for smaller screens.
- Flat content regions, restrained borders, and selectively lifted utilities.
- Existing folded-D identity artwork, not a generalized gradient treatment.

This record describes the incumbent implementation, not a redesign or a parity certification. Sources: `_sass/`, shipped `assets/docifly.css`, and the served documentation overview and getting-started page inspected on desktop and mobile. Frontmatter typography stacks omit trailing emoji fallbacks for portability; runtime stacks in `_sass/_props.scss` remain authoritative for those fallbacks.

## Colors

Reference Blue supplies interaction emphasis; Paper and Cool Ink anchor theme-specific neutral layers. Fold Purple describes the existing identity artwork, not a newly extracted flat UI token.

### Primary

- **Reference Blue:** light-theme links, action fills, and emphasis use `reference-blue-light`. Dark-theme interaction text and fills use `reference-blue-dark-text`; the saturated `reference-blue-dark` is a separate primitive, not the default dark link color.
- **Reference Blue tint and shade:** low/high accent variants support badges, selection, and inverted text. Resolve semantic tokens for the active theme rather than hard-coding one variant.

### Secondary

Semantic callout and badge families are blue for notes, purple for tips, orange for cautions, red for dangers, and green for success badges. Their low/base/high values are implemented in `_sass/_props.scss`, with badge mappings in `_sass/_components.scss`. They are contextual signals, not interchangeable decorative accents. These component-specific families are intentionally not expanded into a second palette here.

### Neutral

- **Paper:** light page and sidebar background; **Paper Nav:** slightly tinted light header.
- **Cool Ink:** dark page background and light primary text.
- **Cool Gray:** dark header/sidebar, body text, borders, inline-code surfaces, and muted labels. The numbered primitive ramp is ordered light-to-dark; runtime gray names reverse roles in light mode.
- **Code surfaces:** dedicated light/dark backgrounds and text colors, with syntax colors maintained in `_sass/_props.scss`.

**The Semantic Theme Rule.** Use the active theme's semantic CSS properties for text, backgrounds, borders, and accents; token names such as “white” and “black” describe roles that change with the theme.

## Typography

**Display and heading font:** Urbanist, locally shipped at weight 800, with system fallbacks. **Body and interface font:** the platform system stack. **Code and badges:** the system monospace stack.

The geometric, tightly tracked headings provide character without making paragraphs depend on a custom font. The hierarchy is an explicit stepped scale, not one universal modular ratio.

- **Display:** fluid hero title, using the frontmatter display role.
- **Headline:** document h1 is (2.1875rem) below the main desktop breakpoint and uses the headline role above it.
- **Title:** document h2 is (1.8125rem) below that breakpoint and uses the title role above it.
- **Lower headings:** h3 (1.5rem → 1.8125rem), h4 (1.25rem → 1.5rem), and h5 (1.125rem). These remain weight 800 with the heading line height and tracking.
- **Body:** use the body role for prose; document content has a width cap, not a prescribed character count.
- **Labels:** desktop nested navigation uses the label size; top-level labels use (1rem, weight 600). Mobile top-level navigation is (1.125rem).
- **Code:** block code uses the code role; inline code and smaller code labels use (0.8125rem).

**The Heading/Prose Rule.** Preserve Urbanist for headings and the site title; use the system stack for body text and ordinary controls. Card titles have their own weight-600 treatment and should not be mistaken for document headings.

## Layout

Documentation uses a fixed header, left navigation, bounded reading column, and right table of contents when space permits. The header is (3.5rem) on smaller screens and (4rem) at the main desktop breakpoint. The sidebar width is (18.75rem); ordinary content is capped at (45rem). Horizontal content padding increases from (1rem) to (1.5rem) at the wide breakpoint. Content panels use (1.5rem) vertical padding, with a larger bottom reading buffer.

At (50rem), navigation becomes a persistent sidebar, the mobile menu control disappears, heading sizes increase, and hero layouts switch from a centered single column to a (7:4) text/image split. The heading-token media query uses (50em); other shell rules use (50rem). At (72rem), the table of contents becomes a right-hand rail and its mobile bar no longer reserves vertical space. Below that threshold, heading navigation uses a mobile bar. Use logical inline directions so the structure can mirror for RTL.

Splash heroes have a separate width cap of (80rem); article content is centered at the ordinary (45rem) cap, as is the page title when no hero is present. Hero copy is bounded to (50ch); identity artwork scales independently and is not a background decoration. Actions wrap instead of squeezing labels.

Prose blocks typically separate by the base spacing token; headings following non-headings have (1.5em) top separation. Code and tab strips preserve horizontal scrolling rather than clipping useful content. Component padding is contextual; the frontmatter spacing entries record recurring distances, not an enforced universal spacing scale.

## Elevation & Depth

**Flat workspace, lifted utilities.** Persistent reading regions are separated by tonal backgrounds and thin borders. Link cards use the small shadow; the mobile menu button uses the medium shadow; the search dialog and focused skip link use the large shadow. Exact theme-specific shadow values are recorded in the sidecar. Search overlays use a tinted backdrop with (0.25rem) blur.

**The Utility Lift Rule.** Keep reading surfaces flat. Reuse the implemented small, medium, and large shadow roles for the utilities that already need separation rather than adding ambient shadows to every container.

Motion has one focal moment per surface. Documentation pages progressively enhance ordinary navigation with a (260ms) vertical reading-pane handoff, stationary header and navigation shell, and a moving current-page link on desktop. Only the documentation layout opts into cross-document View Transitions; unsupported browsers and reduced-motion preferences retain immediate navigation. Splash artwork can explicitly opt into `hero.image.depth: true`: a finite (900ms) entrance, bounded pointer-driven perspective, and an offset soft shadow derived from the theme's neutral colors. Hero copy stays still; touch, reduced motion, and JavaScript-disabled rendering retain the original static artwork. Pointer tracking stops on exit or when offscreen, with no idle animation loop. The version-picker caret retains its (0.2s ease) transition; there is no global animation scale.

## Shapes

Actions are fully rounded pills. Navigation links and badges use compact corners; search fields, desktop search dialogs, and link cards use field-sized corners. Ordinary content cards are square and bordered; code blocks are nearly square. The mobile menu button is circular. Do not normalize these distinct shapes into one global radius.

Borders are generally (1px). Callouts use a stronger inline-start stripe (0.25rem). Tabs use a (2px) baseline and selected underline. The folded-D artwork retains its existing geometry and gradients as an asset.

## Components

### Buttons

Precise and restrained. Primary link actions use the semantic text-accent fill with the theme's page-background color for their label. Secondary actions are outlined with primary text; minimal actions remove horizontal padding and visible fill. Desktop dimensions are captured in frontmatter; below (50rem), link actions use (0.4375rem 1.125rem) padding and (0.875rem) type.

Primary hover retains its color assignment; do not invent a darker fill or lift. Link-action keyboard focus uses the browser outline with (0.25rem) offset. The general focus-visible treatment elsewhere is an accent outline (2px) with (2px) offset.

### Cards / Containers

Ordinary cards are square, bordered, page-colored containers with fluid padding (1rem to 2.5rem). Link cards use rounded corners, (1rem) padding, and the small shadow. Preserve these two container types rather than treating all cards as clickable. Link-card hover uses the implemented raised neutral surface, stronger border, and primary-text icon.

### Inputs / Fields

Search is the canonical field: page-colored background, primary text, neutral border, field radius, and the padding recorded in frontmatter. Focus changes the input border to the accent, in addition to the shared focus outline. The header search trigger uses a (2.5rem) height and a keyboard-shortcut hint on desktop; on mobile it becomes an icon-only control. Disabled triggers use reduced opacity (0.65). No generic form error style is established.

The search dialog is full-screen on mobile. On desktop it is top-centered with a (40rem) width cap, rounded corners, and the large shadow. Results are individually surfaced containers with compact corners.

### Navigation

Recursive navigation groups use native disclosure controls and indentation lines. Current-page links use an accent fill, inverted text, and weight 600. Hover/focus raises the label to the theme's primary text color. Small-screen navigation is a full-height popover below the header; the circular toggle shows open/close state. Preserve current-page semantics and visible keyboard focus.

### Badges and Callouts

Badges are compact monospace labels with theme-specific semantic fills, a (1px) border, and compact corners. They are labels, not invented interactive chips. Callouts use semantic tinted surfaces and an inline-start stripe, with matching emphasized title/icon color.

### Tabs and Code

Tabs are a horizontally scrollable row of text controls: selection combines weight 600, primary text, and an accent underline. Code uses a dedicated neutral surface, monospace text, syntax colors, and horizontal overflow. Frames, line markers, copy controls, and feedback keep their existing documented variants; this record does not define new ones.

## Do's and Don'ts

### Do:
- **Do** resolve semantic color properties for the active light or dark theme.
- **Do** preserve the Urbanist heading/system-prose distinction.
- **Do** keep reading content bounded and preserve mobile navigation and horizontal code overflow.
- **Do** retain visible keyboard focus and current-page or selected-state semantics.
- **Do** use existing folded-D artwork for identity and semantic colors for contextual signals.

### Don't:
- **Don't** equate the purple logo artwork with the blue interaction accent.
- **Don't** give every content region a shadow or the same corner radius.
- **Don't** invent hover motion, form states, or additional palette roles absent from the implementation.
- **Don't** describe this extracted design record or historical screenshots as proof of complete Starlight parity.
