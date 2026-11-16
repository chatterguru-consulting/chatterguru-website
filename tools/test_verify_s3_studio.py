"""Regression checks for the browser's Studio request policy."""

import hashlib
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from verify_s3_studio import request_allowed, verify_scene


class RequestPolicyTest(unittest.TestCase):
    def test_only_exact_site_origin_and_https_usgs(self):
        origin = "http://127.0.0.1:8000"
        for address in (
            origin + "/index.html", "https://basemap.nationalmap.gov/tile",
            "https://basemap.nationalmap.gov:443/tile", "data:image/png;base64,AA==",
            f"blob:{origin}/resource",
        ):
            with self.subTest(address=address):
                self.assertTrue(request_allowed(address, origin))
        for address in (
            "http://127.0.0.1:8001/index.html", "http://basemap.nationalmap.gov/tile",
            "https://basemap.nationalmap.gov:8443/tile", "https://basemap.nationalmap.gov.example.invalid/",
            "https://basemap.nationalmap.gov@example.invalid/", "https://user@basemap.nationalmap.gov/",
            "file:///local/document", "blob:https://example.invalid/resource",
        ):
            with self.subTest(address=address):
                self.assertFalse(request_allowed(address, origin))


class ScenePackageTest(unittest.TestCase):
    def test_reject_private_metadata_even_with_valid_file_digests(self):
        with TemporaryDirectory() as temp:
            bundle = Path(temp)
            (bundle / "index.html").write_text(
                '<script src="../../vendor/cesium-1.119.0/Cesium.js"></script>'
                '<p>USGS · OpenStreetMap</p><a href="rights-and-sources.md">Credits</a>',
                encoding="utf-8",
            )
            (bundle / "rights-and-sources.md").write_text("USGS · OpenStreetMap", encoding="utf-8")
            evidence = {"kind": "workbench-export", "source_head": "1" * 40, "scene_id": "king_farm",
                        "exporter": "scripts/publish_website_viewer.py"}

            def write_manifest():
                files = {}
                for name in ("index.html", "rights-and-sources.md"):
                    data = (bundle / name).read_bytes()
                    files[name] = {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
                (bundle / "website-demo-manifest.json").write_text(
                    json.dumps({"schema": 2, "evidence": evidence, "files": files}), encoding="utf-8"
                )

            write_manifest()
            self.assertEqual(verify_scene(bundle)["verified_files"], 2)
            ledger = bundle / "rights-and-sources.md"
            for unsafe in ("file:///fixture/private", "X:/Users/fixture/private", "fixture@example.invalid"):
                with self.subTest(unsafe=unsafe):
                    ledger.write_text("USGS OpenStreetMap " + unsafe, encoding="utf-8")
                    write_manifest()
                    with self.assertRaisesRegex(ValueError, "Local path or email"):
                        verify_scene(bundle)
            # A public scene must not point at a particular home (made-up examples).
            for unsafe in ("12 Example Hill Lane", '{"featureId": "bldg_12_example"}',
                           '{"displayName": "40-46"}', "3D Building: 12 Example",
                           "\\u003e12 Example (Townhouse)\\u003c", "8 Sample Crescent"):
                with self.subTest(unsafe=unsafe):
                    ledger.write_text("USGS OpenStreetMap " + unsafe, encoding="utf-8")
                    write_manifest()
                    with self.assertRaisesRegex(ValueError, "House-numbered label"):
                        verify_scene(bundle)
            # Street names, numbered roads and labels that merely contain a number are fine.
            ledger.write_text("USGS OpenStreetMap Example Hill Lane; I-70 Ridge Crossing; "
                              "Face 4 Radar Beam Frustum; 1st Sidelobe Footprint; Fixture road 2 Corridor (Paved Street)",
                              encoding="utf-8")
            write_manifest()
            self.assertEqual(verify_scene(bundle)["verified_files"], 2)
