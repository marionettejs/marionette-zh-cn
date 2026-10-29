# Reference fixture validation

AI assistance: **dot** helped write the fixture and browser checks. This is a small consumer example of the official Marionette implementation. English core documentation remains authoritative.

On **2026-10-24, 06:07:50.290–06:07:52.311 UTC**, a separate reference fixture passed **12 checks**, with **0 failures**, against its production build in system Chromium **154.0.8037.57** (Debian 13, headless). See the unchanged [dated result receipt](validation-2026-10-24.json) and [check source](checks.mjs).

The original Backstage prompt journey was **not independently replayed**. These are reference-fixture results, not an independent model benchmark or evidence of an assistant's success rate.

| Recorded component | Version |
| --- | --- |
| Node / npm | 24.19.0 / 11.9.0 |
| marionette / @mnjs/utils / @mnjs/radio / @mnjs/adapters | 5.0.0 each |
| lit-html | 3.3.3 |
| Vite / Playwright | 8.3.0 / 1.63.0 |

The clean lockfile installation and production build passed. The installed core documentation manifest identified source revision `0f2284ad4bbfe8c82ce82714471697a68c2acaeb`, version 5.0.0, and a clean source state. Five relevant installed documentation pages matched that pinned source and the manifest's hashes. Core registry tarball integrity matched the lockfile:

```text
sha512-/20gKRRRCGKH6JqmFnlSPE9E2wP/1zBtmNlSUF55cmlaOYudBZR9MgXNWJ0IjhnEnHE7iYSFi7uaJ7OdnrFaGg==
```

The 12 checks cover empty state; ordinary Enter adding three tasks once each; completion counts; global totals across all/active/completed filters; retention of the same draft input node and value; twelve completion/reversal cycles; filtered-row removal and fallback focus; adding under a completed filter; rejection of empty/whitespace submissions; synthetic composition guards; literal rendering of markup-shaped text; narrow-viewport overflow; and absence of observed browser errors or external page requests. The dated JSON gives the exact 12 check names. Only synthetic task data was used.

The first browser attempt timed out in a test helper after a checkbox's row was removed. The helper was corrected to click and check the resulting UI; the final 12-check run passed. This note reports that final run without claiming the earlier attempt passed.

For this publication selection, only the fixture's descriptive caption/title and npm project name were edited. Application behavior, dependency versions/integrities, and check source remain unchanged. **No build or browser checks were rerun for this selection.** The dated receipt belongs to the original reference fixture; it is not a new execution receipt for these editorial edits.

**NOT RUN:** real Chinese IME candidate selection and compositionend/Enter timing; native-language review; mainland China accessibility; independent model benchmarks; other browsers or physical mobile devices; a full accessibility audit; performance/scale validation; persistence across refresh; an independent core source-to-distribution rebuild audit. The narrow-viewport check is a geometry assertion, not visual review. Synthetic composition events test guards only and do not establish real IME correctness.

Use the [reproduction commands](README.md#复现检查) to run the supplied checks yourself. Fresh installation needs npm registry/cache access and an installed Chromium executable.
