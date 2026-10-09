---
title: Deployment
permalink: /deployment/
---

Jigyll produces static files. Publish the consumer's `_site/` output, not the theme repository, its installed Git checkout, or the Markdown source. No Node.js or server-side theme runtime is required to serve that output.

## Host at the root

For a site at the root of a domain, keep `baseurl` empty. Set `url` to your real public origin when deploying; leave it empty for the local documentation preview.

```yaml
url: https://docs.example.com
baseurl: ""
```

`docs.example.com` is an illustrative deployment origin, not a Docifly service. From the `my-docs` directory created in [Getting started](../getting-started/), build your site:

```sh
jigyll build
```

Publish the contents of `my-docs/_site/` at your domain root. To preview locally, use [Build and preview](../getting-started/#build-and-preview). A local HTTP preview is preferable to opening generated HTML with a `file:` URL: absolute asset paths and Clipboard API availability depend on an appropriate origin.

## Host under a prefix

For a site published at `https://example.com/docs/`, use:

```yaml
url: https://example.com
baseurl: /docs
```

The prefix starts with a slash and has no trailing slash. Page permalinks and navigation links still exclude it. For example, the code page's permalink and navigation link remain `/code/`, not `/docs/code/`.

The theme's URL filter adds the prefix to its asset and navigation URLs. The generated output must actually be served under `/docs/`; setting `baseurl` does not make a static host mount that directory automatically.

### Build and publish the prefixed site

After setting `baseurl: /docs` in your site's `_config.yml`, build from the same `my-docs` directory:

```sh
jigyll build
```

Publish the contents of `my-docs/_site/` at `/docs/` on your host, not at its root. The host must serve the generated files at that prefix; no changes to the generated HTML are needed.

### Distinguish preview from deployment

A successful root preview does not show that prefix mounting is configured correctly. Check the generated files at their intended `/docs/` URL, including article links and assets.

Theme maintainers can use the [separate prefixed-output example](#build-a-separate-prefixed-output) below to inspect an installed documentation consumer with an optional static server.

## Author portable article links

The Markdown filename and its public route are different concepts. This page is served at `/deployment/`, so a sibling-page link is relative to that route:

```markdown
Read [Getting started](../getting-started/).
```

Read [Getting started](../getting-started/). The same link resolves within `/docs/` when the site is hosted there.

The overview uses `./getting-started/` because its route is `/`. Images use the same rule: the Markdown guide links to `../media/workflow.svg`. Avoid root-absolute article links such as `/code/` when you want them to remain inside a deployment prefix.

## Publish a custom 404 page

Docifly supplies the `not-found` layout, but a theme cannot create a consumer route or configure a hosting provider. Add a root `404.md` to the consumer:

```yaml
---
title: Page not found
layout: not-found
permalink: /404.html
search_exclude: true
---
```

`jigyll new` creates a starter `404.html`. Remove that starter when adding `404.md`; two source files must not publish the same permalink. The only replacement file is the documented `404.md`—no layout, include, Sass, or theme asset is copied into the consumer.

The default page renders a `Page not found` heading and a `Back to home` link. Customize its escaped plain-text message and ordered recovery links in front matter:

```yaml
not_found:
  message: The requested documentation page may have moved.
  links:
    - text: Documentation home
      link: /
      variant: primary
    - text: Contact support
      link: https://example.com/support
      variant: minimal
```

Links use the hero action contract: `text` and `link` are required; variants are `primary`, `secondary`, or `minimal`. Root-relative links pass through the configured `baseurl`; malformed links are omitted. Set `search_exclude: true` so the missing-page message does not appear as documentation content.

### GitHub Pages

For a user or organization site at `/`, publish the generated `/404.html` at the repository root. For a project site such as `https://owner.github.io/docs/`, set `baseurl: /docs`; the generated recovery links and assets then retain that prefix. GitHub Pages serves the project's `/docs/404.html` for missing project routes while preserving HTTP status 404.

GitHub Pages setup is concrete host behavior, not a portable static-host guarantee. On another host, configure missing routes to serve the generated `404.html` while preserving HTTP 404. A local static server commonly returns 200 for a direct `/404.html` request and therefore cannot prove production fallback status.

## Maintainer verification from this repository

These examples are for theme maintainers in a Docifly checkout, not for a site created as `my-docs`. First create the installed documentation consumer using [Developing Docifly](../development/#preview-an-installed-consumer). Then, from the Docifly repository root, build its root-hosted output:

```sh
jigyll build --source .poc/living-docs
```

### Build a separate prefixed output

To inspect the same consumer at `/docs/` without changing its configuration:

```sh
jigyll build --source .poc/living-docs --baseurl /docs --destination "$PWD/.poc/prefix-preview/docs"
python -m http.server 4323 --bind 127.0.0.1 --directory .poc/prefix-preview
```

Open <http://127.0.0.1:4323/docs/>. Python's static server is an optional maintainer preview tool, not a consumer build dependency. Stop it with Control-C. Any static server that mounts the output at the prefix can serve the same unchanged files.

The destination is absolute because Jigyll resolves relative destinations from the consumer source directory, not the shell's working directory.

## Inspect what you publish

Use the navigation, follow an article link, load the image, and switch color modes on your chosen preview origin. These are useful manual observations, not an automated deployment gate or a claim about a production service.

Keep source files and installed themes out of the deployed output: build from your consumer directory and publish only `_site/`. For this repository's maintainer examples, build the separate documentation consumer rather than the theme repository root so historical evidence stays out of the published site. Review your hosting configuration separately; hosting-provider setup and production monitoring are outside this documentation workflow.
