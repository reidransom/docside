---
title: Color modes
permalink: /color-modes/
---

Use **Select theme** to choose Dark, Light, Punk, Ice, or Auto. The control sits in the header on wide screens and moves into Menu on narrow screens. Both locations use the same saved preference.

The default Light palette has purple accents, pink secondary accents, and warm paper backgrounds. `_sass/_theme.scss` defines its base colors and the CSS rules that derive backgrounds, text, accents, status colors, code colors, badges, and borders.

Dark loads four base colors from `assets/themes/dark.json`: `primary`, `secondary`, `body-text`, and `bg`. Use six-digit hex values. All five variants are calculated in CSS and update automatically when a base color changes:

| Variant | Derivation (`color-mix` in sRGB) |
| --- | --- |
| `primary-alt` | 80% primary + 20% background |
| `secondary-alt` | 60% secondary + 40% white |
| `strong-text` | 25% body text + 75% white |
| `muted-text` | 72% body text + 28% background |
| `bg-alt` | 92% background + 8% body text |

Dark-scheme palettes may explicitly override any of these variants. Punk uses `assets/themes/punk.json` with all nine colors to retain its neon green accents, pink headings and keywords, violet text, and black backgrounds. Light-scheme palette files require all nine colors; the built-in Light palette remains in CSS.

Ice uses `assets/themes/ice.json` with all nine colors, inspired by [ZeroClaw](https://www.zeroclaw.com/): a near-black navy background, sky-blue links and actions, cyan secondary accents, cool slate body text, and white headings. It uses dark-scheme components without changing the default Dark palette.

Publish JSON color changes with the site. They do not need Sass compilation. After changing Sass, run `python tools/styles/build.py` to rebuild `assets/docifly.css`. See [Theme internals](../internals/#styles-and-shipped-output) for build dependencies.

Borders come from the shared CSS rules. The base palette has no separate border color.

## Add a theme

1. Add `assets/themes/ocean.json` using the same four base-color keys as `dark.json`.
2. Add an entry to the array in `assets/themes/index.json`:

   ```json
   { "id": "ocean", "label": "Ocean", "scheme": "dark", "palette": "ocean.json" }
   ```

3. Publish the palette file and updated registry. You do not need to edit JavaScript, templates, or Sass.

Entries appear in the dropdown in registry order, with Auto last.

| Field | Purpose |
| --- | --- |
| `id` | Unique lowercase name. Start with a letter, then use letters, digits, or hyphens. `auto` is reserved. |
| `label` | Dropdown text. A localized `data-label-<id>` attribute on the selector takes precedence. |
| `scheme` | `light` or `dark`. Sets the icon, browser control colors, hero image variant, and light/dark component styles. |
| `palette` | Path relative to the registry URL. Deployment prefixes stay intact. |

Keep the `light` entry with `palette: null` to use the CSS default. Keep `dark` for Auto to follow the system setting. Each additional theme needs a palette file.

If a saved theme ID no longer exists in the registry, the loader uses Auto. If the registry fails to load, the page stays light and hides the selector.

## Choose a preference

| Preference | Behavior |
| --- | --- |
| Dark | Uses the dark palette regardless of the system setting |
| Light | Uses the light palette regardless of the system setting |
| Punk | Uses the punk palette regardless of the system setting |
| Ice | Uses the ice palette regardless of the system setting |
| Auto | Follows the system's light or dark preference |

Dark, Light, Punk, and Ice save your choice locally when browser storage is available. Auto clears that saved choice.

Choose Light, then open [Code blocks](../code/) to check that your choice survives navigation. Choose Auto to follow the system again.

### Auto follows live changes

With Auto selected, changing your operating system's appearance switches the page between Light and Dark without a reload. Auto never selects Punk or Ice. An explicit Dark, Light, Punk, or Ice choice takes precedence over the system setting.

You can also use browser developer tools to emulate `prefers-color-scheme`.

## Read without storage

The loader saves your preference under the `starlight-theme` local-storage key. Invalid values fall back to Auto.

If the browser blocks storage, the selector still works for the current page. Your choice may be lost on navigation or reload. A working selector does not mean the browser saved the setting.

## Read without JavaScript

Without JavaScript, the page uses Light. The article, links, images, server-highlighted code, table of contents, and ordinary fragment links still work. Navigation sections can still expand and collapse.

JavaScript adds the mode selector, heading-anchor controls, copy buttons, active-section feedback, and responsive table-of-contents controls. The mobile menu needs native popover support. JavaScript adds focus handling and saves its state.

To check this fallback, disable JavaScript in browser settings and reload. Turn it back on afterward to restore the controls. This is a manual check, not an automated test.

## Initialization and responsiveness

`assets/color-mode.js` runs in the document head before the stylesheet and page content. When storage is available, it restores the last applied palette synchronously, so navigation and reloads keep the selected colors instead of briefly showing Light. The cached palette is scoped to the site's registry URL and used only when it matches the saved preference and, for Auto, the current system appearance.

The loader still fetches `assets/themes/index.json` and the selected palette on each page to pick up published changes. Palette requests are cached for later switches on the same page. Without a matching cached palette, the page shows Light until loading finishes. If a palette request fails or contains invalid colors, the loader clears the cached palette, uses Light, and logs the error. It keeps your saved preference. If you change themes while a request is pending, the old response cannot override your new choice.

The selector appears once the registry has loaded and the DOM is ready. The global-controls script moves it between the header and Menu at 50rem. Print always uses the light print palette.

Theme changes do not recolor images. The [Markdown](../markdown/) example keeps its image colors when you switch themes.

See [Theme internals](../internals/) for the files behind each feature, or [Manual inspection](../inspection/) for keyboard-focus and mobile-layout checks.
