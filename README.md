# Chatterguru Website Concept Pages

This folder contains static HTML mockups for replacing the current Squarespace placeholder at `https://chatterguru.com`.

## Preview locally

The 3D studio scenes under `demos/s3/studio/` need a web server. Opened by double-clicking (a `file:` address), the browser blocks their map imagery and models, and the page shows a notice instead of the scene. From this folder run:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8000/`. The other pages also work when opened directly.

## Source Inputs

- Live site check: the current site resolves to a Squarespace "Coming Soon" placeholder.
- Brochure text source: `Chatterguru Brochure Text.docx`.
- Brand image source: extracted from the brochure Word file as `assets/brochure-image.png`.

## Proposed Page Set

- `index.html`: homepage and company positioning.
- `capabilities.html`: overview of service lines.
- `systems-engineering.html`: systems engineering, integration, MBSE, and visualization.
- `radar-rf-ew.html`: RF, IR, satellite, radar, EW, and advanced sensing support.
- `software-cyber.html`: secure software, DevSecOps, embedded software, and cybersecurity.
- `ai-data-science.html`: AI, machine learning, analytics, optimization, and simulation.
- `engagement-models.html`: practical ways to start reviews, prototypes, and delivery-support work.
- `case-study-templates.html`: public-safe structures for future cleared case studies.
- `team.html`: expert team profiles.
- `contact.html`: founder contact information and inquiry topics.

## Squarespace Build Notes

- Use these as page copy and layout direction rather than a final Squarespace export.
- Keep the public radar/RF/EW language high-level and non-sensitive.
- Use the case study template page before publishing any client example, and only add cleared public content.
- Consider replacing the extracted brochure image with a polished brand/logo asset when available.
