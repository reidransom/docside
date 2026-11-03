---
title: Overview
print_tree:
  - name: src
    type: directory
    open: false
    children:
      - name: print.css
        type: file
      - name: complete-output.txt
        type: file
---
Welcome to **Docifly Docs**, a documentation site built from ordinary Markdown. Read the [long guide](./guides/long-guide/) or explore the [code examples](./reference/code-examples/).

## Getting started

Choose a topic in the sidebar. This overview uses *emphasis*, **strong text**, and literal inline code such as `<article>`.

- Install the theme.
- Configure ordered navigation.
- Write Markdown and publish your site.

## Documentation workflow

1. Make a small, reviewable change.
2. Build the site locally.
3. Check the rendered result before publishing.

> Good documentation explains what a reader can do, not just how the software is arranged.

### Using `config.json`

Configuration is ordinary data. Keep the content separate from the theme.

## A small diagram

![Three connected documentation stages: write, build, read](./fixture.svg)

## Printable interactive content

The [external print destination](https://example.test/print-target?mode=complete)
prints its URL. [Internal navigation](./guides/long-guide/), the
[page fragment](#getting-started), [email](mailto:docs@example.test), and
[telephone](tel:+15550123) links do not add destination suffixes.

{% capture print_first %}The first printable tab panel remains visible.{% endcapture %}
{% capture print_second %}The hidden printable tab panel is also complete.{% endcapture %}
{% capture print_tabs %}{% include components/tab.html label="First print panel" content=print_first %}{% include components/tab.html label="Second print panel" content=print_second %}{% endcapture %}
{% include components/tabs.html content=print_tabs sync="acceptance-tabs" persist=true %}

{% include components/file-tree.html items=page.print_tree %}

## Component boundaries

{% include components/link-button.html text="Unsafe action must not render" href="javascript:alert(1)" %}
{% include components/link-button.html text="Unsafe data action must not render" href="data:text/html,test" %}
{% include components/link-card.html title="Unsafe card must not render" href="javascript:alert(1)" %}
{% include components/link-card.html title="Unsafe data card must not render" href="data:text/html,test" %}
{% include components/link-button.html text="Literal <mark>action</mark> & safe" href="/cards/" %}
{% include components/link-card.html title="Literal <mark>card</mark> & safe" href="/badges/" description="Literal <em>description</em> & safe" %}

{% capture boundary_body %}
### Nested component prose

Read **strong content** and [the destination](/cards/).

- First nested item
- Second nested item

> A nested quotation keeps its prose boundary.

{% include components/link-button.html text="Nested action" href="/cards/" variant="secondary" %}
{% endcapture %}
{% include components/card.html title="Literal <mark>title</mark> & safe" icon="star" content=boundary_body %}
{% include components/callout.html title="Literal <mark>notice</mark> & safe" icon="not-in-the-registry" content=boundary_body %}
