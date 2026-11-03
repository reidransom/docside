---
title: Tabs
permalink: /tabs/
---

Docifly renders captured Markdown as semantic stacked sections, then progressively enhances them into keyboard-operable tabs. Every label and panel remains readable when JavaScript is unavailable.

Enhanced groups use Basecoat's default Vega tabs. Long labels scroll within their own tab list rather than widening the page; keyboard selection reveals the chosen label in that list. Printing returns to labeled stacked panels, including panels hidden on screen.

## Independent tabs

{% capture overview_panel %}
The first panel has a [focusable link](../getting-started/) and ordinary **Markdown**.
{% endcapture %}
{% capture code_panel %}
The second panel contains code:

```sh
jigyll build --source my-docs
```
{% endcapture %}
{% capture independent_tabs %}
{% include components/tab.html label="Overview" icon="open-book" content=overview_panel %}
{% include components/tab.html label="A deliberately long tab label that scrolls within a narrow tab list" icon="not-in-the-frozen-registry" content=code_panel %}
{% endcapture %}
{% include components/tabs.html content=independent_tabs persist=true %}

Capture each panel, render it with `tab.html`, then pass the rendered items to `tabs.html`:

```liquid
{% raw %}{% capture first_panel %}
Rich **Markdown** with [a link](/getting-started/).
{% endcapture %}
{% capture second_panel %}
A second panel.
{% endcapture %}
{% capture items %}
{% include components/tab.html label="First" icon="open-book" content=first_panel %}
{% include components/tab.html label="Second" content=second_panel %}
{% endcapture %}
{% include components/tabs.html content=items %}{% endraw %}
```

Labels are required escaped plain text. `icon` optionally accepts a frozen public icon name; unknown names omit the SVG. Panel content follows the consumer's trusted Markdown/raw-HTML policy. Labels inside one group must be unique. Nested tab groups are unsupported.

## Synchronized and persistent groups

Groups with the same nonempty `sync` key synchronize by exact label. A group missing the selected label keeps its current panel. `persist=true` stores the synchronized label under a versioned Docifly key; it defaults to false and has no effect without `sync`.

The npm, pnpm, and Yarn panels below are illustrative stress examples for synchronization and different panel heights, not instructions for installing Docifly. Docifly does not require any of these package managers.

{% capture npm_panel %}
Install with npm.
{% endcapture %}
{% capture pnpm_panel %}
Install with pnpm.
{% endcapture %}
{% capture yarn_panel %}
The Yarn panel is deliberately taller so synchronized switching exercises scroll stability.

- Install Yarn globally.
- Keep the lockfile committed.
- Re-run the build after dependency changes.

[Continue to the cross-page restoration fixture](../tabs-restoration/).
{% endcapture %}
{% capture package_tabs %}
{% include components/tab.html label="npm" content=npm_panel %}
{% include components/tab.html label="pnpm" content=pnpm_panel %}
{% include components/tab.html label="Yarn" content=yarn_panel %}
{% endcapture %}
{% include components/tabs.html content=package_tabs sync="package-manager" persist=true %}

This reordered group omits `pnpm`. Selecting `pnpm` above leaves this group unchanged; selecting `npm` or `Yarn` synchronizes it without moving focus here.

{% capture reordered_tabs %}
{% include components/tab.html label="Yarn" content=yarn_panel %}
{% include components/tab.html label="npm" content=npm_panel %}
{% endcapture %}
{% include components/tabs.html content=reordered_tabs sync="package-manager" persist=false %}

Pointer selection and Arrow Left/Right, Home, and End update both selection and focus. Arrow navigation wraps at either end and reverses in right-to-left layouts; Home and End still select the first and last labels in source order. Tab leaves the tab list for the selected panel's first focusable content, or the panel itself when it has no focusable content. Synchronization keeps focus in the initiating group and keeps that group at the same viewport position when a taller panel above it changes.

When no selection is saved, the first synchronized group supplies its first label to matching groups. A missing or invalid saved label falls back to each group's first panel if that group lacks the exact label. Storage denial keeps selection and synchronization working in memory. Persistence is enabled for a sync key if any group using that key requests it; a receiving group need not also set `persist=true`.

## In-memory synchronization

Without `persist`, synchronized groups share a selection only on the current page. Labels are case-sensitive: `Yarn` and `yarn` are different choices. The independent example above also sets `persist=true` to demonstrate that it has no effect without a `sync` key.

{% capture memory_tabs %}
{% include components/tab.html label="npm" content=npm_panel %}
{% include components/tab.html label="Yarn" content=yarn_panel %}
{% endcapture %}
{% include components/tabs.html content=memory_tabs sync="in-memory-package" %}

{% capture case_tabs %}
{% include components/tab.html label="yarn" content=yarn_panel %}
{% include components/tab.html label="npm" content=npm_panel %}
{% endcapture %}
{% include components/tabs.html content=case_tabs sync="in-memory-package" %}
