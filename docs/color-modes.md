---
title: Color modes
permalink: /color-modes/
---

Use **Select theme** to choose Dark, Light, Punk, Ice, or Auto. The control sits in the header on wide screens and moves into Menu on narrow screens. Both locations use the same saved preference.

Light and Dark use the stock **Basecoat 1.1.0 / Vega** palettes. They do not load a palette JSON file: their registry entries have `palette: null`, and the locally shipped Basecoat stylesheet owns their shared colors and font stacks. The stacks prefer Geist and Geist Mono, then fall back to installed system fonts; Docifly downloads no fonts.

Punk and Ice are complete custom semantic palettes over the same components. Punk keeps neon green actions, pink-tinted secondary surfaces, violet text, and black backgrounds. Ice uses near-black navy surfaces, sky-blue actions, cyan-tinted secondary surfaces, and cool slate text, inspired by [ZeroClaw](https://www.zeroclaw.com/).

The custom-palette format uses Basecoat semantic names **without** the leading `--`. This replaces the former base-color/derived-variant format: convert every custom file to the complete schema below. There is no legacy-schema fallback. Shared foreground/background pairs, borders, inputs, focus rings, and sidebar colors are explicit; Docifly's syntax, code-marker, and semantic-notice extensions remain CSS-owned.

The intentional appearance change is broader than recoloring: stock themes
now use Vega controls, cards, alerts, and tabs, with its neutral Light/Dark
defaults rather than the former shared skin. Public Liquid arguments remain
the same. Do not reproduce the old appearance with token aliases or add a
second theme controller.

Publish JSON color changes with the site. They do not need Sass compilation. After changing Sass, run `python tools/styles/build.py` to rebuild `assets/docifly.css`. See [Theme internals](../internals/#styles-and-shipped-output) for build dependencies.


## Add a theme

1. Add `assets/themes/ocean.json` with exactly these 26 required keys. This is a complete dark-scheme example; choose and check readable foreground/background pairs for your own palette.

   ```json
   {
     "background": "#050810",
     "foreground": "#cbd5e1",
     "card": "#0a0f1a",
     "card-foreground": "#cbd5e1",
     "popover": "#0a0f1a",
     "popover-foreground": "#cbd5e1",
     "primary": "#38bdf8",
     "primary-foreground": "#050810",
     "secondary": "#12303d",
     "secondary-foreground": "#67e8f9",
     "muted": "#101b2c",
     "muted-foreground": "#a3b4ca",
     "accent": "#143345",
     "accent-foreground": "#e0f2fe",
     "destructive": "#ff8a9b",
     "border": "#40536c",
     "input": "#40536c",
     "ring": "#38bdf8",
     "sidebar": "#0a0f1a",
     "sidebar-foreground": "#cbd5e1",
     "sidebar-primary": "#38bdf8",
     "sidebar-primary-foreground": "#050810",
     "sidebar-accent": "#143345",
     "sidebar-accent-foreground": "#e0f2fe",
     "sidebar-border": "#40536c",
     "sidebar-ring": "#38bdf8"
   }
   ```

   Every value must be a six-digit hex string, such as `"#38bdf8"`. Missing or unknown keys, short hex, non-string values, and the old base-color keys are rejected. Light-scheme custom palettes use the same complete schema. Basecoat's `accent` is an interaction **surface**, not a universal link/text color; pair it with `accent-foreground`.
2. Add an entry to the array in `assets/themes/index.json`:

   ```json
   { "id": "ocean", "label": "Ocean", "scheme": "dark", "palette": "ocean.json" }
   ```

3. Publish the palette file and updated registry. You do not need to edit JavaScript, templates, or Sass.

Check the resulting rendered surfaces, not just the JSON: body/muted text,
selected navigation, semantic notices, focus rings, native controls, and
syntax over both plain and marked code backgrounds. Validation proves the
schema and color syntax, not contrast for an arbitrary author palette.
Switch back to both stock themes to confirm no custom colors remain, then
inspect light print and screen restoration.

Entries appear in the dropdown in registry order, with Auto last.

| Field | Purpose |
| --- | --- |
| `id` | Unique lowercase name. Start with a letter, then use letters, digits, or hyphens. `auto` is reserved. |
| `label` | Dropdown text. A localized `data-label-<id>` attribute on the selector takes precedence. |
| `scheme` | `light` or `dark`. Sets the icon, browser control colors, hero image variant, and component styles. Dark schemes apply `html.dark`, including Punk, Ice, and dark custom themes. |
| `palette` | Nonempty palette path relative to the registry URL. Deployment prefixes stay intact. Only built-in Light and Dark use `null`. |

Keep unique `light` and `dark` entries with matching `scheme` values and `palette: null` so Auto can follow the system using stock colors. Each additional theme needs a complete palette file. Registry labels and order remain customizable; localized selector labels take precedence.

If a saved theme ID no longer exists in the registry, the loader uses Auto. If the registry fails to load or validate, the loader clears any restored custom colors, uses Light, and hides the selector. Registry and palette failures log an error without deleting your saved preference.

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

To check this fallback manually, disable JavaScript in browser settings and reload. Turn it back on afterward to restore the controls. The maintainer browser gate also exercises no-JavaScript Light pages at root and prefixed deployments.

## Initialization and responsiveness

`assets/color-mode.js` is the single theme controller and runs in the document head before both local stylesheets and page content. It updates `data-theme`, `data-color-scheme`, `html.dark`, and the screen-only custom palette together. Switching to stock Light or Dark, or falling back to Light after an error, removes every previous custom override.

Stock Light/Dark restore synchronously from the saved preference or Auto's current system appearance, without needing a cached palette or waiting for JSON. Custom palettes restore before paint only from a valid version-2 snapshot matching the saved theme ID. The cache key is `docifly-palette:<absolute registry URL>`, so different deployment prefixes do not share snapshots. Old, incomplete, malformed, and nonmatching snapshots are ignored; a custom choice without a matching snapshot initially renders Light.

The loader still fetches `assets/themes/index.json` on every page, then fetches the selected custom palette to pick up published changes. Fresh responses are authoritative over snapshots. Palette requests are reused for later switches on that page; stock Light/Dark never fetch a palette. If a palette request fails or contains invalid colors, the loader clears the snapshot and all custom overrides, uses Light, and logs the error. The selector and saved preference keep the requested choice. If you switch themes while a request is pending, a delayed success or failure cannot override the latest selection.

The selector appears once the registry has loaded and the DOM is ready. The global-controls script moves it between the header and Menu at 50rem. Print always uses a complete light semantic baseline, even while `html.dark` remains present; leaving print restores the chosen screen palette without changing the preference.

Theme changes do not recolor images. The [Markdown](../markdown/) example keeps its image colors when you switch themes.

See [Theme internals](../internals/) for the files behind each feature, or [Manual inspection](../inspection/) for keyboard-focus and mobile-layout checks.
