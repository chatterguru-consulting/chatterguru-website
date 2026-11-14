(() => {
  "use strict";
  const get = (id) => document.getElementById(id);
  const frame = get("frame");
  const previous = get("prev");
  const next = get("next");
  const status = get("status");
  const activeSha = get("active-frame-sha");
  const pills = Array.from(document.querySelectorAll(".pill-btn"));

  function prepare() {
    const recorded = JSON.parse(get("recording-frames").textContent);
    frame.max = String(recorded.length - 1);

    function show(rawIndex) {
      const idx = Math.max(0, Math.min(recorded.length - 1, Number(rawIndex)));
      const evidence = recorded[idx];
      frame.value = String(idx);
      frame.setAttribute("aria-valuetext", evidence.time_s + " seconds");
      previous.disabled = idx === 0;
      next.disabled = idx === recorded.length - 1;
      status.textContent =
        "Capture " + (idx + 1) + " of " + recorded.length + " · " +
        evidence.time_s + " s · " +
        evidence.observations + " recorded observations · " +
        evidence.tracks + " tracker state estimates";
      get("plot").src = evidence.image;
      get("plot").alt =
        "Retained range-Doppler and top-down views at " + evidence.time_s + " seconds";
      get("full").href = evidence.image;
      if (activeSha) {
        activeSha.textContent = evidence.source_sha256;
      }
      pills.forEach((btn, i) => {
        btn.setAttribute("aria-pressed", String(i === idx));
      });
    }

    frame.disabled = false;
    frame.addEventListener("input", () => show(frame.valueAsNumber));
    previous.addEventListener("click", () => show(frame.valueAsNumber - 1));
    next.addEventListener("click", () => show(frame.valueAsNumber + 1));
    pills.forEach((btn) => {
      btn.addEventListener("click", () => show(btn.dataset.index));
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.target && (ev.target.tagName === "INPUT" || ev.target.tagName === "TEXTAREA")) {
        return;
      }
      if (ev.key === "ArrowLeft" && frame.valueAsNumber > 0) {
        show(frame.valueAsNumber - 1);
      } else if (ev.key === "ArrowRight" && frame.valueAsNumber < recorded.length - 1) {
        show(frame.valueAsNumber + 1);
      }
    });
    show(0);
  }

  try {
    prepare();
  } catch {
    status.textContent = "The recording controls could not be initialized. Capture 1 remains visible.";
  }
})();
