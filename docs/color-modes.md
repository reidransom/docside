---
title: Color modes and fallback behavior
permalink: /color-modes/
---

The **Select theme** control offers Dark, Light, Punk, and Auto. On a wide screen it is in the header; on a narrow screen it moves into Menu. It is the same control in both places, not two independently stored preferences.

Light is the default palette in `_sass/_theme.scss`: purple primary accents, pink secondary accents, and warm paper surfaces. One shared set of runtime CSS rules derives surfaces, text, accents, semantic shades, code colors, and badges from the active base colors. Dark is loaded separately from `assets/themes/dark.json`, which contains only nine base hex colors: `primary`, `primary-alt`, `secondary`, `secondary-alt`, `body-text`, `strong-text`, `muted-text`, `bg`, and `bg-alt`. Editing the JSON does not require Sass compilation; publish the updated asset with the site. After editing Sass, run `python tools/styles/build.py` to compile `assets/docifly.css`. See [Theme internals](../internals/#styles-and-shipped-output) for build dependencies.

Select Punk to load `assets/themes/punk.json`: neon green accents, neon pink headings and keywords, violet reading and muted text, and black surfaces. Borders follow the shared derivation rules; the base-color schema has no independent border input.

## Choose a preference

| Preference | Effective palette | Persistence |
| --- | --- | --- |
| Dark | Loads the dark base palette regardless of the system setting | Saved locally when storage is available |
| Light | Light regardless of the system setting | Saved locally when storage is available |
| Punk | Loads the punk base palette regardless of the system setting | Saved locally when storage is available |
| Auto | Follows the system color preference | Clears the explicit stored choice |

Try Light and then follow [Code blocks](../code/). Your explicit preference should survive navigation. Switch back to Auto when you want the system preference to decide.

### Auto follows live changes

With Auto selected, changing the operating system's appearance should change the site's effective palette without a reload. A browser's developer tools may also let you emulate `prefers-color-scheme` for manual inspection. With Dark, Light, or Punk selected, the explicit choice wins over the system setting.

Auto follows only the system's dark or light preference; it never selects Punk.

## Read without storage

The stored preference uses the `starlight-theme` local-storage key. Invalid values fall back to Auto. If storage access is unavailable, the page still initializes from the system preference and lets you change its in-memory preference.

An in-memory choice is not a promise of persistence after navigation or reload. This distinction matters in restricted browsing contexts: a readable page and working selector do not imply that the browser permitted a saved setting.

## Read without JavaScript

JavaScript-disabled reading uses the default **light** palette. The server-rendered table of contents and ordinary fragment links remain. JavaScript adds active-section feedback and responsive disclosure behavior; it also adds the mode selector, heading-anchor controls, and copy buttons.

The article, links, images, server-highlighted code, and native navigation disclosures remain. The mobile menu relies on native popover support; JavaScript adds focus handling and persistence to that native behavior.

You can disable JavaScript in browser settings and reload to inspect this fallback. Re-enable it afterward to restore the enhancements. This is a suggested manual check, not a maintained automated test.

## Initialization and responsiveness

The color-mode asset executes in the document head before styles and body content. It requests the selected Dark or Punk JSON only when needed and caches each palette request for subsequent switches on the page. Default light colors remain visible on a cold visit until the request completes. If the request fails or the palette is invalid, the page falls back to light and logs the error; the stored preference is preserved. A pending response cannot override a later selection. Print output always uses the light print palette. Once the DOM is ready, the selector initializes; global controls place it in the header or menu at the 50rem navigation transition.

Palette changes affect theme colors, not the content of author-supplied images. See [Markdown](../markdown/) for an image that retains its own colors in both modes.

For source ownership, see [Theme internals](../internals/). For ways to inspect keyboard focus and mobile layout, see [Manual inspection](../inspection/).
