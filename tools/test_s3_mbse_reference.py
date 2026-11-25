"""Static checks for the public engineering documentation and its export links."""

from html.parser import HTMLParser
import json
from pathlib import Path
import unittest
from urllib.parse import urlsplit

SITE = Path(__file__).resolve().parents[1]
REFERENCE = "s3-engineering-reference.html"
EXPLORER = "s3-mbse.html"


class PageIndex(HTMLParser):
    def __init__(self, name):
        super().__init__()
        self.ids = []
        self.links = []
        self.diagrams = set()
        self.feed((SITE / name).read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        fields = dict(attrs)
        if "id" in fields:
            self.ids.append(fields["id"])
        if "data-diagram" in fields:
            self.diagrams.add(fields["data-diagram"])
        for attr in ("href", "src"):
            if attr in fields:
                self.links.append(fields[attr])


class MbseReferenceTest(unittest.TestCase):
    def test_documentation_links_resolve_in_pages_and_export(self):
        pages = {name: PageIndex(name) for name in (REFERENCE, EXPLORER)}
        export = json.loads((SITE / "assets/s3-mbse-data.json").read_text(encoding="utf-8"))
        explorer_routes = pages[EXPLORER].diagrams | {row["id"] for row in export["archipelago_slices"]}
        for name, page in pages.items():
            self.assertEqual(len(page.ids), len(set(page.ids)), name)
            for href in page.links:
                with self.subTest(page=name, url=href):
                    link = urlsplit(href)
                    if link.scheme or link.netloc:
                        continue
                    destination = link.path.lstrip("/") or name
                    self.assertTrue((SITE / destination).is_file(), destination)
                    if link.fragment and destination in pages:
                        targets = set(pages[destination].ids)
                        if destination == EXPLORER:
                            targets |= explorer_routes
                        self.assertIn(link.fragment, targets)

    def test_studio_and_systems_engineering_link_to_reference(self):
        for name in (EXPLORER, "systems-engineering.html", "s3-studio.html"):
            with self.subTest(page=name):
                self.assertIn(REFERENCE, PageIndex(name).links)


if __name__ == "__main__":
    unittest.main()
