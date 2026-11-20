(function () {
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("primary-nav");

  if (!header || !toggle || !nav) {
    return;
  }

  function isMobileNav() {
    return window.matchMedia("(max-width: 700px)").matches;
  }

  function setMenuOpen(isOpen) {
    header.classList.toggle("nav-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    nav.hidden = isMobileNav() && !isOpen;
  }

  setMenuOpen(false);

  toggle.addEventListener("click", function () {
    setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && header.classList.contains("nav-open")) {
      setMenuOpen(false);
      toggle.focus();
    }
  });

  window.addEventListener("resize", function () {
    if (isMobileNav()) {
      setMenuOpen(toggle.getAttribute("aria-expanded") === "true");
    } else {
      nav.hidden = false;
      setMenuOpen(false);
    }
  });
})();

// The site as an app: register the service worker (sw.js) and, in the phone menu, offer
// "Install app" where the browser can install it, or Add to Home Screen steps on iPhone.
(function () {
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "127.0.0.1" || location.hostname === "localhost")) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () { /* the site works without it */ });
    });
  }
  var nav = document.getElementById("primary-nav");
  var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  if (!nav || standalone) {
    return;
  }
  var ua = navigator.userAgent || "";
  var iOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var item = document.createElement("button");
  item.type = "button";
  item.className = "nav-install";
  item.hidden = true;
  item.textContent = "Install app";
  var help = document.createElement("p");
  help.className = "nav-install-help";
  help.hidden = true;
  help.textContent = "In Safari, tap the Share button, then Add to Home Screen.";
  nav.appendChild(item);
  nav.appendChild(help);
  var deferred = null;
  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferred = event;
    item.hidden = false;
  });
  window.addEventListener("appinstalled", function () {
    item.hidden = true;
    help.hidden = true;
  });
  if (iOS) {
    item.textContent = "Add to Home Screen";
    item.hidden = false;
  }
  item.addEventListener("click", function () {
    if (deferred) {
      deferred.prompt();
      deferred.userChoice.finally(function () { deferred = null; item.hidden = true; });
    } else {
      help.hidden = !help.hidden;
    }
  });
})();
