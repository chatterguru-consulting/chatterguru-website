# S³ Viewer release verification

The public Workbench export uses a static scene package and a shared Cesium build.
The recorded radar replay keeps its separate schema 1 evidence format. This
procedure exercises the viewer during a real Chromium load and playback.

## Run the checks

Use Python 3.11 or later, an installed Chrome or Edge, and Playwright 1.48 or
later in a validation environment. Obtain the pinned Cesium package directly
from the npm registry. The verifier compares its pinned archive digest and
every shipped build and notice file without extracting the archive.

```powershell
python -B -m unittest discover -s tools
python -B tools/verify_s3_preview.py .
Invoke-WebRequest 'https://registry.npmjs.org/cesium/-/cesium-1.119.0.tgz' -OutFile "$env:TEMP/cesium-1.119.0.tgz"
python -B tools/verify_s3_studio.py . --cesium-tarball "$env:TEMP/cesium-1.119.0.tgz" --report "$env:TEMP/s3-browser-report.json"
```

The verifier checks every scene folder under `demos/s3/studio/`, including
file inventory, digests, local paths and emails in scene text, credits, viewer
and replay evidence, and Cesium assets. The byte totals include each scene's
manifest and exclude the separately shared Cesium library.

Browser checks use 1360×900, 390×844 and 320×568 viewports. Each browser opens
the globe on loopback, checks the visible credits and evidence label, clicks
Play and samples the clock after 10 seconds. The report records network hosts,
unexpected requests, missing assets and console errors. It blocks requests
outside the site origin and HTTPS `basemap.nationalmap.gov`. An unavailable
allowed service can still cause a failed load. The request test exercises the
load and playback path under Chromium and the asset checks establish byte
identity.

## Asset and public claims review

The site correctly distinguishes the recorded radar replay, Workbench scene
exports and illustrative JavaScript explorers. The recorded crossing was
verified separately against the retained HDF5 archive, including all four
captures, values and decoded plot pixels. The two viewer scenes depict
fictional traffic and generic sensors. Their overlays need scene-specific
labels for simulated data and display representations.

| Source | Review and actions |
| --- | --- |
| CesiumJS | All 378 shipped build, license and third-party metadata files match npm `cesium@1.119.0`, plus the site's separate source note. Keep the Apache license and dependency notices together. [Upstream license](https://github.com/CesiumGS/cesium/blob/1.119/LICENSE.md) |
| Live USGS basemaps | Attribute The National Map and link to the four service descriptions. The imagery services list region-dependent providers and restrictions, including some Alaska imagery. The Maryland-local baked layer has its own separate source. [National Map terms](https://www.usgs.gov/faqs/what-are-terms-uselicensing-map-services-and-data-national-map) · [Imagery Only](https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer) · [Imagery Topo](https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer) · [Topo](https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer) · [Shaded Relief](https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer) |
| Baked USDA NAIP | USGS identifies the conterminous NAIP source as public domain and describes its service as primarily 0.6 m. Both scenes credit USDA NAIP and USGS. Record the source imagery date and actual resolution if the source metadata supports them. XYZ tile zoom and nominal source resolution describe different things. [USGS NAIP ImageServer](https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer) |
| OpenStreetMap | Both viewers display contributor credit. Their HTML also carries machine-readable geometry derived from OSM. Link a clearly scoped ODbL 1.0 extract or sufficient reconstruction materials from each scene's data credits. Cover the actual geometry shipped, including South Mountain's land cover and streams in addition to roads and buildings. The ODbL terms apply to the relevant database, with the viewer code, independent layers and rendered work covered according to their own terms. [OSMF attribution](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines) · [ODbL sections 4.3–4.6](https://opendatacommons.org/licenses/odbl/1-0/) |
| Terrain | South Mountain's source terrain and feature files match its radar site manifest at `0f06af1`. Its 3DEP elevation samples are represented on a 40 m scene grid. King Farm's page credits describe synthetic hills while the runtime subtitle claims a 1 m USGS 3DEP DEM. Align both displayed labels with the terrain each viewer actually loads. [USGS 3DEP](https://www.usgs.gov/3d-elevation-program) |
| Synthetic models | All seven GLBs in each scene match the Chatterguru radar source at the manifest revision, identify the repository’s synthetic CAD generator and contain their mesh data without external buffers or textures. |

Use the schema 2 manifests for the Cesium scenes and the schema 1 manifest for
the recorded crossing. The original wireframe previews have been retired.

To independently verify the recorded-crossing plots against the matching
Workbench archive, put the recording's radar checkout `src` directory on
`PYTHONPATH` and run:

```bash
python -B tools/verify_recorded_crossing.py demos/s3/recorded-crossing "<studio-run-directory>"
```

Match the radar revision and source fingerprint in the [recorded replay receipt](../demos/s3/recorded-crossing/source.json).
Use the rendering dependencies and fonts from the export environment for pixel parity.

## iPhone Safari acceptance

On the actual iPhone, open the review build over an approved reachable preview
URL. Loopback on the development PC is only usable from that PC. Record the iPhone
model, iOS version, browser, website revision and whether the phone is on Wi-Fi
or cellular. For both King Farm and South Mountain, start with a fresh tab.

1. From the S³ Studio gallery, open each scene. Time the first visible globe and first sharper
   local aerial imagery. Verify that building geometry and model motion appear.
2. Tap Play, watch the clock advance for ten seconds, then pause and scrub to
   a different time. Pinch and pan the globe. Switch basemap and return to
   aerial imagery.
3. Open Tools, switch the visual, infrared, radar and tactical lenses, and
   open and close the radar panel. Rotate the phone and repeat the panel toggle.
4. Check that Play, Tools, the evidence label and the data credits remain
   readable and tappable. Return to the Studio hub and open the recorded
   replay. Select the last capture and verify 17.5 s.
5. Record any blank globe, overlap, missing credits, excessive load delay or
   repro steps. Keep the iPhone gate pending until this result is recorded.
