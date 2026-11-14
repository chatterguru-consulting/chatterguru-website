# King Farm, Rockville, Maryland: data sources and credits

This page is the S³ Workbench Cesium Scenario Studio exported for the public website.
The scene, target motion and sensor products come from the Workbench export at source
revision `f149196683f28299afe18435b82f3201d70f63f8`. Your browser draws them. Targets and missions are fictional and the
sensor models are generic and educational.

## Included

| Item | Source | Terms |
| --- | --- | --- |
| 3D globe library | CesiumJS 1.119.0 (self-hosted under `demos/s3/vendor/`) | Apache License 2.0 |
| Basemap tiles (loaded at view time) | USGS The National Map: Imagery Only, Imagery Topo, Topo, Shaded Relief (`basemap.nationalmap.gov`) | Public domain (U.S. Government work); credit USGS |
| Aerial photography over the scene | USDA National Agriculture Imagery Program (NAIP), 0.6 m, via the USGS NAIP Imagery service; 1123 tiles baked at zoom 13–17 | Public domain; credit USDA NAIP / USGS |
| Buildings and roads | OpenStreetMap | © OpenStreetMap contributors, Open Database License (ODbL) 1.0 – https://www.openstreetmap.org/copyright |
| Terrain | Terrain: synthetic rolling hills for illustration | See left |
| Vehicle and aircraft models | S³ Workbench synthetic models (`synth_*.glb`) | Chatterguru Consulting LLC |

## Left out of the public page

- Cesium ion, Cesium World Terrain and Google/Bing tiles: no keys or paid services are used.
- Esri basemaps and the OpenStreetMap tile servers used by the private Workbench.
- Cesium sample models and third-party car and bus meshes: replaced with S³ synthetic models.
- The Workbench service worker and install manifest.
