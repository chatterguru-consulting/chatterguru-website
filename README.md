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
- [S³ Studio](s3-studio.html) is the demo gallery. It links to the King Farm and South Mountain Workbench exports, a recorded radar replay, and the original browser explorers. The evidence labels explain what produced each view.
- [Founder & Lab](about.html) covers Chatterpaul Joseph’s career, the lab, and community service. [Run for Jericho](run-for-jericho.html) has its own public address.
- [Contact](contact.html) lists ways to get in touch about a briefing or a technical question.

## Validate before publishing

```bash
python -B -m unittest discover -s tools
python -B tools/verify_s3_preview.py . --bundle demos/s3/recorded-crossing
```

See [S³ viewer verification](docs/S3_VIEWER_VERIFICATION.md) for the scene and Cesium integrity checks, browser tests, attribution, and the iPhone Safari checklist. GitHub Pages serves the live site from `main`. Review changes on the open website PR before merging.
