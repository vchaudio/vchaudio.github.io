/* Header brand “re-home” animation: same-origin index ↔ sub. Uses sessionStorage on click so it still runs when Referer is missing. */
(function () {
  if (typeof document === "undefined" || !document.documentElement) return;
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  } catch (e0) {}

  var STORAGE = "vchNavArrival";

  function pathBase(pathname) {
    var p = (pathname || "").replace(/\/+$/, "");
    var i = p.lastIndexOf("/");
    return (i >= 0 ? p.slice(i + 1) : p).toLowerCase();
  }

  function kindFromPathname(pathname) {
    var b = pathBase(pathname);
    if (!b || b === "index.html") return "index";
    if (/\.html$/i.test(b)) return "sub";
    return "index";
  }

  function referrerKind() {
    var ref = document.referrer;
    if (!ref) return "unknown";
    try {
      var u = new URL(ref);
      if (u.origin !== location.origin) return "unknown";
      return kindFromPathname(u.pathname);
    } catch (e1) {
      return "unknown";
    }
  }

  function applyArrivalClass() {
    var here = kindFromPathname(location.pathname);
    var from = referrerKind();
    var pending = null;
    try {
      pending = sessionStorage.getItem(STORAGE);
      if (pending) sessionStorage.removeItem(STORAGE);
    } catch (e2) {}

    if (pending === "to-index" && here === "index") {
      document.documentElement.classList.add("nav-from-sub");
      return;
    }
    if (pending === "to-sub" && here === "sub") {
      document.documentElement.classList.add("nav-from-index");
      return;
    }

    if (here === "index" && from === "sub") {
      document.documentElement.classList.add("nav-from-sub");
    } else if (here === "sub" && from === "index") {
      document.documentElement.classList.add("nav-from-index");
    }
  }

  applyArrivalClass();

  document.addEventListener(
    "click",
    function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var t = e.target;
      if (!t || !t.closest) return;
      var a = t.closest("a[href]");
      if (!a || a.target === "_blank" || a.getAttribute("download")) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#") return;
      try {
        var dest = new URL(a.href, location.href);
        if (dest.origin !== location.origin) return;
        var here = kindFromPathname(location.pathname);
        var destKind = kindFromPathname(dest.pathname);
        if (destKind === here) return;
        if (here === "index" && destKind === "sub") {
          sessionStorage.setItem(STORAGE, "to-sub");
        } else if (here === "sub" && destKind === "index") {
          sessionStorage.setItem(STORAGE, "to-index");
        }
      } catch (e3) {}
    },
    true
  );
})();
