/* Interactive SysML-style S³ Digital Thread Explorer for chatterguru.com */
"use strict";

(() => {
  const DATA_URL = "assets/s3-mbse-data.json";
  const NS = "http://www.w3.org/2000/svg";

  const state = {
    data: null,
    diagram: "bdd",
    selectedId: "HybridReceiver",
    rtmGroup: "all",
    rtmQuery: "",
  };

  const DIAGRAM_META = {
    uc: {
      frame: "uc [package] S3_Operational_Context [CG-RAD-CONOPS-001]",
      caption: "Operational actors, core Workbench workflows, and explicit preflight / passive-replay boundaries.",
      defaultNode: "S3Workbench",
    },
    req: {
      frame: "req [package] S3_Requirements_Hierarchy [49 AST-Verified Candidates]",
      caption: "Traceability from Stakeholder Needs (STK-001..024) via «deriveReqt» to System Candidates and «verify» Negative-Control Tests.",
      defaultNode: "PreflightGate",
    },
    bdd: {
      frame: "bdd [package] S3_Unified_Architecture [Multi-Sensor & HBF2]",
      caption: "Composite SysML Block Definition Diagram showing typed value properties and architectural ownership.",
      defaultNode: "HybridReceiver",
    },
    ibd: {
      frame: "ibd [block] S3UnifiedWorkbench [Same-Source Parity & Fail-Closed Flow]",
      caption: "Internal Block Diagram with typed ports and item flows proving identical frozen source consumption and truth isolation.",
      defaultNode: "AdaptiveBranches",
    },
    par: {
      frame: "par [block] S3_Physical_And_Resource_Constraints [Fail-Closed Bounds]",
      caption: "Parametric constraint blocks binding RMB conditioning, SAR spatial aliasing, monopulse coherence, and compute caps.",
      defaultNode: "ConstraintRMB",
    },
  };

  const $ = (id) => document.getElementById(id);
  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

  function el(tag, attrs = {}, text = null) {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      node.setAttribute(k, String(v));
    }
    if (text !== null) node.textContent = text;
    return node;
  }

  function addDefs(svg) {
    const defs = el("defs");
    // Open arrow (dependency / item flow / deriveReqt / verify)
    const mOpen = el("marker", { id: "arrow-open", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 8, markerHeight: 8, orient: "auto-start-reverse" });
    mOpen.append(el("path", { d: "M 1 1 L 9 5 L 1 9", fill: "none", stroke: "#0b6d82", "stroke-width": 1.6 }));
    defs.append(mOpen);

    // Filled arrow (solid item flow)
    const mSolid = el("marker", { id: "arrow-solid", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 8, markerHeight: 8, orient: "auto-start-reverse" });
    mSolid.append(el("path", { d: "M 0 1 L 9 5 L 0 9 z", fill: "#1f2a36" }));
    defs.append(mSolid);

    // Filled composition diamond (SysML bdd composition)
    const mDiamond = el("marker", { id: "diamond-comp", viewBox: "0 0 14 10", refX: 1, refY: 5, markerWidth: 11, markerHeight: 8, orient: "auto" });
    mDiamond.append(el("path", { d: "M 1 5 L 7 1 L 13 5 L 7 9 z", fill: "#1f2a36", stroke: "#1f2a36", "stroke-width": 1 }));
    defs.append(mDiamond);

    svg.append(defs);
  }

  function createSysmlFrame(svg, width, height, frameTitle) {
    svg.append(el("rect", { x: 2, y: 2, width: width - 4, height: height - 4, rx: 6, fill: "#ffffff", stroke: "#b7c6cf", "stroke-width": 1.5 }));
    const headerW = Math.min(width - 40, Math.max(360, frameTitle.length * 7.4 + 34));
    svg.append(el("path", {
      d: `M 2 2 H ${headerW} V 24 L ${headerW - 14} 34 H 2 Z`,
      fill: "#edf5f7",
      stroke: "#b7c6cf",
      "stroke-width": 1.5,
    }));
    svg.append(el("text", {
      x: 14, y: 22, fill: "#17202a", "font-size": 12.5, "font-weight": 800,
      "font-family": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    }, frameTitle));
  }

  function makeInteractiveGroup(elementId) {
    const g = el("g", {
      class: "sysml-node" + (state.selectedId === elementId ? " is-selected" : ""),
      tabindex: "0",
      role: "button",
      "data-element-id": elementId,
      "aria-label": "Inspect " + elementId,
    });
    const pick = () => {
      state.selectedId = elementId;
      renderDiagram();
      renderInspector();
    };
    g.addEventListener("click", pick);
    g.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        pick();
      }
    });
    return g;
  }

  function drawBlock(svg, { id, x, y, w, h, stereo = "«block»", title, lines = [], accent = "#1f2a36", fill = "#ffffff", headFill = "#f2f7f9", rx = 5 }) {
    const g = makeInteractiveGroup(id);
    g.append(el("rect", { class: "node-box", x, y, width: w, height: h, rx, fill, stroke: accent, "stroke-width": 1.6 }));
    const headH = 44;
    g.append(el("rect", { x: x + 1, y: y + 1, width: w - 2, height: headH, rx: Math.max(0, rx - 1), fill: headFill }));
    g.append(el("line", { x1: x, y1: y + headH, x2: x + w, y2: y + headH, stroke: "#d0dce2", "stroke-width": 1.2 }));
    g.append(el("text", { x: x + w / 2, y: y + 17, "text-anchor": "middle", fill: "#0b6d82", "font-size": 10.5, "font-weight": 700, "font-family": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" }, stereo));
    g.append(el("text", { x: x + w / 2, y: y + 34, "text-anchor": "middle", fill: "#17202a", "font-size": 12.5, "font-weight": 800 }, title));
    lines.forEach((ln, idx) => {
      g.append(el("text", {
        x: x + 10, y: y + headH + 17 + idx * 16, fill: "#465865", "font-size": 10.5,
        "font-family": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      }, ln));
    });
    svg.append(g);
  }

  function drawConnector(svg, d, { dashed = false, markerEnd = "url(#arrow-open)", markerStart = "", stroke = "#0b6d82", label = "", lx = 0, ly = 0 } = {}) {
    const attrs = { d, fill: "none", stroke, "stroke-width": 1.5 };
    if (dashed) attrs["stroke-dasharray"] = "6,4";
    if (markerEnd) attrs["marker-end"] = markerEnd;
    if (markerStart) attrs["marker-start"] = markerStart;
    svg.append(el("path", attrs));
    if (label) {
      svg.append(el("rect", { x: lx - label.length * 3.2 - 5, y: ly - 10, width: label.length * 6.4 + 10, height: 15, rx: 3, fill: "#ffffff", opacity: 0.92 }));
      svg.append(el("text", {
        x: lx, y: ly + 1, "text-anchor": "middle", fill: stroke, "font-size": 10, "font-weight": 700,
        "font-family": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      }, label));
    }
  }

  function drawPort(svg, x, y, label, align = "top") {
    svg.append(el("rect", { x: x - 5, y: y - 5, width: 10, height: 10, fill: "#18a8c5", stroke: "#0b6d82", "stroke-width": 1.3 }));
    const ly = align === "top" ? y - 9 : y + 18;
    svg.append(el("text", {
      x, y: ly, "text-anchor": "middle", fill: "#0b6d82", "font-size": 9.5, "font-weight": 700,
      "font-family": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    }, label));
  }

  function drawActor(svg, x, y, name) {
    svg.append(el("circle", { cx: x, cy: y, r: 10, fill: "#ffffff", stroke: "#1f2a36", "stroke-width": 1.8 }));
    svg.append(el("line", { x1: x, y1: y + 10, x2: x, y2: y + 36, stroke: "#1f2a36", "stroke-width": 1.8 }));
    svg.append(el("line", { x1: x - 14, y1: y + 20, x2: x + 14, y2: y + 20, stroke: "#1f2a36", "stroke-width": 1.8 }));
    svg.append(el("line", { x1: x, y1: y + 36, x2: x - 12, y2: y + 54, stroke: "#1f2a36", "stroke-width": 1.8 }));
    svg.append(el("line", { x1: x, y1: y + 36, x2: x + 12, y2: y + 54, stroke: "#1f2a36", "stroke-width": 1.8 }));
    svg.append(el("text", { x, y: y + 70, "text-anchor": "middle", fill: "#17202a", "font-size": 11.5, "font-weight": 700 }, name));
  }

  function drawUseCase(svg, { id, cx, cy, rx, ry, title, sub }) {
    const g = makeInteractiveGroup(id);
    g.append(el("ellipse", { class: "node-box", cx, cy, rx, ry, fill: "#f2fbfd", stroke: "#0b6d82", "stroke-width": 1.6 }));
    g.append(el("text", { x: cx, y: cy - 3, "text-anchor": "middle", fill: "#17202a", "font-size": 12, "font-weight": 800 }, title));
    if (sub) {
      g.append(el("text", { x: cx, y: cy + 13, "text-anchor": "middle", fill: "#465865", "font-size": 10 }, sub));
    }
    svg.append(g);
  }

  function buildBddSvg() {
    const W = 980, H = 560;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "SysML Block Definition Diagram of S3 Unified Architecture" });
    addDefs(svg);
    createSysmlFrame(svg, W, H, DIAGRAM_META.bdd.frame);

    // Top root block
    drawBlock(svg, {
      id: "S3Workbench", x: 355, y: 52, w: 270, h: 98,
      title: "S3UnifiedWorkbench",
      lines: ["studio3D: CesiumStudioView", "sharedSession: SharedSensorPanel", "hybridLab: HybridSfapPanel"],
      headFill: "#e4f4f8",
    });

    // Tier 2: World, Eligibility, Governance, Evidence
    drawBlock(svg, {
      id: "SceneSnapshot", x: 24, y: 205, w: 215, h: 100,
      title: "SceneSnapshot",
      lines: ["sample_times_s: float[*]", "origin_wgs84: ENU/WGS84", "content_digest: sha256"],
    });
    drawBlock(svg, {
      id: "ObjectSourceEvidence", x: 262, y: 205, w: 215, h: 100,
      title: "ObjectSourceEvidence",
      lines: ["geometry: facets | points", "attitude_rpy_deg: float[3]", "uncertainty: explicit"],
    });
    drawBlock(svg, {
      id: "PreflightGate", x: 500, y: 205, w: 220, h: 100,
      title: "SensorExecutionPlan",
      lines: ["zero_write_preflight()", "budget: mem & work caps", "admitted: bool"],
      headFill: "#fff6e0", accent: "#a87314",
    });
    drawBlock(svg, {
      id: "SealedArchive", x: 742, y: 205, w: 214, h: 100,
      title: "SealedHDF5 & Viewer",
      lines: ["sar_v2: z0 + z=h_DEM", "sha256_tamper_gate()", "passive_replay: true"],
      headFill: "#eaf5ee", accent: "#1f6a46",
    });

    // Composition lines from S3Workbench to Tier 2
    drawConnector(svg, "M 490 150 V 178 H 131 V 205", { markerStart: "url(#diamond-comp)", markerEnd: "", stroke: "#1f2a36" });
    drawConnector(svg, "M 490 150 V 178 H 369 V 205", { markerStart: "url(#diamond-comp)", markerEnd: "", stroke: "#1f2a36" });
    drawConnector(svg, "M 490 150 V 178 H 610 V 205", { markerStart: "url(#diamond-comp)", markerEnd: "", stroke: "#1f2a36" });
    drawConnector(svg, "M 490 150 V 178 H 849 V 205", { markerStart: "url(#diamond-comp)", markerEnd: "", stroke: "#1f2a36" });

    // Tier 3: Sensor Producers & Adaptive Processing
    drawBlock(svg, {
      id: "SharedRadarAdapter", x: 24, y: 382, w: 176, h: 112,
      title: "SharedRadarAdapter",
      lines: ["common_cpi_lfm()", "cfar_monopulse()", "zero_truth_leakage"],
    });
    drawBlock(svg, {
      id: "SharedSarAdapter", x: 214, y: 382, w: 184, h: 112,
      title: "SharedSarAdapter",
      lines: ["spotlight | stripmap", "moving_dem_occluded()", "focus_z0 + focus_dem()"],
    });
    drawBlock(svg, {
      id: "SharedIRAdapter", x: 412, y: 382, w: 170, h: 112,
      title: "SharedIRAdapter",
      lines: ["6dof_rigid_rotation()", "planck_lwir_mwir()", "explicit_nodata_mask"],
    });
    drawBlock(svg, {
      id: "HybridReceiver", x: 596, y: 382, w: 178, h: 112,
      title: "HybridReceiver",
      lines: ["T_analog: N -> S", "polyphase_4tap(F)", "seal_metadata_sha256"],
    });
    drawBlock(svg, {
      id: "AdaptiveBranches", x: 788, y: 382, w: 168, h: 112,
      title: "STAP / Joint SFAP",
      lines: ["gip_screened_stap()", "joint_SxF_sfap()", "branch_kalman_track()"],
    });

    // Dependencies from PreflightGate to Tier 3 producers
    [112, 306, 497, 685, 872].forEach((tx) => {
      drawConnector(svg, `M 610 305 V 344 H ${tx} V 382`, { dashed: true, stroke: "#0b6d82" });
    });
    svg.append(el("rect", { x: 446, y: 334, width: 140, height: 18, rx: 3, fill: "#ffffff" }));
    svg.append(el("text", { x: 516, y: 347, "text-anchor": "middle", fill: "#0b6d82", "font-size": 10.5, "font-weight": 700, "font-family": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" }, "«admits_before_alloc»"));

    return svg;
  }

  function buildIbdSvg() {
    const W = 980, H = 520;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "SysML Internal Block Diagram showing same-source parity and fail-closed flow" });
    addDefs(svg);
    createSysmlFrame(svg, W, H, DIAGRAM_META.ibd.frame);

    // Dashed fail-closed preflight boundary
    svg.append(el("rect", { x: 268, y: 54, width: 205, height: 438, rx: 8, fill: "#fffdf6", stroke: "#c58a1c", "stroke-width": 1.6, "stroke-dasharray": "7,4" }));
    svg.append(el("text", { x: 370, y: 74, "text-anchor": "middle", fill: "#854d0e", "font-size": 11, "font-weight": 800, "font-family": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" }, "FAIL-CLOSED PREFLIGHT"));

    // Left: Frozen World + Evidence
    drawBlock(svg, { id: "SceneSnapshot", x: 26, y: 92, w: 204, h: 108, stereo: "«part»", title: "world: SceneSnapshot", lines: ["immutable 4D poses", "WGS84/ENU + DEM", "sha256 content_digest"] });
    drawBlock(svg, { id: "ObjectSourceEvidence", x: 26, y: 268, w: 204, h: 108, stereo: "«part»", title: "ev: ObjectSourceEvidence", lines: ["explicit facets/points", "6-DoF rigid transform", "material uncertainty"] });

    // Center: Preflight Gate
    drawBlock(svg, { id: "PreflightGate", x: 286, y: 174, w: 170, h: 120, stereo: "«part»", title: "gate: PreflightPlan", lines: ["mem/work caps", "RMB K >= 2*DOF", "zero writes if blocked"], headFill: "#fff6e0", accent: "#a87314" });

    // Right-Center: Frozen Sources
    drawBlock(svg, { id: "HybridReceiver", x: 510, y: 84, w: 204, h: 112, stereo: "«part»", title: "rx: HybridChannelizer", lines: ["one frozen (S,P,R,F)", "4-tap polyphase", "source_digest sealed"] });
    drawBlock(svg, { id: "SharedSarAdapter", x: 510, y: 222, w: 204, h: 104, stereo: "«part»", title: "sar: SharedSarAdapter", lines: ["one SarAcquisitionHistory", "z=0 & z=h_DEM(x,y)", "NaN NoData retained"] });
    drawBlock(svg, { id: "SharedIRAdapter", x: 510, y: 352, w: 204, h: 104, stereo: "«part»", title: "ir: SharedIRAdapter", lines: ["6-DoF rotated facets", "Planck LWIR/MWIR", "explicit NoData mask"] });

    // Far Right: Paired Branches + Passive Archive
    drawBlock(svg, { id: "AdaptiveBranches", x: 760, y: 84, w: 196, h: 132, stereo: "«part»", title: "dsp: PairedBranches", lines: ["Conventional RDM", "GIP-Screened STAP", "Joint S×F SFAP", "CFAR + Monopulse + KF"] });
    drawBlock(svg, { id: "SealedArchive", x: 760, y: 268, w: 196, h: 146, stereo: "«part»", title: "out: SealedSession", lines: ["radar.h5 / sar.h5 (v2)", "ir.h5 / trade_ledger.h5", "session.json (SHA-256)", "Passive Multi-Layer UI"], headFill: "#eaf5ee", accent: "#1f6a46" });

    // Ports
    drawPort(svg, 230, 146, "p_world");
    drawPort(svg, 230, 322, "p_ev");
    drawPort(svg, 286, 234, "p_in");
    drawPort(svg, 456, 234, "p_ok");
    drawPort(svg, 714, 140, "p_iq");
    drawPort(svg, 760, 140, "p_in");
    drawPort(svg, 714, 274, "p_sar");
    drawPort(svg, 714, 404, "p_ir");

    // Item flows
    drawConnector(svg, "M 235 146 H 260 V 222 H 281", { markerEnd: "url(#arrow-solid)", stroke: "#1f2a36" });
    drawConnector(svg, "M 235 322 H 260 V 246 H 281", { markerEnd: "url(#arrow-solid)", stroke: "#1f2a36" });
    drawConnector(svg, "M 461 234 H 484 V 140 H 510", { markerEnd: "url(#arrow-solid)", stroke: "#0b6d82" });
    drawConnector(svg, "M 461 234 H 484 V 274 H 510", { markerEnd: "url(#arrow-solid)", stroke: "#0b6d82" });
    drawConnector(svg, "M 461 234 H 484 V 404 H 510", { markerEnd: "url(#arrow-solid)", stroke: "#0b6d82" });
    drawConnector(svg, "M 719 140 H 755", { markerEnd: "url(#arrow-solid)", stroke: "#0b6d82", label: "same IQ", lx: 737, ly: 126 });
    drawConnector(svg, "M 858 216 V 268", { markerEnd: "url(#arrow-solid)", stroke: "#1f6a46", label: "tracks+RDM", lx: 902, ly: 244 });
    drawConnector(svg, "M 719 274 H 740 V 320 H 760", { markerEnd: "url(#arrow-solid)", stroke: "#1f6a46" });
    drawConnector(svg, "M 719 404 H 740 V 364 H 760", { markerEnd: "url(#arrow-solid)", stroke: "#1f6a46" });

    return svg;
  }

  function buildReqSvg() {
    const W = 980, H = 530;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "SysML Requirements Diagram tracing Stakeholder Needs to System Requirements and Negative Controls" });
    addDefs(svg);
    createSysmlFrame(svg, W, H, DIAGRAM_META.req.frame);

    // Column 1: Stakeholder Needs
    drawBlock(svg, { id: "HybridReceiver", x: 24, y: 68, w: 240, h: 102, stereo: "«requirement»", title: "STK-021..024 · Hybrid Array", lines: ["Status: CANDIDATE_UNAPPROVED", "Hybrid N->S, immutable (S,P,R,F)", "N/S/P/R/F/K trade studies"], headFill: "#fff6e0", accent: "#a87314" });
    drawBlock(svg, { id: "SharedSarAdapter", x: 24, y: 212, w: 240, h: 102, stereo: "«requirement»", title: "STK-003, STK-017 · 4D Scene", lines: ["Status: CANDIDATE_UNAPPROVED", "Repeatable 4D world, terrain", "uncertainty & provenance"], headFill: "#fff6e0", accent: "#a87314" });
    drawBlock(svg, { id: "S3Workbench", x: 24, y: 356, w: 240, h: 102, stereo: "«requirement»", title: "STK-009, STK-018 · Studio", lines: ["Status: CANDIDATE_UNAPPROVED", "Conventional vs adaptive RDM", "passive replay & review"], headFill: "#fff6e0", accent: "#a87314" });

    // Column 2: Derived Candidate System Requirements
    drawBlock(svg, { id: "AdaptiveBranches", x: 356, y: 68, w: 254, h: 102, stereo: "«requirement»", title: "HBF-01..12 (12 Reqs)", lines: ["Status: CANDIDATE_UNAPPROVED", "Polyphase channelizer, Joint SFAP", "GIP STAP, monopulse & ledger"], headFill: "#e4f4f8", accent: "#0b6d82" });
    drawBlock(svg, { id: "SharedIRAdapter", x: 356, y: 212, w: 254, h: 102, stereo: "«requirement»", title: "S³-SAR-F01..05 (5 Reqs)", lines: ["Status: CANDIDATE_UNAPPROVED", "Moving/occluded SAR, DEM 3D BP", "6-DoF IR & multi-layer viewer"], headFill: "#e4f4f8", accent: "#0b6d82" });
    drawBlock(svg, { id: "PreflightGate", x: 356, y: 356, w: 254, h: 102, stereo: "«requirement»", title: "S3-STAP-F01..08 (8 Reqs)", lines: ["Status: CANDIDATE_UNAPPROVED", "Fail-closed preflight, same-source", "King Farm & South Mtn packs"], headFill: "#e4f4f8", accent: "#0b6d82" });

    // Column 3: AST-Verified Negative-Control Test Cases
    drawBlock(svg, { id: "ConstraintRMB", x: 702, y: 68, w: 254, h: 102, stereo: "«testCase»", title: "HBF2 Negative Controls", lines: ["test_hbf2_channelizer_and_joint_sfap", "test_hbf2_03_terrain_and_gip_stap", "test_hbf2_04_05_tracking_and_benchmark"], headFill: "#eaf5ee", accent: "#1f6a46" });
    drawBlock(svg, { id: "ConstraintAliasing", x: 702, y: 212, w: 254, h: 102, stereo: "«testCase»", title: "S³-WORLD Negative Controls", lines: ["test_s3w_01_rotating_ir.py", "test_s3w_02_03_moving_and_dem_sar", "test_s3w_04_multilayer_and_civilian"], headFill: "#eaf5ee", accent: "#1f6a46" });
    drawBlock(svg, { id: "SealedArchive", x: 702, y: 356, w: 254, h: 102, stereo: "«testCase»", title: "RTM & STAP Audit Gates", lines: ["audit_candidate_requirements_rtm.py", "test_s3_stap_ab_acceptance.py", "49 / 49 AST-verified on disk"], headFill: "#eaf5ee", accent: "#1f6a46" });

    // deriveReqt & verify arrows
    drawConnector(svg, "M 356 119 H 264", { dashed: true, label: "«deriveReqt»", lx: 310, ly: 108 });
    drawConnector(svg, "M 356 263 H 264", { dashed: true, label: "«deriveReqt»", lx: 310, ly: 252 });
    drawConnector(svg, "M 356 407 H 264", { dashed: true, label: "«deriveReqt»", lx: 310, ly: 396 });

    drawConnector(svg, "M 702 119 H 610", { dashed: true, stroke: "#1f6a46", label: "«verify»", lx: 656, ly: 108 });
    drawConnector(svg, "M 702 263 H 610", { dashed: true, stroke: "#1f6a46", label: "«verify»", lx: 656, ly: 252 });
    drawConnector(svg, "M 702 407 H 610", { dashed: true, stroke: "#1f6a46", label: "«verify»", lx: 656, ly: 396 });

    return svg;
  }

  function buildParSvg() {
    const W = 980, H = 500;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "SysML Parametric Diagram of S3 Physics and Resource Constraints" });
    addDefs(svg);
    createSysmlFrame(svg, W, H, DIAGRAM_META.par.frame);

    // 4 SysML constraint blocks (rounded corners)
    drawBlock(svg, { id: "ConstraintRMB", x: 40, y: 66, w: 400, h: 98, rx: 14, stereo: "«constraint»", title: "RMB Covariance Conditioning", lines: ["{ K >= 2 * DOF }", "STAP: DOF = S  |  Joint SFAP: DOF = S * F"], headFill: "#fff6e0", accent: "#a87314" });
    drawBlock(svg, { id: "ConstraintAliasing", x: 540, y: 66, w: 400, h: 98, rx: 14, stereo: "«constraint»", title: "SAR Spatial Aliasing & DEM NoData", lines: ["{ 4 * pi * f_max * |DeltaR| / c <= pi }", "{ isNaN(h_DEM(x,y)) => pixel = NaN }"], headFill: "#fff6e0", accent: "#a87314" });
    drawBlock(svg, { id: "ConstraintMonopulse", x: 40, y: 344, w: 400, h: 98, rx: 14, stereo: "«constraint»", title: "Subarray Monopulse Coherence", lines: ["{ SNR_coh >= 6.0 dB  AND  |sin(az)| < 0.999 }", "Rejects low-coherence plots; zero truth rescue"], headFill: "#fff6e0", accent: "#a87314" });
    drawBlock(svg, { id: "ConstraintBudget", x: 540, y: 344, w: 400, h: 98, rx: 14, stereo: "«constraint»", title: "Pre-Allocation Memory & Work Caps", lines: ["{ cube_bytes <= max_cube_bytes }", "{ mflops_per_cpi <= max_mflops_per_cpi }"], headFill: "#fff6e0", accent: "#a87314" });

    // Center value-property blocks
    drawBlock(svg, { id: "HybridReceiver", x: 110, y: 208, w: 220, h: 86, stereo: "«valueProperty»", title: "HybridArrayContract", lines: ["N, S, P, R, F, K", "carrier_hz, bandwidth_hz"] });
    drawBlock(svg, { id: "PreflightGate", x: 380, y: 208, w: 220, h: 86, stereo: "«valueProperty»", title: "PreflightAdmission", lines: ["admitted: bool", "rejection_reasons: str[*]"], headFill: "#e4f4f8", accent: "#0b6d82" });
    drawBlock(svg, { id: "SharedSarAdapter", x: 650, y: 208, w: 220, h: 86, stereo: "«valueProperty»", title: "SarAcquisitionSchedule", lines: ["pulse_times_s, f_max", "focus_elevation_m[*,*]"] });

    // Binding connectors
    drawConnector(svg, "M 220 164 V 208", { markerEnd: "", stroke: "#1f2a36", label: "S, F, K", lx: 186, ly: 188 });
    drawConnector(svg, "M 330 251 H 380", { markerEnd: "", stroke: "#0b6d82" });
    drawConnector(svg, "M 600 251 H 650", { markerEnd: "", stroke: "#0b6d82" });
    drawConnector(svg, "M 760 164 V 208", { markerEnd: "", stroke: "#1f2a36", label: "f_max, ΔR", lx: 804, ly: 188 });
    drawConnector(svg, "M 220 294 V 344", { markerEnd: "", stroke: "#1f2a36", label: "baseline b", lx: 176, ly: 322 });
    drawConnector(svg, "M 490 294 V 320 H 740 V 344", { markerEnd: "", stroke: "#1f2a36", label: "caps", lx: 615, ly: 312 });

    return svg;
  }

  function buildUcSvg() {
    const W = 980, H = 480;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "SysML Use Case Diagram for CG-RAD-CONOPS-001" });
    addDefs(svg);
    createSysmlFrame(svg, W, H, DIAGRAM_META.uc.frame);

    // System boundary
    svg.append(el("rect", { x: 220, y: 54, width: 540, height: 398, rx: 10, fill: "#fafdfe", stroke: "#0b6d82", "stroke-width": 1.6 }));
    svg.append(el("text", { x: 490, y: 76, "text-anchor": "middle", fill: "#0b6d82", "font-size": 12.5, "font-weight": 800 }, "«system» Chatterguru S³ Unified Workbench"));

    // Actors
    drawActor(svg, 95, 118, "Systems Engineer");
    drawActor(svg, 95, 290, "Radar / RF Engineer");
    drawActor(svg, 885, 204, "V&V Reviewer");

    // Use cases
    drawUseCase(svg, { id: "SceneSnapshot", cx: 390, cy: 132, rx: 132, ry: 34, title: "Author 4D World", sub: "King Farm / South Mtn (R2)" });
    drawUseCase(svg, { id: "PreflightGate", cx: 618, cy: 224, rx: 122, ry: 34, title: "Preflight & Budget Gate", sub: "Zero-write admission" });
    drawUseCase(svg, { id: "S3Workbench", cx: 390, cy: 256, rx: 132, ry: 34, title: "Execute Multi-Sensor Run", sub: "RF + DEM-SAR + 6-DoF IR" });
    drawUseCase(svg, { id: "SealedArchive", cx: 490, cy: 382, rx: 158, ry: 36, title: "Passive Replay & Tamper Audit", sub: "SHA-256 HDF5 + RTM Checks" });

    // Associations & include relationships
    drawConnector(svg, "M 115 140 L 258 132", { markerEnd: "", stroke: "#1f2a36" });
    drawConnector(svg, "M 115 312 L 258 256", { markerEnd: "", stroke: "#1f2a36" });
    drawConnector(svg, "M 865 232 L 648 382", { markerEnd: "", stroke: "#1f2a36" });
    drawConnector(svg, "M 498 152 L 542 194", { dashed: true, label: "«include»", lx: 545, ly: 168 });
    drawConnector(svg, "M 512 240 L 502 228", { markerEnd: "", stroke: "none" });
    drawConnector(svg, "M 522 256 L 498 224", { dashed: true, label: "«include»", lx: 525, ly: 280 });
    drawConnector(svg, "M 390 290 L 440 346", { dashed: true, label: "«seals»", lx: 385, ly: 325 });

    return svg;
  }

  function renderDiagram() {
    const wrap = $("sysml-svg-wrap");
    const meta = DIAGRAM_META[state.diagram] || DIAGRAM_META.bdd;
    $("sysml-frame-title").textContent = meta.frame;
    $("sysml-frame-caption").textContent = meta.caption;

    document.querySelectorAll(".sysml-tab").forEach((btn) => {
      btn.setAttribute("aria-selected", btn.dataset.diagram === state.diagram ? "true" : "false");
    });

    const builders = { bdd: buildBddSvg, ibd: buildIbdSvg, req: buildReqSvg, par: buildParSvg, uc: buildUcSvg };
    wrap.replaceChildren((builders[state.diagram] || buildBddSvg)());
  }

  function renderInspector() {
    const box = $("sysml-inspector");
    const elems = state.data?.sysml_elements || {};
    const info = elems[state.selectedId] || Object.values(elems)[0];
    if (!info) return;

    const reqButtons = info.requirements
      .map((rid) => `<button type="button" class="sysml-chip" data-filter-req="${esc(rid)}">${esc(rid)}</button>`)
      .join("");
    const diagButtons = info.diagrams
      .map((dk) => `<button type="button" class="sysml-chip" data-jump-diagram="${esc(dk)}">${esc(dk.toUpperCase())}</button>`)
      .join("");
    const props = info.properties.map((p) => `<li>${esc(p)}</li>`).join("");
    const mods = info.modules.map((m) => `<li>${esc(m)}</li>`).join("");

    box.innerHTML = `
      <span class="stereo">${esc(info.stereotype)}</span>
      <h3>${esc(info.name)}</h3>
      <p class="pkg">${esc(info.package)}</p>
      <p>${esc(info.summary)}</p>
      <h4>Properties &amp; Contracts</h4>
      <ul class="sysml-prop-list">${props}</ul>
      <h4>Linked Requirements (click to filter RTM)</h4>
      <div class="sysml-chip-row">${reqButtons}</div>
      <h4>Implemented Modules</h4>
      <ul class="sysml-prop-list">${mods}</ul>
      <h4>Appears In SysML Views</h4>
      <div class="sysml-chip-row">${diagButtons}</div>
    `;

    box.querySelectorAll("[data-filter-req]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.rtmGroup = "all";
        state.rtmQuery = btn.dataset.filterReq;
        $("rtm-search").value = state.rtmQuery;
        renderRtm();
        $("rtm-section").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    box.querySelectorAll("[data-jump-diagram]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.diagram = btn.dataset.jumpDiagram;
        renderDiagram();
      });
    });
  }

  function renderArchipelago() {
    const slices = state.data?.archipelago_slices || [];
    const grid = $("archipelago-grid");
    if (!grid || !slices.length) return;
    grid.innerHTML = slices
      .map((s) => `
          <article class="conops-phase mbse-equation-slice" id="${esc(s.id)}">
          <div class="conops-phase-head">
            <h3>${esc(s.title)}</h3>
            <span class="mbse-gov-pill phase-active">${esc(s.maturity)}</span>
          </div>
          <p style="margin-bottom:8px;"><strong>Flow:</strong> ${esc(s.pipeline)}</p>
          <ul class="sysml-prop-list" style="margin-bottom:8px;">
            ${s.equations.map((eq) => `<li>${esc(eq)}</li>`).join("")}
          </ul>
          <p style="margin-bottom:6px;"><strong>Limits:</strong> ${esc(s.limits)}</p>
          <p><strong>Modules:</strong> ${s.modules.map((m) => `<code>${esc(m)}</code>`).join(" ")}</p>
            ${s.verification ? `<p><strong>Referenced tests:</strong> ${esc(s.verification)}</p>` : ""}
        </article>
      `)
      .join("");
  }

  function renderMultiLevelReqs() {
    const rows = state.data?.multi_level_requirements || [];
    const tbody = $("multilevel-tbody");
    if (!tbody || !rows.length) return;
    tbody.innerHTML = rows
      .map((r) => `
        <tr>
          <td><strong>${esc(r.id)}</strong><br><code>${esc(r.level)}</code></td>
          <td><code>${esc(r.parent)}</code></td>
          <td><strong>${esc(r.shall)}</strong><br><span style="color:#5f6f7a;font-size:12.5px;">Rationale: ${esc(r.rationale)} · Allocated to: <code>${esc(r.allocation)}</code></span></td>
          <td><code>${esc(r.verification_method)}</code><br>${esc(r.acceptance_criteria)}</td>
          <td><span class="mbse-gov-pill candidate">${esc(r.approval_status)}</span><br><span style="font-size:12px;color:#17202a;">${esc(r.verification_status)}</span><br><code>${esc(r.evidence_ref)}</code></td>
        </tr>
      `)
      .join("");
  }

  function renderConops() {
    const conops = state.data?.conops;
    if (!conops) return;
    $("conops-doc-id").textContent = `${esc(conops.document_id)} v${esc(conops.version)}`;
    $("conops-reading-rule").textContent = conops.reading_rule;

    const phaseGrid = $("conops-phases");
    phaseGrid.innerHTML = conops.phases
      .map((p) => {
        const cls = p.status === "Active" ? "phase-active" : "phase-future";
        return `
          <article class="conops-phase">
            <div class="conops-phase-head">
              <h3>${esc(p.code)} · ${esc(p.name)}</h3>
              <span class="mbse-gov-pill ${esc(cls)}">${esc(p.status)}</span>
            </div>
            <p>${esc(p.gate)}</p>
          </article>
        `;
      })
      .join("");
  }

  function renderRtm() {
    const entries = state.data?.rtm?.entries || [];
    const q = state.rtmQuery.trim().toLowerCase();
    const filtered = entries.filter((row) => {
      if (state.rtmGroup !== "all" && row.group !== state.rtmGroup) return false;
      if (!q) return true;
      const hay = [
        row.req_id,
        row.group,
        row.title,
        ...row.source_modules,
        ...row.negative_control_tests,
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });

    document.querySelectorAll(".rtm-filter-btn").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.group === state.rtmGroup ? "true" : "false");
    });

    $("rtm-count").textContent = `Showing ${esc(filtered.length)} of ${esc(entries.length)} AST-verified candidate requirements (source rev ${esc(state.data.source_revision)} · payload ${state.data.payload_sha256.slice(0, 12)})`;
    $("rtm-tbody").innerHTML = filtered
      .map((row) => `
        <tr>
          <td><strong>${esc(row.req_id)}</strong></td>
          <td><code>${esc(row.group)}</code></td>
          <td><span class="mbse-gov-pill candidate">${esc(row.approval_status)}</span></td>
          <td>${esc(row.title)}</td>
          <td>${row.source_modules.map((m) => `<code>${esc(m)}</code>`).join("<br>")}</td>
          <td>${row.negative_control_tests.map((n) => `<code>${esc(n)}</code>`).join("<br>")}</td>
        </tr>
      `)
      .join("");
  }

  const tick = (ok) => (ok ? '<span class="ev-ok" aria-label="passed">✓</span>' : '<span class="ev-bad" aria-label="failed">✗</span>');

  function renderThread() {
    const d = state.data;
    const ev = d.systems_evidence;
    const rtm = d.rtm;
    const modules = new Set(rtm.entries.flatMap((r) => r.source_modules));
    const tests = new Set(rtm.entries.flatMap((r) => r.negative_control_tests));
    const gateTotal = ev.governance_gates.reduce((n, g) => n + g.controls_total, 0);
    const gatePassed = ev.governance_gates.reduce((n, g) => n + g.controls_passed, 0);
    const qual = ev.qualification.checks;
    const qualPassed = qual.filter((c) => c.passed).length;
    const steps = [
      { n: d.conops.proposal ? 2 : 1, label: "ConOps documents", sub: "Rev 0.1 draft and Rev 0.2 candidate", href: "#conops" },
      { n: rtm.stakeholder_count, label: "Stakeholder needs", sub: "STK candidates", href: "#rtm-section" },
      { n: rtm.system_candidate_count, label: "System requirements", sub: "HBF, STAP and SAR candidates", href: "#rtm-section" },
      { n: d.multi_level_requirements.length, label: "Multi-level “shall” statements", sub: "system → subsystem → model", href: "#multilevel-reqs" },
      { n: modules.size, label: "Source modules traced", sub: "each exists on disk", href: "#rtm-section" },
      { n: tests.size, label: "Negative-control tests", sub: "each found in the test code", href: "#rtm-section" },
      { n: `${gatePassed}/${gateTotal}`, label: "Gate controls executed", sub: "gave the expected decision", href: "#evidence" },
      { n: `${qualPassed}/${qual.length}`, label: "Qualification checks", sub: "physics and tracking, run at export", href: "#qualification" },
      { n: `${ev.readiness.human_gates_signed_off}/${ev.readiness.human_gates_total}`, label: "Owner sign-offs", sub: "still open: nothing self-approves", href: "#readiness", open: true },
    ];
    $("thread-chain").innerHTML = steps
      .map((s) => `
        <li class="thread-step${s.open ? " open" : ""}">
          <a href="${s.href}"><strong>${esc(s.n)}</strong><span>${esc(s.label)}</span><small>${esc(s.sub)}</small></a>
        </li>`)
      .join("");
    $("kpi-gates").textContent = `${gatePassed}/${gateTotal}`;
    $("kpi-qual").textContent = `${qualPassed}/${qual.length}`;
    $("kpi-signoff").textContent = `${ev.readiness.human_gates_signed_off}/${ev.readiness.human_gates_total}`;
  }

  function renderEvidence() {
    const ev = state.data.systems_evidence;
    $("evidence-rule").textContent = ev.reading_rule;
    $("gate-cards").innerHTML = ev.governance_gates
      .map((g) => `
        <article class="ev-card">
          <div class="conops-phase-head">
            <h3>${esc(g.title)}</h3>
            <span class="mbse-gov-pill phase-active">${esc(g.controls_passed)}/${esc(g.controls_total)} controls</span>
          </div>
          <p>${esc(g.purpose)}</p>
          <div class="rtm-table-wrap">
            <table class="rtm-table ev-table">
              <thead><tr><th>Control</th><th>Expected</th><th>Observed</th><th><span class="sr-only">Result</span></th></tr></thead>
              <tbody>${g.controls
                .map((c) => `<tr><td>${esc(c.control)}</td><td><code>${esc(c.expected)}</code></td><td><code>${esc(c.observed)}</code></td><td>${tick(c.passed)}</td></tr>`)
                .join("")}</tbody>
            </table>
          </div>
          <p class="ev-module"><code>${esc(g.module)}</code></p>
        </article>`)
      .join("");

    const q = ev.qualification;
    $("qual-card").innerHTML = `
      <div class="conops-phase-head">
        <h3>${esc(q.title)}</h3>
        <span class="mbse-gov-pill phase-active">${esc(q.checks.filter((c) => c.passed).length)}/${esc(q.checks.length)} checks · seed ${esc(q.seed)}</span>
      </div>
      <div class="rtm-table-wrap">
        <table class="rtm-table ev-table">
          <thead><tr><th>Check</th><th>Measured at export</th><th><span class="sr-only">Result</span></th></tr></thead>
          <tbody>${q.checks.map((c) => `<tr><td>${esc(c.check)}</td><td>${esc(c.measured)}</td><td>${tick(c.passed)}</td></tr>`).join("")}</tbody>
        </table>
      </div>
      <p><strong>Limits:</strong> ${esc(q.limits)}</p>
      <p class="ev-module"><code>${esc(q.module)}</code></p>`;

    const r = ev.readiness;
    $("readiness-summary").textContent =
      `${r.epics_audited} open epics audited · declared files present: ${r.all_engineering_artifacts_present ? "yes" : "no"} · ` +
      `package dependency graph: ${r.dag_passed ? "no cycles or layer violations" : "FAILED"} across ${r.dag_modules_scanned} packages and modules`;
    $("readiness-tbody").innerHTML = r.epics
      .map((e) => `
        <tr>
          <td><strong>${esc(e.epic_issue)}</strong></td>
          <td>${esc(e.title)}</td>
          <td>${e.merged_prs.map((n) => `<code>${esc(n)}</code>`).join(" ")}</td>
          <td>${esc(e.declared_file_count)} ${tick(e.engineering_artifacts_present)}</td>
          <td>${e.human_acceptance_gates.map((h) => `<span class="ev-gate">☐ ${esc(h)}</span>`).join("")}</td>
        </tr>`)
      .join("");

    const sc = ev.repository_scale;
    $("scale-line").textContent =
      `${sc.source_modules.toLocaleString()} source modules · ${sc.test_files.toLocaleString()} test files · ` +
      `${sc.test_functions_defined.toLocaleString()} test functions defined. ${sc.note}`;
  }

  function renderProposal() {
    const p = state.data.conops?.proposal;
    const box = $("conops-proposal");
    if (!p || !box) return;
    box.innerHTML = `
      <div class="conops-phase-head">
        <h3>${esc(p.document_id)} · Rev ${esc(p.version)}</h3>
        <span class="mbse-gov-pill candidate">${esc(p.status)}</span>
      </div>
      <p>The Rev 0.2 candidate ConOps for Sensor Scenario Studio succeeds ${esc(p.predecessor_id)} Rev 0.1. Both documents are bound to this export by a SHA-256 of their text, so the page describes exactly the revisions it was generated from.</p>
      <p class="ev-module"><code>${esc(p.source_path)}</code> · <code>${esc(p.source_text_sha256.slice(0, 16))}…</code></p>`;
  }

  function labelFilterCounts() {
    const counts = state.data.rtm.group_counts || {};
    const total = state.data.rtm.total_requirements;
    document.querySelectorAll(".rtm-filter-btn").forEach((btn) => {
      const n = btn.dataset.group === "all" ? total : counts[btn.dataset.group];
      if (n === undefined) { btn.hidden = true; return; }
      btn.textContent = btn.textContent.replace(/\(\d+\)/, `(${n})`);
    });
  }

  function wireTabKeys() {
    const tabs = [...document.querySelectorAll(".sysml-tab")];
    tabs.forEach((tab, i) => {
      tab.addEventListener("keydown", (ev) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[ev.key];
        if (!step) return;
        ev.preventDefault();
        const next = tabs[(i + step + tabs.length) % tabs.length];
        next.focus();
        next.click();
      });
    });
  }

  function applyHashRoute() {
    const hash = location.hash.replace("#", "").toLowerCase();
    if (DIAGRAM_META[hash]) {
      state.diagram = hash;
      state.selectedId = DIAGRAM_META[hash].defaultNode;
      state.scrollToExplorer = true;
    }
  }

  async function init() {
    try {
      const resp = await fetch(DATA_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      state.data = await resp.json();
    } catch (err) {
      $("sysml-svg-wrap").textContent = `Unable to load the MBSE dataset (${err.message}).`;
      return;
    }

    applyHashRoute();
    $("kpi-total-reqs").textContent = String(state.data.rtm.total_requirements);
    $("kpi-stk-reqs").textContent = String(state.data.rtm.stakeholder_count);
    $("kpi-sys-reqs").textContent = String(state.data.rtm.system_candidate_count);
    $("kpi-rev").textContent = state.data.source_revision;

    document.querySelectorAll(".sysml-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.diagram = btn.dataset.diagram;
        state.selectedId = DIAGRAM_META[state.diagram].defaultNode;
        history.replaceState(null, "", "#" + state.diagram);
        renderDiagram();
        renderInspector();
      });
    });

    document.querySelectorAll(".rtm-filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.rtmGroup = btn.dataset.group;
        renderRtm();
      });
    });

    $("rtm-search").addEventListener("input", (ev) => {
      state.rtmQuery = ev.target.value;
      renderRtm();
    });

    renderDiagram();
    renderInspector();
    renderArchipelago();
    renderMultiLevelReqs();
    renderConops();
    renderRtm();
    renderThread();
    renderEvidence();
    renderProposal();
    labelFilterCounts();
    wireTabKeys();
    if (state.scrollToExplorer) {
      setTimeout(() => $("sysml-explorer").scrollIntoView({ block: "start" }), 50);
    } else {
      const slice = document.getElementById(location.hash.slice(1));
      if (slice?.classList.contains("mbse-equation-slice")) slice.scrollIntoView();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
