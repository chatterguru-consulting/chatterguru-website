# AESA ground surveillance, farmland near Poolesville, Maryland: data sources and credits

This page is the S³ Workbench Cesium Scenario Studio exported for the public website.
The scene, target motion and sensor overlays come from the Workbench export at source revision `839a8017cd8d1f8a157f9fb37dee1d4a046f2aff`.
Your browser draws them. The sensors are simulated with generic, educational models, and the
targets and missions are fictional.

## Included

| Item | Source | Terms |
| --- | --- | --- |
| 3D globe library | CesiumJS 1.119.0, self-hosted, unmodified | Apache License 2.0 |
| Basemap “Satellite” (loaded from USGS while you view) | USGS The National Map: Orthoimagery: the live `USGSImageryOnly` tile service at basemap.nationalmap.gov. | Public domain U.S. Government data; credit USGS |
| Basemap “Topo” (loaded from USGS while you view) | USGS The National Map: Imagery Topo: the live `USGSImageryTopo` tile service at basemap.nationalmap.gov. | Public domain U.S. Government data; credit USGS |
| Basemap “Map” (loaded from USGS while you view) | USGS The National Map: Topo: the live `USGSTopo` tile service at basemap.nationalmap.gov. | Public domain U.S. Government data; credit USGS |
| Basemap “Relief” (loaded from USGS while you view) | USGS The National Map: Shaded Relief: the live `USGSShadedReliefOnly` tile service at basemap.nationalmap.gov. | Public domain U.S. Government data; credit USGS |
| Ground | Flat at the radar site's height: the AESA model assumes flat ground around the site. | — |
| Radar, camera and SAR simulation | S³ AESA search-while-track model: statistical detections for the whole run, an IQ re-check of up to 12 flagged dwells, a rendered LWIR camera, and AESA-cued airborne SAR chips where the site has a SAR scene. Generic, educational parameters; fictional targets. | Chatterguru Consulting LLC |
| Vehicle and aircraft models | S³ Workbench synthetic models | Chatterguru Consulting LLC |

## Left out of the public page

- Cesium ion, Cesium World Terrain and Google or Bing tiles: no keys or paid services are used.
- Esri basemaps and the OpenStreetMap tile servers used by the private Workbench.
- Cesium sample models and third-party car and bus meshes, replaced with S³ synthetic models.
- The Workbench service worker and install manifest.
