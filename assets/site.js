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
    if (event.key === "Escape") {
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
