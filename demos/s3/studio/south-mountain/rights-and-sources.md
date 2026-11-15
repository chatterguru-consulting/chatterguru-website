# South Mountain I-70, Maryland: data sources and credits

This page is the S³ Workbench Cesium Scenario Studio exported for the public website.
The scene, target motion and sensor overlays come from the Workbench export at source revision `3d10a2eb64faa719a4a7557f0413b937e0b33f2e`.
Your browser draws them. The sensors are simulated with generic, educational models, and the
targets and missions are fictional.

## Included

| Item | Source | Terms |
| --- | --- | --- |
| 3D globe library | CesiumJS 1.119.0, self-hosted, unmodified | Apache License 2.0 |
| Basemap “Satellite” (loaded from USGS while you view) | USGS The National Map: Orthoimagery: the live `USGSImageryOnly` tile service at basemap.nationalmap.gov. USGS assembles it from several regional imagery and map sources. | Public domain U.S. Government data; credit USGS |
| Basemap “Topo” (loaded from USGS while you view) | USGS The National Map: Imagery Topo: the live `USGSImageryTopo` tile service at basemap.nationalmap.gov. USGS assembles it from several regional imagery and map sources. | Public domain U.S. Government data; credit USGS |
| Basemap “Map” (loaded from USGS while you view) | USGS The National Map: Topo: the live `USGSTopo` tile service at basemap.nationalmap.gov. USGS assembles it from several regional imagery and map sources. | Public domain U.S. Government data; credit USGS |
| Basemap “Relief” (loaded from USGS while you view) | USGS The National Map: Shaded Relief: the live `USGSShadedReliefOnly` tile service at basemap.nationalmap.gov. USGS assembles it from several regional imagery and map sources. | Public domain U.S. Government data; credit USGS |
| Close-up aerial photography over the scene | USDA National Agriculture Imagery Program (NAIP) from the USGS NAIP Imagery service (service metadata dated January 2025; nominal resolution about 0.6 m, which varies by acquisition). 665 tiles baked at zoom 15–17; they fade in as the camera comes down. | Public domain; credit USDA NAIP / USGS |
| Buildings, roads and other map features | OpenStreetMap (483 buildings, 404 roads, 928 landcover, 192 streams). Download the extract used here: osm-derived-data.geojson (osm-derived-data.geojson) | © OpenStreetMap contributors (https://www.openstreetmap.org/copyright); extract offered under the Open Database License 1.0 (https://opendatacommons.org/licenses/odbl/1-0/) |
| Terrain | USGS 3D Elevation Program (public domain) | See source |
| Vehicle and aircraft models | S³ Workbench synthetic models | Chatterguru Consulting LLC |

## Left out of the public page

- Cesium ion, Cesium World Terrain and Google or Bing tiles: no keys or paid services are used.
- Esri basemaps and the OpenStreetMap tile servers used by the private Workbench.
- Cesium sample models and third-party car and bus meshes, replaced with S³ synthetic models.
- The Workbench service worker and install manifest.
