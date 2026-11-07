---
title: Docifly
layout: splash
permalink: /
hero:
  tagline: A standalone Jigyll theme for clear, readable documentation.
  image:
    src: /media/paper-dragon-docs.webp
    alt: A paper dragon wearing glasses and reading a book
    width: 1024
    height: 683
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
- [Color modes](./color-modes/) explains the available palettes and Auto, including what happens without JavaScript or storage.
- [Manual inspection](./inspection/) suggests ways to try the site with a keyboard and at different window sizes.

## Understand the implementation

[Theme internals](./internals/) explains what the layouts, includes, Sass, and browser enhancements do. These docs are plain Markdown in a separate site with Docifly installed. They need no browser test runner or documentation preprocessing.

## Scope and limitations

Docifly has documentation and splash layouts with optional heroes. It supports recursive navigation, heading navigation, Markdown and code formatting, color modes, and local full-text search. Each feature's docs describe the supported components and output.

Docifly supplies the documentation shell and supported authoring features. Local browser checks and manual inspection do not establish accessibility certification, real Safari support, or complete parity with another documentation framework.

Historical proof-of-concept captures and result files remain in the theme repository's `evidence/poc/`, outside this published documentation site. The tools that captured those results have been retired, so they are not a current measurement of this site.
