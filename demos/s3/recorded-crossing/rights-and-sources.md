# Recorded Crossing Replay — Provenance, Rights & Verification Notes

## Evidence Kind
- **Classification**: `recorded-workbench` (authored fictional two-target crossing scenario executed through the Chatterguru S3 Studio HDF5 recording pipeline).
- **Scenario ID**: `website-fictional-crossing-v1` (fictional 20 s crossing paths at 5 s CPI cadence; unclassified generic textbook waveforms and planar CV Kalman tracking).

## Exact Recording & Source Identities
- `source_head`: `d808dbb2edda382be018e9d1c3f19bdea9896575`
- `source_fingerprint`: `3b9aeda78d4e41ad83c3ad5ee2a8d48d41a1289b44eeb2c9da1fb322477ecc40`
- `session_manifest_sha256`: `ab8bc999f016686a68c738913cedd218d25b530e99b22aeeddc01be3a1f30419`
- `scientific_digest`: `f49fc309bb399380f3cc00ff6e446cbd75e827806155f455788cd388a4438232`

## Retained Captures & Rendering
- Each PNG image (`1380 x 696`, rendered at 11.5 x 5.8 in @ 120 DPI) was rendered deterministically with `eccm_sandbox.recording.tactical_view.draw_tactical` directly from the reopened HDF5 `SessionReader` frames (`bounds_m=(800, 1250, -150, 150)`, `rdm_bounds=(0, 2200, -24, 24)`).
- `cpi-1.png` (`reference-0`, t = 2.5 s): 2 observations, 2 track states, source SHA-256 `e1b21d14b5a54d699949b1c176930f9d18674fecc6716a4d81a75d758c2292bc`
- `cpi-2.png` (`reference-1`, t = 7.5 s): 2 observations, 2 track states, source SHA-256 `158e61df335a223facb77f3cb7ebc6def0d754b11e90d687e0c2d4b658748659`
- `cpi-3.png` (`reference-2`, t = 12.5 s): 2 observations, 2 track states, source SHA-256 `26017634b5e94b356dca4ed7b055aa3a5d8735e9f1a2c06ccf33817ff0128e6d`
- `cpi-4.png` (`reference-3`, t = 17.5 s): 2 observations, 2 track states, source SHA-256 `3ccc4b926234bfd3bb2a920c94df1157a6e8a7fa1e840189eae4ee38115bc5df`

## Third-Party Data & Network Dependencies
- **None**: This demo uses purely authored synthetic East-North geometry (`map_anchor=None`), bundled local CSS/JS/JSON/PNG assets, zero external CDNs, and zero runtime network calls (`default-src 'none'`).
