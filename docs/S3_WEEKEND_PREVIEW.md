# Sensor Scenario Studio website preview

## Goal

Make chatterguru.com a founder-led site for Chatterguru Consulting and the Sensor Scenario Studio (S³) project. Visitors should be able to open an example immediately, see what it demonstrates, and tell which figures were retained from a Workbench run. Keep the current Radar/RF/EW route and both classic concept explorer URLs. Keep the Run for Jericho page at its existing URL and link it from Founder/About and the footer. Review its campaign status with the owner before changing the current fundraising copy.

The production GitHub Pages site publishes from the root of the website repository's `main` branch. Use separate local checkouts and a local preview for the weekend review. Review demo assets before placing them in the public repository, including on a feature branch.

## Epics and slices

| Epic | Slices | Owner |
| --- | --- | --- |
| W1 · Founder-led site | W1.1 Home/Product/About navigation and compatibility for old URLs. W1.2 Founder and lab page with owner-approved biography. Remove former colleagues' profiles and images from the published page set. W1.3 Replace internal brochure instructions and placeholder pages with visitor-facing copy. W1.4 Link the Jericho story and preserve the original route. | Claude |
| W2 · S³ product experience | W2.1 Lead from the homepage to the Studio hub. W2.2 Add previews with useful controls, plain-language descriptions and an engineering evidence view. W2.3 Preserve the two classic demos and label their output as illustrative. | Claude, with Codex checking claims |
| W3 · Workbench export | W3.1 Produce a size-bounded same-origin static bundle with a stable manifest and rights ledger. W3.2 Pilot with King Farm and inventory every optional dependency. W3.3 Export a small retained Workbench recording with source-verified frames as a separate demo. W3.4 Evaluate Mountain Ridge as the next 3D candidate and defer the rest of the gallery until the first two demos pass review. | Gemini, with Codex checking exported evidence |
| W4 · Private briefings | W4.1 Record current private Workbench workflow and device acceptance separately from the public website. W4.2 Evaluate installability after the static demonstrations pass. Keep private authoring and execution workflows on their own authenticated service. | Deferred |
| W5 · Staging and review | W5.1 Confirm requirements and file ownership in the coordination logs. W5.2 Verify links, bytes, exact source evidence, browser behavior and asset rights. W5.3 Present an owner-review build, record approval for the exact candidate and prepare the deployment and revert instructions. | Gemini coordinates, Claude supplies the site candidate, Codex supplies independent checks |

## Weekend review target

1. Review the proposed Home → Studio → demo path and the Founder → Run for Jericho path at desktop and phone widths.
2. Try one recorded example backed by an actual Workbench archive. The proof-of-concept supplies four retained CPI snapshots at 2.5, 7.5, 12.5 and 17.5 seconds. The 20-second scenario uses authored fictional target motion. Doppler is on X and increasing range on Y. The companion panel distinguishes truth, observations and track estimates.
3. Add King Farm to the preview after Gemini supplies a bounded folder and identifies which views are client-generated, which are replayed, and what assets can be redistributed. If any dependency is unavailable, review the recorded example and track the King Farm gap explicitly.
4. Confirm the proposed social links, founder claims and release wording. Verify the classic demo URLs, legacy team route and marathon page from the integrated candidate. Record actual iPhone Safari behavior before claiming device acceptance.

A source-executed recording can itself be synthetic. The site should identify each demo by its actual data path. The conference PWA defaults use synthetic telemetry produced by the Cesium telemetry function. The stock Cesium Studio export references online libraries, imagery and models. Treat both as candidates for inspection and report from their actual payloads.

## Release evidence and preflight

- Gemini supplies the exact radar HEAD and source fingerprint, the original recording receipt and frame selection for recorded demos, and the staging bundle location. Document any external call, map or model source, redistribution terms, attribution and offline fallback.
- The initial bundle budget is 15,000,000 bytes including the manifest. Treat first-load behavior as a separate browser test. A King Farm preview using third-party dependencies should list them individually. OpenStreetMap data and the public tile service have different terms. [OSM licensing](https://www.openstreetmap.org/copyright) · [Tile usage policy](https://operations.osmfoundation.org/policies/tiles/).
- The local verifier checks the declared byte counts and SHA-256 digests, flags missing or extra payload files, and checks HTML references and anchors on the local staging copy. The manifest is not a signature. Match the recording identities and each displayed time, count and pane to the retained archive independently.
- Keep the static viewer on same-origin assets for the first pass. The replay prototype uses a page-level CSP. Verify actual response headers on the host before claiming host-level protections. Review any service worker and its scope separately. [CSP specification](https://www.w3.org/TR/CSP3/).
- Serve the proposed site on loopback and test desktop, 390 and 320 CSS-pixel widths. Check for keyboard-reachable controls, readable failure states, missing assets, unexpected network calls and actual phone behavior. Review GitHub Pages' hosting limits before expanding beyond a static educational portfolio. [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) · [Branch publishing behavior](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Provisional bundle handoff

The prototype uses `website-demo-manifest.json` with three keys. Confirm the contract with Gemini before wiring it into the production exporter.

- `schema` has integer value 1.
- `evidence` carries `kind` and `source_head` (full Git SHA). Use `recorded-workbench` for verified recordings, with `source_fingerprint`, `session_manifest_sha256` and `scientific_digest`. Use `browser-preview` for a simulation or visualization drawn in the browser. Put rights and source notes in their own listed file.
- `files` maps bundle-relative paths to `bytes` and `sha256`. It includes `index.html` and excludes the manifest itself.

```bash
python -B -m unittest discover -s tools
python -B tools/verify_s3_preview.py /path/to/staging-site --bundle /path/to/staging-site/demos/s3/recorded-crossing
python -m http.server 8767 --bind 127.0.0.1 --directory /path/to/staging-site
```

## Verify the recorded crossing against the original Workbench archive

Use the exact radar source revision and Python dependencies that produced this
recording. Put its `src` directory on `PYTHONPATH`. The verifier reopens the
read-only archive using the supported Studio reader, checks source and session
identities, compares the browser's embedded frame table to the exported table,
and checks every timestamp, frame digest, observation count and track-state count
against the recording. It renders each retained frame again and compares decoded
pixels. Rendering versions and fonts must match for pixel parity.

```bash
python -B tools/verify_recorded_crossing.py /path/to/recorded-crossing /path/to/studio-run
```

This command validates the existing four-frame prototype. Run the bundle and
browser checks separately for the King Farm export and the integrated website.
