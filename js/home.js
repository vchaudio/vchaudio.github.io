(function () {
  "use strict";

  var VIEW_MAIN = "main";
  var VIEW_RESUME = "resume";
  var VIEW_CONTACT = "contact";

  function initHomeTabGroup(tablistSelector, defaultTab, onLayoutChange) {
    var tablist = document.querySelector(tablistSelector);
    if (!tablist) {
      return {
        reset: function () {},
        getTab: function () {
          return defaultTab;
        },
      };
    }

    var tabs = [].slice.call(tablist.querySelectorAll("[data-home-tab]"));
    var panels = {};
    tabs.forEach(function (tab) {
      var key = tab.getAttribute("data-home-tab");
      var panelId = tab.getAttribute("aria-controls");
      var panel = panelId ? document.getElementById(panelId) : null;
      if (key && panel) panels[key] = panel;
    });
    var active = defaultTab;

    function switchTab(next) {
      if (!panels[next] || next === active) return;
      active = next;
      tabs.forEach(function (tab) {
        var on = tab.getAttribute("data-home-tab") === next;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
      });
      Object.keys(panels).forEach(function (key) {
        var panel = panels[key];
        if (!panel) return;
        if (key === next) {
          panel.hidden = false;
          panel.querySelectorAll(".reveal").forEach(function (el) {
            el.classList.add("is-visible");
          });
        } else {
          panel.hidden = true;
        }
      });
      var scrollY = window.scrollY;
      if (onLayoutChange) onLayoutChange();
      requestAnimationFrame(function () {
        window.scrollTo(0, scrollY);
        requestAnimationFrame(function () {
          window.dispatchEvent(new Event("resize"));
        });
      });
    }

    tablist.addEventListener("click", function (e) {
      var tab = e.target.closest("[data-home-tab]");
      if (!tab || !tablist.contains(tab)) return;
      switchTab(tab.getAttribute("data-home-tab"));
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
      switchTab(tabs[next].getAttribute("data-home-tab"));
    });

    return {
      reset: function () {
        switchTab(defaultTab);
      },
      getTab: function () {
        return active;
      },
    };
  }

  function initHomeViews() {
    var root = document.querySelector("[data-home-root]");
    if (!root) return;

    var toggleBtn = document.getElementById("home-toggle-btn");
    var showMoreBtn = document.getElementById("home-show-more-btn");
    var mailBtn = document.getElementById("home-mail-btn");
    var panelMain = document.getElementById("home-panel-main");
    var panelResume = document.getElementById("home-panel-resume");
    var panelContact = document.getElementById("home-panel-contact");
    var videosExtra = document.getElementById("best-works-videos-extra");
    if (!toggleBtn || !panelMain || !panelResume || !panelContact) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var view = VIEW_MAIN;
    var animating = false;
    var videosExpanded = false;
    var videosAnimating = false;
    var showMoreRevealTimer = null;
    var videosTransitionTimer = null;
    var videosCloseTimers = [];
    var videosCloseFinished = false;
    var showMoreRevealedAfterClose = false;
    var videosOpenPendingLock = false;
    var unifiedLayoutShrinking = false;
    var unifiedShrinkStartedAt = 0;
    var VIDEOS_EXTRA_OPEN_MS = 550;
    var VIDEOS_EXTRA_THUMB_MS = 850;
    var VIDEOS_EXTRA_STAGGER_END_MS = 360;
    var VIDEOS_EXTRA_TOTAL_MS = VIDEOS_EXTRA_THUMB_MS + VIDEOS_EXTRA_STAGGER_END_MS;
    var VIDEOS_EXTRA_CONTAINER_START_MS = 200;
    var VIDEOS_EXTRA_CONTAINER_CLOSE_MS = 2200;
    var HOME_BOTTOM_HIDE_MS = 550;
    var SHOW_MORE_AFTER_CLOSE_DELAY_MS = 40;
    var SHOW_MORE_REVEAL_CONTAINER_CLOSE_RATIO = 0.5;
    var VIDEOS_EXTRA_HIDE_LAST_DELAY_MS = 320;
    var UNIFIED_VIDEOS_GRID_MQ = window.matchMedia("(max-width: 1100px)");
    var MOBILE_ANCHOR_MS = 900;
    var NOBLEMEN_REVEAL_DELAY_MS = 100;
    var MOBILE_ANCHOR_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

    function isUnifiedVideosGrid() {
      return UNIFIED_VIDEOS_GRID_MQ.matches;
    }

    function bestWorksVideoCols() {
      var bw = panelMain ? panelMain.querySelector(".best-works") : null;
      if (!bw) return 5;
      var cols = parseInt(getComputedStyle(bw).getPropertyValue("--bw-cols"), 10);
      return cols > 0 ? cols : 5;
    }

    /* Orphan row: 5th thumb alone (4+1 @ ~1080px, 2+2+1 @ ~720px) — same anchor flow as mobile */
    function isMobileNoblemenAnchor() {
      if (!isUnifiedVideosGrid()) return false;
      var cols = bestWorksVideoCols();
      var itemsInLastRow = 5 - Math.floor((5 - 1) / cols) * cols;
      return itemsInLastRow === 1;
    }

    function mobileGridAnchorWrap() {
      var row = panelMain ? panelMain.querySelector(".best-works__row--videos") : null;
      if (!row) return null;
      var wraps = row.querySelectorAll(".video-thumb-wrap");
      return wraps.length >= 5 ? wraps[4] : null;
    }

    function mobileOpenShiftX(wrap) {
      var block = wrap ? wrap.closest(".best-works__videos-block") : null;
      if (!block || !wrap) return 0;
      var bwRoot = block.closest(".best-works") || block;
      var gapToken = getComputedStyle(bwRoot).getPropertyValue("--bw-gap").trim();
      var gap = 12;
      if (gapToken) {
        gap = parseFloat(gapToken);
        if (gapToken.indexOf("rem") !== -1) {
          gap *= parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        }
      }
      var blockRect = block.getBoundingClientRect();
      var wrapRect = wrap.getBoundingClientRect();
      var colW = (blockRect.width - gap) / 2;
      var targetCenterX = blockRect.left + colW / 2;
      var currentCenterX = wrapRect.left + wrapRect.width / 2;
      return targetCenterX - currentCenterX;
    }

    function setMobileAnchorActive(wrap, active) {
      if (!wrap) return;
      if (active) wrap.classList.add("is-mobile-anchor");
      else wrap.classList.remove("is-mobile-anchor");
    }

    function clearMobileAnchorMotion(wrap) {
      if (!wrap) return;
      if (wrap._mobileAnchorTimer) {
        window.clearTimeout(wrap._mobileAnchorTimer);
        wrap._mobileAnchorTimer = null;
      }
      if (wrap._mobileAnchorOnEnd) {
        wrap.removeEventListener("transitionend", wrap._mobileAnchorOnEnd);
        wrap._mobileAnchorOnEnd = null;
      }
      wrap.style.transition = "";
      wrap.style.transform = "";
      wrap.style.zIndex = "";
    }

    function settlePuzzleTile(wrap) {
      if (!wrap) return;
      wrap.classList.add("is-puzzle-settled");
      wrap.style.animation = "";
      wrap.style.opacity = "";
      wrap.style.filter = "";
    }

    function freezePuzzleOnAnchor(wrap) {
      if (!wrap || !wrap.closest(".best-works-wrap--puzzle")) return;
      wrap.classList.remove("is-puzzle-settled");
      wrap.style.animation = "none";
      wrap.style.opacity = "1";
      wrap.style.filter = "none";
    }

    function releaseMobileAnchor(wrap) {
      if (!wrap) return;
      var hadAnchor = wrap.classList.contains("is-mobile-anchor");
      clearMobileAnchorMotion(wrap);
      setMobileAnchorActive(wrap, false);
      if (hadAnchor) settlePuzzleTile(wrap);
    }

    function prepareMobileAnchor(wrap) {
      if (!wrap || !isMobileNoblemenAnchor()) return;
      clearMobileAnchorMotion(wrap);
      setMobileAnchorActive(wrap, true);
      freezePuzzleOnAnchor(wrap);
    }

    function isMobileAnchorMotionActive() {
      var wrap = mobileGridAnchorWrap();
      return !!(wrap && wrap.classList.contains("is-mobile-anchor") && wrap._mobileAnchorTimer);
    }

    function completeMobileAnchorOpen() {
      releaseMobileAnchor(mobileGridAnchorWrap());
      if (videosOpenPendingLock) {
        videosOpenPendingLock = false;
        lockPanelMainHeight();
      }
    }

    function startMobileAnchorTransition(wrap, fromTransform, toTransform, onDone, motionOnly) {
      if (!wrap || !isMobileNoblemenAnchor()) {
        if (onDone) onDone();
        return;
      }

      function finish() {
        if (motionOnly) clearMobileAnchorMotion(wrap);
        else releaseMobileAnchor(wrap);
        if (onDone) onDone();
      }

      wrap.style.zIndex = "2";
      wrap.style.transition = "none";
      wrap.style.transform = fromTransform;
      void wrap.offsetWidth;
      wrap.style.transition = "transform " + MOBILE_ANCHOR_MS / 1000 + "s " + MOBILE_ANCHOR_EASE;
      wrap.style.transform = toTransform;

      function onEnd(e) {
        if (e.target !== wrap || e.propertyName !== "transform") return;
        finish();
      }

      wrap._mobileAnchorOnEnd = onEnd;
      wrap.addEventListener("transitionend", onEnd);
      wrap._mobileAnchorTimer = window.setTimeout(finish, MOBILE_ANCHOR_MS + 80);
    }

    function runMobileAnchorOpen(wrap, applyLayout, onDone) {
      if (!wrap || !isMobileNoblemenAnchor()) {
        if (applyLayout) applyLayout();
        if (onDone) onDone();
        return;
      }

      prepareMobileAnchor(wrap);
      var shiftXBefore = mobileOpenShiftX(wrap);
      var first = wrap.getBoundingClientRect();
      if (applyLayout) applyLayout();
      prepareMobileAnchor(wrap);

      var last = wrap.getBoundingClientRect();
      var dx = first.left - last.left;
      var dy = first.top - last.top;

      if (Math.abs(dx) >= 0.5 || Math.abs(dy) >= 0.5) {
        startMobileAnchorTransition(
          wrap,
          "translate3d(" + dx + "px," + dy + "px, 0)",
          "translate3d(0, 0, 0)",
          onDone,
          true
        );
        return;
      }

      if (Math.abs(shiftXBefore) >= 0.5) {
        startMobileAnchorTransition(
          wrap,
          "translate3d(0, 0, 0)",
          "translate3d(" + shiftXBefore + "px, 0, 0)",
          onDone,
          true
        );
        return;
      }

      releaseMobileAnchor(wrap);
      if (onDone) onDone();
    }

    function resetMobileAnchor(wrap) {
      if (!wrap) return;
      var hadAnchor =
        wrap.classList.contains("is-mobile-anchor") || !!wrap._mobileAnchorTimer;
      var hadStaleFreeze =
        !hadAnchor &&
        wrap.style.animation === "none" &&
        !!wrap.closest(".best-works-wrap--puzzle");
      clearMobileAnchorMotion(wrap);
      setMobileAnchorActive(wrap, false);
      if (hadAnchor || hadStaleFreeze) settlePuzzleTile(wrap);
    }

    function setMobileAnchorLayoutHidden(hidden) {
      if (!videosExtra) return;
      if (hidden) videosExtra.classList.add("is-mobile-anchor-layout");
      else videosExtra.classList.remove("is-mobile-anchor-layout");
    }

    function videosExtraContainerCloseMs() {
      return VIDEOS_EXTRA_CONTAINER_CLOSE_MS;
    }

    function videosExtraContainerCloseDelay() {
      return VIDEOS_EXTRA_CONTAINER_START_MS;
    }

    function unifiedVideosGridCloseDelay() {
      return VIDEOS_EXTRA_HIDE_LAST_DELAY_MS + VIDEOS_EXTRA_THUMB_MS;
    }

    function unifiedVideosBlock() {
      return videosExtra ? videosExtra.closest(".best-works__videos-block") : null;
    }

    function measureUnifiedVideosBlockCollapsedHeight() {
      var block = unifiedVideosBlock();
      if (!block) return 0;
      var row = block.querySelector(".best-works__row--videos");
      if (row) {
        var rowH = row.getBoundingClientRect().height;
        if (rowH > 0) return Math.ceil(rowH);
      }
      var mainWraps = block.querySelectorAll(".best-works__row--videos .video-thumb-wrap");
      if (!mainWraps.length) return block.getBoundingClientRect().height;
      var blockTop = block.getBoundingClientRect().top;
      var maxBottom = blockTop;
      mainWraps.forEach(function (wrap) {
        maxBottom = Math.max(maxBottom, wrap.getBoundingClientRect().bottom);
      });
      return Math.ceil(maxBottom - blockTop);
    }

    function clearUnifiedBlockTransitionEnd() {
      var block = unifiedVideosBlock();
      if (!block || !block._unifiedBlockOnEnd) return;
      block.removeEventListener("transitionend", block._unifiedBlockOnEnd);
      block._unifiedBlockOnEnd = null;
    }

    function watchUnifiedBlockTransitionEnd(onDone) {
      var block = unifiedVideosBlock();
      if (!block) {
        if (onDone) onDone();
        return;
      }
      clearUnifiedBlockTransitionEnd();
      function onEnd(e) {
        if (e.target !== block || e.propertyName !== "max-height") return;
        clearUnifiedBlockTransitionEnd();
        if (onDone) onDone();
      }
      block._unifiedBlockOnEnd = onEnd;
      block.addEventListener("transitionend", onEnd);
    }

    function beginNoblemenUnifiedAnchorClose() {
      if (!videosExtra || videosCloseFinished || videosExtra._noblemenCloseStarted) return;
      if (!isMobileNoblemenAnchor() || reduceMotion) return;
      videosExtra._noblemenCloseStarted = true;
      holdMobileAnchorAtPairedSlot(mobileGridAnchorWrap());
      pushVideosCloseTimer(
        window.setTimeout(revealShowMoreAfterClose, NOBLEMEN_REVEAL_DELAY_MS)
      );
    }

    function beginUnifiedGridCleanup() {
      if (!videosExtra || videosCloseFinished || videosExtra._unifiedGridCleanedUp) return;
      videosExtra._unifiedGridCleanedUp = true;

      if (!isMobileNoblemenAnchor()) {
        videosExtra.classList.remove("is-open");
      } else if (!videosExtra._noblemenCloseStarted) {
        beginNoblemenUnifiedAnchorClose();
      }

      videosExtra.classList.add("is-container-closing", "is-unified-handoff");
      videosExtra.setAttribute("aria-hidden", "true");
      videosExtra.classList.remove("is-hiding");
      videosExtra.style.transition = "none";
      videosExtra.style.maxHeight = "0px";
      extraThumbWraps().forEach(function (wrap) {
        wrap.style.animation = "none";
      });
    }

    function onUnifiedBlockCollapsed() {
      beginUnifiedGridCleanup();
      scheduleUnifiedCloseFinish();
    }

    function scheduleUnifiedCloseFinish() {
      if (videosCloseFinished || !videosExtra || videosExtra._unifiedFinishQueued) return;
      videosExtra._unifiedFinishQueued = true;
      finishVideosClose();
    }

    function prepareVideosExtraDomAfterClose() {
      if (!videosExtra) return;
      videosExtra.style.transition = "none";
      videosExtra.classList.remove(
        "is-open",
        "is-hiding",
        "is-container-closing",
        "is-unified-handoff"
      );
      videosExtra.setAttribute("aria-hidden", "true");
      void videosExtra.offsetWidth;
      videosExtra.style.transition = "";
      videosExtra.style.maxHeight = "";
      extraThumbWraps().forEach(function (wrap) {
        wrap.style.animation = "none";
      });
    }

    function resetUnifiedVideosBlockCollapse() {
      unifiedLayoutShrinking = false;
      unifiedShrinkStartedAt = 0;
      clearUnifiedBlockTransitionEnd();
      var block = unifiedVideosBlock();
      if (!block) return;
      block.style.transition = "";
      block.style.maxHeight = "";
      block.style.overflow = "";
    }

    function settleUnifiedBlockBeforeLock(onDone) {
      var block = unifiedVideosBlock();
      if (!block) {
        if (onDone) onDone();
        return;
      }

      if (!videosExtra._unifiedGridCleanedUp) {
        prepareVideosExtraDomAfterClose();
      } else {
        videosExtra.classList.remove("is-hiding");
        extraThumbWraps().forEach(function (wrap) {
          wrap.style.animation = "none";
        });
      }

      unifiedLayoutShrinking = false;
      unifiedShrinkStartedAt = 0;
      clearUnifiedBlockTransitionEnd();
      block.style.transition = "";
      block.style.maxHeight = "";
      block.style.overflow = "";
      if (onDone) onDone();
    }

    var unifiedBlockSettling = false;

    function finishUnifiedBlockCollapse(onDone) {
      var block = unifiedVideosBlock();
      if (!block || !unifiedLayoutShrinking) {
        if (onDone) onDone();
        return;
      }
      if (unifiedBlockSettling) return;

      var settleFallbackId = null;

      function afterBlockAnim() {
        if (settleFallbackId) {
          window.clearTimeout(settleFallbackId);
          settleFallbackId = null;
        }
        if (unifiedBlockSettling || !unifiedLayoutShrinking) {
          if (onDone) onDone();
          return;
        }
        unifiedBlockSettling = true;
        settleUnifiedBlockBeforeLock(function () {
          unifiedBlockSettling = false;
          if (onDone) onDone();
        });
      }

      if (videosExtra && videosExtra._unifiedFinishQueued) {
        afterBlockAnim();
        return;
      }

      watchUnifiedBlockTransitionEnd(afterBlockAnim);
      settleFallbackId = window.setTimeout(function () {
        clearUnifiedBlockTransitionEnd();
        afterBlockAnim();
      }, 220);
    }

    function beginUnifiedLayoutShrink(closeMs) {
      var block = unifiedVideosBlock();
      if (!block) return;
      unifiedLayoutShrinking = true;
      unifiedShrinkStartedAt = Date.now();
      if (videosExtra) videosExtra._unifiedFinishQueued = false;
      var fromH = block.getBoundingClientRect().height;
      var toH = measureUnifiedVideosBlockCollapsedHeight();
      block.style.transition = "none";
      block.style.overflow = "hidden";
      block.style.maxHeight = fromH + "px";
      void block.offsetHeight;
      block.style.transition =
        "max-height " + closeMs / 1000 + "s " + MOBILE_ANCHOR_EASE;
      block.style.maxHeight = toH + "px";
      watchUnifiedBlockTransitionEnd(onUnifiedBlockCollapsed);
    }

    function holdMobileAnchorAtPairedSlot(wrap) {
      if (!wrap || !videosExtra || !isMobileNoblemenAnchor()) return;
      var pairedLeft = wrap.getBoundingClientRect().left;
      var pairedTop = wrap.getBoundingClientRect().top;
      videosExtra.classList.remove("is-open");
      void videosExtra.offsetHeight;
      var dx = pairedLeft - wrap.getBoundingClientRect().left;
      var dy = pairedTop - wrap.getBoundingClientRect().top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      setMobileAnchorActive(wrap, true);
      wrap.style.zIndex = "2";
      wrap.style.transition = "none";
      wrap.style.transform = "translate(" + dx + "px," + dy + "px)";
    }

    function animateMobileAnchorToCenter(wrap) {
      if (!wrap || !isMobileNoblemenAnchor()) return;
      var fromTransform = wrap.style.transform;
      if (!fromTransform) return;
      setMobileAnchorActive(wrap, true);
      startMobileAnchorTransition(
        wrap,
        fromTransform,
        "translate3d(0, 0, 0)",
        null,
        true
      );
    }

    function measureVideosExtraCloseHeight() {
      if (!videosExtra) return 0;

      var needsMobileMeasure =
        isUnifiedVideosGrid() &&
        videosExtra.classList.contains("is-open") &&
        !videosExtra.classList.contains("is-container-closing");

      if (!needsMobileMeasure) {
        return videosExtra.scrollHeight;
      }

      /* Unified grid uses display:contents — restore box layout to read height */
      videosExtra.classList.add("is-close-measure");
      void videosExtra.offsetHeight;
      var h = videosExtra.scrollHeight;
      videosExtra.classList.remove("is-close-measure");
      return h;
    }

    root.style.setProperty(
      "--show-more-after-close-delay",
      (reduceMotion ? 0 : SHOW_MORE_AFTER_CLOSE_DELAY_MS) + "ms"
    );

    function prepareBestWorksPuzzle() {
      var wrap = panelMain ? panelMain.querySelector(".best-works-wrap") : null;
      if (!wrap) return;
      if (reduceMotion) {
        wrap.classList.remove("best-works-wrap--pre-puzzle", "best-works-wrap--puzzle");
        return;
      }
      wrap.classList.remove("best-works-wrap--puzzle");
      wrap.classList.add("best-works-wrap--pre-puzzle");
    }

    function replayBestWorksPuzzle() {
      var wrap = panelMain ? panelMain.querySelector(".best-works-wrap") : null;
      if (!wrap) return;
      if (reduceMotion) {
        wrap.classList.remove("best-works-wrap--pre-puzzle", "best-works-wrap--puzzle");
        return;
      }
      wrap.classList.remove("best-works-wrap--puzzle");
      wrap.classList.add("best-works-wrap--pre-puzzle");
      void wrap.offsetWidth;
      wrap.classList.remove("best-works-wrap--pre-puzzle");
      wrap.classList.add("best-works-wrap--puzzle");
    }

    function scheduleBestWorksPuzzle() {
      requestAnimationFrame(function () {
        requestAnimationFrame(replayBestWorksPuzzle);
      });
    }

    function clearShowMoreReveal() {
      if (showMoreRevealTimer) {
        window.clearTimeout(showMoreRevealTimer);
        showMoreRevealTimer = null;
      }
    }

    function revealShowMore(afterClose) {
      var homeBottom = document.getElementById("home-bottom");
      if (!homeBottom || view !== VIEW_MAIN || homeBottom.hidden) return;
      if (homeBottom.classList.contains("home-bottom--puzzle")) return;
      clearShowMoreReveal();
      homeBottom.classList.remove("home-bottom--pre-puzzle", "home-bottom--hiding");
      homeBottom.classList.add("home-bottom--ready", "home-bottom--puzzle");
      if (afterClose === true) {
        homeBottom.classList.add("home-bottom--puzzle-after-close");
      } else {
        homeBottom.classList.remove("home-bottom--puzzle-after-close");
      }
    }

    function replayShowMoreButtonReveal() {
      var homeBottom = document.getElementById("home-bottom");
      if (!homeBottom || view !== VIEW_MAIN || homeBottom.hidden) return;
      clearShowMoreReveal();
      if (reduceMotion) {
        homeBottom.classList.remove(
          "home-bottom--pre-puzzle",
          "home-bottom--hiding",
          "home-bottom--puzzle",
          "home-bottom--puzzle-after-close"
        );
        homeBottom.classList.add("home-bottom--ready");
        return;
      }
      if (
        homeBottom.classList.contains("home-bottom--pre-puzzle") &&
        !homeBottom.classList.contains("home-bottom--puzzle")
      ) {
        revealShowMore(true);
        return;
      }
      homeBottom.classList.remove(
        "home-bottom--hiding",
        "home-bottom--puzzle",
        "home-bottom--puzzle-after-close",
        "home-bottom--ready"
      );
      homeBottom.classList.add("home-bottom--pre-puzzle");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          revealShowMore(true);
        });
      });
    }

    function revealShowMoreAfterClose() {
      if (showMoreRevealedAfterClose || videosCloseFinished) return;
      showMoreRevealedAfterClose = true;
      if (showMoreBtn) {
        showMoreBtn.textContent = "Show More";
        showMoreBtn.setAttribute("aria-expanded", "false");
      }
      if (
        isMobileNoblemenAnchor() &&
        !reduceMotion &&
        videosExtra &&
        videosExtra.classList.contains("is-hiding")
      ) {
        animateMobileAnchorToCenter(mobileGridAnchorWrap());
      }
      replayShowMoreButtonReveal();
    }

    function pushVideosCloseTimer(id) {
      videosCloseTimers.push(id);
    }

    function hideHomeBottomButton() {
      var homeBottom = document.getElementById("home-bottom");
      if (!homeBottom) return;
      clearShowMoreReveal();
      if (reduceMotion) {
        homeBottom.classList.remove("home-bottom--puzzle", "home-bottom--ready");
        homeBottom.classList.add("home-bottom--pre-puzzle");
        return;
      }
      homeBottom.classList.remove("home-bottom--puzzle", "home-bottom--ready");
      void homeBottom.offsetWidth;
      homeBottom.classList.add("home-bottom--hiding");
      var finished = false;
      function finish() {
        if (finished) return;
        finished = true;
        homeBottom.removeEventListener("animationend", onAnimEnd);
        homeBottom.classList.remove("home-bottom--hiding");
        homeBottom.classList.add("home-bottom--pre-puzzle");
      }
      function onAnimEnd(e) {
        if (e.target !== homeBottom || e.animationName !== "best-works-puzzle-float-out") return;
        finish();
      }
      homeBottom.addEventListener("animationend", onAnimEnd);
      pushVideosCloseTimer(window.setTimeout(finish, HOME_BOTTOM_HIDE_MS + 80));
    }

    function scheduleShowMoreReveal() {
      var homeBottom = document.getElementById("home-bottom");
      if (!homeBottom) return;

      clearShowMoreReveal();
      homeBottom.classList.remove("home-bottom--ready", "home-bottom--puzzle");
      homeBottom.classList.add("home-bottom--pre-puzzle");

      if (reduceMotion) {
        homeBottom.classList.remove("home-bottom--pre-puzzle");
        homeBottom.classList.add("home-bottom--ready");
        return;
      }

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          revealShowMore();
        });
      });

      showMoreRevealTimer = window.setTimeout(function () {
        revealShowMore();
      }, 2000);
    }

    function panelInner(panel) {
      return panel ? panel.querySelector(".home-panel__inner") : null;
    }

    function measurePanel(panel, opts) {
      opts = opts || {};
      if (!panel) return 0;
      var inner = panelInner(panel);
      if (!inner) return 0;
      if (opts.live && panel.classList.contains("is-visible")) {
        return inner.scrollHeight;
      }
      panel.style.maxHeight = "none";
      var h = inner.scrollHeight;
      panel.style.maxHeight = "";
      return h;
    }

    function lockPanelMainHeight(onLocked, opts) {
      opts = opts || {};
      if (!panelMain) return;
      panelMain.classList.remove("home-panel--flow");
      panelMain.classList.add("home-panel--instant-height");
      panelMain.style.maxHeight = measurePanel(panelMain, { live: true }) + "px";
      if (opts.skipRemeasure) {
        panelMain.classList.remove("home-panel--instant-height");
        if (onLocked) onLocked();
        return;
      }
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          panelMain.style.maxHeight = measurePanel(panelMain, { live: true }) + "px";
          panelMain.classList.remove("home-panel--instant-height");
          if (onLocked) onLocked();
        });
      });
    }

    function unlockPanelMainFlow() {
      if (!panelMain) return;
      panelMain.classList.add("home-panel--flow");
      panelMain.style.maxHeight = "none";
    }

    function remeasurePanelInstant(panel) {
      if (!panel || !panel.classList.contains("is-visible")) return;
      var scrollY = window.scrollY;
      panel.classList.add("home-panel--instant-height");
      panel.style.maxHeight = measurePanel(panel, { live: true }) + "px";
      panel.classList.remove("home-panel--instant-height");
      requestAnimationFrame(function () {
        window.scrollTo(0, scrollY);
      });
    }

    var resumeTabs = initHomeTabGroup('[data-home-tablist="resume"]', "resume", function () {
      if (view === VIEW_RESUME) remeasurePanelInstant(panelResume);
    });

    function replayPanelRoll(inner, mode) {
      if (!inner || reduceMotion || !mode) return;
      inner.classList.remove(
        "home-panel__inner--roll",
        "home-panel__inner--roll-close",
        "home-panel__inner--roll-reverse"
      );
      void inner.offsetWidth;
      if (mode === "open") inner.classList.add("home-panel__inner--roll");
      else if (mode === "close") inner.classList.add("home-panel__inner--roll-close");
      else if (mode === "open-reverse") inner.classList.add("home-panel__inner--roll-reverse");
    }

    function setPanelOpen(panel, open, opts) {
      opts = opts || {};
      if (!panel) return;
      var inner = panelInner(panel);
      if (open) {
        panel.classList.remove("is-hidden");
        panel.classList.add("is-visible");
        panel.removeAttribute("hidden");
        panel.style.maxHeight = measurePanel(panel) + "px";
        if (inner && opts.rollMode) {
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              replayPanelRoll(inner, opts.rollMode);
            });
          });
        }
      } else {
        if (inner && opts.rollClose) {
          replayPanelRoll(inner, "close");
        } else if (inner) {
          inner.classList.remove(
            "home-panel__inner--roll",
            "home-panel__inner--roll-close",
            "home-panel__inner--roll-reverse"
          );
        }
        panel.classList.add("is-hidden");
        panel.classList.remove("is-visible");
        panel.style.maxHeight = "0px";
        panel.setAttribute("hidden", "");
      }
    }

    function syncToggleButton() {
      if (view === VIEW_MAIN) {
        toggleBtn.textContent = "Resume";
        toggleBtn.removeAttribute("data-back");
        toggleBtn.setAttribute("aria-label", "Show resume");
      } else {
        toggleBtn.textContent = "\u2190 Back";
        toggleBtn.setAttribute("data-back", "");
        toggleBtn.setAttribute("aria-label", "Back to home");
      }
    }

    function revealInPanel(panel) {
      if (!panel) return;
      panel.querySelectorAll(".reveal").forEach(function (el) {
        el.classList.add("is-visible");
      });
    }

    function applyView(next, opts) {
      opts = opts || {};
      var animate = !!opts.animate;
      var prev = view;
      view = next;
      root.setAttribute("data-home-view", next);
      syncToggleButton();

      var leavingMain = prev === VIEW_MAIN && next !== VIEW_MAIN;
      var enteringMain = prev !== VIEW_MAIN && next === VIEW_MAIN;
      var rollOnOpen = animate && !reduceMotion;

      if (next === VIEW_MAIN) prepareBestWorksPuzzle();

      setPanelOpen(panelMain, next === VIEW_MAIN, {
        rollMode: rollOnOpen && enteringMain ? "open-reverse" : null,
        rollClose: rollOnOpen && leavingMain,
      });
      setPanelOpen(panelResume, next === VIEW_RESUME, {
        rollMode: rollOnOpen && next === VIEW_RESUME ? "open" : null,
        rollClose: rollOnOpen && prev === VIEW_RESUME && next !== VIEW_RESUME,
      });
      setPanelOpen(panelContact, next === VIEW_CONTACT, {
        rollMode: rollOnOpen && next === VIEW_CONTACT ? "open" : null,
        rollClose: rollOnOpen && prev === VIEW_CONTACT && next !== VIEW_CONTACT,
      });

      var onMain = next === VIEW_MAIN;
      var homeBottom = document.getElementById("home-bottom");
      var homeFooterSocial = document.getElementById("home-footer-social");
      if (homeBottom) homeBottom.hidden = !onMain;
      if (homeFooterSocial) homeFooterSocial.hidden = !onMain;
      if (!onMain) {
        clearShowMoreReveal();
        clearVideosAnimation();
      }
      if (mailBtn) mailBtn.setAttribute("aria-expanded", next === VIEW_CONTACT ? "true" : "false");

      if (next === VIEW_RESUME) revealInPanel(panelResume);
      if (next === VIEW_MAIN && (enteringMain || opts.initialLoad)) {
        scheduleBestWorksPuzzle();
        scheduleShowMoreReveal();
      }
      if (next === VIEW_CONTACT) {
        revealInPanel(panelContact);
        var first = panelContact.querySelector("input, textarea");
        if (first) {
          setTimeout(function () {
            first.focus();
          }, animate ? 480 : 0);
        }
      }
      if (next !== VIEW_RESUME) resumeTabs.reset();
    }

    function switchView(next) {
      if (animating || next === view) return;
      animating = true;
      applyView(next, { animate: true });
      setTimeout(
        function () {
          animating = false;
        },
        reduceMotion ? 0 : 450
      );
    }

    toggleBtn.addEventListener("click", function () {
      if (view === VIEW_MAIN) switchView(VIEW_RESUME);
      else switchView(VIEW_MAIN);
    });

    function extraThumbWraps() {
      return videosExtra ? videosExtra.querySelectorAll(".best-works__videos-extra-inner .video-thumb-wrap") : [];
    }

    function restartExtraThumbAnimations() {
      extraThumbWraps().forEach(function (wrap) {
        wrap.style.animation = "none";
        void wrap.offsetWidth;
        wrap.style.animation = "";
      });
    }

    function clearVideosAnimation() {
      videosOpenPendingLock = false;
      videosCloseFinished = false;
      showMoreRevealedAfterClose = false;
      unifiedBlockSettling = false;
      videosCloseTimers.forEach(function (id) {
        window.clearTimeout(id);
      });
      videosCloseTimers = [];
      if (videosTransitionTimer) {
        window.clearTimeout(videosTransitionTimer);
        videosTransitionTimer = null;
      }
      if (videosExtra && videosExtra._onGridTransitionEnd) {
        videosExtra.removeEventListener("transitionend", videosExtra._onGridTransitionEnd);
        videosExtra._onGridTransitionEnd = null;
      }
      if (videosExtra) {
        videosExtra.classList.remove(
          "is-closing",
          "is-container-closing",
          "is-hiding",
          "is-close-measure",
          "is-mobile-anchor-layout",
          "is-unified-handoff"
        );
        videosExtra.style.transition = "";
        videosExtra.style.maxHeight = "";
        videosExtra._unifiedFinishQueued = false;
        videosExtra._unifiedGridCleanedUp = false;
        videosExtra._noblemenCloseStarted = false;
      }
      resetUnifiedVideosBlockCollapse();
      resetMobileAnchor(mobileGridAnchorWrap());
      setMobileAnchorLayoutHidden(false);
      var homeBottom = document.getElementById("home-bottom");
      if (homeBottom) {
        homeBottom.classList.remove("home-bottom--hiding", "home-bottom--puzzle-after-close");
      }
      videosAnimating = false;
    }

    function finishVideosOpen() {
      if (!videosExtra) return;
      if (videosTransitionTimer) {
        window.clearTimeout(videosTransitionTimer);
        videosTransitionTimer = null;
      }
      if (videosExtra._onGridTransitionEnd) {
        videosExtra.removeEventListener("transitionend", videosExtra._onGridTransitionEnd);
        videosExtra._onGridTransitionEnd = null;
      }
      videosAnimating = false;
      if (isMobileAnchorMotionActive()) {
        videosOpenPendingLock = true;
        return;
      }
      lockPanelMainHeight();
    }

    function finishVideosClose() {
      if (videosCloseFinished || !videosExtra) return;

      function finalizeVideosClose() {
        if (videosCloseFinished) return;
        videosCloseFinished = true;
        videosCloseTimers.forEach(function (id) {
          window.clearTimeout(id);
        });
        videosCloseTimers = [];
        if (videosExtra._onGridTransitionEnd) {
          videosExtra.removeEventListener("transitionend", videosExtra._onGridTransitionEnd);
          videosExtra._onGridTransitionEnd = null;
        }
        if (!unifiedLayoutShrinking) {
          prepareVideosExtraDomAfterClose();
        }
        resetMobileAnchor(mobileGridAnchorWrap());
        setMobileAnchorLayoutHidden(false);
        lockPanelMainHeight(null, { skipRemeasure: true });
        revealShowMoreAfterClose();
        videosAnimating = false;
      }

      if (unifiedLayoutShrinking) {
        finishUnifiedBlockCollapse(finalizeVideosClose);
        return;
      }

      finalizeVideosClose();
    }

    function beginContainerClose() {
      if (!videosExtra || videosCloseFinished) return;
      var closeMs = videosExtraContainerCloseMs();
      var layoutShrunk = unifiedLayoutShrinking;

      if (isMobileNoblemenAnchor()) {
        holdMobileAnchorAtPairedSlot(mobileGridAnchorWrap());
      } else {
        videosExtra.classList.remove("is-open");
      }

      videosExtra.classList.add("is-container-closing");
      videosExtra.setAttribute("aria-hidden", "true");

      if (layoutShrunk) {
        return;
      } else {
        var closeFromH = measureVideosExtraCloseHeight();
        videosExtra.classList.remove("is-close-measure");
        videosExtra.style.transition = "none";
        videosExtra.style.maxHeight = closeFromH + "px";
        void videosExtra.offsetHeight;
        videosExtra.style.transition =
          "max-height " + closeMs / 1000 + "s " + MOBILE_ANCHOR_EASE;
        videosExtra.style.maxHeight = "0px";

        function onTransitionEnd(e) {
          if (e.target !== videosExtra || e.propertyName !== "max-height") return;
          finishVideosClose();
        }

        videosExtra._onGridTransitionEnd = onTransitionEnd;
        videosExtra.addEventListener("transitionend", onTransitionEnd);
        pushVideosCloseTimer(window.setTimeout(finishVideosClose, closeMs + 100));
      }

      if (isMobileNoblemenAnchor()) {
        pushVideosCloseTimer(
          window.setTimeout(revealShowMoreAfterClose, NOBLEMEN_REVEAL_DELAY_MS)
        );
      } else {
        pushVideosCloseTimer(
          window.setTimeout(
            revealShowMoreAfterClose,
            Math.round(closeMs * SHOW_MORE_REVEAL_CONTAINER_CLOSE_RATIO)
          )
        );
      }
    }

    function beginVideosOpenAfterAnchor() {
      restartExtraThumbAnimations();

      function onTransitionEnd(e) {
        if (e.target !== videosExtra || e.propertyName !== "grid-template-rows") return;
        finishVideosOpen();
      }

      videosExtra._onGridTransitionEnd = onTransitionEnd;
      videosExtra.addEventListener("transitionend", onTransitionEnd);
      videosTransitionTimer = window.setTimeout(finishVideosOpen, VIDEOS_EXTRA_OPEN_MS + 100);
    }

    function beginVideosOpen() {
      clearVideosAnimation();
      videosAnimating = true;
      unlockPanelMainFlow();
      videosExtra.classList.remove("is-hiding", "is-container-closing", "is-closing");
      videosExtra.setAttribute("aria-hidden", "false");

      var anchor = mobileGridAnchorWrap();
      if (isMobileNoblemenAnchor() && anchor && !reduceMotion) {
        runMobileAnchorOpen(
          anchor,
          function () {
            videosExtra.classList.add("is-open");
            beginVideosOpenAfterAnchor();
          },
          completeMobileAnchorOpen
        );
        return;
      }

      videosExtra.classList.add("is-open");
      beginVideosOpenAfterAnchor();
    }

    function beginVideosClose() {
      clearVideosAnimation();
      if (!videosExtra || !videosExtra.classList.contains("is-open")) return;

      videosAnimating = true;
      videosExpanded = false;
      unlockPanelMainFlow();

      if (showMoreBtn) {
        showMoreBtn.setAttribute("aria-expanded", "false");
      }

      hideHomeBottomButton();

      if (videosExtra.classList.contains("is-hiding")) {
        videosExtra.classList.remove("is-hiding");
        void videosExtra.offsetWidth;
      }
      videosExtra.classList.remove("is-container-closing");
      videosExtra.classList.add("is-hiding");
      restartExtraThumbAnimations();

      var closeMs = videosExtraContainerCloseMs();
      var layoutCloseDelay = videosExtraContainerCloseDelay();

      if (isUnifiedVideosGrid()) {
        pushVideosCloseTimer(
          window.setTimeout(function () {
            beginUnifiedLayoutShrink(closeMs);
          }, layoutCloseDelay)
        );
        if (isMobileNoblemenAnchor() && !reduceMotion) {
          pushVideosCloseTimer(
            window.setTimeout(
              beginNoblemenUnifiedAnchorClose,
              unifiedVideosGridCloseDelay()
            )
          );
        }
      } else {
        pushVideosCloseTimer(
          window.setTimeout(function () {
            beginContainerClose();
          }, layoutCloseDelay)
        );
      }

      var closeFinishMs = layoutCloseDelay + closeMs + 100;
      if (isUnifiedVideosGrid() && isMobileNoblemenAnchor() && !reduceMotion) {
        closeFinishMs = Math.max(
          closeFinishMs,
          unifiedVideosGridCloseDelay() +
            NOBLEMEN_REVEAL_DELAY_MS +
            MOBILE_ANCHOR_MS +
            120
        );
      }

      pushVideosCloseTimer(window.setTimeout(finishVideosClose, closeFinishMs));
    }

    function setVideosExpanded(open) {
      if (!videosExtra) return;
      if (open === videosExpanded) return;
      if (videosAnimating) return;

      videosExpanded = open;

      if (reduceMotion) {
        clearVideosAnimation();
        videosExtra.classList.remove("is-hiding", "is-container-closing", "is-closing");
        if (open) {
          videosExtra.setAttribute("aria-hidden", "false");
          videosExtra.classList.add("is-open");
          if (showMoreBtn) {
            showMoreBtn.textContent = "Show Less";
            showMoreBtn.setAttribute("aria-expanded", "true");
          }
        } else {
          videosExtra.classList.remove("is-open", "is-hiding");
          videosExtra.setAttribute("aria-hidden", "true");
          if (showMoreBtn) {
            showMoreBtn.textContent = "Show More";
            showMoreBtn.setAttribute("aria-expanded", "false");
          }
          replayShowMoreButtonReveal();
        }
        lockPanelMainHeight();
        return;
      }

      if (open) {
        if (showMoreBtn) {
          showMoreBtn.textContent = "Show Less";
          showMoreBtn.setAttribute("aria-expanded", "true");
        }
        beginVideosOpen();
        return;
      }

      beginVideosClose();
    }

    function toggleVideosMore() {
      setVideosExpanded(!videosExpanded);
    }

    if (showMoreBtn) {
      showMoreBtn.addEventListener("click", toggleVideosMore);
    }

    if (mailBtn) {
      mailBtn.addEventListener("click", function () {
        if (view === VIEW_MAIN) switchView(VIEW_CONTACT);
        else if (view === VIEW_CONTACT) switchView(VIEW_MAIN);
      });
    }

    applyView(VIEW_MAIN, { initialLoad: true });

    window.addEventListener(
      "resize",
      function () {
        if (videosAnimating) return;
        if (view === VIEW_MAIN) setPanelOpen(panelMain, true);
        else if (view === VIEW_RESUME) setPanelOpen(panelResume, true);
        else if (view === VIEW_CONTACT) setPanelOpen(panelContact, true);
      },
      { passive: true }
    );

    initContactForm();
    initContactMessageField();
  }

  function remeasureVisibleContactPanel() {
    var panel = document.getElementById("home-panel-contact");
    if (!panel || !panel.classList.contains("is-visible")) return;
    var inner = panel.querySelector(".home-panel__inner");
    if (!inner) return;
    panel.classList.add("home-panel--instant-height");
    panel.style.maxHeight = inner.scrollHeight + "px";
    panel.classList.remove("home-panel--instant-height");
  }

  function initContactMessageField() {
    var textarea = document.getElementById("connect-message");
    var handle = document.querySelector(".home-connect__resize-handle");
    if (!textarea) return;

    function maxMessageHeight() {
      return Math.min(Math.round(window.innerHeight * 0.55), 520);
    }

    function minMessageHeight() {
      return 88;
    }

    function clampMessageHeight(h) {
      return Math.max(minMessageHeight(), Math.min(maxMessageHeight(), Math.round(h)));
    }

    function setMessageHeight(h) {
      textarea.style.height = clampMessageHeight(h) + "px";
      remeasureVisibleContactPanel();
    }

    if (typeof ResizeObserver !== "undefined") {
      var panelObserver = new ResizeObserver(function () {
        remeasureVisibleContactPanel();
      });
      panelObserver.observe(textarea);
    }

    window.addEventListener("resize", remeasureVisibleContactPanel, { passive: true });

    if (!handle) return;

    function startResize(clientY) {
      var startY = clientY;
      var startH = textarea.offsetHeight;

      function onMove(e) {
        var y = e.touches && e.touches.length ? e.touches[0].clientY : e.clientY;
        setMessageHeight(startH + (y - startY));
      }

      function onEnd() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onEnd);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend", onEnd);
        document.removeEventListener("touchcancel", onEnd);
      }

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onEnd);
      document.addEventListener("touchmove", onMove, { passive: true });
      document.addEventListener("touchend", onEnd);
      document.addEventListener("touchcancel", onEnd);
    }

    handle.addEventListener("mousedown", function (e) {
      e.preventDefault();
      startResize(e.clientY);
    });

    handle.addEventListener(
      "touchstart",
      function (e) {
        if (!e.touches.length) return;
        startResize(e.touches[0].clientY);
      },
      { passive: true }
    );
  }

  function initContactForm() {
    var form = document.getElementById("home-connect-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var emailEl = form.querySelector('[name="email"]');
      var nameEl = form.querySelector('[name="name"]');
      var subjectEl = form.querySelector('[name="subject"]');
      var messageEl = form.querySelector('[name="message"]');
      var email = emailEl ? emailEl.value.trim() : "";
      var name = nameEl ? nameEl.value.trim() : "";
      var subjectRaw = subjectEl ? subjectEl.value.trim() : "";
      var message = messageEl ? messageEl.value.trim() : "";

      var statusEl = form.querySelector("[data-connect-status]");
      var submitBtn = form.querySelector('button[type="submit"]');

      function setStatus(text, kind) {
        if (!statusEl) return;
        statusEl.textContent = text || "";
        statusEl.setAttribute("data-kind", kind || "");
      }

      if (!email || !name || !subjectRaw || !message) {
        setStatus("Please fill in Your email, Name, Subject, and Message.", "error");
        return;
      }

      // GitHub Pages is static: to send email "from the site" we need a form backend.
      // Create one (e.g. Formspree) and paste the endpoint here.
      var FORM_ENDPOINT = "https://formspree.io/f/xpqnkwvb";

      if (!FORM_ENDPOINT) {
        setStatus("Contact form is not configured yet.", "error");
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      form.classList.add("is-sending");
      setStatus("Sending…", "info");

      var fd = new FormData();
      fd.append("email", email);
      fd.append("name", name);
      fd.append("subject", subjectRaw);
      fd.append(
        "message",
        "From: " + name + " <" + email + ">\n\n" + message
      );
      fd.append("_subject", "VCHAUDIO:SITE: " + subjectRaw);
      fd.append("_replyto", email);
      fd.append("page", location.href);

      fetch(FORM_ENDPOINT, {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Bad response");
          setStatus("Sent. Thank you!", "success");
          form.reset();
          var messageEl = form.querySelector('[name="message"]');
          if (messageEl) messageEl.style.height = "";
          remeasureVisibleContactPanel();
        })
        .catch(function () {
          setStatus("Sorry — sending failed. Please try again later.", "error");
        })
        .finally(function () {
          form.classList.remove("is-sending");
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHomeViews);
  } else {
    initHomeViews();
  }
})();
