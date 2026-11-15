"""Check the S³ recorded crossing prototype against the original Studio archive."""

from __future__ import annotations

import argparse
from hashlib import sha256
from html.parser import HTMLParser
from io import BytesIO
import json
from pathlib import Path

from verify_s3_preview import MANIFEST, verify_bundle


class ReplayPage(HTMLParser):
    """Read the data explicitly consumed by the replay controls."""

    def __init__(self, path: Path):
        super().__init__()
        self.payloads: list[str] = []
        self._in_payload = False
        self.feed(path.read_text(encoding="utf-8"))
        self.close()

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        self._in_payload = (tag == "script" and attributes.get("id") == "recording-frames"
                            and attributes.get("type") == "application/json")
        if self._in_payload:
            self.payloads.append("")

    def handle_data(self, text):
        if self._in_payload:
            self.payloads[-1] += text

    def handle_endtag(self, tag):
        if tag == "script":
            self._in_payload = False


def verify_recorded_crossing(bundle: Path, recording: Path) -> int:
    """Reopen the recording and check the table and rendered pixels."""
    from matplotlib.figure import Figure
    from PIL import Image
    from eccm_sandbox.recording.session import SessionReader, SessionReplay
    from eccm_sandbox.recording.studio_run import reopen_studio_run
    from eccm_sandbox.recording.studio_view import recorded_registration
    from eccm_sandbox.recording.tactical_overlays import build_tactical_overlay
    from eccm_sandbox.recording.tactical_view import draw_tactical
    from eccm_sandbox.workbench.run_center import source_identity

    verify_bundle(bundle)
    evidence = json.loads((bundle / MANIFEST).read_text(encoding="utf-8"))["evidence"]
    run = reopen_studio_run(recording)
    header = json.loads((recording / "studio-request.json").read_text(encoding="utf-8"))
    receipt = json.loads((recording / "studio-result.json").read_text(encoding="utf-8"))
    expected = {
        "kind": "recorded-workbench",
        "source_head": header["source_head"],
        "source_fingerprint": header["source_fingerprint"],
        "session_manifest_sha256": receipt["manifest_sha256"],
        "scientific_digest": receipt["scientific_digest"],
    }
    if evidence != expected or json.loads((bundle / "source.json").read_text(encoding="utf-8")) != expected:
        raise ValueError("Published source claims disagree with the Studio receipt")
    current_source = source_identity()
    if (current_source.checkout_head != expected["source_head"]
            or current_source.source_digest != expected["source_fingerprint"]):
        raise ValueError("Run this check with the radar revision and Python sources that recorded the session")

    payloads = ReplayPage(bundle / "index.html").payloads
    if len(payloads) != 1:
        raise ValueError("Expected one embedded recording table")
    rows = json.loads((bundle / "frames.json").read_text(encoding="utf-8"))
    if json.loads(payloads[0]) != rows:
        raise ValueError("Browser frame data disagrees with frames.json")
    with SessionReader(run.session_path) as session:
        if session.manifest["configuration"]["authored_scenario"]["scenario_id"] != "website-fictional-crossing-v1":
            raise ValueError("This check is for the fictional crossing preview")
        if type(rows) is not list or len(rows) != len(session.frame_ids) or len(rows) != 4:
            raise ValueError("Expected all four crossing frames")
        replay = SessionReplay(session)
        for i, key in enumerate(session.frame_ids):
            frame = session.frame(key)
            view = replay.view(frame.variant, frame.ordinal)
            registration = recorded_registration(frame)
            overlay = build_tactical_overlay(frame, registration, reference_db=view.reference_db)
            image_name = f"cpi-{i + 1}.png"
            expected_row = {
                "id": key,
                "time_s": frame.reference_time_s,
                "source_sha256": frame.source_digest,
                "observations": sum(point.kind == "observation" for point in overlay.points),
                "tracks": sum(point.kind == "track" for point in overlay.points),
                "image": image_name,
            }
            if rows[i] != expected_row:
                raise ValueError(f"Published frame values disagree with recording: {key}")

            figure = Figure(figsize=(11.5, 5.8), dpi=120)
            draw_tactical(figure, view, registration, bounds_m=(800., 1250., -150., 150.),
                          rdm_bounds=(0., 2200., -24., 24.))
            rendered = BytesIO()
            figure.savefig(rendered, format="png")
            rendered.seek(0)
            with Image.open(bundle / image_name) as published, Image.open(rendered) as baseline:
                published_pixels = published.convert("RGBA")
                baseline_pixels = baseline.convert("RGBA")
                if (published_pixels.size != baseline_pixels.size
                        or sha256(published_pixels.tobytes()).digest() != sha256(baseline_pixels.tobytes()).digest()):
                    raise ValueError(f"Published plot pixels disagree with Workbench render: {key}")
    return len(rows)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bundle", type=Path)
    parser.add_argument("recording", type=Path)
    args = parser.parse_args()
    try:
        count = verify_recorded_crossing(args.bundle, args.recording)
    except (OSError, ValueError, KeyError, ImportError) as error:
        parser.exit(1, f"{error}\n")
    print(f"Verified crossing source, timestamps, counts and rendered pixels for {count} retained frames")


if __name__ == "__main__":
    main()
