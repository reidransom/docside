---
title: Docifly
layout: splash
permalink: /
hero:
  tagline: A standalone Jigyll documentation theme that uses stock Starlight as its design reference.
  image:
    src: /media/docifly-icon.svg
    alt: Docifly purple folded D logo
    width: 505
    height: 509
  actions:
    - text: Get started
      link: /getting-started/
      variant: primary
    - text: Explore page layouts
      link: /pages/
      variant: minimal
---

This documentation site runs Docifly. Open [Getting started](./getting-started/) to try its sidebar, heading links, table of contents, code blocks, and color selector on a documentation-layout page.

## Start with a working site

Read [Getting started](./getting-started/) to install Docifly and configure your site. You don't need to install Node.js, Astro, or Sass to use the shipped theme.

Then organize your [navigation](./navigation/), write [headings](./headings/), and choose a [deployment location](./deployment/).

## Explore the examples

- [Markdown](./markdown/) shows lists, tables, images, quotations, and inline formatting alongside authoring examples.
- [Code blocks](./code/) shows highlighted code, whitespace, and horizontal overflow. Try copying a block.
- [Color modes](./color-modes/) explains Dark, Light, and Auto, including what happens without JavaScript or storage.
- [Manual inspection](./inspection/) suggests ways to try the site with a keyboard and at different window sizes.

## Understand the implementation

[Theme internals](./internals/) explains what the layouts, includes, Sass, and browser enhancements do. These docs are plain Markdown in a separate site with Docifly installed. They need no browser test runner or documentation preprocessing.

## Scope and limitations

Docifly has documentation and splash layouts with optional heroes. It supports recursive navigation, heading navigation, Markdown and code formatting, color modes, and local full-text search. Each feature's docs describe the supported components and output.

Visual parity means matching appearances under a defined set of conditions. Interaction parity means matching observable control behavior. Trying this site by hand does not prove that it fully matches stock Starlight in either respect.

Historical proof-of-concept captures and result files remain in the theme repository's `evidence/poc/`, outside this published documentation site. The tools that captured those results have been retired, so they are not a current measurement of this site.
