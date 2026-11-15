"""Check the preview verifier against positive and negative controls."""

import hashlib
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from verify_s3_preview import MANIFEST, check_links, verify_bundle


class PreviewVerificationTest(unittest.TestCase):
    def setUp(self):
        tmp = TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        self.page = self.root / "index.html"
        self.page.write_text('<a id="intro" href="#intro">Intro</a>', encoding="utf-8")
        payload = self.page.read_bytes()
        self.data = {"schema": 1, "evidence": {"kind": "browser-preview", "source_head": "1" * 40},
                     "files": {"index.html": {"bytes": len(payload),
                                              "sha256": hashlib.sha256(payload).hexdigest()}}}
        self.write_manifest()

    def write_manifest(self):
        (self.root / MANIFEST).write_text(json.dumps(self.data), encoding="utf-8")

    def test_integrity_and_links(self):
        count, size = verify_bundle(self.root)
        self.assertEqual(count, 1)
        self.assertGreater(size, self.page.stat().st_size)
        self.assertEqual(check_links(self.root), (1, []))

    def test_same_size_corruption(self):
        self.page.write_bytes(self.page.read_bytes().replace(b"Intro", b"Other"))
        with self.assertRaisesRegex(ValueError, "digest mismatch"):
            verify_bundle(self.root)

    def test_extra_file_and_missing_file(self):
        extra = self.root / "extra.json"
        extra.touch()
        with self.assertRaisesRegex(ValueError, "inventory mismatch"):
            verify_bundle(self.root)
        extra.unlink()
        self.page.unlink()
        with self.assertRaisesRegex(ValueError, "inventory mismatch"):
            verify_bundle(self.root)

    def test_parent_and_case_collision_rejected(self):
        receipt = self.data["files"]["index.html"]
        for name in ("../index.html", "INDEX.html"):
            with self.subTest(name=name):
                self.data["files"][name] = receipt
                self.write_manifest()
                with self.assertRaisesRegex(ValueError, "Unsafe|Case-colliding"):
                    verify_bundle(self.root)
                del self.data["files"][name]

    def test_recording_evidence_requires_studio_identity(self):
        self.data["evidence"]["kind"] = "recorded-workbench"
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, "source identity"):
            verify_bundle(self.root)

    def test_schema_and_digests_require_exact_json_types(self):
        self.data["schema"] = True
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, "schema"):
            verify_bundle(self.root)
        self.data["schema"] = 1
        self.data["evidence"]["source_head"] = int("1" * 40)
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, "source identity"):
            verify_bundle(self.root)

    def test_duplicate_manifest_fields_are_rejected(self):
        manifest = self.root / MANIFEST
        manifest.write_text(manifest.read_text(encoding="utf-8").replace(
            '"schema": 1', '"schema": 1, "schema": 1', 1
        ), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Duplicate manifest field"):
            verify_bundle(self.root)

    def test_studio_v2_requires_export_identity_and_rights(self):
        self.data["schema"] = 2
        self.data["evidence"] = {
            "kind": "workbench-export", "source_head": "1" * 40, "scene_id": "mountain_ridge",
            "exporter": "scripts/publish_website_viewer.py", "cesium": "1.119.0",
        }
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, "rights-and-sources"):
            verify_bundle(self.root)
        ledger = b"Credits"
        (self.root / "rights-and-sources.md").write_bytes(ledger)
        self.data["files"]["rights-and-sources.md"] = {"bytes": len(ledger), "sha256": hashlib.sha256(ledger).hexdigest()}
        self.write_manifest()
        self.assertEqual(verify_bundle(self.root, expected_schema=2)[0], 2)
        with self.assertRaisesRegex(ValueError, "schema 1"):
            verify_bundle(self.root, expected_schema=1)
        self.data["evidence"]["source_head"] = "local checkout"
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, "export identity"):
            verify_bundle(self.root)

    def test_invalid_local_link_and_anchor(self):
        self.page.write_text('<a href="old.html">Old</a><img src="#miss"><a href="#miss">Missing</a>',
                             encoding="utf-8")
        _, errors = check_links(self.root)
        self.assertEqual(len(errors), 3)


if __name__ == "__main__":
    unittest.main()
