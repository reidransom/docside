# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are developers authoring and maintaining technical documentation sites with Jigyll. Documentation readers are the secondary audience: they need to find relevant information and understand it.

## Product Purpose

Docside is a standalone documentation theme for Jigyll. It provides a usable documentation experience while letting authors work in ordinary Markdown and site configuration.

This repository also contains Docside's documentation website. That site consumes the theme and serves as a working demonstration of its supported features.

Success means developers can install the theme, configure a documentation site, and publish useful documentation; readers can navigate and comprehend that documentation.

## Positioning

Basecoat 1.1.0's default Vega distribution is Docside's shared visual authority: its local standalone CSS owns the reset, stock Light/Dark colors, component geometry, focus/state treatment, and font stacks. Docside owns the documentation shell, prose, semantic status/code extensions, and existing browser behavior. This is a clean foundation replacement, not an optional skin or a claim of Astro compatibility.

Consumers use shipped assets with Git and Jigyll; they need no Node.js, npm, Python, Sass, or Tailwind build. MiniSearch remains a separate SRI-pinned production CDN dependency for search, with no runtime local fallback.

## Operating Context

- Consumers install Docside through Jigyll's theme installer, configure `_config.yml`, and author Markdown pages.
- The documented installation requires Git and Jigyll 1.13.0 or later.
- `docs/` is the maintained documentation site. Its local theme symlink points to this repository for development previews.
- Preview the site with servd from `docs/`; `docs/.servd.toml` runs Jigyll's watched server.
- An installed consumer is a separate Git snapshot. A direct source preview is not proof that consumer installation works.

## Capabilities and Constraints

The existing documentation describes documentation and splash layouts, optional heroes, recursive navigation, heading links and table of contents, Markdown and code formatting, color modes, and local full-text search. Feature-specific guides define supported behavior and limitations.

Keep Markdown-first authoring and the consumer installation workflow. Browser enhancements must be described according to their actual supported behavior, including documented JavaScript and storage limitations.

Keep scope precise: the current local acceptance surface is the maintained documentation, feature fixtures, and real Git-installed consumers at root and `/docs/`, using pinned headless Chromium, Firefox, and WebKit on Linux. Playwright WebKit is not real Safari evidence. Historical Starlight comparisons and domain definitions in `CONTEXT.md` do not establish current visual or interaction parity.

## Brand Commitments

Preserve the Docside name and existing purple folded-D logo assets. Existing product copy is direct and technical; it distinguishes demonstrated behavior from unsupported claims.

## Evidence on Hand

- `docs/`: installation, configuration, feature guides, implementation details, and manual inspection instructions; the site itself demonstrates the theme.
- `docs/media/` and `__docs/`: existing Docside identity artwork.
- `fixtures/`: feature-specific content and scenarios.
- `evidence/` and `docs/poc.md`: retained inspection and historical proof-of-concept material, not current proof of the Basecoat cutover or parity.
- `docs/internals.md`: maintainer browser acceptance guidance. Failure-diagnostic screenshots are not visual-parity baselines.

Do not invent customer proof, testimonials, benchmarks, accessibility certification, or parity results.

## Product Principles

1. Make documentation useful for readers and straightforward for developers to author and maintain.
2. Keep consumer use independent of frontend build tools; ship local Basecoat Vega and compiled documentation CSS.
3. Use this documentation site as a real consumer and demonstration of the theme.
4. Preserve precise terminology and make claims only within the scope supported by evidence.

## Open Decisions

No additional product-specific accessibility standard or audience requirements were established during initialization. This does not remove the need for accessible implementation; it prevents inventing a certification or commitment.
