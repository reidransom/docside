---
title: Theme internals
permalink: /internals/
---

Docifly is a Git-installable Jigyll theme. Its implementation is a server-rendered shell, shipped CSS, and small browser enhancements. The documentation consumer supplies only configuration, Markdown, and content artwork; it does not copy the implementation into its own source.

## Installation and ownership

Jigyll resolves the selected theme from the consumer's `_theme/` directory. Theme layouts, includes, Sass, and assets participate in the normal build; consumer files with the same names take precedence. Theme configuration and data are not merged into the site.

That makes the ordinary installed site the useful manual exercise surface. A direct build from the theme development tree could hide an installation or override problem. [Developing Docifly](../development/) explains how to install and refresh this documentation's consumer without a custom harness.

## Layout and includes

| Source | Responsibility |
| --- | --- |
| `_layouts/default.html` | Documentation shell with navigation, heading TOC, optional hero, article, and shared controls |
| `_layouts/splash.html` | Wide shell without sidebars, with the same optional hero and shared controls |
| `_layouts/not-found.html` | Explicit consumer 404 presentation using the splash shell and recovery actions |
| `_includes/hero.html` | Escaped hero copy, validated consumer-hosted artwork, and ordered actions |
| `_includes/header.html` | Site-title link, search, and initially hidden color selector |
| `_includes/navigation.html` | Recursive ordered navigation, native group disclosures, current-page marking, and optional link badges |
| `_includes/toc.html` | H2/H3 heading links from `page.headings`, preserving engine IDs and omitting ID-less or empty labels |

The page type and hero are independent. A default page without `hero` gets one ordinary H1; either layout with `hero` gets one hero H1 instead. Splash and not-found pages retain the fixed header while omitting navigation, the mobile menu, and both sidebars. The not-found route remains consumer-owned because a theme cannot configure the host's missing-route behavior.

Public content includes live under `_includes/components/`. `icon.html` validates a frozen 130-name registry, fixed size/color vocabularies, and explicit decorative or labeled accessibility semantics; `tools/icons/icons.json` generates both its trusted private path branches and the complete documentation fixture. `link-button.html` is the single validated action-link renderer shared by public content, heroes, and not-found recovery actions. `badge.html` validates escaped text variants and sizes; a badge placed on the source line after a heading is styled beside it without entering the heading's ID or navigation label. `steps.html` decorates only a rendered outer ordered list, retaining its native `start` value and leaving nested lists or malformed input ordinary. `file-tree.html` recursively renders escaped structured data through a private include, bounds traversal at eight directory levels, and marks its illustrative labels out of search. `callout.html` validates one of four aside types, preserves captured Markdown, labels each aside from its visible escaped title, and falls back to the selected type's icon when a custom name is unknown.

Content buttons, badges, cards, and static callouts render Basecoat Vega structures, not a second component skin. Public author variant names remain unchanged; link buttons map secondary/minimal to Vega outline/ghost. Only status colors, badge sizes, long-label wrapping, and documentation layouts extend the shared components. Each `.sl-markdown-content` starts a CSS `@scope` that stops at component boundaries; explicit Markdown sections inside cards and callouts start a fresh scope, keeping lists and links readable without applying article typography to their chrome.

Text labels and titles are escaped. A navigation badge contributes to its link name unless an equivalent `aria_label` supplies that name and hides redundant visible text from assistive technology. Theme asset URLs and navigation links pass through `relative_url` and attribute escaping. Page URLs and navigation links must agree for the current-page marker to appear.

## Styles and shipped output

All three page layouts load the local, unmodified `assets/vendor/basecoat/basecoat.cdn.min.css` **before** `assets/docifly.css`, using escaped `relative_url` asset paths. The synchronous color-mode bootstrap precedes both. Basecoat supplies the only reset, shared semantic tokens, default Vega component rules, and font stacks; there is no second reset or compatibility token graph.

`_sass/docifly.scss` is the documentation stylesheet entry point. It loads documentation-only properties, theme extensions, navigation, TOC, Markdown, heading anchors, code, color modes, search, hero/page presentation, content components, and print, then defines shell geometry. Adaptations use the `docifly` layer after Basecoat's `properties`, `theme`, `base`, `components`, and `utilities` layers. Prose styles exclude component surfaces instead of overriding their typography and controls.

Consumers load the two shipped stylesheets without a frontend build. Maintainers changing Sass rebuild the documentation artifact with Python 3 and Dart Sass 1.79.0 or later available as `sass`:

```sh
python tools/styles/build.py
```

Run this from the theme repository root, not the documentation consumer. The builder compiles `_sass/docifly.scss` into `assets/docifly.css` without fetching or modifying Basecoat. Shell, prose, code, and component rules consume Basecoat semantics directly, including paired sidebar colors. `_sass/_props.scss` retains documentation layout/type values under `--docifly-*`; `_sass/_theme.scss` owns only documentation-specific status, syntax, code-marker, hero-depth, and print extensions. Stock Light/Dark remain vendor-owned. Punk, Ice, and additional custom themes use complete semantic JSON palettes; see [Color modes](../color-modes/) for the exact required schema. Publishing JSON changes needs no Sass compilation. Commit rebuilt CSS with Sass changes.

A standalone Dart Sass executable supplies the compiler without Node.js. Merely editing Markdown does not require compilation, and consumers loading the shipped CSS need neither Python nor Sass. `jigyll build` consumes the compiled asset; it does not run this maintainer build step.

The pinned Basecoat dependency is maintained separately from Sass. `assets/vendor/basecoat/` contains the unmodified `basecoat-css@1.1.0` standalone Vega stylesheet, the release's MIT license, and `manifest.json` with the original archive/distribution URLs, exact archive member names, byte sizes, and SHA-256 digests. The stylesheet also retains its upstream Tailwind CSS MIT notice verbatim; the manifest lists retained CSS notices. It contains no font files or external asset requests: its six image URLs are inline SVG data URLs, and its Geist/Geist Mono font stacks fall back to locally available system fonts.

To reimport the pinned release from an already acquired local npm archive, run these explicit maintainer operations from the repository root:

```sh
python tools/styles/basecoat.py import --archive /path/to/basecoat-css-1.1.0.tgz
python tools/styles/basecoat.py check
python -m unittest discover -s tools/styles -p 'test_basecoat.py'
```

Both operations are offline and use only Python's standard library. Import validates the package name, version, MIT declaration, and the exact required regular-file members before staging any replacement. It never extracts arbitrary archive paths, templates, scripts, or other stylesheets; failed validation or staging leaves the installed distribution untouched, and a failed publication rename restores the previous distribution. Check needs no archive: it rejects missing or altered installed CSS/license bytes and invalid pinned manifest metadata. The recorded digests provide local integrity/provenance, not an upstream signature. A version upgrade requires a separate reviewed change to the tool's pin, release/license inspection, manifest/digest review, and local rendering proof; do not edit the generated vendor bytes.

Importing does not edit layouts or compile Sass. `tools/styles/build.py` remains responsible only for documentation Sass and never refreshes dependencies; theme consumers need no new package manager or frontend toolchain. The standalone stylesheet includes the global reset, tokens, component rules, and only its bundled utility subset, not arbitrary Tailwind classes. Its semantic `:root`/`.dark` declarations are **unlayered**: the runtime's screen-only custom rules use `html:root` specificity to win even when restored before the vendor link loads. The light print baseline is also unlayered and more specific than vendor defaults, so `html.dark` cannot leak dark semantics into print. No vendor bytes are patched. Dark component variants use `html.dark`, synchronized by Docifly's one theme controller. No Basecoat JavaScript or compatibility pack is shipped.

When changing code-marker styles, check whole-line and inline marks in Light, Dark, Punk, and Ice, including both stripe phases and numbered gutters. Composite translucent marker backgrounds over the actual code surface before calculating WCAG relative luminance. Keep syntax-text contrast at least 4.5:1 without changing marker semantics or copied source. Narrow `--docifly-code-muted` and `--docifly-code-focus` extensions keep captions/gutters and code focus readable; dark insertion/deletion fills use less opacity rather than changing Vega's shared palette.

All typography uses Basecoat's font stacks: Geist/Geist Sans with system sans-serif fallbacks, and Geist Mono with system monospace fallbacks. These are preferences for locally installed fonts, not downloads or bundled font assets. Article headings retain a documentation-specific scale, weight 700, restrained tracking, and a bounded reading column; site-title and hero geometry remain documentation adaptations. Component typography remains Vega-owned rather than inheriting a global heading-font override.

The principal responsive transitions are 50rem for sidebar/menu placement and 72rem for the TOC rail/disclosure. At the default 16px browser font setting these are 800 and 1152 CSS pixels. They are font-relative layout decisions, not promises about named devices.

Header buttons, the theme's native `select`, and the native search `dialog`
use Vega's `btn`, `select`, `input`, and `dialog` contracts. Docifly adds only
shell placement, compact/touch geometry, wrapping, and search-result layout.
Language/version pickers remain native `details` disclosures with ordinary
links and paired popover/selection colors; no Basecoat interaction controller
is loaded. Heroes and not-found actions share the public Vega link-button
renderer, including narrow-screen wrapping and 44px minimum action height.

For responsive changes, inspect `/internals/#search` and `/icons/` at 320–390 CSS pixels: inline prose code must wrap without widening the page, while tables, fenced code, and file trees scroll locally. At 1280×900, set the root font size to 200%, then restore it with focus in navigation or the TOC; check compact-shell transitions and focus retention. Exercise Menu/Search outside their visible shapes, navigation/TOC rows, and search-result sections, snippets, and padding with touch and keyboard.

For language-picker changes, preview a consumer of `fixtures/localization/site/` with English, French, and Arabic editions. Check Light/Dark and 320px, 390px, and desktop widths: the popup must stay within the viewport below the fixed header, preserve the current-edition highlight, and keep long labels readable. With JavaScript disabled, verify that the native disclosure and edition links still work from the header.

## Browser enhancement ownership

All layouts load `assets/color-mode.js` synchronously in the head before CSS. The documentation layout's enhancement assets are deferred in this order: navigation, global controls, optional hero depth, prose, TOC, tabs, code, MiniSearch, then search. The splash layout omits navigation, global controls, and TOC; it loads optional hero depth before prose. The not-found layout defers only MiniSearch and search. Tabs and code initialize before the optional CDN script, so a slow MiniSearch response does not delay those independent enhancements. MiniSearch still executes before search initialization. No client renderer or hydration framework is involved.

### Color mode

`assets/color-mode.js` loads `assets/themes/index.json` as the single registry for dropdown order, IDs, labels, native color schemes, icons, and palette paths. It preserves the `starlight-theme` preference key and initializes the selector after registry validation and DOM readiness. Light is the server-rendered/no-JavaScript default. Auto chooses stock Light/Dark from the system; explicit preferences ignore live system changes. Light and Dark require matching schemes and `palette: null`; every other entry requires a palette path, resolved relative to the registry URL for prefix-safe requests. Both light- and dark-scheme custom palettes must define exactly the 26 semantic six-digit hex strings listed in [Color modes](../color-modes/), including all used sidebar pairs. Unknown, missing, legacy, short-hex, and non-string values are rejected. Localized selector labels still take precedence, and `assets/global-controls.js` moves the same control between header and Menu at 50rem.

Every application synchronously updates `html.dark`, `data-theme`, `data-color-scheme`, and the screen-only palette as one resolved state. The stylesheet is replaced, never accumulated: custom→stock and error→Light transitions clear every preceding custom override. Registry errors restore Light and hide the selector; palette errors restore Light while retaining the requested selector value. Both retain the saved preference and log the failure. Revision checks prevent delayed palette successes or failures from overriding newer selections; custom requests are reused within a page, while stock schemes make no palette request.

Successful applications save `{version: 2, id, scheme, colors}` under `docifly-palette:<absolute registry URL>` when storage permits. Stock Light/Dark restore synchronously from the preference or Auto's system setting even without a snapshot. A matching, complete version-2 custom snapshot restores before paint; incompatible old objects and invalid/nonmatching snapshots are ignored. Without a matching custom snapshot, the initial page remains Light until fresh loading finishes. Every page still fetches a fresh registry and the selected custom palette; fresh results replace the restored snapshot, and failures clear it. Storage denial leaves current-page switching and Auto functional. Print uses the independent light semantic baseline and cannot see the screen-only custom stylesheet; returning to screen restores the selection without modifying preferences.

### Navigation

`assets/navigation.js` enhances the native navigation popover and disclosures. It makes covered content inert while the mobile menu is open, handles keyboard focus and Escape, closes the menu after link selection, and cleans up at the responsive transition.

The navigation enhancement compares the viewport with the current root font at the existing 50rem and 72rem thresholds. Its compact-shell guards let font-size overrides fall back from wide columns; navigation, TOC, and shared controls follow the rendered control state rather than viewport media queries alone.

The global-controls enhancer relocates one DOM instance rather than cloning
controls. Returning from the compact menu to the desktop header preserves focus
on a global control; navigation focus otherwise moves to the first sidebar link.

Session persistence stores group state and scroll position under a base-URL-specific key. A signature of navigation labels and links prevents stale state being applied after the consumer changes its navigation. Native controls still work when storage access fails.

### Page navigation

Navigation uses ordinary document loads without page transition effects. URLs, history, fragments, and full page loads are not intercepted. The current-page navigation highlight updates on the destination page.

### Hero depth

Images explicitly configured with `hero.image.depth: true` load `assets/hero.js`. With a fine hover pointer and no reduced-motion preference, the image makes one finite entrance and responds to pointer position with bounded perspective. Pointer updates are coalesced into requested animation frames, not a continuous rendering loop; leaving the image, scrolling, resizing, or hiding the page resets tracking. Offscreen images stop tracking. Touch, reduced motion, and JavaScript-disabled rendering keep the original static artwork. The [hero guide](../pages/#add-an-image) documents the opt-in; the documentation overview demonstrates it on the folded-D logo.

### Heading anchors

`assets/prose.js` discovers headings with IDs inside `#article`, wraps them for anchor presentation, and links to the IDs already emitted by Jigyll. It does not derive new slugs or rewrite heading text.

Heading permalinks use the filled `link-alt` glyph from `tools/icons/icons.json`, with room around the path inside its 24-by-24 viewBox to avoid clipping.

### Table of contents

`_includes/toc.html` renders an Overview entry and eligible H2/H3 entries from Jigyll 1.12.0's `page.headings` metadata. The engine collects that flat, article-ordered `{level, id, text}` list from rendered article HTML before layouts; it includes `.no_toc`, nested-Markdown, repeated, and explicit IDs unchanged. Docifly skips entries without IDs or labels and does not derive replacement slugs.

`assets/toc.js` enhances the existing links. It switches between a rail and a disclosure, maintains current-section feedback from the article headings, and focuses the emitted target after link selection. It does not create, remove, or label TOC entries.

### Tabs

`assets/tabs.js` is the sole tab controller; Basecoat JavaScript is not loaded. Server-rendered `.tab-item` sections remain fully readable without JavaScript. Enhancement moves their panels and decorative icons into Vega's `.tabs` structure with a direct-child ARIA tablist and panels, removes the section wrappers, and retains plain-text panel headings for print. IDs are deterministic from page-local DOM order. Tabs are named by their labels alone; selected/hidden/tabindex state and panel labels stay aligned. Long-label scrolling is local to the tablist, with no replacement tab skin. Exact text-label synchronization never transfers focus to a receiving group, and unequal panel heights above the initiating group do not move it in the viewport. Versioned persistence is optional per sync key; missing labels fall back to the group's first panel on restoration and storage failures retain in-memory behavior. Nested groups remain unsupported.

### Clipboard

Jigyll parses fenced-code metadata and emits the semantic `figure.highlight[data-code-frame]` seam, escaped caption, and unchanged server-highlighted code. `assets/code.js` treats that figure as the canonical frame container, adds native code/copy focus stops when the Clipboard API is available, reads only `code.textContent`, prevents overlapping copy attempts, and reports the actual write result. Untitled and unframed blocks retain the same enhancer without browser-side source parsing.

Copy controls use Vega's outline/icon button contract. Their documentation-only
rules position them over the code frame; semantic feedback pairs distinguish
success and denial without replacing the actual Clipboard API result. Inline
prose code wraps even inside tab panels; fenced source remains preformatted
inside its own focusable horizontal scroller.

### Search

`assets/js/zzzz-search-data.json` is a front-matter-bearing theme asset whose `search-data` layout runs after Jigyll renders all page bodies. It emits deterministic same-origin records for published default-layout HTML pages and output-enabled collection documents. Each record contains the title, base-URL-correct URL, article text, and Jigyll heading metadata; `search_exclude: true` omits a document. Component regions marked with `data-search-exclude` are delimited by private build-time markers and removed from the article body before text normalization, so illustrative file-tree labels do not enter the corpus.

The layouts load the MIT-licensed MiniSearch 7.2.0 browser bundle directly from `https://cdn.jsdelivr.net/npm/minisearch@7.2.0/dist/umd/index.min.js`, pinned with SHA-384 Subresource Integrity and anonymous CORS. No library bundle or local fallback is shipped. Search requires access to jsDelivr; a Content Security Policy must permit `https://cdn.jsdelivr.net` in its script sources. If the library cannot load, the search control remains disabled. `assets/search.js` uses the same Unicode tokenizer for indexing and matching, normalizes case and canonical Unicode form, requires every token, and allows a prefix only on the final token. It verifies exact matches itself after MiniSearch finds candidates, ranks title/heading/body hits deterministically, and uses text-only DOM APIs for corpus values. The disabled control remains unavailable without JavaScript; the native dialog supplies loading, guidance, results, failure, and retry states.

Search uses a native modal dialog with Vega's popover surface and controls.
The existing enhancer keeps Tab/Shift-Tab within its visible controls and
results and returns focus to its opener on Cancel/Escape. A failed corpus load
offers the existing explicit Retry action; no-results and empty-query messages
remain separate from that error. Opening the modal dismisses the native menu
popover so its covered-content state can clear.

Highlighting and fenced-code metadata parsing are server-side Jigyll/Chroma behavior. Differences from stock Starlight's code highlighter cannot be repaired by inventing tokens in CSS or the copy handler.

### Print

`_sass/_print.scss` removes fixed and interactive chrome; `_sass/_theme.scss`
defines a complete, unlayered light semantic/status/code baseline that wins
over vendor defaults even while `html.dark` stays set. Custom palette injection
is screen-only; printing needs no extra theme controller or preference writes.
Print expands all labeled tab panels and native disclosure content, including
Basecoat's collapsed `::details-content` block size and opacity, removes
staggered-grid offsets and file-tree paint containment, and wraps code/table
cells. It appends destinations only to HTTP(S) article links. Layouts render one
screen-hidden canonical URL after the article. Leaving print retains the
screen palette, selection, and disclosure state unchanged.

Browser paper size, 12 mm margins, scale, headers/footers, and background
graphics remain print-dialog or automation settings rather than theme
configuration. Inspect an actual saved rendering/PDF: visible layout boxes
alone do not prove disclosure contents are painted.

### Maintainer browser acceptance

`tools/browser/` is a maintainer-only Playwright gate. Its package lock pins
Playwright, `browser-revisions.json` records the corresponding Chromium,
Firefox, and WebKit revisions, and the preparation step builds the shared
overview, long-guide, and code fixtures at both `/` and `/docs/`. It also copies
the maintained Markdown examples (components, tabs, splash, and not-found)
and their artwork into those consumers, rather than duplicating their templates.
Node, Playwright, and downloaded browsers are not part of a Jigyll consumer install.

Run the gate on a Playwright-supported Linux host:

```sh
cd tools/browser
npm ci
npx playwright install --with-deps chromium firefox webkit
JIGYLL=/path/to/jigyll npm test
```

Functional browser runs are local-only. `tools/browser/tests/fixtures.mjs`
installs the shared `local-policy.mjs` policy on the default context; tests
needing clipboard permissions or disabled JavaScript use its
`createLocalContext` fixture so explicitly created contexts receive the same
policy before their first page. Service workers are blocked. Only the configured
local test origin and non-network resources are allowed; unexpected external
HTTP(S) requests are aborted and fail the test. Each test attaches its request
decisions as `local-requests` JSON.

The one external script URL already present in production layouts is fulfilled
from real MiniSearch 7.2.0 bytes in
`tools/browser/fixtures/minisearch/7.2.0/`. Its manifest records the upstream
source, MIT license source, size, SHA-256, and SHA-384 SRI. The policy validates
the bytes and their match with all three production layouts before running.
No acquisition is performed during a functional run. This is a maintainer-only
fixture, not a shipped runtime search fallback; production CDN loading and its
disabled-search failure behavior remain unchanged. A page-level route may
explicitly deny that known script to exercise the failure state.

Native localized companion consumers reuse `fixtures/localization/site/` at
`/localized/` and `/localized/docs/`, with French routes such as
`/localized/fr/demarrage/` and Arabic RTL routes such as
`/localized/docs/ar/dalil/`. The maintained catalogs and message inventory
include all supported theme labels, including Punk and Ice; preparation no
longer patches disposable catalogs. The generated pages use Jigyll's actual
locale metadata, translations, and locale-filtered search corpus, not a `dir`
attribute applied to an English fixture. The offline search integration tests
check an expected generated result, excluded content, Arabic locale isolation,
and the known script-denied disabled state.

For focused shell work, run `npx --no-install playwright test tests/acceptance.spec.mjs tests/chrome.spec.mjs --project=chromium`
from `tools/browser/` after `npm run build-fixture`. These exercise persistence
after observable native-toggle storage, specific search navigation/retry/empty
states, modal focus, enlarged-text relocation, localized long labels, and
no-JavaScript disclosures. Run the localization boundary checker from the
repository root with an absolute executable path:
`python tools/localization/check.py --jigyll /absolute/path/to/jigyll`.

The generated `.artifacts/environment.json` records the platform, Jigyll and
theme revisions, package-lock digest, browser revisions, color modes, pages,
and viewports. The JSON reporter records each project result. Failure
screenshots and traces are diagnostic artifacts, not visual-parity baselines.
The verdict applies only to those pinned Playwright binaries on Linux.
Playwright WebKit is not Safari evidence; Edge, real Safari, mobile devices,
physical devices, and accessibility certification remain outside this gate.

## Fallback and change discipline

Without JavaScript, the default light palette, content, links, images, native navigation, server-rendered TOC, server-highlighted code, and every tab panel remain readable. Anchor controls, active-section feedback, responsive TOC disclosure behavior, code copying, tab selection/synchronization, and mode selection are enhancements. Browser support for native popovers is still relevant to the mobile fallback.

When changing theme behavior, update the explanation and its real example together. Inspect the installed consumer rather than adding a second demo implementation. The [manual-inspection guide](../inspection/) gives starting points without imposing automated testing or a screenshot baseline.

## Attribution and historical scope

Stock Starlight and Expressive Code attribution remains in the shipped license assets. The frozen 130-name public icon paths are covered by `assets/starlight-LICENSE`; the separate Seti file-icon inventory used by file trees retains its notice in `assets/file-tree-icons-LICENSE`. The frozen stock Starlight POC revision was `39d4e71f23b3fb6fde0e77eb983fcd38629b70b9`; its historical captures, code-token records, and verification results remain in the repository's `evidence/poc/`.

The legacy Node.js POC tooling was removed. The maintainer gate above is the
current acceptance evidence; it does not prove complete visual parity,
interaction parity, or Astro compatibility.
