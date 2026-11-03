---
title: Tabs restoration fixture
permalink: /tabs-restoration/
---

This page verifies that a persistent synchronized selection restores on another page. Choose a package manager on the [main tabs fixture](../tabs/), then follow its Yarn-panel link here or navigate here directly.

## Restored selection

{% capture npm_restore %}
The restored npm panel.
{% endcapture %}
{% capture yarn_restore %}
The restored Yarn panel with a [focusable return link](../tabs/).
{% endcapture %}
{% capture pnpm_restore %}
The restored pnpm panel.
{% endcapture %}
{% capture restore_tabs %}
{% include components/tab.html label="Yarn" content=yarn_restore %}
{% include components/tab.html label="npm" content=npm_restore %}
{% include components/tab.html label="pnpm" content=pnpm_restore %}
{% endcapture %}
{% include components/tabs.html content=restore_tabs sync="package-manager" persist=true %}

Restoration matches the saved label, not its position: this page deliberately starts with `Yarn`, while the main guide starts with `npm`. Reload keeps the selected label when storage is available. With no saved choice, an unknown saved label, or denied storage, this page starts on `Yarn`. Every panel is readable without JavaScript and in print; leaving print restores the screen selection.
