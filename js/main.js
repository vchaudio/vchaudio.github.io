(function () {
  "use strict";

  /* Smooth height for spoiler when JS available (refines native max-height) */
  function initSpoilers() {
    document.querySelectorAll("details.spoiler").forEach(function (details) {
      const body = details.querySelector(".spoiler-body");
      const inner = details.querySelector(".spoiler-inner");
      if (!body || !inner) return;

      function setHeight(open) {
        if (open) {
          body.style.maxHeight = inner.scrollHeight + 24 + "px";
        } else {
          body.style.maxHeight = "0px";
        }
      }

      details.addEventListener("toggle", function () {
        if (details.open) {
          requestAnimationFrame(function () {
            setHeight(true);
          });
        } else {
          setHeight(false);
        }
      });

      if (details.open) {
        requestAnimationFrame(function () {
          setHeight(true);
        });
      }

      window.addEventListener(
        "resize",
        function () {
          if (details.open) setHeight(true);
        },
        { passive: true }
      );
    });
  }

  /* IntersectionObserver scroll reveals */
  function initReveal() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    document.querySelectorAll(".reveal").forEach(function (el) {
      io.observe(el);
    });
  }

  /* Subtle parallax on avatar (respect reduced motion) */
  function initAvatarParallax() {
    var wrap = document.querySelector(".avatar-wrap");
    if (!wrap || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var ring = wrap.querySelector(".avatar-ring");
    if (!ring) return;

    wrap.addEventListener(
      "mousemove",
      function (e) {
        var rect = wrap.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (e.clientX - cx) / (rect.width / 2);
        var dy = (e.clientY - cy) / (rect.height / 2);
        ring.style.transform =
          "perspective(800px) rotateY(" + dx * 8 + "deg) rotateX(" + -dy * 6 + "deg)";
      },
      { passive: true }
    );

    wrap.addEventListener(
      "mouseleave",
      function () {
        ring.style.transform = "";
      },
      { passive: true }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initSpoilers();
      initReveal();
      initAvatarParallax();
    });
  } else {
    initSpoilers();
    initReveal();
    initAvatarParallax();
  }
})();
