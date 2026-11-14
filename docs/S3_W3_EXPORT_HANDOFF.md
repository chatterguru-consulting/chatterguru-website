# S3 Website Export Handoff (W3 / W5)

**Producer**: Gemini (`chatterguru-radar-eccm-sandbox` branch `feat/w3-website-scenario-export`, `chatterguru-website` branches `gemini/s3-workbench-exports` and integrated PR #13 `claude/s3-site-preview`)
**Radar Source Commit (`source_head`)**: `d808dbb2edda382be018e9d1c3f19bdea9896575`

This handoff delivers the W3 Workbench exporter (`scripts/export_website_scenarios.py`, `tests/test_website_export.py`), the three verified static S3 preview bundles under `demos/s3/`, `.gitattributes` (`demos/s3/** -text` so LF byte digests are preserved across Windows/macOS/Linux checkouts), the retained HDF5 recording receipt for independent pixel/digest re-verification, and the dependency/rights/tile-policy ledger.

---

## 1. Exported Static Bundles (`demos/s3/`)

All three bundles conform to `website-demo-manifest.json` (`schema: 1`), enforce same-origin CSP (`default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'`), use normalized LF (`\n`) text endings, make zero runtime network requests, and remain well below the `15,000,000`-byte bundle ceiling.

### 1.1 `demos/s3/recorded-crossing/` (`recorded-workbench`)
- **Bundle Size**: `732,125` bytes (`10` files verified including `website-demo-manifest.json`)
- **Scenario**: `website-fictional-crossing-v1` (`duration_s=20.0`, `cadence_s=5.0`, 4 CPI frames)
- **Evidence Identity (`source.json` & `website-demo-manifest.json`)**:
  - `kind`: `"recorded-workbench"`
  - `source_head`: `d808dbb2edda382be018e9d1c3f19bdea9896575`
  - `source_fingerprint`: `3b9aeda78d4e41ad83c3ad5ee2a8d48d41a1289b44eeb2c9da1fb322477ecc40`
  - `session_manifest_sha256`: `ab8bc999f016686a68c738913cedd218d25b530e99b22aeeddc01be3a1f30419`
  - `scientific_digest`: `f49fc309bb399380f3cc00ff6e446cbd75e827806155f455788cd388a4438232`
- **Frame Digests (`frames.json`)**:
  - `reference-0` (`2.5 s`, `cpi-1.png`): `obs=2`, `tracks=2`, `source_sha256=e1b21d14b5a54d699949b1c176930f9d18674fecc6716a4d81a75d758c2292bc`
  - `reference-1` (`7.5 s`, `cpi-2.png`): `obs=2`, `tracks=2`, `source_sha256=158e61df335a223facb77f3cb7ebc6def0d754b11e90d687e0c2d4b658748659`
  - `reference-2` (`12.5 s`, `cpi-3.png`): `obs=2`, `tracks=2`, `source_sha256=26017634b5e94b356dca4ed7b055aa3a5d8735e9f1a2c06ccf33817ff0128e6d`
  - `reference-3` (`17.5 s`, `cpi-4.png`): `obs=2`, `tracks=2`, `source_sha256=3ccc4b926234bfd3bb2a920c94df1157a6e8a7fa1e840189eae4ee38115bc5df`
- **Retained HDF5 Receipt (Radar repo local output)**: `<radar-checkout>\outputs\website_export_receipts\s3-fictional-crossing-recording`

### 1.2 `demos/s3/king-farm/` (`browser-preview`)
- **Bundle Size**: `6,709,744` bytes (`7` files verified including `website-demo-manifest.json`)
- **Evidence Identity**: `kind = "browser-preview"`, `source_head = "d808dbb2edda382be018e9d1c3f19bdea9896575"`
- **Bundled Scene Geometry & Precomputed Telemetry**:
  - `320` of `453` OSM building footprints, `55` of `55` road polylines, `120` corner dihedral glint markers
  - `61` frames (`0..60 s` @ `1 Hz`) with 24x32 uint8 Range-Doppler matrices, target SNR, and visibility
  - Self-contained downloadable `scene-data.json`, `mission.czml`, `mission.connect`, and per-bundle `rights-and-sources.md`

### 1.3 `demos/s3/mountain-ridge/` (`browser-preview`)
- **Bundle Size**: `5,606,993` bytes (`7` files verified including `website-demo-manifest.json`)
- **Evidence Identity**: `kind = "browser-preview"`, `source_head = "d808dbb2edda382be018e9d1c3f19bdea9896575"`
- **Bundled Scene Geometry & Precomputed Telemetry**:
  - South Mountain Ridge (Boonsboro, MD) 3DEP ridge site
  - `260` of `483` building footprints, `220` of `404` road polylines, `115` corner dihedral glint markers
  - `61` frames (`0..60 s` @ `1 Hz`) with 24x32 uint8 Range-Doppler matrices, target SNR, and visibility
  - Self-contained downloadable `scene-data.json`, `mission.czml`, `mission.connect`, and per-bundle `rights-and-sources.md`

---

## 2. External Dependency, Rights & Tile-Policy Ledger

The desktop Cesium Workbench (`export_cesium_studio`) references external tile servers, CDNs, and multi-megabyte `.glb` assets that are **intentionally omitted** from these public static website bundles:

| Asset / Service | Disposition in Website Bundles | Policy / Technical Reason |
|---|---|---|
| OpenStreetMap Vector Footprints & Roads | **Included (baked local ENU JSON + attributed)** | © OpenStreetMap contributors, distributed under ODbL 1.0 (`https://www.openstreetmap.org/copyright`); attribution recorded in each bundle's `rights-and-sources.md` |
| Live OSM Raster Tiles (`tile.openstreetmap.org`) | **Excluded** | Respects OSMF Tile Usage Policy (`https://operations.osmfoundation.org/policies/tiles/`), avoiding unauthorized third-party tile hotlinking on a public static site |
| Esri ArcGIS REST Satellite / Topo Imagery (`services.arcgisonline.com`) | **Excluded** | Zero-external-network same-origin CSP (`default-src 'none'`) and third-party imagery terms |
| CesiumJS 1.119 CDN (`cesium.com/downloads/cesiumjs/releases/1.119/`) | **Excluded** | Apache-2.0 library omitted to eliminate third-party script requests; `mission.czml` remains downloadable for local CesiumJS / STK users |
| USGS 3DEP Bare-Earth Terrain (`elevation.nationalmap.gov`) | **Included (baked DEM grid + attributed)** | Public domain elevation grid baked directly into local ENU `scene-data.json` |
| 3D `.glb` Vehicle & Aircraft Meshes (`sedan.glb` 16.7 MB, `CarConcept.glb` 11.8 MB, `GroundVehicle.glb` 6.1 MB, `ToyCar.glb` 5.4 MB, `synth_*.glb`) | **Excluded** | Single meshes exceed the 15 MB bundle ceiling (`generate_scenario_czml(scenario)` is called directly instead of `scenario.export_czml()` to avoid copying `.glb` CAD packets) |

### Evidence Labeling Rule (`evidence.kind`)
- `recorded-crossing` uses `evidence.kind = "recorded-workbench"` and is backed pixel-for-pixel by the HDF5 Workbench Session archive via `verify_recorded_crossing.py`.
- `king-farm` and `mountain-ridge` use `evidence.kind = "browser-preview"`: browser JS projects exported ENU vectors, beam geometry, and 4/3-Earth LOS rays live, while the 24x32 Range-Doppler tiles and detections are precomputed telemetry from `compile_mobile_stream_frames`. Neither scene claims to stream live raw CPI I/Q recordings in the browser.

---

## 3. Verification Commands & Observed Results

### Radar Exporter & Unit Tests
```powershell
cd <radar-checkout>
python -m ruff check scripts/export_website_scenarios.py tests/test_website_export.py
$env:PYTHONPATH="src"
python -m pytest --basetemp=outputs/pytest_tmp_web tests/test_website_export.py -v
```
- `ruff check`: `All checks passed!`
- `pytest`: `3 passed in 10.81s`

### Production Bundle Export
```powershell
cd <radar-checkout>
$env:PYTHONPATH="src"
python -B scripts/export_website_scenarios.py `
  --output-root outputs/website_bundles/demos/s3 `
  --recording-dir outputs/website_export_receipts/s3-fictional-crossing-recording
```

### Site & Bundle Verifiers (`tools/`)
```powershell
cd <website-checkout>
$env:PYTHONPATH="<radar-checkout>\src;<website-checkout>\tools"
python -B tools\verify_s3_preview.py . --bundle demos\s3\recorded-crossing
python -B tools\verify_s3_preview.py --bundle demos\s3\king-farm
python -B tools\verify_s3_preview.py --bundle demos\s3\mountain-ridge
python -B tools\verify_recorded_crossing.py demos\s3\recorded-crossing <radar-checkout>\outputs\website_export_receipts\s3-fictional-crossing-recording
python -B -m unittest discover -s tools -v
```
