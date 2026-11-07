---
title: Getting started
permalink: /getting-started/
---

Install Docifly, configure your site, and write Markdown pages.

## Install Docifly in your site

Install [Jigyll](https://jigyll.r2ware.app/docs/installation/#mise-macos--linux--windows) 1.15.0 or later.

Create a new site in a new directory:

```sh
jigyll new my-docs --theme reidransom/docifly@latest
cd my-docs
```

Jigyll installs the theme into `_theme/docifly/` and sets `theme: docifly` in `_config.yml`.

`@latest` selects the latest published GitHub release. Until Docifly publishes a release, replace `latest` with a full 40-character commit SHA. You can also select an exact release tag.

## Configure your site

Edit `_config.yml`. A minimal configuration is:

```yaml
title: My documentation
theme: docifly
url: ""
baseurl: ""
navigation:
  - label: Overview
    link: /
  - label: Installation
    link: /installation/
defaults:
  - scope:
      path: ""
    values:
      layout: default
```

Set your site's title, navigation, and layout defaults in `_config.yml`.

The [navigation guide](../navigation/) explains nested groups. The [deployment guide](../deployment/) explains `url`, `baseurl`, and portable links.

## Write pages

Replace `index.md` with an overview:

```markdown
---
title: Overview
permalink: /
---

Welcome to the documentation.

## Next steps

Read the [installation guide](./installation/).
```

Create `installation.md`:

```markdown
---
title: Installation
permalink: /installation/
---

Install the theme, configure navigation, and build your site.

## Continue reading

Return to the [overview](../).
```

The layout renders the front-matter title as the page H1. Start article sections at H2 instead of repeating that title as another H1. The `permalink` is the public route, independent of the Markdown filename.

## Build and preview

From your site directory:

```sh
jigyll build
jigyll serve --host 127.0.0.1 --port 4322
```

Open <http://127.0.0.1:4322/>. The site output is `_site/`; the installed theme is under `_theme/`. Stop the server with Control-C.

## Override deliberately

A consumer can supply its own layouts, includes, or assets with the same names to override the installed theme. Ordinary documentation should not need those overrides. In particular, this documentation site supplies none: its real layout, styles, and browser enhancements come from Docifly, linked locally for development or installed for consumer verification.

Read [Theme internals](../internals/) before changing shared presentation. Do not turn an example that needs only Markdown into a consumer-specific theme fork.

Next, organize your pages with the [navigation guide](../navigation/), then [build and publish your site](../deployment/) at your chosen host.
