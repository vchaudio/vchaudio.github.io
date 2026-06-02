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
    if (details.closest(".vm-xctrl-spoilers, .project-page-spoilers")) {
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
  /* Project overview pages: staggered load entrance; other pages: scroll reveal */
  function initProjectPageEnter() {
    var projectMain = document.querySelector("main.project-page--hero-glow");
    if (!projectMain) return false;

    var reduceMotion = false;
    try {
      reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e0) {}

    var banner = document.querySelector(".page-overview-banner");
    var items = projectMain.querySelectorAll(".reveal");

    if (reduceMotion) return true;

    if (banner) banner.classList.add("project-enter");

    items.forEach(function (el, index) {
      el.classList.add("project-enter");
      el.style.animationDelay = (0.14 + index * 0.1) + "s";
    });

    return true;
  }

  function initReveal() {
    if (initProjectPageEnter()) return;
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

  function youtubeEmbedSrc(videoId) {
    var params = new URLSearchParams({
      autoplay: "1",
      rel: "0",
      modestbranding: "1",
      origin: location.origin,
    });
    return (
      "https://www.youtube-nocookie.com/embed/" +
      encodeURIComponent(videoId) +
      "?" +
      params.toString()
    );
  }

  /* Marketing: centered YouTube lightbox from thumbnail buttons */
  function initVideoLightbox() {
    var root = document.getElementById("video-lightbox");
    if (!root) return;
    var iframe = document.getElementById("video-lightbox-iframe");
    if (!iframe) return;
    var caption = document.getElementById("video-lightbox-caption");

    iframe.referrerPolicy = "strict-origin-when-cross-origin";

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
      var year = thumb.getAttribute("data-lightbox-year");
      if (!heading && !sub && !year) {
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
      if (year) {
        var date = document.createElement("p");
        date.className = "video-lightbox__caption-year";
        date.textContent = year;
        caption.appendChild(date);
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
      iframe.src = youtubeEmbedSrc(id);
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
    var fsBtn = root.querySelector("[data-lb-fullscreen]");
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
    var capturedPointerId = null;
    var pinchActive = false;
    var pinchDist0 = 0;
    var pinchScale0 = 1;
    var pinchMid0X = 0;
    var pinchMid0Y = 0;
    var pinchPanX0 = 0;
    var pinchPanY0 = 0;
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

    function fullscreenElement() {
      return (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        null
      );
    }

    function isLightboxFullscreen() {
      var el = fullscreenElement();
      return el === img || el === root;
    }

    function exitLightboxFullscreen() {
      if (!isLightboxFullscreen()) return;
      var ex = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
      if (ex) ex.call(document).catch(function () {});
    }

    function updateFullscreenButton() {
      if (!fsBtn || fsBtn.hidden) return;
      var on = fullscreenElement() === img;
      fsBtn.textContent = on ? "Exit" : "Fullscreen";
      fsBtn.setAttribute("aria-label", on ? "Exit fullscreen" : "Enter fullscreen");
      fsBtn.setAttribute("aria-pressed", on ? "true" : "false");
    }

    function toggleLightboxFullscreen() {
      if (!img.getAttribute("src")) return;
      resetView();
      var enter = img.requestFullscreen || img.webkitRequestFullscreen || img.mozRequestFullScreen;
      var ex = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
      if (fullscreenElement() === img) {
        if (ex) ex.call(document).catch(function () {});
      } else if (enter) {
        enter.call(img).catch(function () {});
      }
    }

    function releasePinchPointerCapture() {
      dragging = false;
      stage.classList.remove("is-grabbing");
      if (capturedPointerId != null) {
        try {
          stage.releasePointerCapture(capturedPointerId);
        } catch (errRel) {}
        capturedPointerId = null;
      }
    }

    function pinchMidFromTouches(e) {
      var t0 = e.touches[0];
      var t1 = e.touches[1];
      var dx = t1.clientX - t0.clientX;
      var dy = t1.clientY - t0.clientY;
      return {
        x: (t0.clientX + t1.clientX) / 2,
        y: (t0.clientY + t1.clientY) / 2,
        dist: Math.hypot(dx, dy)
      };
    }

    function onTouchStartPinch(e) {
      if (root.hidden) return;
      if (e.touches.length !== 2) return;
      releasePinchPointerCapture();
      var m = pinchMidFromTouches(e);
      if (m.dist < 8) return;
      pinchDist0 = Math.max(m.dist, 8);
      pinchScale0 = scale;
      pinchMid0X = m.x;
      pinchMid0Y = m.y;
      pinchPanX0 = panX;
      pinchPanY0 = panY;
      pinchActive = true;
    }

    function onTouchMovePinch(e) {
      if (root.hidden || !pinchActive || e.touches.length < 2) return;
      e.preventDefault();
      var m = pinchMidFromTouches(e);
      var d = Math.max(m.dist, 1);
      var next = pinchScale0 * (d / pinchDist0);
      scale = Math.min(5, Math.max(1, next));
      panX = pinchPanX0 + (m.x - pinchMid0X);
      panY = pinchPanY0 + (m.y - pinchMid0Y);
      if (scale <= 1) {
        scale = 1;
        panX = 0;
        panY = 0;
      }
      pan.style.transition = "none";
      pan.style.transform = "translate(" + panX + "px," + panY + "px) scale(" + scale + ")";
      updateZoomLabel();
    }

    function onTouchEndPinch(e) {
      if (e.touches.length < 2) pinchActive = false;
    }

    function onWheel(e) {
      if (root.hidden) return;
      e.preventDefault();
      var factor = e.deltaY < 0 ? 1.1 : 0.9;
      setScale(scale * factor);
    }

    function onPointerDown(e) {
      if (root.hidden) return;
      if (pinchActive) return;
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
        capturedPointerId = e.pointerId;
      } catch (err) {}
      stage.classList.add("is-grabbing");
    }

    function onPointerMove(e) {
      if (pinchActive) return;
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
      if (e && e.pointerId != null && capturedPointerId === e.pointerId) capturedPointerId = null;
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
      stage.addEventListener("touchstart", onTouchStartPinch, { passive: true });
      stage.addEventListener("touchmove", onTouchMovePinch, { passive: false });
      stage.addEventListener("touchend", onTouchEndPinch);
      stage.addEventListener("touchcancel", onTouchEndPinch);
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
      stage.removeEventListener("touchstart", onTouchStartPinch);
      stage.removeEventListener("touchmove", onTouchMovePinch);
      stage.removeEventListener("touchend", onTouchEndPinch);
      stage.removeEventListener("touchcancel", onTouchEndPinch);
    }

    function close() {
      exitLightboxFullscreen();
      pinchActive = false;
      releasePinchPointerCapture();
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

      if (fsBtn) {
        var canFs =
          typeof img.requestFullscreen === "function" ||
          typeof img.webkitRequestFullscreen === "function" ||
          typeof img.mozRequestFullScreen === "function";
        fsBtn.hidden = !canFs;
        updateFullscreenButton();
      }
    }

    root.addEventListener("click", function (e) {
      var fs = e.target.closest("[data-lb-fullscreen]");
      if (fs && root.contains(fs)) {
        e.preventDefault();
        e.stopPropagation();
        toggleLightboxFullscreen();
        return;
      }
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

    document.addEventListener("fullscreenchange", updateFullscreenButton);
    document.addEventListener("webkitfullscreenchange", updateFullscreenButton);
    document.addEventListener("mozfullscreenchange", updateFullscreenButton);

    document.addEventListener("keydown", function (e) {
      if (root.hidden) return;
      if (e.key === "Escape") {
        e.preventDefault();
        if (fullscreenElement() === img) {
          exitLightboxFullscreen();
        } else {
          close();
        }
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
    return Math.min(4, Math.max(2, n));
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

  function portfolioMaxVisibleCols(viewWidth, rows, opts) {
    opts = opts || {};
    if (viewWidth <= 0) viewWidth = 960;
    if (opts.projectMobile) {
      if (viewWidth < 720) return 2;
      if (viewWidth < 960) return rows === 1 ? 3 : 2;
      return rows === 1 ? 4 : 3;
    }
    if (viewWidth < 420) return 2;
    if (viewWidth < 720) return rows === 1 ? 3 : 2;
    return rows === 1 ? 4 : 3;
  }

  function portfolioStripItems(strip) {
    if (!strip) return [];
    var wraps = strip.querySelectorAll(":scope > .video-thumb-wrap");
    if (wraps.length) return [].slice.call(wraps);
    return [].slice.call(strip.querySelectorAll(":scope > .video-thumb"));
  }

  function applyPortfolioGridLayout(root) {
    if (!root.closest(".home-portfolio-block") && !root.closest(".project-portfolio-block")) return false;
    var strip = root.querySelector(".video-scroller__strip--grid-2");
    if (!strip) return false;
    var view = root.querySelector(".video-scroller__viewport");
    var items = portfolioStripItems(strip);
    var n = items.length;
    if (!n) return false;

    var isProject = !!root.closest(".project-portfolio-block");
    var viewWidth = view ? view.clientWidth : 960;

    var rows;
    if (isProject && viewWidth < 720) {
      rows = 1;
    } else {
      rows = n <= 3 ? 1 : 2;
    }
    var totalCols = Math.ceil(n / rows);
    var maxVisible = portfolioMaxVisibleCols(viewWidth, rows, {
      projectMobile: isProject,
    });
    var fitAll = totalCols <= maxVisible;
    var centered = fitAll && (n === 2 || n === 4);
    var colsPerView = fitAll && !centered ? totalCols : centered ? maxVisible : maxVisible;

    root.setAttribute("data-video-scroller-rows", String(rows));
    root.setAttribute("data-portfolio-fit-all", fitAll ? "true" : "false");
    if (centered) root.setAttribute("data-portfolio-centered", "true");
    else root.removeAttribute("data-portfolio-centered");
    root.classList.toggle("video-scroller--fit-all", fitAll);
    strip.style.setProperty("--portfolio-grid-rows", String(rows));
    strip.style.setProperty("--portfolio-total-cols", String(totalCols));
    if (isProject && viewWidth < 960) {
      strip.style.removeProperty("--portfolio-cols-per-view");
    } else {
      strip.style.setProperty("--portfolio-cols-per-view", String(colsPerView));
    }
    return true;
  }

  function portfolioColsPerPageFromCss(thumbEl) {
    if (!thumbEl) return 2;
    var raw = window.getComputedStyle(thumbEl).getPropertyValue("--portfolio-cols-per-view");
    var n = parseInt(String(raw).trim(), 10);
    if (!n || n < 1) return 2;
    return n;
  }

  function portfolioGridScrollPage(root, view, dir, reduceMotion) {
    if (root.getAttribute("data-portfolio-fit-all") === "true") return false;
    var rows = parseInt(root.getAttribute("data-video-scroller-rows"), 10) || 2;
    var strip = root.querySelector(".video-scroller__strip");
    var items = portfolioStripItems(strip);
    if (items.length < 2) return false;

    var colsPerPage = portfolioColsPerPageFromCss(items[0]);
    var totalCols = Math.ceil(items.length / rows);
    if (totalCols <= colsPerPage) return false;

    var colW = items[rows] ? items[rows].offsetLeft - items[0].offsetLeft : 0;
    if (colW <= 0) return false;

    var numPages = Math.ceil(totalCols / colsPerPage);
    var maxScroll = Math.max(0, view.scrollWidth - view.clientWidth);
    var curPage = marketingCarouselPageIndex(view.scrollLeft, colW, maxScroll, numPages);
    var nextPage = Math.max(0, Math.min(numPages - 1, curPage + dir));
    var targetLeft = nextPage >= numPages - 1 ? maxScroll : nextPage * colW;
    view.scrollTo({ left: targetLeft, behavior: reduceMotion ? "auto" : "smooth" });
    return true;
  }

  function portfolioGridButtonState(root, view, prev, next) {
    if (root.getAttribute("data-portfolio-fit-all") === "true") {
      prev.disabled = true;
      next.disabled = true;
      return true;
    }
    var rows = parseInt(root.getAttribute("data-video-scroller-rows"), 10) || 2;
    var strip = root.querySelector(".video-scroller__strip");
    var items = portfolioStripItems(strip);
    if (items.length < 2) return false;

    var colsPerPage = portfolioColsPerPageFromCss(items[0]);
    var totalCols = Math.ceil(items.length / rows);
    if (totalCols <= colsPerPage) return false;

    var colW = items[rows] ? items[rows].offsetLeft - items[0].offsetLeft : 0;
    if (colW <= 0) return false;

    var numPages = Math.ceil(totalCols / colsPerPage);
    var maxScroll = Math.max(0, view.scrollWidth - view.clientWidth);
    var pageIdx = marketingCarouselPageIndex(view.scrollLeft, colW, maxScroll, numPages);
    prev.disabled = pageIdx <= 0;
    next.disabled = pageIdx >= numPages - 1;
    return true;
  }

  /* Marketing page: horizontal video thumbnail strips, prev/next scroll */
  function initVideoScrollers() {
    document.querySelectorAll("[data-video-scroller]").forEach(function (root) {
      var view = root.querySelector(".video-scroller__viewport");
      var prev = root.querySelector(".video-scroller__btn--prev");
      var next = root.querySelector(".video-scroller__btn--next");
      if (!view || !prev || !next) return;

      if (root.closest(".home-portfolio-block") || root.closest(".project-portfolio-block")) {
        applyPortfolioGridLayout(root);
      }

      var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      function scrollPage(dir) {
        if (root.hasAttribute("data-video-scroller-rows")) {
          if (portfolioGridScrollPage(root, view, dir, reduceMotion)) return;
        }
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
        if (root.hasAttribute("data-video-scroller-rows")) {
          if (portfolioGridButtonState(root, view, prev, next)) return;
        }
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
            if (root.closest(".home-portfolio-block") || root.closest(".project-portfolio-block")) applyPortfolioGridLayout(root);
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
      function handleScrollerResize() {
        if (root.closest(".is-tab-inactive")) return;
        if (root.closest(".home-portfolio-block") || root.closest(".project-portfolio-block")) {
          applyPortfolioGridLayout(root);
        }
        updateScrollerState();
      }

      view.addEventListener("scroll", updateScrollerState, { passive: true });
      root.addEventListener("vch:scroller-refresh", updateScrollerState);
      window.addEventListener("resize", handleScrollerResize, { passive: true });
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

  function initProjectTablists() {
    document.querySelectorAll("[data-project-tablist]").forEach(function (tablist) {
      var tabs = [].slice.call(tablist.querySelectorAll("[data-project-tab]"));
      if (!tabs.length) return;

      var panels = {};
      tabs.forEach(function (tab) {
        var key = tab.getAttribute("data-project-tab");
        var panelId = tab.getAttribute("aria-controls");
        var panel = panelId ? document.getElementById(panelId) : null;
        if (key && panel) panels[key] = panel;
      });

      var active =
        tabs.find(function (t) {
          return t.getAttribute("aria-selected") === "true";
        }) || tabs[0];
      var activeKey = active ? active.getAttribute("data-project-tab") : null;
      var panelsWrap = tablist.parentElement
        ? tablist.parentElement.querySelector(".project-portfolio-tab-panels")
        : null;

      function refreshPanelScrollers(panel) {
        if (!panel) return;
        panel.querySelectorAll("[data-video-scroller]").forEach(function (root) {
          if (root.closest(".home-portfolio-block") || root.closest(".project-portfolio-block")) {
            applyPortfolioGridLayout(root);
          }
          root.dispatchEvent(new CustomEvent("vch:scroller-refresh"));
        });
      }

      function clampScrollAfterTabResize() {
        var maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        if (window.scrollY > maxScroll) {
          window.scrollTo(0, maxScroll);
        }
      }

      function switchTab(next) {
        if (!panels[next] || next === activeKey) return;
        activeKey = next;
        tabs.forEach(function (tab) {
          var on = tab.getAttribute("data-project-tab") === next;
          tab.setAttribute("aria-selected", on ? "true" : "false");
          tab.tabIndex = on ? 0 : -1;
        });
        Object.keys(panels).forEach(function (key) {
          var panel = panels[key];
          if (!panel) return;
          var on = key === next;
          panel.classList.toggle("is-tab-inactive", !on);
          panel.setAttribute("aria-hidden", on ? "false" : "true");
        });
        refreshPanelScrollers(panels[next]);
        clampScrollAfterTabResize();
        requestAnimationFrame(clampScrollAfterTabResize);
      }

      if (panelsWrap && activeKey && panels[activeKey]) {
        refreshPanelScrollers(panels[activeKey]);
        if (typeof ResizeObserver !== "undefined") {
          var resizeRaf = 0;
          var tabPanelObserver = new ResizeObserver(function () {
            if (resizeRaf) return;
            resizeRaf = requestAnimationFrame(function () {
              resizeRaf = 0;
              clampScrollAfterTabResize();
            });
          });
          Object.keys(panels).forEach(function (key) {
            if (panels[key]) tabPanelObserver.observe(panels[key]);
          });
        }
      }

      tablist.addEventListener("click", function (e) {
        var tab = e.target.closest("[data-project-tab]");
        if (!tab || !tablist.contains(tab)) return;
        switchTab(tab.getAttribute("data-project-tab"));
      });

      tablist.addEventListener("keydown", function (e) {
        var current = tabs.findIndex(function (t) {
          return t.getAttribute("aria-selected") === "true";
        });
        if (current < 0) return;
        var next = current;
        if (e.key === "ArrowRight") next = (current + 1) % tabs.length;
        else if (e.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
        else return;
        e.preventDefault();
        tabs[next].focus();
        switchTab(tabs[next].getAttribute("data-project-tab"));
      });
    });
  }

  function initScrollToTop() {
    var btn = document.querySelector("[data-scroll-to-top]");
    if (!btn) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var threshold = 320;
    var homeHref = btn.getAttribute("data-home-href");
    var isDual = !!homeHref;

    function updateState() {
      var scrolled = window.scrollY > threshold;
      if (isDual) {
        btn.classList.add("is-visible");
        btn.classList.toggle("is-scrolled", scrolled);
        btn.setAttribute("aria-label", scrolled ? "Back to top" : "Home");
      } else {
        btn.classList.toggle("is-visible", scrolled);
      }
    }

    btn.addEventListener("click", function () {
      if (isDual && !btn.classList.contains("is-scrolled")) {
        try {
          sessionStorage.setItem("vchNavArrival", "to-index");
        } catch (err) {}
        window.location.href = homeHref;
        return;
      }
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });

    window.addEventListener("scroll", updateState, { passive: true });
    updateState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initSpoilers();
      initReveal();
      initProjectTablists();
      initVideoScrollers();
      initOtherProjectsSync();
      initVideoLightbox();
      initImageLightbox();
      initAvatarParallax();
      initScrollToTop();
    });
  } else {
    initSpoilers();
    initReveal();
    initProjectTablists();
    initVideoScrollers();
    initOtherProjectsSync();
    initVideoLightbox();
    initImageLightbox();
    initAvatarParallax();
    initScrollToTop();
  }
})();
