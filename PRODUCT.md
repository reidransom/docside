# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are developers authoring and maintaining technical documentation sites with Jigyll. Documentation readers are the secondary audience: they need to find relevant information and understand it.

## Product Purpose

Docifly is a standalone documentation theme for Jigyll. It provides a usable documentation experience while letting authors work in ordinary Markdown and site configuration.

This repository also contains Docifly's documentation website. That site consumes the theme and serves as a working demonstration of its supported features.

Success means developers can install the theme, configure a documentation site, and publish useful documentation; readers can navigate and comprehend that documentation.

## Positioning

Stock Starlight is the reference for Docifly's appearance and responsive behavior, not a runtime dependency or a claim of Astro compatibility. Consumers do not need to install Node.js, Astro, or Sass to use the shipped theme.

Visual parity and interaction parity are distinct claims that require a defined scope and current evidence. Using Starlight as a reference does not establish either claim by itself.

## Operating Context

- Consumers install Docifly through Jigyll's theme installer, configure `_config.yml`, and author Markdown pages.
- The documented installation requires Git and Jigyll 1.13.0 or later.
- `docs/` is the maintained documentation site. Its local theme symlink points to this repository for development previews.
- Preview the site with servd from `docs/`; `docs/.servd.toml` runs Jigyll's watched server.
- An installed consumer is a separate Git snapshot. A direct source preview is not proof that consumer installation works.

## Capabilities and Constraints

The existing documentation describes documentation and splash layouts, optional heroes, recursive navigation, heading links and table of contents, Markdown and code formatting, color modes, and local full-text search. Feature-specific guides define supported behavior and limitations.

Keep Markdown-first authoring and the consumer installation workflow. Browser enhancements must be described according to their actual supported behavior, including documented JavaScript and storage limitations.

Use the domain definitions in `CONTEXT.md`: stock Starlight means its default documentation experience, not the Starlight website's site-specific customizations. Visual parity concerns rendered appearance; interaction parity concerns observable control behavior.

## Brand Commitments

Preserve the Docifly name and existing purple folded-D logo assets. Existing product copy is direct and technical; it distinguishes demonstrated behavior from unsupported claims.

## Evidence on Hand

- `docs/`: installation, configuration, feature guides, implementation details, and manual inspection instructions; the site itself demonstrates the theme.
- `docs/media/` and `__docs/`: existing Docifly identity artwork.
- `fixtures/`: feature-specific content and scenarios.
- `evidence/` and `docs/poc.md`: retained inspection and historical proof-of-concept material. Historical captures are not current proof of complete Starlight parity.
- `docs/internals.md`: maintainer browser acceptance guidance. Failure-diagnostic screenshots are not visual-parity baselines.

Do not invent customer proof, testimonials, benchmarks, accessibility certification, or parity results.

## Product Principles

1. Make documentation useful for readers and straightforward for developers to author and maintain.
2. Keep consumer use independent of Node.js, Astro, and Sass installations.
3. Use this documentation site as a real consumer and demonstration of the theme.
4. Preserve precise terminology and make claims only within the scope supported by evidence.

## Open Decisions

No additional product-specific accessibility standard or audience requirements were established during initialization. This does not remove the need for accessible implementation; it prevents inventing a certification or commitment.
