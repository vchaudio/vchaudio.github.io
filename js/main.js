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
    /* Subpages (e.g. VM-XCtrl): full-width spoilers, not index tile width */
    if (details.closest(".vm-xctrl-spoilers")) {
      details.style.removeProperty("max-width");
      return;
    }
    details.style.maxWidth = narrowMaxPx(details) + "px";
  }

  /** CSS keyframe only restarts if animation is cleared and reapplied */
  function replayRollAnimation(inner) {
    inner.style.animation = "none";
    void inner.offsetWidth;
    inner.style.removeProperty("animation");
  }

  /* Home spoilers: instant tile width; roll on open; close only from summary */
  function initSpoilers() {
    function closeSpoiler(d) {
      if (!d.open) return;
      d.open = false;
      d.style.removeProperty("max-width");
    }

    var resizeJobs = [];
    var resizeTimer = null;
    function scheduleSpoilerResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resizeTimer = null;
        for (var i = 0; i < resizeJobs.length; i++) resizeJobs[i]();
      }, 120);
    }

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

      resizeJobs.push(function () {
        if (details.open) setHeight(true);
        else applyNarrowMax(details);
      });
    });

    if (resizeJobs.length) {
      window.addEventListener("resize", scheduleSpoilerResize, { passive: true });
    }
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

  /* Marketing: centered YouTube lightbox from thumbnail buttons */
  function initVideoLightbox() {
    var root = document.getElementById("video-lightbox");
    if (!root) return;
    var iframe = document.getElementById("video-lightbox-iframe");
    if (!iframe) return;
    var caption = document.getElementById("video-lightbox-caption");

    var prevBodyOverflow = "";

    function setCaptionFromThumb(thumb) {
      if (!caption) return;
      caption.textContent = "";
      if (!thumb) {
        caption.hidden = true;
        return;
      }
      var heading = thumb.getAttribute("data-lightbox-heading");
      var sub = thumb.getAttribute("data-lightbox-sub");
      if (!heading && !sub) {
        caption.hidden = true;
        return;
      }
      caption.hidden = false;
      if (heading) {
        var role = document.createElement("p");
        role.className = "video-lightbox__caption-role";
        role.textContent = heading;
        caption.appendChild(role);
      }
      if (sub) {
        var meta = document.createElement("p");
        meta.className = "video-lightbox__caption-sub";
        meta.textContent = sub;
        caption.appendChild(meta);
      }
    }

    function close() {
      iframe.removeAttribute("src");
      root.hidden = true;
      root.setAttribute("aria-hidden", "true");
      document.body.style.overflow = prevBodyOverflow;
      setCaptionFromThumb(null);
    }

    function open(id, thumb) {
      if (!id) return;
      iframe.src =
        "https://www.youtube.com/embed/" +
        encodeURIComponent(id) +
        "?autoplay=1&rel=0&modestbranding=1";
      root.hidden = false;
      root.setAttribute("aria-hidden", "false");
      prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      setCaptionFromThumb(thumb || null);
      var closeBtn = root.querySelector(".video-lightbox__close");
      if (closeBtn) closeBtn.focus();
    }

    document.addEventListener("click", function (e) {
      var thumb = e.target.closest(".video-thumb[data-youtube-id]");
      if (thumb) {
        e.preventDefault();
        open(thumb.getAttribute("data-youtube-id"), thumb);
        return;
      }
      if (root.hidden) return;
      if (e.target.closest("[data-lightbox-close]") && root.contains(e.target)) {
        close();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !root.hidden) close();
    });
  }

  /* My studio: full-screen image lightbox with HQ URL + zoom / pan */
  function initImageLightbox() {
    var root = document.getElementById("image-lightbox");
    if (!root) return;
    var img = document.getElementById("image-lightbox-img");
    var stage = document.getElementById("image-lightbox-stage");
    var pan = document.getElementById("image-lightbox-pan");
    var cap = document.getElementById("image-lightbox-caption");
    var zoomPct = document.getElementById("image-lightbox-zoompct");
    if (!img || !stage || !pan) return;

    var prevBodyOverflow = "";
    var scale = 1;
    var panX = 0;
    var panY = 0;
    var dragging = false;
    var dragStartX = 0;
    var dragStartY = 0;
    var startPanX = 0;
    var startPanY = 0;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var stageBound = false;

    function updateZoomLabel() {
      if (zoomPct) zoomPct.textContent = Math.round(scale * 100) + "%";
    }

    function applyTransform() {
      pan.style.transition = reduceMotion || dragging ? "none" : "transform 0.1s ease-out";
      pan.style.transform = "translate(" + panX + "px," + panY + "px) scale(" + scale + ")";
      updateZoomLabel();
    }

    function resetView() {
      scale = 1;
      panX = 0;
      panY = 0;
      applyTransform();
    }

    function setScale(next) {
      var s = Math.min(5, Math.max(1, next));
      scale = s;
      if (scale <= 1) {
        scale = 1;
        panX = 0;
        panY = 0;
      }
      applyTransform();
    }

    function onWheel(e) {
      if (root.hidden) return;
      e.preventDefault();
      var factor = e.deltaY < 0 ? 1.1 : 0.9;
      setScale(scale * factor);
    }

    function onPointerDown(e) {
      if (root.hidden) return;
      if (e.button !== 0) return;
      if (e.target.closest(".image-lightbox__toolbar") || e.target.closest(".image-lightbox__close")) return;
      if (scale <= 1) return;
      dragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      startPanX = panX;
      startPanY = panY;
      try {
        stage.setPointerCapture(e.pointerId);
      } catch (err) {}
      stage.classList.add("is-grabbing");
    }

    function onPointerMove(e) {
      if (!dragging) return;
      panX = startPanX + (e.clientX - dragStartX);
      panY = startPanY + (e.clientY - dragStartY);
      pan.style.transition = "none";
      pan.style.transform = "translate(" + panX + "px," + panY + "px) scale(" + scale + ")";
      updateZoomLabel();
    }

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove("is-grabbing");
      try {
        if (e && e.pointerId != null) stage.releasePointerCapture(e.pointerId);
      } catch (err2) {}
      applyTransform();
    }

    function onDoubleClickStage(e) {
      if (root.hidden) return;
      if (e.target.closest("button")) return;
      e.preventDefault();
      resetView();
    }

    function bindStage() {
      if (stageBound) return;
      stageBound = true;
      stage.addEventListener("wheel", onWheel, { passive: false });
      stage.addEventListener("pointerdown", onPointerDown);
      stage.addEventListener("pointermove", onPointerMove);
      stage.addEventListener("pointerup", endDrag);
      stage.addEventListener("pointercancel", endDrag);
      stage.addEventListener("dblclick", onDoubleClickStage);
    }

    function unbindStage() {
      if (!stageBound) return;
      stageBound = false;
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", endDrag);
      stage.removeEventListener("pointercancel", endDrag);
      stage.removeEventListener("dblclick", onDoubleClickStage);
    }

    function close() {
      unbindStage();
      img.removeAttribute("src");
      img.removeAttribute("alt");
      if (cap) {
        cap.textContent = "";
        cap.hidden = true;
      }
      root.hidden = true;
      root.setAttribute("aria-hidden", "true");
      document.body.style.overflow = prevBodyOverflow;
      resetView();
    }

    function open(url, alt, caption) {
      if (!url) return;
      bindStage();
      resetView();
      img.alt = alt || "";
      if (cap) {
        if (caption) {
          cap.textContent = caption;
          cap.hidden = false;
        } else {
          cap.textContent = "";
          cap.hidden = true;
        }
      }
      root.hidden = false;
      root.setAttribute("aria-hidden", "false");
      prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      function afterLoad() {
        resetView();
      }
      img.addEventListener("load", afterLoad, { once: true });
      img.src = url;

      var closeBtn = root.querySelector(".image-lightbox__close");
      if (closeBtn) closeBtn.focus();
    }

    root.addEventListener("click", function (e) {
      var zbtn = e.target.closest("[data-lb-zoom]");
      if (!zbtn || !root.contains(zbtn)) return;
      e.preventDefault();
      e.stopPropagation();
      var kind = zbtn.getAttribute("data-lb-zoom");
      if (kind === "in") setScale(scale * 1.2);
      else if (kind === "out") setScale(scale / 1.2);
      else resetView();
    });

    document.addEventListener("click", function (e) {
      var trig = e.target.closest("[data-studio-lightbox]");
      if (trig) {
        e.preventDefault();
        var inner = trig.querySelector("img");
        var altText = inner ? inner.getAttribute("alt") || "" : "";
        var hq = (trig.getAttribute("data-lightbox-hq") || "").trim();
        var url = hq || trig.getAttribute("data-full-src");
        open(url, altText, trig.getAttribute("data-lightbox-caption"));
        return;
      }
      if (root.hidden) return;
      if (e.target.closest("[data-image-lightbox-close]") && root.contains(e.target)) {
        close();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (root.hidden) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setScale(scale * 1.15);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setScale(scale / 1.15);
      } else if (e.key === "0") {
        e.preventDefault();
        resetView();
      }
    });
  }

  function marketingThumbsPerPageFromCss(thumbEl) {
    if (!thumbEl) return 4;
    var raw = window.getComputedStyle(thumbEl).getPropertyValue("--marketing-thumbs-per-view");
    var n = parseInt(String(raw).trim(), 10);
    if (!n || n < 1) return 4;
    return Math.min(4, n);
  }

  /* Which marketing carousel "page" is closest to current scrollLeft */
  function marketingCarouselPageIndex(scrollLeft, pageW, maxScroll, numPages) {
    if (numPages <= 1) return 0;
    var best = 0;
    var bestDist = Infinity;
    for (var pi = 0; pi < numPages; pi++) {
      var pos = pi === numPages - 1 ? maxScroll : pi * pageW;
      var d = Math.abs(scrollLeft - pos);
      if (d < bestDist) {
        bestDist = d;
        best = pi;
      }
    }
    return best;
  }

  /* Marketing page: horizontal video thumbnail strips, prev/next scroll */
  function initVideoScrollers() {
    document.querySelectorAll("[data-video-scroller]").forEach(function (root) {
      var view = root.querySelector(".video-scroller__viewport");
      var prev = root.querySelector(".video-scroller__btn--prev");
      var next = root.querySelector(".video-scroller__btn--next");
      if (!view || !prev || !next) return;

      var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      function scrollPage(dir) {
        if (root.hasAttribute("data-other-projects-sync")) {
          var thumbs = root.querySelectorAll(".video-thumb");
          if (!thumbs.length) return;
          var w = thumbs[0].offsetWidth || view.clientWidth;
          if (!w) return;
          var maxI = thumbs.length - 1;
          var idx = Math.floor((view.scrollLeft + w * 0.45) / w);
          idx = Math.max(0, Math.min(maxI, idx + dir));
          view.scrollTo({ left: idx * w, behavior: reduceMotion ? "auto" : "smooth" });
          return;
        }
        /* Marketing & ads: paged scroll; thumbs per row from CSS --marketing-thumbs-per-view */
        if (root.closest(".marketing-showcase") != null) {
          var stripM = root.querySelector(".video-scroller__strip");
          var thumbsM = stripM ? stripM.querySelectorAll(":scope > .video-thumb") : [];
          if (thumbsM.length >= 2) {
            var perPageM = marketingThumbsPerPageFromCss(thumbsM[0]);
            var nM = thumbsM.length;
            var numPagesM = Math.ceil(nM / perPageM);
            if (numPagesM > 1 && perPageM < nM && thumbsM[perPageM]) {
              var pageWM = thumbsM[perPageM].offsetLeft - thumbsM[0].offsetLeft;
              if (pageWM > 0) {
                var maxScrollM = Math.max(0, view.scrollWidth - view.clientWidth);
                var curPage = marketingCarouselPageIndex(view.scrollLeft, pageWM, maxScrollM, numPagesM);
                var nextPage = Math.max(0, Math.min(numPagesM - 1, curPage + dir));
                var targetLeft = nextPage >= numPagesM - 1 ? maxScrollM : nextPage * pageWM;
                view.scrollTo({ left: targetLeft, behavior: reduceMotion ? "auto" : "smooth" });
                return;
              }
            }
          }
        }
        var amount = Math.max(120, view.clientWidth * 0.72);
        view.scrollBy({ left: dir * amount, behavior: reduceMotion ? "auto" : "smooth" });
      }

      function updateButtons() {
        var eps = 8;
        var isOther = root.hasAttribute("data-other-projects-sync");
        if (isOther) {
          var thumbs = root.querySelectorAll(".video-thumb");
          var w = (thumbs[0] && thumbs[0].offsetWidth) || view.clientWidth;
          if (w > 0) {
            var maxI = thumbs.length - 1;
            var idx = Math.floor((view.scrollLeft + w * 0.45) / w);
            idx = Math.max(0, Math.min(maxI, idx));
            prev.disabled = idx <= 0;
            next.disabled = idx >= maxI;
            return;
          }
        }
        var isMarketing = !isOther && root.closest(".marketing-showcase") != null;
        if (isMarketing) {
          var stripB = root.querySelector(".video-scroller__strip");
          var thumbsB = stripB ? stripB.querySelectorAll(":scope > .video-thumb") : [];
          if (thumbsB.length >= 2) {
            var perPB = marketingThumbsPerPageFromCss(thumbsB[0]);
            var nB = thumbsB.length;
            var numPB = Math.ceil(nB / perPB);
            if (numPB > 1 && perPB < nB && thumbsB[perPB]) {
              var pageWB = thumbsB[perPB].offsetLeft - thumbsB[0].offsetLeft;
              if (pageWB > 0) {
                var maxSB = Math.max(0, view.scrollWidth - view.clientWidth);
                var pageIdx = marketingCarouselPageIndex(view.scrollLeft, pageWB, maxSB, numPB);
                prev.disabled = pageIdx <= 0;
                next.disabled = pageIdx >= numPB - 1;
                return;
              }
            }
          }
        }
        prev.disabled = view.scrollLeft <= eps;
        next.disabled = view.scrollLeft + view.clientWidth >= view.scrollWidth - eps;
      }

      function updateEdgeFades() {
        var eps = 4;
        var maxScroll = view.scrollWidth - view.clientWidth;
        if (maxScroll <= eps) {
          view.removeAttribute("data-fade-left");
          view.removeAttribute("data-fade-right");
          return;
        }
        if (view.scrollLeft > eps) view.setAttribute("data-fade-left", "1");
        else view.removeAttribute("data-fade-left");
        if (view.scrollLeft < maxScroll - eps) view.setAttribute("data-fade-right", "1");
        else view.removeAttribute("data-fade-right");
      }

      function updateScrollerState() {
        updateButtons();
        updateEdgeFades();
      }

      root.querySelectorAll("img").forEach(function (im) {
        if (im.complete) return;
        im.addEventListener(
          "load",
          function () {
            updateScrollerState();
          },
          { passive: true }
        );
      });

      prev.addEventListener("click", function () {
        scrollPage(-1);
      });
      next.addEventListener("click", function () {
        scrollPage(1);
      });
      view.addEventListener("scroll", updateScrollerState, { passive: true });
      window.addEventListener("resize", updateScrollerState, { passive: true });
      updateScrollerState();
      requestAnimationFrame(function () {
        requestAnimationFrame(updateScrollerState);
      });
    });
  }

  /* Other projects: sync category, video name, and description to active slide */
  function initOtherProjectsSync() {
    var root = document.querySelector("[data-other-projects-sync]");
    if (!root) return;
    var view = root.querySelector(".video-scroller__viewport");
    var categoryEl = document.getElementById("other-projects-sync-category");
    var titleEl = document.getElementById("other-projects-sync-title");
    var descEl = document.getElementById("other-projects-sync-desc");
    if (!view || !categoryEl || !titleEl || !descEl) return;
    var thumbs = [].slice.call(root.querySelectorAll(".video-thumb[data-op-title]"));
    if (!thumbs.length) return;

    var raf = 0;

    function activeThumb() {
      var slide = (thumbs[0] && thumbs[0].offsetWidth) || view.clientWidth;
      if (!slide) return thumbs[0];
      var i = Math.floor((view.scrollLeft + slide * 0.45) / slide);
      if (i < 0) i = 0;
      if (i >= thumbs.length) i = thumbs.length - 1;
      return thumbs[i];
    }

    function apply() {
      var t = activeThumb();
      var cat = (t && t.getAttribute("data-op-category")) || "";
      var name = (t && t.getAttribute("data-op-title")) || "";
      var desc = (t && t.getAttribute("data-op-desc")) || "";
      if (categoryEl.textContent !== cat) categoryEl.textContent = cat;
      if (titleEl.textContent !== name) titleEl.textContent = name;
      if (descEl.textContent !== desc) descEl.textContent = desc;
    }

    function schedule() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        apply();
      });
    }

    view.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    if (typeof ResizeObserver !== "undefined") {
      try {
        var ro = new ResizeObserver(schedule);
        ro.observe(view);
      } catch (errRo) {}
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(apply);
    });
  }

  /* Subtle parallax on avatar (respect reduced motion); rAF-throttled to avoid jank */
  function initAvatarParallax() {
    var wrap = document.querySelector(".avatar-wrap");
    if (!wrap || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var ring = wrap.querySelector(".avatar-ring");
    if (!ring) return;

    var rafId = 0;
    var lastClientX = 0;
    var lastClientY = 0;

    function applyParallax() {
      rafId = 0;
      var rect = wrap.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = (lastClientX - cx) / (rect.width / 2);
      var dy = (lastClientY - cy) / (rect.height / 2);
      ring.style.transform =
        "perspective(800px) rotateY(" + dx * 8 + "deg) rotateX(" + -dy * 6 + "deg)";
    }

    wrap.addEventListener(
      "mousemove",
      function (e) {
        lastClientX = e.clientX;
        lastClientY = e.clientY;
        if (rafId) return;
        rafId = requestAnimationFrame(applyParallax);
      },
      { passive: true }
    );

    wrap.addEventListener(
      "mouseleave",
      function () {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        ring.style.transform = "";
      },
      { passive: true }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initSpoilers();
      initReveal();
      initVideoScrollers();
      initOtherProjectsSync();
      initVideoLightbox();
      initImageLightbox();
      initAvatarParallax();
    });
  } else {
    initSpoilers();
    initReveal();
    initVideoScrollers();
    initOtherProjectsSync();
    initVideoLightbox();
    initImageLightbox();
    initAvatarParallax();
  }
})();
