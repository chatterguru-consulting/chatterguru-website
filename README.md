# Chatterguru Consulting website

This is the source for [chatterguru.com](https://www.chatterguru.com/), a static site about Chatterguru Consulting and Sensor Scenario Studio (S³).

## Preview locally

From the repository root, start a loopback web server.

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Open [the local homepage](http://127.0.0.1:8000/). Use the server for the 3D scenes so the browser can load the imagery and models.

## Find your way around

- [Home](index.html) introduces the practice and links to the [capabilities](capabilities.html).
- [S³ Studio](s3-studio.html) is the demo gallery. It links to the King Farm and South Mountain Workbench exports (`demos/s3/studio/`), three AESA search-while-track scenes (`demos/s3/aesa/`), a recorded radar replay, and the original browser explorers. The evidence labels explain what produced each view.
- [S³ systems engineering](s3-mbse.html) hosts the ConOps, candidate requirements, SysML-style explorer and exported evidence. The [engineering reference](s3-engineering-reference.html) adds model theory, worked examples, and a public documentation coverage catalog. See the [MBSE documentation review guide](docs/S3_MBSE_DOCUMENTATION.md) when updating either page.
- [Learn sensor physics](s3-learn.html) opens the first interactive SAR lesson and the public learning roadmap. The [education production guide](docs/S3_EDUCATION_ROADMAP.md) links the coverage review, teaching references, and companion media plan.
- `demos/s3/shared/` holds the phone layout every 3D scene loads: on a phone the map gets the screen, and the controls live in one Menu sheet. The radar repository's `scripts/publish_website_viewer.py` writes it.
- [Founder & Lab](about.html) covers Chatterpaul Joseph’s career, the lab, and community service. [Run for Jericho](run-for-jericho.html) has its own public address.
- [Contact](contact.html) lists ways to get in touch about a briefing or a technical question.
- `team.html` and `case-study-templates.html` are forwarding pages. Nothing links to them on purpose: they send visitors who still have the old addresses to Founder & Lab and S³ Studio.
- `favicon.ico` is the browser tab icon, and `assets/og-s3-studio.jpg` is the picture shown when a page is shared.
- The site installs as an app ("Chatterguru") from a phone's browser: `manifest.webmanifest`, the icons in `assets/icons/`, and the service worker `sw.js`, which `assets/site.js` registers. The phone menu offers "Install app" where the browser supports it and the Add to Home Screen steps on iPhone. The worker keeps site pages and the pinned Cesium build on the phone, never the 3D scene pages or map tiles, and shows `offline.html` (reached only through the worker, so nothing links to it) when a page is not available offline. Change `VERSION` in `sw.js` when the site's styles or scripts change.

## Validate before publishing

```bash
python -B -m unittest discover -s tools
python -B tools/verify_s3_preview.py . --bundle demos/s3/recorded-crossing
python -B tools/verify_site_app.py . --browser msedge
```

`verify_site_app.py` (needs Playwright) checks that the browser can install the site, that the service worker takes over and works offline, and that it never stores scenes or map tiles.

`tools/verify_s3_studio.py` checks every Studio and AESA scene, plays each one in a browser at desktop and phone sizes, and fails a phone layout whose floating controls cover more than 15% of the screen.

See [S³ viewer verification](docs/S3_VIEWER_VERIFICATION.md) for the scene and Cesium integrity checks, browser tests, attribution, and the iPhone Safari checklist. GitHub Pages serves the live site from `main`. Review changes on the open website PR before merging.
