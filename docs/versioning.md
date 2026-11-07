---
title: Versioned documentation
permalink: /versioning/
---

A version picker represents several independently built static sites. It does not make one Jigyll build contain every documentation release, preserve the current article path, or combine search results.

## Declare the matrix

Keep one ordered JSON matrix in the consumer repository. Every entry has a stable `id`, reader-facing plain-text `label`, Git `ref`, and normalized root-relative `baseUrl` with a trailing slash. The order is the picker order.

```json
{
  "entries": [
    { "id": "4.2", "label": "4.2", "ref": "v4.2.0", "baseUrl": "/" },
    { "id": "4.1", "label": "4.1", "ref": "v4.1.9", "baseUrl": "/4.1/" }
  ]
}
```

`baseUrl` is a complete public homepage path, not a permalink. It must stay on the same origin, start at `/`, use only normalized path segments, and end in `/`. The matrix is consumer-owned release policy; Docside does not infer versions from branches or tags.

## Stage every release

Run the matrix command from the Docside checkout used by your publication automation:

```sh
node tools/versioning/build.mjs \
  --matrix documentation-versions.json \
  --source /absolute/path/to/consumer \
  --stage /absolute/path/to/new-staging \
  --report /absolute/path/to/version-matrix-report.json
```

The command resolves every ref before building, clones and checks out every resolved commit in isolation, runs ordinary Jigyll once per entry with its own `baseurl`, and injects only the ordered public picker data plus that build's active identifier. Generated pages never receive Git refs or resolved commits. Each picker identifies its active version, keeps it as current text, and points every other version at its configured default-language homepage. It does not inherit an article route, query string, fragment, locale route, or the active build's hosting prefix.

Each checked-out consumer selects its own Docside revision. Historical sources must therefore already refer to a theme revision that understands the generated picker data. Rebuild every entry when the matrix changes: adding, removing, relabeling, or reordering an entry changes every generated picker.

## Promote a successful stage

`--stage` is a disposable staging location, not a deployment target. The command replaces it only after every checkout, Jigyll build, and composition succeeds; a failed run leaves an existing stage intact. Its JSON report records the ordered entries, resolved commits, Jigyll version, theme identity when available, isolated build destinations, and final status or failed phase.

Promotion remains your deployment system's responsibility. Do not point `--stage` at the currently deployed directory. Publish the successful staged directory with your ordinary static-host workflow only after your deployment checks pass. A changed public matrix invalidates cached historical output: purge or version cache keys according to your host's policy.

Each release remains a separate static site under its configured base URL. Its assets, navigation, canonical URLs, 404 page, and search corpus are scoped to that release.
