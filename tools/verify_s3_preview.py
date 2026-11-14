"""Verify local website links and an optional, self-contained S³ demo bundle."""

from __future__ import annotations

import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import stat
from urllib.parse import unquote, urljoin, urlsplit

SITE_URL = "https://www.chatterguru.com/"
MAX_BUNDLE_BYTES = 15_000_000
MANIFEST = "website-demo-manifest.json"
SOURCE_KINDS = {"recorded-workbench", "browser-preview"}
SAFE_PART = re.compile(r"[A-Za-z0-9_][A-Za-z0-9_.-]*")
HEX_DIGEST = re.compile(r"[0-9a-f]+")


class Page(HTMLParser):
    """Collect local references and anchor targets without executing the page."""

    def __init__(self, path: Path):
        super().__init__()
        self.links = []
        self.anchors = set()
        self.feed(path.read_text(encoding="utf-8-sig"))
        self.close()

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if value is None:
                continue
            if key == "id" or (tag == "a" and key == "name"):
                self.anchors.add(value)
            if key in {"href", "src", "poster"}:
                relation = dict(attrs).get("rel") or ""
                if tag == "base":
                    raise ValueError("base URLs are outside the static preview contract")
                if key != "href" or tag != "link" or relation.lower() != "canonical":
                    self.links.append(value)


def check_links(root: Path) -> tuple[int, list[str]]:
    """Check local references and fragments across public static HTML."""
    pages = {p.relative_to(root).as_posix(): Page(p) for p in sorted(root.rglob("*.html"))
             if not any(part.startswith(".") for part in p.relative_to(root).parts)}
    errors = []
    for name, page in pages.items():
        for ref in page.links:
            url = urlsplit(urljoin(urljoin(SITE_URL, name), ref.strip()))
            if url.hostname not in {"www.chatterguru.com", "chatterguru.com"} or url.scheme not in {"http", "https"}:
                continue
            rel = unquote(url.path).lstrip("/")
            target = (root / rel).resolve()
            if not target.is_relative_to(root):
                errors.append(f"{name} → {ref}: escapes site root")
                continue
            if target.is_dir():
                target /= "index.html"
            if not target.is_file():
                errors.append(f"{name} → {ref}: missing file")
                continue
            parsed = pages.get(target.relative_to(root).as_posix())
            if parsed and url.fragment and unquote(url.fragment) not in parsed.anchors:
                errors.append(f"{name} → {ref}: missing anchor")
    return len(pages), errors


def _demo_file(path: Path) -> bool:
    info = path.lstat()
    if stat.S_ISLNK(info.st_mode) or getattr(info, "st_file_attributes", 0) & stat.FILE_ATTRIBUTE_REPARSE_POINT:
        raise ValueError(f"Linked bundle path: {path.name}")
    if stat.S_ISREG(info.st_mode):
        return True
    if stat.S_ISDIR(info.st_mode):
        return False
    raise ValueError(f"Unsupported bundle entry: {path.name}")


def _unique_json_fields(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"Duplicate manifest field: {key}")
        result[key] = value
    return result


def _is_digest(value, length):
    return type(value) is str and len(value) == length and HEX_DIGEST.fullmatch(value) is not None


def verify_bundle(bundle: Path) -> tuple[int, int]:
    """Verify one preview. Hashes check bytes against a separately reviewed manifest."""
    if _demo_file(bundle):
        raise ValueError("Bundle path must be a directory")
    manifest = bundle / MANIFEST
    if not _demo_file(manifest) or manifest.stat().st_size > 256_000:
        raise ValueError("Expected a bounded regular-file manifest")
    data = json.loads(manifest.read_text(encoding="utf-8"), object_pairs_hook=_unique_json_fields)
    if (type(data) is not dict or set(data) != {"schema", "evidence", "files"}
            or type(data["schema"]) is not int or data["schema"] != 1):
        raise ValueError("Expected website demo manifest schema 1")
    evidence = data["evidence"]
    if (type(evidence) is not dict or type(evidence.get("kind")) is not str
            or evidence["kind"] not in SOURCE_KINDS):
        raise ValueError("Unknown demo evidence kind")
    kind = evidence["kind"]
    required = ({"kind", "source_head", "source_fingerprint", "session_manifest_sha256", "scientific_digest"}
                if kind == "recorded-workbench" else {"kind", "source_head"})
    if set(evidence) != required or not _is_digest(evidence["source_head"], 40):
        raise ValueError("Missing or invalid source identity")
    if any(not _is_digest(evidence[key], 64) for key in required - {"kind", "source_head"}):
        raise ValueError("Missing or invalid recording identity")

    files = data["files"]
    if type(files) is not dict or "index.html" not in files or MANIFEST in files:
        raise ValueError("Manifest must list index.html and each dependency")
    casefold_paths = set()
    for name, attrs in files.items():
        if not all(SAFE_PART.fullmatch(part) for part in name.split("/")):
            raise ValueError(f"Unsafe bundle name: {name}")
        if name.casefold() in casefold_paths:
            raise ValueError(f"Case-colliding bundle name: {name}")
        casefold_paths.add(name.casefold())
        if (type(attrs) is not dict or set(attrs) != {"bytes", "sha256"}
                or type(attrs["bytes"]) is not int or attrs["bytes"] < 0
                or not _is_digest(attrs["sha256"], 64)):
            raise ValueError(f"Invalid file receipt: {name}")

    actual = set()
    for path in bundle.rglob("*"):
        if _demo_file(path):
            actual.add(path.relative_to(bundle).as_posix())
    if actual != {*files, MANIFEST}:
        raise ValueError(f"Bundle file inventory mismatch: {sorted(actual ^ {*files, MANIFEST})}")
    total = sum((bundle / name).stat().st_size for name in actual)
    if total > MAX_BUNDLE_BYTES:
        raise ValueError(f"Bundle exceeds {MAX_BUNDLE_BYTES:,} bytes")
    for name, attrs in files.items():
        path = bundle / name
        if path.stat().st_size != attrs["bytes"] or hashlib.sha256(path.read_bytes()).hexdigest() != attrs["sha256"]:
            raise ValueError(f"Bundle size or digest mismatch: {name}")
    return len(files), total


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("site", nargs="?", type=Path, help="Verify website HTML and local references")
    parser.add_argument("--bundle", type=Path, help="Verify standalone demo manifest and files")
    args = parser.parse_args()
    if args.site is None and args.bundle is None:
        parser.error("Supply a site or --bundle")
    try:
        if args.site is not None:
            root = args.site.resolve(strict=True)
            count, errors = check_links(root)
            if not count or errors:
                raise ValueError("\n".join(errors) or "No site pages found")
            print(f"Verified local links in {count} HTML pages")
        if args.bundle is not None:
            count, total = verify_bundle(args.bundle)
            print(f"Verified {count} bundle files ({total:,} bytes including manifest)")
    except (OSError, ValueError, TypeError) as error:
        parser.exit(1, f"{error}\n")


if __name__ == "__main__":
    main()
