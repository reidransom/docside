---
title: Page layouts and heroes
permalink: /pages/
hero:
  title: Documentation can have a hero too
  tagline: Page layout and hero presentation are independent choices, even with a long explanation that wraps on narrow screens.
  image:
    src: /media/workflow.svg
    alt: A workflow diagram
    width: 960
    height: 480
  actions:
    - text: View the splash layout without a hero
      link: /wide-page/
      variant: secondary
---

Choose the shell with Jigyll's `layout` front matter. `default` keeps the navigation and heading table of contents. `splash` omits both sidebars, centers article content at the same 45rem width cap, and gives heroes a separate 80rem cap. Either layout can render an optional hero.

## Set the site favicon

Set a root-relative favicon directory in `_config.yml`, without `baseurl`:

```yaml
favicon_dir: /assets/favicons
```

The directory contains `favicon.ico`, `favicon.svg`, `favicon-32x32.png`, `apple-touch-icon.png`, `safari-pinned-tab.svg`, and `site.webmanifest`. The manifest references the Android and maskable icons in the same directory. Docifly emits the links in the default, splash, and not-found layouts and applies the deployment prefix. The pinned-tab icon uses the purple tint `#6d35ef`.

Omit `favicon_dir` to emit no favicon links. The documentation site enables the generated Docifly icon set; other sites are not automatically given Docifly branding.

## Add a hero

Hero text is escaped plain text. Article Markdown begins after the hero. If `hero.title` is absent, the hero uses `page.title`; an empty or absent tagline creates no gap.

```yaml
layout: splash
hero:
  tagline: A concise plain-text introduction.
  actions:
    - text: Get started
      link: /getting-started/
      variant: primary
    - text: Project source
      link: https://example.com/project
      variant: minimal
```

Action variants are `primary`, `secondary`, and `minimal`; invalid variants fall back to `primary`. Action text is plain text. Links must be root-relative internal paths or absolute HTTP(S) URLs. Malformed actions are omitted.

## Add an image

Use either one root-relative consumer image:

```yaml
hero:
  image:
    src: /media/diagram.svg
    alt: Architecture overview
    width: 960
    height: 480
```

Or provide a complete light/dark pair:

```yaml
hero:
  image:
    light: /media/diagram-light.svg
    dark: /media/diagram-dark.svg
    alt: Architecture overview
    width: 960
    height: 480
```

`alt`, `width`, and `height` are required. Alternative text may be empty only when the artwork is decorative. Image paths are root-relative without `baseurl`; Docifly applies the deployment prefix. Incomplete pairs, nonpositive dimensions, and non-root-relative paths omit the image instead of emitting broken markup.

Set `hero.image.depth: true` to give an illustration an optional perspective treatment while preserving the reserved image geometry, alternative text, and hero copy. With JavaScript enabled and a fine hover-capable pointer, the artwork makes one short entrance and tilts by at most 8 degrees as the pointer moves over it, returning to its resting angle on exit. Touch/coarse pointers, reduced-motion preferences, and browsers with JavaScript disabled keep the original artwork static. Reduced-motion changes take effect without reloading; motion also stops while the artwork is offscreen or the page is hidden. Omit `depth` for artwork that should stay still, as on the home page.

## Supported combinations

- `layout: default` without `hero`: the ordinary documentation shell used by most guides.
- `layout: default` with `hero`: this page.
- `layout: splash` without `hero`: the [wide-page fixture](../wide-page/).
- `layout: splash` with `hero`: the [documentation home page](../).

The [minimal hero fixture](../minimal-hero/) exercises an image-free hero and an empty tagline. Hero values do not accept Markdown, raw HTML, component slots, or arbitrary action attributes.
