"""Verify public S³ Studio packages, the pinned Cesium build, and browser playback."""

from __future__ import annotations

import argparse
from functools import partial
from hashlib import sha256
from html import unescape
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
import tarfile
from threading import Thread
from urllib.parse import unquote, urlsplit

from verify_s3_preview import MANIFEST, _demo_file, file_sha256, verify_bundle

CESIUM = "cesium-1.119.0"
CESIUM_TARBALL_SHA256 = "2daa7203af810ddb320d7990ef26812309336f4559b3d9b2d1b1450f8110cd7d"
USGS = "basemap.nationalmap.gov"
SCENES = Path("demos/s3/studio")
# AESA search-while-track scenes (published by the same exporter, kind "aesa-export").
AESA_SCENES = Path("demos/s3/aesa")
# On a phone, floating controls may cover at most this share of the screen once the
# scene has loaded (the map should get the screen; everything else waits in the menu).
PHONE_MAX_COVERED = 0.15
PRIVATE_TEXT = re.compile(
    r"file:(?:/{1,3}|\\)|\b[a-z]:[\\/](?:users|documents|windows|temp|onedrive|"
    r"program files(?: \(x86\))?|work(?:space)?|python\d+)(?:[\\/]|\b)|"
    r"/(?:home|Users)/[^/\s<>]+/|"
    r"(?<![\w.+-])[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+",
    re.IGNORECASE,
)
# A public scene must not point at a particular home: no house-numbered street
# address, no building labelled with a house number, no house-numbered building id.
_STREET_TYPE = (r"(?:Alley|Avenue|Ave|Boulevard|Blvd|Circle|Close|Court|Ct|Crescent|Drive|Dr|Highway|Hwy|Lane|Ln|"
                r"Loop|Mews|Parkway|Pike|Place|Pl|Plaza|Road|Rd|Row|Square|Street|St|Terrace|Trail|Turnpike|Way)")
HOUSE_LABEL = re.compile(
    r"(?<![\w.#-])\d{1,5}(?:\s*-\s*\d{1,5})?[A-Z]?\s+(?:[A-Z][A-Za-z']+\s+){1,3}" + _STREET_TYPE + r"\b|"
    r"\bbldg_\d+_[a-z]|"
    r'(?:3D Building: |"display_?[nN]ame": ")\d{1,5}(?:\s*-\s*\d{1,5})?[A-Z]?(?=[ "<\\])|'
    r"(?<![\w.#-])\d{1,5} (?:[A-Z][a-z]+ ){1,3}\((?:Townhouse|House|Home|Residence)\)"
)
JSON_ESCAPE = re.compile(r"\\u[0-9a-fA-F]{4}")
TEXT_SUFFIXES = {".html", ".js", ".css", ".json", ".geojson", ".czml", ".md", ".txt", ".xml", ".svg", ".webmanifest"}


def request_allowed(value: str, origin: str) -> bool:
    """Match exact origins rather than hostname prefixes or URL substrings."""
    try:
        url = urlsplit(value)
        if url.scheme in {"data", "blob"}:
            # Embedded resources and workers stay inside the browser.
            return url.scheme == "data" or value.startswith(f"blob:{origin}/")
        if url.username is not None or url.password is not None:
            return False
        return (f"{url.scheme}://{url.netloc}" == origin
                or (url.scheme == "https" and url.hostname == USGS and url.port in (None, 443)))
    except ValueError:
        return False


def verify_scene(bundle: Path) -> dict:
    count, size = verify_bundle(bundle, expected_schema=2)
    page = bundle / "index.html"
    markup = unescape(page.read_text(encoding="utf-8"))
    ledger = (bundle / "rights-and-sources.md").read_text(encoding="utf-8")
    evidence = json.loads((bundle / MANIFEST).read_text(encoding="utf-8")).get("evidence", {})
    uses_osm = evidence.get("kind") != "aesa-export" or bool(evidence.get("osm"))
    credits = ("USGS", "OpenStreetMap") if uses_osm else ("USGS",)
    if (bundle / "imagery/naip/extent.json").is_file():
        credits += ("NAIP",)
    if not all(credit in ledger and credit in markup for credit in credits):
        raise ValueError("Scene is missing imagery or OpenStreetMap credits")
    if f'../../vendor/{CESIUM}/Cesium.js' not in markup:
        raise ValueError("Scene must use the pinned shared Cesium build")
    if not re.search(r'<a\b[^>]*href=["\'](?:credits\.html|rights-and-sources\.md)["\']', markup, re.I):
        raise ValueError("Scene is missing the data credits link")
    if re.search(r"\bserviceWorker\s*\.\s*register\s*\(", markup):
        raise ValueError("Public Studio must not register a service worker")

    for path in sorted(bundle.rglob("*")):
        if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
            content = unescape(unquote(path.read_text(encoding="utf-8-sig"))).replace("\\\\", "\\")
            if PRIVATE_TEXT.search(content):
                raise ValueError(f"Local path or email found in {path.relative_to(bundle).as_posix()}")
            # Markup held inside JSON is escaped, so a house number can follow an escape.
            if HOUSE_LABEL.search(JSON_ESCAPE.sub(" ", content)):
                raise ValueError(f"House-numbered label found in {path.relative_to(bundle).as_posix()}")
        if path.suffix.lower() == ".glb" and (path.parent != bundle / "models" or not path.name.startswith("synth_")):
            raise ValueError("Only local Studio synthetic models are permitted")
    return {"scene": bundle.name, "verified_files": count, "bundle_bytes": size, "entry_bytes": page.stat().st_size,
            "manifest_sha256": file_sha256(bundle / MANIFEST)}


def verify_vendor(vendor: Path, archive: Path) -> int:
    """Match every shipped build, license and notice file to the official archive."""
    if file_sha256(archive) != CESIUM_TARBALL_SHA256:
        raise ValueError("Cesium npm tarball does not match the pinned digest")
    build = "package/Build/Cesium/"
    notices = {"LICENSE.md", "ThirdParty.json"}
    with tarfile.open(archive, mode="r:gz") as tar:
        files = {}
        for member in tar:
            if not member.isfile():
                continue
            suffix = member.name.removeprefix(build)
            if member.name.startswith(build):
                files[suffix] = member
            elif member.name.removeprefix("package/") in notices:
                files[member.name.removeprefix("package/")] = member
        actual = {path.relative_to(vendor).as_posix() for path in vendor.rglob("*") if _demo_file(path)}
        if actual != {*files, "SOURCE.md"} or not notices <= files.keys():
            raise ValueError(f"Cesium vendor inventory mismatch: {sorted(actual ^ {*files, 'SOURCE.md'})}")
        for name, member in files.items():
            with tar.extractfile(member) as source:
                expected = sha256(source.read()).hexdigest()
            if file_sha256(vendor / name) != expected:
                raise ValueError(f"Cesium vendor file differs from npm: {name}")
    return len(files)


class PreviewServer(ThreadingHTTPServer):
    # Chromium opens many concurrent tile and WebGL asset connections.
    request_queue_size = 128


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def do_GET(self):
        try:
            super().do_GET()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass  # Chromium cancels outstanding imagery requests when closing.


def _network_location(url: str, origin: str) -> str:
    parsed = urlsplit(url)
    if parsed.scheme in {"data", "blob"}:
        return parsed.scheme + ":"
    return "self" if f"{parsed.scheme}://{parsed.netloc}" == origin else (parsed.hostname or parsed.scheme)


def _bundle_uses_osm(bundle: Path) -> bool:
    evidence = json.loads((bundle / MANIFEST).read_text(encoding="utf-8")).get("evidence", {})
    return evidence.get("kind") != "aesa-export" or bool(evidence.get("osm"))


# Share of the screen covered by floating page controls (not the map, its credits or
# the timeline), as a union on a coarse grid.
COVERED_JS = """() => {
  const W = innerWidth, H = innerHeight, step = 8, cols = Math.ceil(W / step), rows = Math.ceil(H / step);
  const grid = new Uint8Array(cols * rows);
  const skip = el => el.closest('#cesiumContainer .cesium-widget, .cesium-viewer-bottom, .cesium-viewer-timelineContainer, .cesium-viewer-fullscreenContainer, .cesium-credit-lightbox-overlay');
  document.querySelectorAll('body *').forEach(el => {
    const cs = getComputedStyle(el);
    if (!(cs.position === 'fixed' || cs.position === 'absolute') || cs.display === 'none' || cs.visibility === 'hidden') return;
    if (el.id === 'cesiumContainer' || skip(el) || parseFloat(cs.opacity) === 0) return;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.width * r.height > 0.95 * W * H) return;
    for (let y = Math.max(0, Math.floor(r.top / step)); y < Math.min(rows, Math.ceil(r.bottom / step)); y++)
      for (let x = Math.max(0, Math.floor(r.left / step)); x < Math.min(cols, Math.ceil(r.right / step)); x++) grid[y * cols + x] = 1;
  });
  let n = 0; for (const v of grid) n += v;
  return n / grid.length;
}"""


def browser_check(browser, origin: str, bundle: Path, width: int, height: int, *, site: Path | None = None,
                  shots: Path | None = None) -> dict:
    """Capture and restrict page traffic during a real WebGL load and playback."""
    context = browser.new_context(viewport={"width": width, "height": height},
                                  has_touch=width < 500, is_mobile=width < 500, service_workers="block")
    requests, denied, errors, responses, failed = [], [], [], [], []

    def route_request(route):
        address = route.request.url
        if request_allowed(address, origin):
            route.continue_()
        else:
            denied.append(address)
            route.abort()

    def watch_page(page):
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)

    try:
        context.on("page", watch_page)
        context.on("request", lambda request: requests.append(request.url))
        context.on("response", lambda response: responses.append((response.url, response.status)))
        context.on("requestfailed", lambda request: failed.append((request.url, request.failure)))
        context.route("**/*", route_request)
        context.route_web_socket("**/*", lambda ws: (denied.append(ws.url), ws.close()))
        page = context.new_page()
        page.set_default_timeout(45_000)
        advanced = False
        covered = None
        phone_menu = False
        credit_text = ""
        layout_ok = False
        evidence_visible = False
        subtitle = ""

        try:
            rel = bundle.relative_to(site).as_posix() if site else f"{SCENES.as_posix()}/{bundle.name}"
            page.goto(f"{origin}/{rel}/index.html", wait_until="domcontentloaded")
            page.wait_for_function("""() => typeof viewer !== 'undefined' && Boolean(viewer?.dataSources?.length)
                && Boolean(document.querySelector('#cesiumContainer canvas'))""")
            credit = page.locator(".cesium-credit-textContainer").filter(
                has_text="OpenStreetMap" if _bundle_uses_osm(bundle) else "USGS").first
            credit.wait_for(state="visible")
            credit_text = credit.inner_text()
            if page.locator("#studioSubTitle").count():
                subtitle = page.locator("#studioSubTitle").inner_text()
            page.wait_for_timeout(1500)
            layout_ok = page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            if shots:
                page.screenshot(path=str(shots / f"{bundle.parent.name}-{bundle.name}-{width}x{height}.png"))
            menu = page.locator("#psMenuBtn")
            if menu.count() and menu.is_visible():
                # Phone layout: controls live in the menu.
                phone_menu = True
                covered = page.evaluate(COVERED_JS)
                menu.click()
                page.locator("#psSheet a[href='credits.html']").wait_for(state="visible")
                evidence_visible = page.locator("#psSheet .s3-evidence").is_visible()
                if shots:
                    page.screenshot(path=str(shots / f"{bundle.parent.name}-{bundle.name}-{width}x{height}-menu.png"))
                page.keyboard.press("Escape")
            else:
                page.locator(".s3-site-bar a[href='credits.html'], .s3-site-bar a[href='rights-and-sources.md']"
                             ).first.wait_for(state="visible")
                evidence_visible = (page.locator("#scenePreviewBadge").is_visible()
                                    or page.locator(".s3-evidence").first.is_visible())
            before = page.evaluate("viewer.clock.currentTime.toString()")
            page.locator("#btnRunSim").click()
            page.wait_for_timeout(10_000)
            advanced = page.evaluate("(before) => viewer.clock.currentTime.toString() !== before", before)
        except Exception as error:
            # Keep observations from the whole partial run in the report.
            errors.append(str(error))

        external = {address for address in requests if not request_allowed(address, origin)} | set(denied)
        broken = {f"{status} {urlsplit(address).path}" for address, status in responses if status >= 400}
        broken |= {f"{reason} {urlsplit(address).path}" for address, reason in failed
                   if reason != "net::ERR_ABORTED" and request_allowed(address, origin)}
        if not advanced:
            errors.append("Scenario clock did not advance")
        if not layout_ok:
            errors.append("Layout did not fit the viewport")
        if not evidence_visible:
            errors.append("Scene evidence label was not visible")
        if width < 500 and not phone_menu:
            errors.append("Phone layout has no scene menu")
        if covered is not None and covered > PHONE_MAX_COVERED:
            errors.append(f"Floating controls cover {covered:.0%} of the phone screen")
        has_naip = (bundle / "imagery/naip/extent.json").is_file()
        required_credits = ("USGS",) + (("OpenStreetMap",) if _bundle_uses_osm(bundle) else ()) + (
            ("NAIP",) if has_naip else ())
        if not all(label in credit_text for label in required_credits):
            errors.append("Data credits were not visible")
        paths = [urlsplit(address).path for address, status in responses if status == 200]
        if has_naip and not any("/imagery/naip/" in path for path in paths):
            errors.append("No local aerial tile loaded")
        if not any("/models/synth_" in path for path in paths):
            errors.append("No synthetic scene model loaded")
        if "synthetic" in credit_text.lower() and "USGS 3DEP" in subtitle:
            errors.append("Terrain subtitle disagrees with the synthetic terrain credit")
        return {
            "scene": bundle.name, "viewport": [width, height], "hosts": sorted({
                _network_location(address, origin) for address in requests}),
            "requests": len(requests), "external_requests": sorted(external),
            "console_or_behavior_errors": sorted(set(errors)), "failed_assets": sorted(broken),
            "playback_advanced": advanced, "credit_text": credit_text, "subtitle": subtitle,
            "local_aerial_responses": len({path for path in paths if "/imagery/naip/" in path}),
            "models_loaded": sorted({Path(path).name for path in paths if "/models/synth_" in path}),
            "phone_menu": phone_menu, "phone_covered_share": covered,
            "ok": not (external or errors or broken),
        }
    finally:
        context.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("site", type=Path)
    parser.add_argument("--cesium-tarball", required=True, type=Path)
    parser.add_argument("--browser", default="msedge", help="Playwright Chromium channel, e.g. chrome or msedge")
    parser.add_argument("--report", type=Path, help="Write the detailed audit report outside the site")
    parser.add_argument("--screenshots", type=Path, help="Save a screenshot per scene and viewport here")
    args = parser.parse_args()
    site = args.site.resolve(strict=True)
    try:
        from playwright.sync_api import sync_playwright

        scenes = sorted((site / SCENES).iterdir())
        if (site / AESA_SCENES).is_dir():
            scenes += sorted(p for p in (site / AESA_SCENES).iterdir() if p.is_dir())
        if args.screenshots:
            args.screenshots.mkdir(parents=True, exist_ok=True)
        if not scenes:
            raise ValueError("No Studio scenes to verify")
        packages = [verify_scene(scene) for scene in scenes]
        vendor = verify_vendor(site / "demos/s3/vendor" / CESIUM, args.cesium_tarball)
        replay_files, replay_bytes = verify_bundle(site / "demos/s3/recorded-crossing", expected_schema=1)

        handler = partial(QuietHandler, directory=site)
        with PreviewServer(("127.0.0.1", 0), handler) as server:
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                origin = f"http://127.0.0.1:{server.server_port}"
                with sync_playwright() as playwright:
                    browser = playwright.chromium.launch(channel=args.browser, args=[
                        "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
                    ])
                    results = [browser_check(browser, origin, scene, w, h, site=site, shots=args.screenshots)
                               for scene in scenes for w, h in ((1360, 900), (390, 844), (320, 568))]
            finally:
                server.shutdown()
                thread.join()

        payload = {"packages": packages, "cesium_files": vendor, "replay_files": replay_files,
                   "replay_bytes": replay_bytes, "browser": results}
        for result in results:
            print(f"{result['scene']} {result['viewport']}: {'PASS' if result['ok'] else 'FAIL'}; "
                  f"{result['requests']} requests; hosts = {', '.join(result['hosts'])}")
        encoded = json.dumps(payload, indent=2, ensure_ascii=False)
        if args.report:
            args.report.write_text(encoded + "\n", encoding="utf-8")
        else:
            print(encoded)
        if not all(result["ok"] for result in results):
            parser.exit(1, "Studio verification failed. Review browser observations.\n")
    except (OSError, ValueError, ImportError) as error:
        parser.exit(1, f"{error}\n")


if __name__ == "__main__":
    main()
