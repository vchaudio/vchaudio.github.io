(function () {
  "use strict";

  function parentWidth(details) {
    var p = details.parentElement;
    return p ? p.clientWidth : 720;
  }

  function narrowMaxPx(details) {
    return Math.min(420, parentWidth(details));
  }

  function applyNarrowMax(details) {
    if (details.open) return;
    details.style.maxWidth = narrowMaxPx(details) + "px";
  }

  /** CSS keyframe only restarts if animation is cleared and reapplied */
  function replayRollAnimation(inner) {
    inner.style.animation = "none";
    void inner.offsetWidth;
    inner.style.removeProperty("animation");
  }

  /* Home spoilers: instant tile width; roll on open only; instant close */
  function initSpoilers() {
    function closeSpoiler(d) {
      if (!d.open) return;
      d.open = false;
      d.style.removeProperty("max-width");
    }

    document.addEventListener(
      "pointerdown",
      function (e) {
        document.querySelectorAll("details.spoiler[open]").forEach(function (d) {
          if (!d.contains(e.target)) closeSpoiler(d);
        });
      },
      true
    );

    document.querySelectorAll("details.spoiler").forEach(function (details) {
      const body = details.querySelector(".spoiler-body");
      const inner = details.querySelector(".spoiler-inner");
      const summary = details.querySelector("summary");
      if (!body || !inner || !summary) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      function setHeight(open) {
        if (open) {
          body.style.maxHeight = inner.scrollHeight + 24 + "px";
        } else {
          body.style.maxHeight = "0px";
        }
      }

      summary.addEventListener("click", function (e) {
        if (reduceMotion) return;

        if (!details.open) {
          e.preventDefault();
          details.open = true;
          details.style.removeProperty("max-width");
          replayRollAnimation(inner);
        } else {
          e.preventDefault();
          closeSpoiler(details);
        }
      });

      details.addEventListener("pointerenter", function () {
        if (details.open) return;
        details.classList.remove("spoiler--no-hover");
      });

      summary.addEventListener("pointerdown", function () {
        if (!details.open) {
          details.classList.remove("spoiler--no-hover");
        }
      });

      details.addEventListener("toggle", function () {
        if (details.open) {
          details.classList.remove("spoiler--no-hover");
          setHeight(true);
        } else {
          details.classList.add("spoiler--no-hover");
          setHeight(false);
          applyNarrowMax(details);
        }
      });

      if (details.open) {
        details.style.removeProperty("max-width");
        setHeight(true);
      } else {
        applyNarrowMax(details);
      }

      window.addEventListener(
        "resize",
        function () {
          if (details.open) {
            setHeight(true);
          } else {
            applyNarrowMax(details);
          }
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
