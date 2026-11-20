"""Check that chatterguru.com works as an installable app on phones.

Runs the site from a loopback server in Edge or Chrome (Playwright) and checks:
- the browser finds the manifest and reports no installability errors;
- the service worker takes control of the site;
- offline, a page visited before still opens, and an unvisited page shows offline.html;
- after a 3D scene is opened, the Cesium build is cached but the scene page, its data
  and the USGS map tiles are not;
- on an iPhone, the phone menu offers "Add to Home Screen".

    python -B tools/verify_site_app.py . --browser msedge
"""

from __future__ import annotations

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import tempfile
from threading import Thread

IPHONE_UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 "
             "(KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1")
SCENE = "demos/s3/aesa/farm-perimeter/index.html"


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def check(site: Path, channel: str) -> dict:
    from playwright.sync_api import sync_playwright

    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Quiet, directory=str(site)))
    Thread(target=server.serve_forever, daemon=True).start()
    origin = f"http://127.0.0.1:{server.server_port}"
    out: dict = {}
    try:
        with sync_playwright() as pw:
            gl = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
            # A normal (not private) profile: browsers do not judge installability in private windows.
            profile = tempfile.TemporaryDirectory()
            ctx = pw.chromium.launch_persistent_context(profile.name, channel=channel, args=gl,
                                                        viewport={"width": 390, "height": 844},
                                                        is_mobile=True, has_touch=True)
            page = ctx.pages[0] if ctx.pages else ctx.new_page()
            page.goto(f"{origin}/s3-studio.html")
            page.wait_for_function("navigator.serviceWorker && navigator.serviceWorker.ready.then(() => true)")
            page.reload()
            page.wait_for_function("Boolean(navigator.serviceWorker.controller)")
            out["controlled"] = True
            cdp = ctx.new_cdp_session(page)
            manifest = cdp.send("Page.getAppManifest")
            out["manifest_errors"] = [e.get("message") for e in manifest.get("errors", [])]
            out["installability_errors"] = [e.get("errorId") for e in
                                            cdp.send("Page.getInstallabilityErrors").get("installabilityErrors", [])]
            # Open a 3D scene online, then look at what was cached.
            page.goto(f"{origin}/{SCENE}")
            page.wait_for_function("typeof viewer !== 'undefined' && Boolean(viewer?.dataSources?.length)",
                                   timeout=60_000)
            page.wait_for_timeout(3000)
            out["cache"] = page.evaluate("""async () => {
              const out = {};
              for (const name of await caches.keys()) {
                out[name] = (await (await caches.open(name)).keys()).map(r => new URL(r.url).pathname);
              }
              return out;
            }""")
            cached = [p for paths in out["cache"].values() for p in paths]
            out["cesium_cached"] = sum(p.startswith("/demos/s3/vendor/cesium-1.119.0/") for p in cached)
            out["scene_cached"] = [p for p in cached if p.startswith(("/demos/s3/aesa/", "/demos/s3/studio/"))]
            out["tiles_cached"] = [p for p in cached if "nationalmap" in p or "/tile/" in p]
            # Offline: a visited page opens; an unvisited page shows the offline page.
            ctx.set_offline(True)
            page.goto(f"{origin}/s3-studio.html")
            out["offline_visited"] = "From a scene on the globe" in page.content()
            page.goto(f"{origin}/systems-engineering.html")
            out["offline_unvisited"] = "offline" in page.content().lower() and "You’re offline" in page.content()
            ctx.set_offline(False)
            ctx.close()
            profile.cleanup()
            browser = pw.chromium.launch(channel=channel, args=gl)

            iphone = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True,
                                         user_agent=IPHONE_UA)
            p2 = iphone.new_page()
            p2.goto(f"{origin}/index.html")
            p2.locator(".menu-toggle").click()
            item = p2.locator(".nav-install")
            out["iphone_menu_item"] = item.is_visible() and item.inner_text().strip() == "Add to Home Screen"
            item.click()
            out["iphone_help"] = p2.locator(".nav-install-help").is_visible()
            iphone.close()
            browser.close()
    finally:
        server.shutdown()
    out["ok"] = bool(out.get("controlled") and not out["manifest_errors"] and not out["installability_errors"]
                     and out["cesium_cached"] > 0 and not out["scene_cached"] and not out["tiles_cached"]
                     and out["offline_visited"] and out["offline_unvisited"]
                     and out["iphone_menu_item"] and out["iphone_help"])
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("site", type=Path)
    ap.add_argument("--browser", default="msedge")
    args = ap.parse_args()
    result = check(args.site.resolve(strict=True), args.browser)
    summary = {k: (len(v) if k == "cache" else v) for k, v in result.items()}
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    if not result["ok"]:
        ap.exit(1, "Site app check failed.\n")


if __name__ == "__main__":
    main()
