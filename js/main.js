(function () {
  "use strict";

  /* If the URL has a hash we'll be landing on (e.g. a project tab link),
     stop the browser from doing its own auto scroll-restoration / hash
     jump — we dock to header+gap ourselves. Set early so it takes effect
     before the browser scrolls. */
  if (history.scrollRestoration && location.hash) {
    history.scrollRestoration = "manual";
  }

  /* Replace the URL hash without adding history entries (so the Back button
     isn't filled with tab switches). The hash is just a copyable snapshot of
     the current section/tab/view. */
  function setHash(hash) {
    var next = hash ? "#" + hash : "";
    if (location.hash === next) return;
    try {
      history.replaceState(null, "", next || location.pathname + location.search);
    } catch (e) {}
  }

  /* Scroll so the top of `el` sits just below the fixed header, with a small
     extra gap. Uses an explicit offset instead of scrollIntoView so the gap is
     consistent regardless of scroll-padding. */
  var ANCHOR_GAP = 24;
  var DOCK_DOWN_OFFSET = 25;
  function scrollToAnchor(el) {
    if (!el) return;
    var header = document.querySelector(".site-header");
    var headerH = header ? header.getBoundingClientRect().height : 72;
    var top = el.getBoundingClientRect().top + window.scrollY - headerH - ANCHOR_GAP;
    window.scrollTo(0, Math.max(0, top));
  }
  function headerHeight() {
    var header = document.querySelector(".site-header");
    return header ? header.getBoundingClientRect().height : 72;
  }

  /* Copy the current page URL with the given hash to the clipboard, silently
     (no toast / message). Falls back to a hidden textarea for browsers without
     the async clipboard API. */
  function copyLinkToClipboard(hash) {
    var base = location.href.split("#")[0];
    var full = base + (hash ? "#" + hash : "");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(full).catch(function () {});
      return;
    }
    try {
      var ta = document.createElement("textarea");
      ta.value = full;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch (e) {}
  }

  /* Brief, subtle opacity dip so the user sees the click registered (not a
     message — just a faint flash on the heading itself). */
  function flashCopied(el) {
    if (!el) return;
    el.style.transition = "opacity 0.15s ease";
    el.style.opacity = "0.45";
    setTimeout(function () {
      el.style.opacity = "";
      setTimeout(function () { el.style.transition = ""; }, 170);
    }, 150);
  }

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
      /* Project / sub-page spoilers live in full-width containers; their
         summary label doubles as a deep-link anchor (click to copy), so the
         open/close toggle is restricted to the chevron icon. Home (tile)
         spoilers keep the whole-summary click to toggle, as before. */
      var isProjectSpoiler = !!details.closest(".vm-xctrl-spoilers, .project-page-spoilers");
      var label = details.querySelector(".spoiler-summary-label");

      function setHeight(open) {
        if (open) {
          body.style.maxHeight = inner.scrollHeight + 24 + "px";
        } else {
          body.style.maxHeight = "0px";
        }
      }

      summary.addEventListener("click", function (e) {
        var onChevron = e.target && e.target.closest && e.target.closest(".spoiler-chevron");
        if (isProjectSpoiler && !onChevron) {
          /* Clicking the label or summary padding must not toggle — the label
             copies the deep-link instead. Cancel the native toggle. */
          e.preventDefault();
          return;
        }
        if (reduceMotion) return; /* let the native toggle happen (chevron only, for project spoilers) */

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

      /* Click the spoiler's name to copy its deep-link (project spoilers that
         have an anchor id assigned by render.js). Silent copy, faint flash. */
      if (isProjectSpoiler && details.id && label) {
        label.style.cursor = "pointer";
        label.style.webkitTouchCallout = "none";
        label.style.webkitTapHighlightColor = "transparent";
        label.title = "Copy link to this section";
        var summaryEl = details.querySelector("summary");
        if (summaryEl) {
          summaryEl.style.webkitTouchCallout = "none";
          summaryEl.style.webkitTapHighlightColor = "transparent";
        }
        label.addEventListener("click", function (e) {
          e.preventDefault();
          copyLinkToClipboard(details.id);
          flashCopied(label);
        });
      }

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

    document.querySelectorAll(".vm-xctrl-older-versions").forEach(function (nested) {
      nested.addEventListener("toggle", function () {
        var parentSpoiler = nested.closest("details.spoiler");
        if (!parentSpoiler || !parentSpoiler.open) return;
        var parentBody = parentSpoiler.querySelector(".spoiler-body");
        var parentInner = parentSpoiler.querySelector(".spoiler-inner");
        if (!parentBody || !parentInner) return;
        parentBody.style.maxHeight = parentInner.scrollHeight + 24 + "px";
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
    var frame = iframe.parentNode; /* .video-lightbox__frame — sized via padding-bottom */
    var panel = frame && frame.parentNode; /* .video-lightbox__panel — width drives the frame */
    /* Ultrawide: the frame is set to the video's exact ratio BEFORE the video loads
       (the ratio is supplied via data-lightbox-ratio, e.g. "2.37" or "2560:1080"), so
       the video loads into the correctly-sized frame synchronously — just like 16:9,
       with no auto-detect, no resize, and no IFrame API. The player is sized "edges
       added to 16:9": keep the 16:9 height (540px = 0.5625 * 960 base panel) and widen
       to the real ratio, capped by viewport width (96vw) and height (88vh) so it fits. */
    var BASE_16_9_HEIGHT = 540; /* 16:9 height at the 960px base panel */

    /* Parse a ratio string: "W:H" / "WxH" / "W/H" (e.g. 2560:1080) or a decimal
       (e.g. 2.37). Returns 0 if unparseable. */
    function parseRatio(str) {
      if (!str) return 0;
      str = String(str).trim();
      var m = str.match(/^(\d+(?:\.\d+)?)\s*[:x\/]\s*(\d+(?:\.\d+)?)$/i);
      if (m) { var w = parseFloat(m[1]), h = parseFloat(m[2]); return h > 0 ? w / h : 0; }
      var d = parseFloat(str);
      return d > 0 ? d : 0;
    }

    function applyUltrawideRatio(ratio) {
      if (!frame || !panel || !(ratio > 0)) return;
      var vw = window.innerWidth || document.documentElement.clientWidth;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var availW = vw * 0.96;
      var availH = vh * 0.88; /* leave room for close button + caption */
      /* "Edges added to 16:9": keep the 16:9 height, widen to the real ratio, then
         cap by viewport width and height so it never overflows. */
      var w = Math.min(BASE_16_9_HEIGHT * ratio, availW, availH * ratio);
      panel.style.width = Math.round(w) + "px";
      frame.style.paddingBottom = (100 / ratio).toFixed(4) + "%";
    }

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
      if (frame) frame.style.paddingBottom = "";
      if (panel) panel.style.width = "";
    }

    function open(id, thumb) {
      if (!id) return;
      /* Set the frame to the video's exact ratio BEFORE loading, so the video loads
         into the correctly-sized frame synchronously — like 16:9, no resize. The
         ratio comes from data-lightbox-ratio (render.js v.ratio, or inline on static
         buttons). No value / unparseable = 16:9 (CSS default, no override). */
      var r = parseRatio(thumb && thumb.getAttribute("data-lightbox-ratio"));
      if (r > 0) applyUltrawideRatio(r);
      else { if (frame) frame.style.paddingBottom = ""; if (panel) panel.style.width = ""; }
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

  /* My studio: fullscreen gallery (dimmed backdrop like video lightbox) */
  function initImageLightbox() {
    var root = document.getElementById("image-lightbox");
    if (!root) return;
    var img = document.getElementById("image-lightbox-img");
    var imgNext = document.getElementById("image-lightbox-img-next");
    var stage = document.getElementById("image-lightbox-stage");
    var track = document.getElementById("image-lightbox-track");
    if (!img || !imgNext || !stage || !track) return;

    if (!stage.querySelector(".image-lightbox__loader")) {
      var loaderEl = document.createElement("div");
      loaderEl.className = "image-lightbox__loader";
      loaderEl.setAttribute("role", "status");
      loaderEl.setAttribute("aria-label", "Loading photo");
      loaderEl.innerHTML =
        '<svg class="image-lightbox__loader-svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">' +
        '<circle class="image-lightbox__loader-ring" cx="20" cy="20" r="16" pathLength="100" />' +
        "</svg>";
      stage.insertBefore(loaderEl, track);
    }

    var prevBtn = root.querySelector("[data-lb-prev]");
    var nextBtn = root.querySelector("[data-lb-next]");
    var counterEl = document.getElementById("image-lightbox-counter");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var slideMs = reduceMotion ? 0 : 420;
    var slides = [];
    var slideIndex = 0;
    var swipeStartX = 0;
    var swipeStartY = 0;
    var prevBodyOverflow = "";
    var stageBound = false;
    var slideBusy = false;
    var preloadCache = Object.create(null);

    var slideTransition = slideMs
      ? "transform " + slideMs + "ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      : "";

    function setTrackPosition(percent, animate) {
      var value = "translateX(" + percent + "%)";
      track.style.transition = animate ? slideTransition : "none";
      track.style.transform = value;
    }

    function resetTracks() {
      setTrackPosition(0, false);
    }

    function clearSecondFrame() {
      imgNext.removeAttribute("src");
      imgNext.removeAttribute("alt");
    }

    function hideIncoming() {
      clearSecondFrame();
    }

    function preloadImage(url) {
      if (!url) return Promise.resolve(false);
      if (preloadCache[url]) return preloadCache[url];
      preloadCache[url] = new Promise(function (resolve) {
        var probe = new Image();
        var settled = false;
        function settle(ok) {
          if (settled) return;
          settled = true;
          if (!ok) {
            resolve(false);
            return;
          }
          if (probe.decode) {
            probe.decode().then(function () {
              resolve(true);
            }).catch(function () {
              resolve(true);
            });
          } else {
            resolve(true);
          }
        }
        probe.onload = function () {
          settle(true);
        };
        probe.onerror = function () {
          settle(false);
        };
        probe.src = url;
      });
      return preloadCache[url];
    }

    function whenImageReady(el, url) {
      if (!url) return Promise.resolve(false);
      return preloadImage(url).then(function (ok) {
        if (!ok) return false;
        return new Promise(function (resolve) {
          var settled = false;
          function finish(success) {
            if (settled) return;
            settled = true;
            resolve(!!success);
          }
          function afterLoad() {
            if (!el.naturalWidth) {
              finish(false);
              return;
            }
            if (el.decode) {
              el.decode().then(function () {
                finish(true);
              }).catch(function () {
                finish(true);
              });
            } else {
              finish(true);
            }
          }
          el.onload = function () {
            afterLoad();
          };
          el.onerror = function () {
            finish(false);
          };
          if (el.src !== url) el.src = url;
          else if (el.complete && el.naturalWidth) afterLoad();
        });
      });
    }

    function applyImageSources(url) {
      if (url && img.src !== url) img.src = url;
    }

    function setImageSources(url) {
      return whenImageReady(img, url);
    }

    function clearImageSources() {
      img.removeAttribute("src");
      img.removeAttribute("alt");
    }

    function playEnterAnim() {
      if (reduceMotion) {
        stage.classList.remove("image-lightbox__stage--loading");
        return;
      }
      img.style.transition = "";
      img.style.transform = "";
      root.classList.add("image-lightbox--enter");
      stage.classList.remove("image-lightbox__stage--loading");
      window.clearTimeout(playEnterAnim._t);
      playEnterAnim._t = window.setTimeout(function () {
        root.classList.remove("image-lightbox--enter");
        img.style.transform = "";
      }, 380);
    }

    function slidePayload(trig) {
      var inner = trig.querySelector("img");
      var hq = (trig.getAttribute("data-lightbox-hq") || "").trim();
      return {
        url: hq || trig.getAttribute("data-full-src") || "",
        alt: inner ? inner.getAttribute("alt") || "" : "",
      };
    }

    function slidesForTrigger(trig) {
      var gallery = trig.closest(".studio-gallery");
      if (!gallery) return [trig];
      return [].slice.call(gallery.querySelectorAll("[data-studio-lightbox]"));
    }

    function updateGalleryChrome() {
      var multi = slides.length > 1;
      if (prevBtn) prevBtn.hidden = !multi;
      if (nextBtn) nextBtn.hidden = !multi;
      if (counterEl) {
        if (multi) {
          counterEl.textContent = slideIndex + 1 + " / " + slides.length;
          counterEl.hidden = false;
        } else {
          counterEl.textContent = "";
          counterEl.hidden = true;
        }
      }
      root.setAttribute(
        "aria-label",
        multi
          ? "Enlarged photo " + (slideIndex + 1) + " of " + slides.length
          : "Enlarged photo"
      );
    }

    function preloadAdjacent() {
      if (slides.length < 2) return;
      var i = slideIndex;
      var len = slides.length;
      preloadImage(slidePayload(slides[(i - 1 + len) % len]).url);
      preloadImage(slidePayload(slides[(i + 1) % len]).url);
    }

    function showSlideInstant(nextIndex, playEnter) {
      if (!slides.length) return Promise.resolve();
      slideIndex = ((nextIndex % slides.length) + slides.length) % slides.length;
      var payload = slidePayload(slides[slideIndex]);
      if (!payload.url) return Promise.resolve();
      slideBusy = true;
      stage.classList.add("image-lightbox__stage--loading");
      preloadAdjacent();
      hideIncoming();
      resetTracks();
      if (playEnter) {
        img.style.transition = "";
        img.style.transform = "";
      }
      img.alt = payload.alt;
      updateGalleryChrome();
      return setImageSources(payload.url)
        .then(function () {
          if (playEnter) {
            requestAnimationFrame(function () {
              playEnterAnim();
            });
          } else {
            stage.classList.remove("image-lightbox__stage--loading");
          }
        })
        .finally(function () {
          slideBusy = false;
        });
    }

    function finishSlide(nextIndex, payload) {
      applyImageSources(payload.url);
      img.alt = payload.alt;
      resetTracks();
      hideIncoming();
      slideIndex = nextIndex;
      updateGalleryChrome();
      preloadAdjacent();
      slideBusy = false;
    }

    function slideHorizontal(dir) {
      if (!slides.length || slideBusy || slides.length < 2) return;
      var len = slides.length;
      var nextIndex = ((slideIndex + dir) % len + len) % len;
      var payload = slidePayload(slides[nextIndex]);
      if (!payload.url) return;
      var currentSrc = img.getAttribute("src") || "";
      if (currentSrc === payload.url) return;

      slideBusy = true;
      window.clearTimeout(slideHorizontal._fallback);
      track.removeEventListener("transitionend", slideHorizontal._onEnd);

      var ready =
        dir > 0
          ? whenImageReady(imgNext, payload.url).then(function (ok) {
              if (!ok) return false;
              imgNext.alt = payload.alt;
              return true;
            })
          : Promise.all([
              whenImageReady(img, payload.url),
              whenImageReady(imgNext, currentSrc),
            ]).then(function (results) {
              if (!results[0] || !results[1]) return false;
              img.alt = payload.alt;
              return true;
            });

      ready.then(function (ok) {
        if (!ok) {
          slideBusy = false;
          return;
        }

        if (!slideMs) {
          finishSlide(nextIndex, payload);
          return;
        }

        slideHorizontal._onEnd = function (e) {
          if (e.target !== track || e.propertyName !== "transform") return;
          track.removeEventListener("transitionend", slideHorizontal._onEnd);
          window.clearTimeout(slideHorizontal._fallback);
          finishSlide(nextIndex, payload);
        };

        slideHorizontal._fallback = window.setTimeout(function () {
          track.removeEventListener("transitionend", slideHorizontal._onEnd);
          finishSlide(nextIndex, payload);
        }, slideMs + 100);

        track.addEventListener("transitionend", slideHorizontal._onEnd);

        if (dir > 0) {
          setTrackPosition(0, false);
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              setTrackPosition(-50, true);
            });
          });
        } else {
          setTrackPosition(-50, false);
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              setTrackPosition(0, true);
            });
          });
        }
      });
    }

    function stepSlide(dir) {
      slideHorizontal(dir);
    }

    function close() {
      unbindStage();
      slides = [];
      slideIndex = 0;
      slideBusy = false;
      stage.classList.remove("image-lightbox__stage--loading");
      root.classList.remove("image-lightbox--enter");
      hideIncoming();
      resetTracks();
      updateGalleryChrome();
      clearImageSources();
      root.hidden = true;
      root.setAttribute("aria-hidden", "true");
      document.body.style.overflow = prevBodyOverflow;
    }

    function warmNeighborsFromTrigger(trig) {
      var gallery = trig.closest(".studio-gallery");
      if (!gallery) return;
      var list = [].slice.call(gallery.querySelectorAll("[data-studio-lightbox]"));
      var idx = list.indexOf(trig);
      if (idx < 0 || list.length < 2) return;
      var len = list.length;
      preloadImage(slidePayload(list[(idx - 1 + len) % len]).url);
      preloadImage(slidePayload(list[(idx + 1) % len]).url);
    }

    function openFromTrigger(trig) {
      slides = slidesForTrigger(trig);
      slideIndex = Math.max(0, slides.indexOf(trig));
      if (!slidePayload(slides[slideIndex]).url) return;
      preloadAdjacent();
      bindStage();
      prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      root.hidden = false;
      root.setAttribute("aria-hidden", "false");
      showSlideInstant(slideIndex, true).then(function () {
        var closeBtn = root.querySelector(".image-lightbox__close");
        if (closeBtn) closeBtn.focus();
      });
    }

    function onStageClick(e) {
      if (root.hidden) return;
      if (e.target.closest(".image-lightbox__close, [data-lb-prev], [data-lb-next]")) return;
      if (e.target.closest(".image-lightbox__frame:first-child .image-lightbox__img")) return;
      var x = e.clientX;
      var w = window.innerWidth;
      if (slides.length > 1 && x < w * 0.22) {
        e.preventDefault();
        e.stopPropagation();
        stepSlide(-1);
        return;
      }
      if (slides.length > 1 && x > w * 0.78) {
        e.preventDefault();
        e.stopPropagation();
        stepSlide(1);
        return;
      }
      close();
    }

    function onSwipeStart(e) {
      if (root.hidden || slides.length < 2 || e.touches.length !== 1) return;
      swipeStartX = e.touches[0].clientX;
      swipeStartY = e.touches[0].clientY;
    }

    function onSwipeEnd(e) {
      if (root.hidden || slides.length < 2 || e.changedTouches.length !== 1) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - swipeStartX;
      var dy = t.clientY - swipeStartY;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) stepSlide(1);
      else stepSlide(-1);
    }

    function bindStage() {
      if (stageBound) return;
      stageBound = true;
      stage.addEventListener("click", onStageClick);
      stage.addEventListener("touchstart", onSwipeStart, { passive: true });
      stage.addEventListener("touchend", onSwipeEnd);
      stage.addEventListener("touchcancel", onSwipeEnd);
    }

    function unbindStage() {
      if (!stageBound) return;
      stageBound = false;
      stage.removeEventListener("click", onStageClick);
      stage.removeEventListener("touchstart", onSwipeStart);
      stage.removeEventListener("touchend", onSwipeEnd);
      stage.removeEventListener("touchcancel", onSwipeEnd);
    }

    root.addEventListener("click", function (e) {
      var navPrev = e.target.closest("[data-lb-prev]");
      var navNext = e.target.closest("[data-lb-next]");
      if (navPrev && root.contains(navPrev)) {
        e.preventDefault();
        e.stopPropagation();
        stepSlide(-1);
        return;
      }
      if (navNext && root.contains(navNext)) {
        e.preventDefault();
        e.stopPropagation();
        stepSlide(1);
        return;
      }
    });

    document.addEventListener(
      "pointerdown",
      function (e) {
        var trig = e.target.closest("[data-studio-lightbox]");
        if (trig) warmNeighborsFromTrigger(trig);
      },
      { passive: true }
    );

    document.addEventListener("click", function (e) {
      var trig = e.target.closest("[data-studio-lightbox]");
      if (trig) {
        e.preventDefault();
        openFromTrigger(trig);
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
      if (e.key === "ArrowLeft" || e.key === "Left") {
        e.preventDefault();
        stepSlide(-1);
        return;
      }
      if (e.key === "ArrowRight" || e.key === "Right") {
        e.preventDefault();
        stepSlide(1);
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
    var mqMobile = window.matchMedia("(max-width: 720px)").matches;
    var viewWidth = view ? view.clientWidth : 0;
    if (!viewWidth && mqMobile) viewWidth = window.innerWidth;
    if (!viewWidth) viewWidth = 960;

    var rows;
    if (isProject && (viewWidth < 720 || mqMobile)) {
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
    root.removeAttribute("data-portfolio-scroll-step");
    strip.style.removeProperty("--portfolio-col-count");
    if (isProject && (viewWidth < 720 || mqMobile)) {
      if (!fitAll) {
        root.setAttribute("data-portfolio-scroll-step", "1");
        strip.style.setProperty("--portfolio-cols-per-view", "2");
        strip.style.setProperty("--portfolio-col-count", "2");
      } else {
        strip.style.removeProperty("--portfolio-cols-per-view");
      }
    } else if (isProject && viewWidth < 960) {
      strip.style.removeProperty("--portfolio-cols-per-view");
    } else {
      strip.style.setProperty("--portfolio-cols-per-view", String(colsPerView));
    }
    return true;
  }

  function portfolioItemStepWidth(items) {
    if (!items || items.length < 2) return 0;
    return items[1].offsetLeft - items[0].offsetLeft;
  }

  function portfolioItemStepIndex(view, items, colsPerPage) {
    var stepW = portfolioItemStepWidth(items);
    if (stepW <= 0) return 0;
    var maxIdx = Math.max(0, items.length - colsPerPage);
    var idx = Math.round(view.scrollLeft / stepW);
    return Math.max(0, Math.min(maxIdx, idx));
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

    if (root.getAttribute("data-portfolio-scroll-step") === "1") {
      var maxIdx = Math.max(0, items.length - colsPerPage);
      var curIdx = portfolioItemStepIndex(view, items, colsPerPage);
      var nextIdx = Math.max(0, Math.min(maxIdx, curIdx + dir));
      view.scrollTo({
        left: items[nextIdx].offsetLeft,
        behavior: reduceMotion ? "auto" : "smooth",
      });
      return true;
    }

    var stride = rows === 1 ? colsPerPage : rows;
    if (stride >= items.length) stride = rows;
    var colW = items[stride] ? items[stride].offsetLeft - items[0].offsetLeft : 0;
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

    if (root.getAttribute("data-portfolio-scroll-step") === "1") {
      var maxIdx = Math.max(0, items.length - colsPerPage);
      var curIdx = portfolioItemStepIndex(view, items, colsPerPage);
      prev.disabled = curIdx <= 0;
      next.disabled = curIdx >= maxIdx;
      return true;
    }

    var stride = rows === 1 ? colsPerPage : rows;
    if (stride >= items.length) stride = rows;
    var colW = items[stride] ? items[stride].offsetLeft - items[0].offsetLeft : 0;
    if (colW <= 0) return false;

    var numPages = Math.ceil(totalCols / colsPerPage);
    var maxScroll = Math.max(0, view.scrollWidth - view.clientWidth);
    var pageIdx = marketingCarouselPageIndex(view.scrollLeft, colW, maxScroll, numPages);
    prev.disabled = pageIdx <= 0;
    next.disabled = pageIdx >= numPages - 1;
    return true;
  }

  /* Desktop: no side arrows when grid fits; mobile: paged swipe + bottom buttons when present */
  function initVideoScrollerNoNav(root, view) {
    var prev = root.querySelector(".video-scroller__btn--prev");
    var next = root.querySelector(".video-scroller__btn--next");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function updateButtons() {
      if (!prev || !next) return;
      if (portfolioGridButtonState(root, view, prev, next)) return;
      var eps = 8;
      prev.disabled = view.scrollLeft <= eps;
      next.disabled = view.scrollLeft + view.clientWidth >= view.scrollWidth - eps;
    }

    function refreshLayout() {
      if (root.closest(".is-tab-inactive")) return;
      if (root.closest(".home-portfolio-block") || root.closest(".project-portfolio-block")) {
        applyPortfolioGridLayout(root);
      }
      if (root.getAttribute("data-portfolio-fit-all") === "true") {
        view.scrollLeft = 0;
        view.removeAttribute("data-fade-left");
        view.removeAttribute("data-fade-right");
      }
      updateButtons();
    }

    function scrollPage(dir) {
      if (portfolioGridScrollPage(root, view, dir, reduceMotion)) return;
      var amount = Math.max(120, view.clientWidth * 0.72);
      view.scrollBy({ left: dir * amount, behavior: reduceMotion ? "auto" : "smooth" });
    }

    if (prev && next) {
      prev.addEventListener("click", function () {
        scrollPage(-1);
      });
      next.addEventListener("click", function () {
        scrollPage(1);
      });
      view.addEventListener("scroll", updateButtons, { passive: true });
    }

    root.querySelectorAll("img").forEach(function (im) {
      if (im.complete) return;
      im.addEventListener("load", refreshLayout, { passive: true });
    });
    window.addEventListener("resize", refreshLayout, { passive: true });
    root.addEventListener("vch:scroller-refresh", refreshLayout);
    refreshLayout();
    requestAnimationFrame(function () {
      requestAnimationFrame(refreshLayout);
    });
  }

  function initVideoScrollers() {
    document.querySelectorAll("[data-video-scroller]").forEach(function (root) {
      var view = root.querySelector(".video-scroller__viewport");
      if (!view) return;

      if (root.hasAttribute("data-video-scroller-no-nav")) {
        initVideoScrollerNoNav(root, view);
        return;
      }

      var prev = root.querySelector(".video-scroller__btn--prev");
      var next = root.querySelector(".video-scroller__btn--next");
      if (!prev || !next) return;

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
      var defaultKey = activeKey;
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
        if (landing) return;
        var maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        if (window.scrollY > maxScroll) {
          window.scrollTo(0, maxScroll);
        }
      }

      /* Deep-link landing state. While landing we suppress the scroll clamp so
         it can't yank the scroll back as the active panel's async layout
         (video scrollers, images) settles. */
      var landing = false;
      var landingRO = null;
      var landingRaf = 0;
      var landingAbort = null;
      var stableTimer = 0;
      function cancelLanding() {
        landing = false;
        if (landingRaf) { try { cancelAnimationFrame(landingRaf); } catch (e) {} landingRaf = 0; }
        if (stableTimer) { try { clearTimeout(stableTimer); } catch (e) {} stableTimer = 0; }
        if (landingRO) { try { landingRO.disconnect(); } catch (e) {} landingRO = null; }
        if (landingAbort) { try { landingAbort(); } catch (e) {} landingAbort = null; }
        /* Restore the site's smooth scroll-behavior (overridden to "auto" while
           landing so the repeated re-scrolls don't fight each other). */
        document.documentElement.style.scrollBehavior = "";
      }

      function switchTab(next) {
        if (!panels[next] || next === activeKey) return;
        cancelLanding();
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
          /* Clear any temporary scroll-room minHeight set by deep-link landing. */
          panel.style.minHeight = "";
        });
        refreshPanelScrollers(panels[next]);
        clampScrollAfterTabResize();
        requestAnimationFrame(clampScrollAfterTabResize);
        setHash(next === defaultKey ? "" : next);
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

      /* Deep-link landing: if the URL hash matches a tab key, activate that tab
         and scroll to its panel (the block) — docked just below the header with
         a small gap. The default tab still scrolls so every tab link lands
         consistently. Because inactive panels are absolutely positioned with
         height:0, a short active panel can leave the page too short to scroll
         its title to the top — so we give the landed panel temporary
         scroll-room (cleared on the next tab click).

         Layout above the landed panel (banner, hero, tablist, web fonts) can
         settle at very different times depending on cache state: a cold
         browser start often never swaps fonts in time (no late shift → lands
         fine), but a warm/already-open browser fetches the web font and swaps
         it LATE — after a short landing window would have ended — shifting the
         panel and making the link "miss" until a reload (cached → swaps early).
         So we keep re-scrolling until layout is truly settled: a ResizeObserver
         on the panel and <main>, periodic catch-alls spread over a longer
         window, plus final re-scrolls on document.fonts.ready and window.load
         (the real "everything loaded" signals). The clamp is suppressed and
         re-scrolls are instant meanwhile. */
      var hashKey = location.hash.replace(/^#/, "");
      if (hashKey && panels[hashKey]) {
        if (hashKey !== activeKey) switchTab(hashKey);
        var panel = panels[hashKey];
        landing = true;
        /* Instant re-scrolls while landing (the site default is smooth, which
           would animate every re-scroll and fight itself). Restored in
           cancelLanding. */
        document.documentElement.style.scrollBehavior = "auto";
        /* The landing window can run a few seconds (waiting for fonts/images to
           settle). If the user starts scrolling/interacting meanwhile, abort so
           we don't yank the scroll back out from under them. Input events only
           come from the user (our own scrollTo never fires them). */
        function onUserInput() { if (landing) cancelLanding(); }
        var inputEvents = ["wheel", "touchstart", "touchmove", "keydown", "mousedown"];
        inputEvents.forEach(function (type) {
          window.addEventListener(type, onUserInput, { passive: true, capture: true });
        });
        landingAbort = function () {
          inputEvents.forEach(function (type) {
            window.removeEventListener(type, onUserInput, { capture: true });
          });
        };
        var DEBUG = /[?&]debug=1(?=&|$)/.test(location.search);
        var landingStart = performance.now();
        function dbg(msg, extra) {
          if (!DEBUG) return;
          try { console.log("[land " + ((performance.now() - landingStart) | 0) + "ms] " + msg, extra || ""); } catch (e) {}
        }
        /* Stable-then-finish. We keep re-docking while layout is still shifting
           (entrance animation, late web-font swap, audio-player / scroller init,
           image decode) and only end the landing once NOTHING has moved for
           STABLE_MS — AND web fonts have loaded AND the min hold (past the
           entrance animation) has elapsed. This is what fixes Ctrl+Shift+R
           (no-cache, late font swap): the swap reflows the hero/about/tablist
           ABOVE the panel and shifts the heading AFTER a naive finish would have
           closed the landing — leaving the inner content (vch-player__now /
           video-scroller__viewport) flush at the top instead of the heading. */
        var STABLE_MS = 250;
        var MIN_HOLD_MS = 1800;
        var fontsReady = false;
        var docked = false;
        /* One scroll only — dock the panel heading, then never scroll again. */
        function dockOnce() {
          if (docked) return;
          docked = true;
          var need = window.innerHeight - headerHeight() - ANCHOR_GAP - 64;
          var pRect = panel.getBoundingClientRect();
          if (pRect.height < need) {
            panel.style.minHeight = need + "px";
          }
          var heading = panel.querySelector("h1, h2, h3");
          var anchorEl = heading || panel;
          var want = headerHeight() + ANCHOR_GAP + DOCK_DOWN_OFFSET;
          var cur = anchorEl.getBoundingClientRect().top;
          var delta = cur - want;
          if (Math.abs(delta) >= 0.5) window.scrollBy(0, delta);
          if (DEBUG) {
            dbg("sync", {
              tab: hashKey,
              heading: heading ? (heading.id || heading.tagName) : null,
              headingTop: Math.round(cur),
              want: want,
              delta: Math.round(delta),
              scrollY: Math.round(window.scrollY)
            });
          }
        }
        function maybeFinish() {
          if (!landing) return;
          var elapsed = performance.now() - landingStart;
          if (fontsReady && elapsed >= MIN_HOLD_MS) {
            dbg("finish (" + (elapsed | 0) + "ms)");
            cancelLanding();
          } else {
            armStable();
          }
        }
        function armStable() {
          if (stableTimer) clearTimeout(stableTimer);
          stableTimer = setTimeout(function () { stableTimer = 0; maybeFinish(); }, STABLE_MS);
        }
        dockOnce();
        function finishLanding() { if (landing) cancelLanding(); }
        armStable();
        try {
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () {
              if (!landing) return;
              fontsReady = true;
              armStable();
            });
          } else {
            fontsReady = true;
          }
        } catch (eF) { fontsReady = true; }
        if (document.readyState === "complete") {
          fontsReady = true;
        } else {
          window.addEventListener("load", function () {
            if (!landing) return;
            fontsReady = true;
            armStable();
          });
        }
        setTimeout(finishLanding, 10000);
        dbg("armed; hash=" + hashKey + " readyState=" + document.readyState);
      }

      /* Click a panel heading -> copy this tab's deep-link to the clipboard
         (projects only; tabbed project pages are the only ones with a
         data-project-tablist). Silent copy, faint flash on the heading. */
      Object.keys(panels).forEach(function (key) {
        var p = panels[key];
        if (!p) return;
        var heading = p.querySelector("h1, h2, h3");
        if (!heading) return;
        heading.style.cursor = "pointer";
        heading.style.webkitTouchCallout = "none";
        heading.style.webkitTapHighlightColor = "transparent";
        heading.title = "Copy link to this section";
        heading.addEventListener("click", function () {
          copyLinkToClipboard(key);
          flashCopied(heading);
        });
      });
    });
  }

  function pathBaseName(pathname) {
    var p = (pathname || "").replace(/\/+$/, "");
    var i = p.lastIndexOf("/");
    return (i >= 0 ? p.slice(i + 1) : p).toLowerCase();
  }

  function isHomeIndexPage() {
    var base = pathBaseName(location.pathname);
    return !base || base === "index.html";
  }

  function ensureDualScrollButton(btn) {
    if (!btn || btn.classList.contains("scroll-to-top--dual")) return;
    var homeHref = btn.getAttribute("data-home-href") || "index.html";
    btn.setAttribute("data-home-href", homeHref);
    btn.classList.add("scroll-to-top--dual", "is-visible");
    var upIcon = btn.querySelector(".scroll-to-top__icon--up");
    var loneSvg = btn.querySelector("svg:not(.scroll-to-top__icon--home)");
    if (!upIcon && loneSvg) {
      loneSvg.classList.add("scroll-to-top__icon", "scroll-to-top__icon--up");
    }
    if (!btn.querySelector(".scroll-to-top__icon--home")) {
      var homeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      homeIcon.setAttribute("class", "scroll-to-top__icon scroll-to-top__icon--home");
      homeIcon.setAttribute("viewBox", "0 0 24 24");
      homeIcon.setAttribute("aria-hidden", "true");
      var homePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      homePath.setAttribute("d", "M5 11.5L12 5l7 6.5M8 10.5V18h3v-5h2v5h3v-7.5");
      homePath.setAttribute("stroke-linecap", "round");
      homePath.setAttribute("stroke-linejoin", "round");
      homeIcon.appendChild(homePath);
      btn.insertBefore(homeIcon, btn.firstChild);
    }
  }

  function initTextSelectionDismiss() {
    function isFormField(node) {
      return node && node.closest && node.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']");
    }

    function isTextTarget(node) {
      if (!node || !node.closest) return false;
      if (isFormField(node)) return true;
      var el = node.nodeType === 3 ? node.parentElement : node;
      while (el && el !== document.documentElement) {
        var style = window.getComputedStyle(el);
        var us = style.userSelect || style.webkitUserSelect;
        if (us === "none") return false;
        if (us === "text" || us === "all") return true;
        el = el.parentElement;
      }
      return false;
    }

    function selectionScope() {
      var sel = window.getSelection();
      if (!sel || !sel.rangeCount || sel.isCollapsed) return null;
      var node = sel.anchorNode;
      if (!node) return null;
      var el = node.nodeType === 3 ? node.parentElement : node;
      if (!el || !el.closest) return null;
      return el.closest(
        "#home-panel-resume, #home-panel-contact, #home-panel-main, #project-main, main"
      );
    }

    document.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      if (isFormField(e.target)) return;

      var sel = window.getSelection();
      if (!sel || !sel.rangeCount || sel.isCollapsed) return;

      var scope = selectionScope();
      if (scope && !scope.contains(e.target)) {
        sel.removeAllRanges();
        return;
      }

      if (isTextTarget(e.target)) return;

      sel.removeAllRanges();
    }, true);
  }

  function initScrollToTop() {
    if (document.querySelector("[data-home-root]")) return;

    var btn = document.querySelector("[data-scroll-to-top]");
    if (!btn) return;

    if (!isHomeIndexPage()) {
      ensureDualScrollButton(btn);
    }

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
      initTextSelectionDismiss();
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
    initTextSelectionDismiss();
    initScrollToTop();
  }
})();
