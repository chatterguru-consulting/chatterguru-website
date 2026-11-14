(() => {
  "use strict";
  const el = (id) => document.getElementById(id);
  const data = JSON.parse(el("scene-preview-data").textContent);

  const canvas = el("scene-canvas");
  const ctx = canvas.getContext("2d");
  const rdmCanvas = el("rdm-canvas");
  const rdmCtx = rdmCanvas.getContext("2d");
  const slider = el("time-slider");
  const playBtn = el("btn-play");
  const prevBtn = el("btn-prev");
  const nextBtn = el("btn-next");
  const timeReadout = el("time-readout");
  const tbody = el("target-tbody");
  const caption = el("scene-caption");
  const chkBldg = el("chk-buildings");
  const chkRoads = el("chk-roads");
  const chkGlints = el("chk-glints");
  const chkLos = el("chk-los");
  const camBtns = Array.from(document.querySelectorAll(".cam-btn"));

  const terrain = data.terrain;
  const spanX = Math.max(terrain.x_max_m - terrain.x_min_m, data.bounds_enu_m[1] - data.bounds_enu_m[0]);
  const spanY = Math.max(terrain.y_max_m - terrain.y_min_m, data.bounds_enu_m[3] - data.bounds_enu_m[2]);
  const baseRadius = Math.max(spanX, spanY) * 0.72;

  const cam = {
    mode: "overview",
    yaw: 0.68,
    pitch: 0.56,
    dist: baseRadius,
    target: [
      0.5 * (data.bounds_enu_m[0] + data.bounds_enu_m[1]),
      0.5 * (data.bounds_enu_m[2] + data.bounds_enu_m[3]),
      0.5 * (terrain.z_min_m + terrain.z_max_m),
    ],
  };

  let frameIdx = 0;
  let playing = false;
  let playTimer = null;

  function setCameraMode(mode) {
    cam.mode = mode;
    camBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cam === mode)));
    if (mode === "overview") {
      cam.yaw = 0.68;
      cam.pitch = 0.56;
      cam.dist = baseRadius;
      cam.target = [
        0.5 * (data.bounds_enu_m[0] + data.bounds_enu_m[1]),
        0.5 * (data.bounds_enu_m[2] + data.bounds_enu_m[3]),
        0.5 * (terrain.z_min_m + terrain.z_max_m),
      ];
    } else if (mode === "top") {
      cam.yaw = 0.0;
      cam.pitch = 1.48;
      cam.dist = baseRadius * 0.95;
    } else if (mode === "radar") {
      const f = data.frames[frameIdx];
      cam.yaw = (f.az_deg * Math.PI) / 180.0 - Math.PI / 2;
      cam.pitch = 0.42;
      cam.dist = baseRadius * 0.55;
      cam.target = [f.sensor_pos[0], f.sensor_pos[1], f.sensor_pos[2] * 0.6];
    }
    drawAll();
  }

  function elevationAt(x, y) {
    const u = Math.max(0, Math.min(1, (x - terrain.x_min_m) / Math.max(1, terrain.x_max_m - terrain.x_min_m)));
    const v = Math.max(0, Math.min(1, (y - terrain.y_min_m) / Math.max(1, terrain.y_max_m - terrain.y_min_m)));
    const ix = Math.min(terrain.nx - 1, Math.round(u * (terrain.nx - 1)));
    const iy = Math.min(terrain.ny - 1, Math.round(v * (terrain.ny - 1)));
    return terrain.z_grid[iy][ix];
  }

  function projectPoint(wx, wy, wz) {
    const cy = Math.cos(cam.yaw);
    const sy = Math.sin(cam.yaw);
    const cp = Math.cos(cam.pitch);
    const sp = Math.sin(cam.pitch);

    const dx = wx - cam.target[0];
    const dy = wy - cam.target[1];
    const dz = wz - cam.target[2];

    const rx = cy * dx - sy * dy;
    const ry = sy * dx + cy * dy;

    const camX = rx;
    const camY = -sp * ry + cp * dz;
    const camZ = cp * ry + sp * dz - cam.dist;

    const depth = -camZ;
    if (depth < 25) return null;
    const f = Math.min(canvas.width, canvas.height) * 1.15;
    const sx = canvas.width * 0.5 + (camX / depth) * f;
    const syScreen = canvas.height * 0.53 - (camY / depth) * f;
    return [sx, syScreen, depth];
  }

  function drawScene3D(frame) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#07101f");
    sky.addColorStop(1, "#0d1b2d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    if (cam.mode === "radar") {
      cam.target = [
        frame.sensor_pos[0] * 0.65,
        frame.sensor_pos[1] * 0.65,
        frame.sensor_pos[2] * 0.35,
      ];
    }

    const step = 2;
    ctx.lineWidth = 0.8;
    const zSpan = Math.max(10, terrain.z_max_m - terrain.z_min_m);
    const xStep = (terrain.x_max_m - terrain.x_min_m) / Math.max(1, terrain.nx - 1);
    const yStep = (terrain.y_max_m - terrain.y_min_m) / Math.max(1, terrain.ny - 1);

    for (let iy = 0; iy < terrain.ny; iy += step) {
      const y = terrain.y_min_m + iy * yStep;
      ctx.beginPath();
      let started = false;
      for (let ix = 0; ix < terrain.nx; ix += step) {
        const x = terrain.x_min_m + ix * xStep;
        const p = projectPoint(x, y, terrain.z_grid[iy][ix]);
        if (!p) { started = false; continue; }
        if (!started) { ctx.moveTo(p[0], p[1]); started = true; }
        else ctx.lineTo(p[0], p[1]);
      }
      const normZ = (terrain.z_grid[iy][Math.floor(terrain.nx / 2)] - terrain.z_min_m) / zSpan;
      ctx.strokeStyle = "rgba(70," + Math.round(135 + 75 * normZ) + ",165,0.28)";
      ctx.stroke();
    }
    for (let ix = 0; ix < terrain.nx; ix += step) {
      const x = terrain.x_min_m + ix * xStep;
      ctx.beginPath();
      let started = false;
      for (let iy = 0; iy < terrain.ny; iy += step) {
        const y = terrain.y_min_m + iy * yStep;
        const p = projectPoint(x, y, terrain.z_grid[iy][ix]);
        if (!p) { started = false; continue; }
        if (!started) { ctx.moveTo(p[0], p[1]); started = true; }
        else ctx.lineTo(p[0], p[1]);
      }
      ctx.strokeStyle = "rgba(70,150,180,0.20)";
      ctx.stroke();
    }

    if (chkRoads.checked) {
      ctx.lineWidth = 1.15;
      ctx.strokeStyle = "rgba(182, 204, 224, 0.42)";
      for (const road of data.roads) {
        ctx.beginPath();
        let started = false;
        for (const pt of road.pts) {
          const z = elevationAt(pt[0], pt[1]) + 0.6;
          const p = projectPoint(pt[0], pt[1], z);
          if (!p) { started = false; continue; }
          if (!started) { ctx.moveTo(p[0], p[1]); started = true; }
          else ctx.lineTo(p[0], p[1]);
        }
        ctx.stroke();
      }
    }

    if (chkBldg.checked) {
      ctx.lineWidth = 0.85;
      ctx.strokeStyle = "rgba(148, 197, 255, 0.55)";
      ctx.fillStyle = "rgba(56, 102, 148, 0.25)";
      for (const b of data.buildings) {
        const zTop = b.gz + b.eh;
        const pts = b.pts;
        const topProj = [];
        let ok = true;
        for (let i = 0; i < pts.length; i++) {
          const ptTop = projectPoint(pts[i][0], pts[i][1], zTop);
          if (!ptTop) { ok = false; break; }
          topProj.push(ptTop);
        }
        if (!ok || topProj.length < 3) continue;
        ctx.beginPath();
        ctx.moveTo(topProj[0][0], topProj[0][1]);
        for (let i = 1; i < topProj.length; i++) ctx.lineTo(topProj[i][0], topProj[i][1]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    if (chkGlints.checked) {
      ctx.fillStyle = "rgba(255, 206, 90, 0.72)";
      for (const d of data.dihedrals) {
        const p = projectPoint(d[0], d[1], d[2] + 1.5);
        if (p) ctx.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3);
      }
    }

    /* Sensor track */
    ctx.beginPath();
    let sStarted = false;
    for (const sp of data.sensor_track) {
      const p = projectPoint(sp[1], sp[2], sp[3]);
      if (!p) { sStarted = false; continue; }
      if (!sStarted) { ctx.moveTo(p[0], p[1]); sStarted = true; }
      else ctx.lineTo(p[0], p[1]);
    }
    ctx.strokeStyle = "rgba(124, 232, 232, 0.65)";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    /* Target trails */
    for (const tid of Object.keys(data.targets)) {
      const tmeta = data.targets[tid];
      ctx.beginPath();
      let tStarted = false;
      for (const pt of tmeta.track) {
        const p = projectPoint(pt[1], pt[2], pt[3]);
        if (!p) { tStarted = false; continue; }
        if (!tStarted) { ctx.moveTo(p[0], p[1]); tStarted = true; }
        else ctx.lineTo(p[0], p[1]);
      }
      ctx.strokeStyle = tmeta.domain === "air" ? "rgba(250, 204, 21, 0.55)" : "rgba(96, 165, 250, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    /* Radar boresight, beam cone and LOS rays */
    const sp = frame.sensor_pos;
    const sp2 = projectPoint(sp[0], sp[1], sp[2]);
    if (sp2 && chkLos.checked) {
      const az = (frame.az_deg * Math.PI) / 180;
      const elRad = (frame.el_deg * Math.PI) / 180;
      const hbw = ((frame.az_bw_deg || 18) * 0.5 * Math.PI) / 180;
      const coneLen = 4500;
      for (const da of [-hbw, 0, hbw]) {
        const rx = sp[0] + coneLen * Math.cos(elRad) * Math.sin(az + da);
        const ry = sp[1] + coneLen * Math.cos(elRad) * Math.cos(az + da);
        const rz = Math.max(terrain.z_min_m, sp[2] + coneLen * Math.sin(elRad));
        const rp = projectPoint(rx, ry, rz);
        if (rp) {
          ctx.beginPath();
          ctx.moveTo(sp2[0], sp2[1]);
          ctx.lineTo(rp[0], rp[1]);
          ctx.strokeStyle = da === 0 ? "rgba(124, 232, 232, 0.8)" : "rgba(124, 232, 232, 0.35)";
          ctx.lineWidth = da === 0 ? 1.8 : 1.0;
          ctx.stroke();
        }
      }
    }

    /* Targets and LOS status at active frame */
    ctx.font = "11px system-ui, sans-serif";
    for (const [tid, t] of Object.entries(frame.targets)) {
      const tp = projectPoint(t.pos[0], t.pos[1], t.pos[2]);
      if (!tp) continue;
      if (sp2 && chkLos.checked) {
        ctx.beginPath();
        ctx.moveTo(sp2[0], sp2[1]);
        ctx.lineTo(tp[0], tp[1]);
        ctx.strokeStyle = t.vis ? "rgba(52, 211, 153, 0.45)" : "rgba(248, 113, 113, 0.55)";
        ctx.lineWidth = 1.0;
        ctx.setLineDash(t.vis ? [] : [4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      ctx.arc(tp[0], tp[1], t.cfar ? 5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = !t.vis ? "#f87171" : (t.cfar ? "#34d399" : (t.beam ? "#facc15" : "#94a3b8"));
      ctx.fill();
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(tid, tp[0] + 7, tp[1] + 4);
    }

    if (sp2) {
      ctx.beginPath();
      ctx.arc(sp2[0], sp2[1], 6, 0, Math.PI * 2);
      ctx.fillStyle = "#7ce8e8";
      ctx.fill();
      ctx.strokeStyle = "#08121f";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#7ce8e8";
      ctx.fillText(data.sensor_id, sp2[0] + 9, sp2[1] - 4);
    }
  }

  function colorForVal(t) {
    const c = Math.max(0, Math.min(1, t));
    if (c < 0.35) {
      const k = c / 0.35;
      return [Math.round(8 + 25 * k), Math.round(14 + 45 * k), Math.round(32 + 95 * k)];
    }
    if (c < 0.72) {
      const k = (c - 0.35) / 0.37;
      return [Math.round(33 + 175 * k), Math.round(59 + 80 * k), Math.round(127 - 40 * k)];
    }
    const k = (c - 0.72) / 0.28;
    return [Math.round(208 + 47 * k), Math.round(139 + 110 * k), Math.round(87 + 90 * k)];
  }

  function drawRdm(frame) {
    const w = rdmCanvas.width;
    const h = rdmCanvas.height;
    rdmCtx.clearRect(0, 0, w, h);
    rdmCtx.fillStyle = "#09111d";
    rdmCtx.fillRect(0, 0, w, h);

    const padL = 52;
    const padB = 34;
    const padT = 16;
    const padR = 16;
    const pw = w - padL - padR;
    const ph = h - padT - padB;

    const rdm = frame.rdm;
    const dBins = rdm.shape[0];
    const rBins = rdm.shape[1];
    const raw = atob(rdm.b64);
    const cellW = pw / dBins;
    const cellH = ph / rBins;

    /* dBins along X (left to right), rBins increasing upward along Y */
    for (let d = 0; d < dBins; d++) {
      for (let r = 0; r < rBins; r++) {
        const idx = d * rBins + r;
        const val = idx < raw.length ? raw.charCodeAt(idx) / 255.0 : 0;
        const rgb = colorForVal(val);
        rdmCtx.fillStyle = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
        const x = padL + d * cellW;
        const y = padT + ph - (r + 1) * cellH;
        rdmCtx.fillRect(x, y, Math.ceil(cellW), Math.ceil(cellH));
      }
    }

    rdmCtx.strokeStyle = "#415973";
    rdmCtx.strokeRect(padL, padT, pw, ph);
    rdmCtx.fillStyle = "#b8cad8";
    rdmCtx.font = "11px system-ui, sans-serif";
    const ax = data.rdm_axes;
    rdmCtx.fillText(ax.vel_min_mps + " m/s", padL, h - 10);
    rdmCtx.fillText("Doppler (m/s)", padL + pw * 0.36, h - 10);
    rdmCtx.fillText("+" + ax.vel_max_mps, w - padR - 42, h - 10);
    rdmCtx.fillText((ax.range_max_m / 1000).toFixed(0) + " km", 6, padT + 10);
    rdmCtx.fillText("Range", 6, padT + ph * 0.5);
    rdmCtx.fillText("0 m", 14, padT + ph);
  }

  function renderTable(frame) {
    const rows = [];
    for (const [tid, t] of Object.entries(frame.targets)) {
      let badge = "SUB-CLUTTER";
      let cls = "st-low";
      if (!t.vis) { badge = "TERRAIN OCCLUDED"; cls = "st-occ"; }
      else if (!t.beam) { badge = "OUT OF BEAM"; cls = "st-out"; }
      else if (t.cfar) { badge = "CFAR LOCK"; cls = "st-ok"; }
      rows.push(
        "<tr><td><code>" + tid + "</code></td>" +
        "<td>" + t.range_m.toFixed(0) + " m</td>" +
        "<td>" + t.v_rad.toFixed(1) + " m/s</td>" +
        "<td>" + (t.vis ? t.snr_db.toFixed(1) + " dB" : "--") + "</td>" +
        '<td class="' + cls + '">' + badge + "</td></tr>"
      );
    }
    tbody.innerHTML = rows.join("");
  }

  function drawAll() {
    const f = data.frames[frameIdx];
    slider.value = String(frameIdx);
    timeReadout.textContent = "t = " + f.t.toFixed(1) + " s / " + data.duration_s + " s";
    drawScene3D(f);
    drawRdm(f);
    renderTable(f);
    caption.textContent =
      "Sensor @ (" + f.sensor_pos[0].toFixed(0) + ", " + f.sensor_pos[1].toFixed(0) + ", " + f.sensor_pos[2].toFixed(0) +
      ") m ENU · boresight az " + f.az_deg.toFixed(1) + " deg, el " + f.el_deg.toFixed(1) +
      " deg · RDM peak " + f.rdm.peak[0].toFixed(1) + " dB.";
  }

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    cam.yaw -= dx * 0.007;
    cam.pitch = Math.max(0.12, Math.min(1.52, cam.pitch + dy * 0.007));
    drawAll();
  });
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    cam.dist = Math.max(400, Math.min(baseRadius * 3.2, cam.dist * Math.exp(e.deltaY * 0.001)));
    drawAll();
  }, { passive: false });

  el("btn-zoom-in").addEventListener("click", () => {
    cam.dist = Math.max(400, cam.dist * 0.8);
    drawAll();
  });
  el("btn-zoom-out").addEventListener("click", () => {
    cam.dist = Math.min(baseRadius * 3.2, cam.dist * 1.25);
    drawAll();
  });
  el("btn-reset-cam").addEventListener("click", () => setCameraMode("overview"));
  camBtns.forEach((b) => b.addEventListener("click", () => setCameraMode(b.dataset.cam)));
  [chkBldg, chkRoads, chkGlints, chkLos].forEach((c) => c.addEventListener("change", drawAll));

  slider.addEventListener("input", () => {
    frameIdx = slider.valueAsNumber;
    drawAll();
  });
  prevBtn.addEventListener("click", () => {
    frameIdx = Math.max(0, frameIdx - 1);
    drawAll();
  });
  nextBtn.addEventListener("click", () => {
    frameIdx = Math.min(data.frames.length - 1, frameIdx + 1);
    drawAll();
  });
  playBtn.addEventListener("click", () => {
    playing = !playing;
    playBtn.textContent = playing ? "Pause" : "Play";
    if (playing) {
      playTimer = setInterval(() => {
        frameIdx = (frameIdx + 1) % data.frames.length;
        drawAll();
      }, 350);
    } else if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
  });

  drawAll();
})();
