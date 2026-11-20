"""The site as an installable app: manifest, icons, service worker and page tags.

The browser checks (install, offline, what is cached) are in verify_site_app.py.
"""

import json
from pathlib import Path
import re
import struct
import unittest

SITE = Path(__file__).resolve().parents[1]


def png_size(path: Path) -> tuple[int, int]:
    head = path.read_bytes()[:24]
    assert head[:8] == b"\x89PNG\r\n\x1a\n", path
    return struct.unpack(">II", head[16:24])


class SiteAppTest(unittest.TestCase):
    def test_manifest_is_installable(self):
        m = json.loads((SITE / "manifest.webmanifest").read_text(encoding="utf-8"))
        self.assertEqual(m["display"], "standalone")
        self.assertEqual(m["scope"], "/")
        self.assertTrue(m["start_url"].startswith("/") and (SITE / m["start_url"].split("?")[0].lstrip("/")).is_file())
        sizes = {}
        for icon in m["icons"]:
            path = SITE / icon["src"].lstrip("/")
            w, h = png_size(path)
            self.assertEqual(icon["sizes"], f"{w}x{h}")
            sizes.setdefault(icon.get("purpose", "any"), set()).add(w)
        self.assertTrue({192, 512} <= sizes["any"])
        self.assertIn(512, sizes["maskable"])
        for shortcut in m["shortcuts"]:
            self.assertTrue((SITE / shortcut["url"].split("#")[0].lstrip("/")).is_file())
        self.assertEqual(png_size(SITE / "assets/icons/apple-touch-icon.png"), (180, 180))

    def test_every_page_and_scene_links_the_app(self):
        pages = sorted(p for p in SITE.glob("*.html") if p.name != "offline.html")
        scenes = sorted(SITE.glob("demos/s3/studio/*/index.html")) + sorted(SITE.glob("demos/s3/aesa/*/index.html"))
        self.assertGreaterEqual(len(scenes), 5)
        for page in pages + scenes:
            with self.subTest(page=page.relative_to(SITE).as_posix()):
                html = page.read_text(encoding="utf-8")
                self.assertEqual(html.count('href="/manifest.webmanifest"'), 1)
                self.assertIn('rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png"', html)
                self.assertNotIn('content="Radar Studio"', html)
                self.assertNotIn('href="manifest.webmanifest"', html)  # never the Workbench's own

    def test_service_worker_keeps_storage_small(self):
        sw = (SITE / "sw.js").read_text(encoding="utf-8")
        # Scene pages and their data, and other sites (map tiles), are never cached.
        self.assertIn("url.origin !== self.location.origin) return", sw)
        for prefix in ("/demos/s3/studio/", "/demos/s3/aesa/"):
            self.assertIn(f"path.startsWith('{prefix}')", sw)
        self.assertIn("/demos/s3/vendor/cesium-1.119.0/", sw)
        for limit in ("MAX_PAGES", "MAX_STATIC", "MAX_CESIUM"):
            self.assertRegex(sw, rf"const {limit} = \d+;")
        self.assertTrue((SITE / "offline.html").is_file())
        self.assertIn("const OFFLINE = '/offline.html'", sw)
        # Only the site script registers it; the scene pages never register a worker.
        js = (SITE / "assets/site.js").read_text(encoding="utf-8")
        self.assertIn('navigator.serviceWorker.register("/sw.js")', js)
        for scene in SITE.glob("demos/s3/*/*/index.html"):
            self.assertIsNone(re.search(r"serviceWorker\s*\.\s*register\s*\(", scene.read_text(encoding="utf-8")))


if __name__ == "__main__":
    unittest.main()
