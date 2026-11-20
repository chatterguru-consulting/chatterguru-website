/*
 * Phone layout for every published 3D scene on chatterguru.com (written by
 * scripts/publish_website_viewer.py into demos/s3/shared/; styles in phone-shell.css).
 *
 * Adds one Menu button to the scene's top bar. The menu sheet lists only the controls
 * this page has: actions click the page's own buttons, and panels (radar console, step
 * controls, map key, camera feed) open one at a time as a bottom sheet. While a panel is
 * open the Menu button closes it. Nothing changes above 760 px.
 */
(function () {
  'use strict';
  var PHONE = window.matchMedia('(max-width: 760px)');
  var byId = function (id) { return document.getElementById(id); };

  // label, icon, and what it does: click an existing button, open a panel, or follow a link.
  var ACTIONS = [
    { group: 'Scene', label: 'Restart', icon: '↺', click: 'btnResetSim' },
    { group: 'Scene', label: 'Map controls', icon: '\u{1F5FA}', click: 'workspaceView' },
    { group: 'Scene', label: 'Inspect', icon: '\u{1F50E}', click: 'workspaceTelemetry' },
    { group: 'Scene', label: 'Statistics', icon: '\u{1F4C8}', click: 'btnSwtStats' },
    { group: 'Scene', label: 'Build scene', icon: '\u{1F9F1}', click: 'workspaceBuild' },
    { group: 'Panels', label: 'Radar console', icon: '\u{1F4E1}', panel: ['radarHud', 'swtHud'] },
    { group: 'Panels', label: 'Step controls', icon: '⏯', panel: ['touchReplayBar'] },
    { group: 'Panels', label: 'Camera feed', icon: '\u{1F321}', panel: ['swtEoirCue'] },
    { group: 'Panels', label: 'Map key', icon: '\u{1F511}', panel: ['studioMapKey'] },
    { group: 'Panels', label: 'About the model', icon: 'ℹ', panel: ['swtModelNote'] },
    { group: 'More', label: 'Help', icon: '?', click: 'workspaceHelp' },
    { group: 'More', label: 'Data credits', icon: '©', href: 'credits.html' },
    { group: 'More', label: 'All 3D scenes', icon: '←', href: 'gallery' },
  ];

  var state = { panel: null, panelEl: null, wasCollapsed: false };

  function present(a) {
    if (a.click) { var b = byId(a.click); return !!b && !b.hidden; }
    if (a.panel) return a.panel.some(byId);
    return true;
  }

  function galleryHref() {
    var back = document.querySelector('.s3-site-bar a[href$="s3-studio.html"]');
    return back ? back.getAttribute('href') : '/s3-studio.html';
  }

  function closeSheet() {
    var sheet = byId('psSheet'), scrim = byId('psScrim'), btn = byId('psMenuBtn');
    if (sheet) sheet.hidden = true;
    if (scrim) scrim.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function closePanel() {
    if (state.panelEl) {
      state.panelEl.classList.remove('ps-show');
      if (state.wasCollapsed) state.panelEl.classList.add('collapsed');
    }
    state.panel = null; state.panelEl = null;
    document.documentElement.classList.remove('ps-panel-open');
    label();
  }

  function openPanel(a) {
    closePanel();
    var el = a.panel.map(byId).filter(Boolean)[0];
    if (!el) return;
    state.wasCollapsed = el.classList.contains('collapsed');
    el.classList.remove('collapsed');
    el.classList.add('ps-show');
    state.panel = a.label; state.panelEl = el;
    document.documentElement.classList.add('ps-panel-open');
    label();
  }

  function label() {
    var btn = byId('psMenuBtn');
    if (!btn) return;
    btn.innerHTML = state.panel ? '✕ Close' : '☰ Menu';
    btn.setAttribute('aria-label', state.panel ? 'Close ' + state.panel : 'Open the scene menu');
  }

  function buildSheet() {
    var scrim = document.createElement('div');
    scrim.id = 'psScrim'; scrim.hidden = true;
    scrim.addEventListener('click', closeSheet);
    var sheet = document.createElement('section');
    sheet.id = 'psSheet'; sheet.hidden = true;
    sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Scene menu');
    var title = (document.querySelector('.top-bar .top-title') || {}).textContent || 'Scene';
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var html = '<div class="ps-grab"></div><div class="ps-head"><b>' + esc(title.trim()) + '</b><span class="s3-evidence">Simulated, fictional scenario</span></div>';
    var groups = {};
    ACTIONS.filter(present).forEach(function (a, i) {
      (groups[a.group] = groups[a.group] || []).push({ a: a, i: i });
    });
    Object.keys(groups).forEach(function (g) {
      html += '<h3>' + g + '</h3><div class="ps-grid">';
      groups[g].forEach(function (x) {
        var a = x.a, inner = '<i aria-hidden="true">' + a.icon + '</i>' + a.label;
        if (a.href) {
          var href = a.href === 'gallery' ? galleryHref() : a.href;
          html += '<a class="ps-item" href="' + href + '">' + inner + '</a>';
        } else {
          html += '<button type="button" class="ps-item" data-ps="' + ACTIONS.indexOf(a) + '">' + inner + '</button>';
        }
      });
      html += '</div>';
    });
    sheet.innerHTML = html;
    sheet.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-ps]');
      if (!t) return;
      var a = ACTIONS[+t.getAttribute('data-ps')];
      closeSheet();
      if (a.panel) openPanel(a);
      else { closePanel(); var b = byId(a.click); if (b) b.click(); }
    });
    document.body.appendChild(scrim);
    document.body.appendChild(sheet);
  }

  function markActive() {
    var sheet = byId('psSheet');
    if (!sheet) return;
    sheet.querySelectorAll('[data-ps]').forEach(function (b) {
      b.classList.toggle('ps-on', ACTIONS[+b.getAttribute('data-ps')].label === state.panel);
    });
  }

  function install() {
    var bar = document.querySelector('.top-bar');
    if (!bar || byId('psMenuBtn')) return;
    var titleBlock = bar.querySelector('.top-title');
    if (titleBlock && titleBlock.parentElement !== bar) titleBlock.parentElement.classList.add('ps-title');
    ACTIONS.forEach(function (a) {
      (a.panel || []).forEach(function (id) { var el = byId(id); if (el) el.classList.add('ps-panel'); });
    });
    var btn = document.createElement('button');
    btn.id = 'psMenuBtn'; btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      if (state.panel) { closePanel(); return; }
      var sheet = byId('psSheet');
      var open = sheet.hidden;
      if (open) { markActive(); sheet.hidden = false; byId('psScrim').hidden = false; btn.setAttribute('aria-expanded', 'true');
        var first = sheet.querySelector('.ps-item'); if (first) first.focus({ preventScroll: true }); }
      else closeSheet();
    });
    bar.appendChild(btn);
    buildSheet();
    label();
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      if (!byId('psSheet').hidden) closeSheet(); else if (state.panel) closePanel();
    });
  }

  function apply() {
    document.documentElement.classList.toggle('ps-phone', PHONE.matches);
    if (!PHONE.matches) { closeSheet(); closePanel(); }
  }

  function start() {
    install();
    apply();
    if (PHONE.addEventListener) PHONE.addEventListener('change', apply); else PHONE.addListener(apply);
  }
  // The scene builds some of its controls after load; wait for them.
  if (document.readyState === 'complete') setTimeout(start, 0);
  else window.addEventListener('load', function () { setTimeout(start, 300); });
  window.psPhoneShell = { open: function (name) {
    var a = ACTIONS.filter(function (x) { return x.label === name; })[0];
    if (a && a.panel) openPanel(a);
  }, close: function () { closeSheet(); closePanel(); } };
})();
