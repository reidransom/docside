# Docside

Docside is a documentation theme for Jigyll, using stock Starlight as visual reference only.

## Start a new site

Install Git and Jigyll 1.13.0 or later, then create a site with Docside:

```sh
jigyll new my-docs --theme https://github.com/reidransom/docside.git
cd my-docs
```

The installer clones Docside into `_theme/docside/`.

Replace `_config.yml` with a minimal site configuration:

```yaml
title: My documentation
theme: docside
url: ""
baseurl: ""
navigation:
  - label: Overview
    link: /
defaults:
  - scope:
      path: ""
    values:
      layout: default
```

Replace `index.md` with an overview:

```markdown
---
title: Overview
permalink: /
---

Welcome to my documentation.

## Next steps

Add ordinary Markdown pages and list them in `_config.yml`.
```

Serve the site from its new directory:

```sh
jigyll serve --host 127.0.0.1 --port 4322
```

Open <http://127.0.0.1:4322/>. The generated site is `_site/`.

See [Getting started](docs/getting-started.md) for page and navigation examples, then read the guides under [`docs/`](docs/).

## Develop the theme

Theme maintainers should use the installed-consumer workflow in [Developing Docside](docs/development.md). It explains how to preview and rebuild this repository's living documentation without making a direct source build look like consumer-installation proof.

## Attribution

The theme retains upstream notices beside shipped third-party assets. Stock Starlight attribution is in `assets/starlight-LICENSE`, and the frozen Seti file-icon inventory is covered by `assets/file-tree-icons-LICENSE`. Search loads the [MIT-licensed MiniSearch](https://github.com/lucaong/minisearch/blob/v7.2.0/LICENSE.txt) directly from jsDelivr; its bundle is not vendored.
