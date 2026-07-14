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
          panel.classList.remove("home-tab-panel--fade");
          panel.hidden = false;
          /* Re-trigger the fade-in now that the panel is displayed. */
          void panel.offsetWidth;
          panel.classList.add("home-tab-panel--fade");
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
    var resumeLabel = (window.__VCH_DATA__ && window.__VCH_DATA__.site && window.__VCH_DATA__.site.sections && window.__VCH_DATA__.site.sections.resumeButtonLabel) || "Resume";
    var showMoreLabel = (window.__VCH_DATA__ && window.__VCH_DATA__.site && window.__VCH_DATA__.site.sections && window.__VCH_DATA__.site.sections.showMoreLabel) || "Show More";
    var showLessLabel = (window.__VCH_DATA__ && window.__VCH_DATA__.site && window.__VCH_DATA__.site.sections && window.__VCH_DATA__.site.sections.showLessLabel) || "Show Less";
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
    var VIDEOS_BLOCK_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
    var PRIMARY_VIDEO_COUNT = 5;
    var primaryVideoWraps = [];
    var extraVideoWraps = [];
    var lastVideoLayoutCols = null;

    function initVideosWrapLists() {
      var row = panelMain ? panelMain.querySelector(".best-works__row--videos") : null;
      var inner = videosExtra ? videosExtra.querySelector(".best-works__videos-extra-inner") : null;
      if (!row || !inner) return;
      if (!primaryVideoWraps.length) {
        primaryVideoWraps = Array.prototype.slice.call(
          row.querySelectorAll(".video-thumb-wrap"),
          0,
          PRIMARY_VIDEO_COUNT
        );
      }
      if (!extraVideoWraps.length) {
        extraVideoWraps = Array.prototype.slice.call(
          inner.querySelectorAll(".video-thumb-wrap")
        );
      }
    }

    function primaryVisibleCount(cols) {
      if (cols >= 5) return 5;
      if (cols === 4) return 4;
      if (cols === 3) return 3;
      if (cols === 2) return 4;
      return cols;
    }

    function moveWrapToIndex(parent, wrap, index) {
      if (wrap.parentNode !== parent) {
        parent.insertBefore(wrap, parent.children[index] || null);
        return;
      }
      var currentIndex = Array.prototype.indexOf.call(parent.children, wrap);
      if (currentIndex !== index) {
        parent.insertBefore(wrap, parent.children[index] || null);
      }
    }

    function syncVideosPrimaryLayout() {
      if (!videosExtra) return;
      initVideosWrapLists();
      var row = panelMain ? panelMain.querySelector(".best-works__row--videos") : null;
      var inner = videosExtra.querySelector(".best-works__videos-extra-inner");
      if (!row || !inner) return;

      if (videosExpanded) {
        lastVideoLayoutCols = bestWorksVideoCols();
        return;
      }

      var visible = primaryVisibleCount(bestWorksVideoCols());
      var rowItems = primaryVideoWraps.slice(0, visible);
      var innerItems = primaryVideoWraps.slice(visible).concat(extraVideoWraps);

      rowItems.forEach(function (wrap, i) {
        moveWrapToIndex(row, wrap, i);
      });
      innerItems.forEach(function (wrap, i) {
        moveWrapToIndex(inner, wrap, i);
      });
      lastVideoLayoutCols = bestWorksVideoCols();
    }

    function isUnifiedVideosGrid() {
      return UNIFIED_VIDEOS_GRID_MQ.matches;
    }

    function bestWorksVideoCols() {
      var bw = panelMain ? panelMain.querySelector(".best-works") : null;
      if (!bw) return 5;
      var cols = parseInt(getComputedStyle(bw).getPropertyValue("--bw-cols"), 10);
      return cols > 0 ? cols : 5;
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

    function beginUnifiedGridCleanup() {
      if (!videosExtra || videosCloseFinished || videosExtra._unifiedGridCleanedUp) return;
      videosExtra._unifiedGridCleanedUp = true;
      videosExtra.classList.remove("is-open");
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
      syncVideosPrimaryLayout();
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
        syncVideosPrimaryLayout();
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

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    function blurShowMoreFocus() {
      if (showMoreBtn && document.activeElement === showMoreBtn) {
        showMoreBtn.blur();
      }
    }

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
        "max-height " + closeMs / 1000 + "s " + VIDEOS_BLOCK_EASE;
      block.style.maxHeight = toH + "px";
      watchUnifiedBlockTransitionEnd(onUnifiedBlockCollapsed);
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

    function syncToolsPuzzleState() {
      var wrap = panelMain ? panelMain.querySelector(".best-works-wrap") : null;
      var tools = panelMain ? panelMain.querySelector(".best-works-tools") : null;
      var recs = panelMain ? panelMain.querySelector("#home-recommendations") : null;
      if (tools) {
        tools.classList.remove("best-works-tools--pre-puzzle", "best-works-tools--puzzle");
      }
      if (recs) {
        recs.classList.remove(
          "home-recommendations--pre-puzzle",
          "home-recommendations--puzzle"
        );
      }
      if (!wrap || reduceMotion) return;
      if (wrap.classList.contains("best-works-wrap--pre-puzzle")) {
        if (tools) tools.classList.add("best-works-tools--pre-puzzle");
        if (recs) recs.classList.add("home-recommendations--pre-puzzle");
      }
      if (wrap.classList.contains("best-works-wrap--puzzle")) {
        if (tools) tools.classList.add("best-works-tools--puzzle");
        if (recs) recs.classList.add("home-recommendations--puzzle");
      }
    }

    function prepareBestWorksPuzzle() {
      var wrap = panelMain ? panelMain.querySelector(".best-works-wrap") : null;
      if (!wrap) return;
      if (reduceMotion) {
        wrap.classList.remove("best-works-wrap--pre-puzzle", "best-works-wrap--puzzle");
        syncToolsPuzzleState();
        return;
      }
      wrap.classList.remove("best-works-wrap--puzzle");
      wrap.classList.add("best-works-wrap--pre-puzzle");
      syncToolsPuzzleState();
    }

    function replayBestWorksPuzzle() {
      var wrap = panelMain ? panelMain.querySelector(".best-works-wrap") : null;
      if (!wrap) return;
      if (reduceMotion) {
        wrap.classList.remove("best-works-wrap--pre-puzzle", "best-works-wrap--puzzle");
        syncToolsPuzzleState();
        return;
      }
      wrap.classList.remove("best-works-wrap--puzzle");
      wrap.classList.add("best-works-wrap--pre-puzzle");
      syncToolsPuzzleState();
      void wrap.offsetWidth;
      wrap.classList.remove("best-works-wrap--pre-puzzle");
      wrap.classList.add("best-works-wrap--puzzle");
      syncToolsPuzzleState();
    }

    function scheduleBestWorksPuzzle() {
      requestAnimationFrame(function () {
        requestAnimationFrame(replayBestWorksPuzzle);
      });
    }

    function prepareResumeButtonReveal() {
      if (!toggleBtn) return;
      if (reduceMotion) {
        toggleBtn.classList.remove("home-action-btn--pre-puzzle", "home-action-btn--puzzle");
        return;
      }
      toggleBtn.classList.remove("home-action-btn--puzzle");
      toggleBtn.classList.add("home-action-btn--pre-puzzle");
    }

    function replayResumeButtonReveal() {
      if (!toggleBtn) return;
      if (reduceMotion) {
        toggleBtn.classList.remove("home-action-btn--pre-puzzle", "home-action-btn--puzzle");
        return;
      }
      toggleBtn.classList.remove("home-action-btn--puzzle");
      toggleBtn.classList.add("home-action-btn--pre-puzzle");
      void toggleBtn.offsetWidth;
      toggleBtn.classList.remove("home-action-btn--pre-puzzle");
      toggleBtn.classList.add("home-action-btn--puzzle");
    }

    function scheduleResumeButtonReveal() {
      prepareResumeButtonReveal();
      requestAnimationFrame(function () {
        requestAnimationFrame(replayResumeButtonReveal);
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
      if (showMoreRevealedAfterClose) return;
      showMoreRevealedAfterClose = true;
      if (showMoreBtn) {
        showMoreBtn.textContent = showMoreLabel;
        showMoreBtn.setAttribute("aria-expanded", "false");
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

      function finishLock() {
        panelMain.classList.remove("home-panel--instant-height");
        if (onLocked) onLocked();
      }

      if (opts.skipRemeasure) {
        finishLock();
        return;
      }
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          panelMain.style.maxHeight = measurePanel(panelMain, { live: true }) + "px";
          finishLock();
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
        if (panel === panelMain) {
          panel.classList.remove("home-panel--flow", "home-panel--instant-height");
        }
        /* Unhide while the is-hidden state (opacity:0, max-height:0) still
           applies, and force a reflow so that start state is rendered.
           Without this the browser jumps straight to the target and the
           max-height/opacity transitions never run (the panel snaps open). */
        panel.removeAttribute("hidden");
        void panel.offsetWidth;
        var targetH = measurePanel(panel);
        panel.classList.remove("is-hidden");
        panel.classList.add("is-visible");
        panel.style.maxHeight = "0px";
        void panel.offsetWidth;
        panel.style.maxHeight = targetH + "px";
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
        toggleBtn.textContent = resumeLabel;
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

      if (next === VIEW_MAIN) {
        if (!videosExpanded) syncVideosPrimaryLayout();
        prepareBestWorksPuzzle();
        if (enteringMain) unlockPanelMainFlow();
      }

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
        unlockPanelMainFlow();
      }
      if (next === VIEW_MAIN && enteringMain) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            remeasurePanelInstant(panelMain);
          });
        });
      }
      if (mailBtn) mailBtn.setAttribute("aria-expanded", next === VIEW_CONTACT ? "true" : "false");

      if (next === VIEW_RESUME) revealInPanel(panelResume);
      if (next === VIEW_MAIN && (enteringMain || opts.initialLoad)) {
        scheduleBestWorksPuzzle();
        scheduleShowMoreReveal();
      }
      if (opts.initialLoad) {
        scheduleResumeButtonReveal();
      }
      syncIndexScrollToTop();
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
      videosCloseFinished = false;
      showMoreRevealedAfterClose = false;
      root.classList.remove("is-videos-closing");
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
          "is-unified-handoff"
        );
        videosExtra.style.transition = "";
        videosExtra.style.maxHeight = "";
        videosExtra._unifiedFinishQueued = false;
        videosExtra._unifiedGridCleanedUp = false;
      }
      resetUnifiedVideosBlockCollapse();
      syncVideosPrimaryLayout();
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
        revealShowMoreAfterClose();
        if (!unifiedLayoutShrinking) {
          prepareVideosExtraDomAfterClose();
        } else {
          syncVideosPrimaryLayout();
        }
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            lockPanelMainHeight(function () {
              root.classList.remove("is-videos-closing");
              videosAnimating = false;
            });
          });
        });
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

      videosExtra.classList.remove("is-open");

      videosExtra.classList.add("is-container-closing");
      videosExtra.setAttribute("aria-hidden", "true");

      if (layoutShrunk) {
        return;
      } else {
        /* Desktop collapse: animate grid-template-rows 1fr -> 0fr (same property
           as the open), driven by the CSS class. Symmetric with Show More and
           smoother than the old max-height transition (no clipping dead-zone,
           no per-frame fight with scroll anchoring). */
        function onTransitionEnd(e) {
          if (e.target !== videosExtra || e.propertyName !== "grid-template-rows") return;
          finishVideosClose();
        }

        videosExtra._onGridTransitionEnd = onTransitionEnd;
        videosExtra.addEventListener("transitionend", onTransitionEnd);
        pushVideosCloseTimer(window.setTimeout(finishVideosClose, closeMs + 100));
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
      videosExtra.classList.add("is-open");
      beginVideosOpenAfterAnchor();
    }

    function beginVideosClose() {
      clearVideosAnimation();
      if (!videosExtra || !videosExtra.classList.contains("is-open")) return;

      blurShowMoreFocus();
      root.classList.add("is-videos-closing");

      videosAnimating = true;
      videosExpanded = false;

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
      } else {
        pushVideosCloseTimer(
          window.setTimeout(function () {
            beginContainerClose();
          }, layoutCloseDelay)
        );
      }

      var closeFinishMs = layoutCloseDelay + closeMs + 100;

      pushVideosCloseTimer(
        window.setTimeout(
          revealShowMoreAfterClose,
          layoutCloseDelay + Math.round(closeMs * SHOW_MORE_REVEAL_CONTAINER_CLOSE_RATIO)
        )
      );
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
            showMoreBtn.textContent = showLessLabel;
            showMoreBtn.setAttribute("aria-expanded", "true");
          }
        } else {
          videosExtra.classList.remove("is-open", "is-hiding");
          videosExtra.setAttribute("aria-hidden", "true");
          syncVideosPrimaryLayout();
          if (showMoreBtn) {
            showMoreBtn.textContent = showMoreLabel;
            showMoreBtn.setAttribute("aria-expanded", "false");
          }
          replayShowMoreButtonReveal();
        }
        lockPanelMainHeight();
        return;
      }

      if (open) {
        if (showMoreBtn) {
          showMoreBtn.textContent = showLessLabel;
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
      showMoreBtn.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "mouse") e.preventDefault();
      });
      showMoreBtn.addEventListener("click", toggleVideosMore);
    }

    if (mailBtn) {
      mailBtn.addEventListener("click", function () {
        if (view === VIEW_MAIN) switchView(VIEW_CONTACT);
        else if (view === VIEW_CONTACT) switchView(VIEW_MAIN);
      });
    }

    function resetIndexScrollToSingleIcon(btn) {
      if (!btn) return;
      var homeIcon = btn.querySelector(".scroll-to-top__icon--home");
      if (homeIcon) homeIcon.remove();
      var upIcon = btn.querySelector(".scroll-to-top__icon--up");
      if (upIcon) upIcon.classList.remove("scroll-to-top__icon--up");
    }

    function ensureIndexScrollDualIcons(btn) {
      if (!btn) return;
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

    function syncIndexScrollToTop() {
      var btn = document.querySelector("[data-scroll-to-top]");
      if (!btn) return;
      var scrolled = window.scrollY > 320;
      if (view === VIEW_MAIN) {
        btn.classList.remove("scroll-to-top--dual", "is-scrolled");
        resetIndexScrollToSingleIcon(btn);
        btn.classList.toggle("is-visible", scrolled);
        btn.setAttribute("aria-label", "Back to top");
        return;
      }
      ensureIndexScrollDualIcons(btn);
      btn.classList.add("scroll-to-top--dual", "is-visible");
      btn.classList.toggle("is-scrolled", scrolled);
      btn.setAttribute("aria-label", scrolled ? "Back to top" : "Home");
    }

    function initIndexScrollToTop() {
      var btn = document.querySelector("[data-scroll-to-top]");
      if (!btn) return;
      var scrollReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      btn.addEventListener("click", function () {
        if (view !== VIEW_MAIN && !btn.classList.contains("is-scrolled")) {
          switchView(VIEW_MAIN);
          return;
        }
        window.scrollTo({ top: 0, behavior: scrollReduceMotion ? "auto" : "smooth" });
      });

      window.addEventListener("scroll", syncIndexScrollToTop, { passive: true });
      syncIndexScrollToTop();
    }

    initIndexScrollToTop();
    applyView(VIEW_MAIN, { initialLoad: true });

    function resizeRemeasurePanels() {
      if (videosAnimating) return;
      var cols = bestWorksVideoCols();
      var layoutChanged = cols !== lastVideoLayoutCols;
      if (layoutChanged) syncVideosPrimaryLayout();
      var panel =
        view === VIEW_MAIN ? panelMain :
        view === VIEW_RESUME ? panelResume :
        view === VIEW_CONTACT ? panelContact : null;
      if (!panel || !panel.classList.contains("is-visible")) return;
      /* The main panel in flow mode (max-height: none) auto-adapts to its
         content — nothing to lock. */
      if (panel === panelMain && panel.classList.contains("home-panel--flow")) return;
      var h = measurePanel(panel, { live: true });
      if (h <= 0) return;
      /* Only rewrite the locked height when it actually changed. On mobile
         the URL bar showing/hiding fires resize continuously while the
         content height stays the same; rewriting the inline height on every
         one (and especially the scroll-preserve that remeasurePanelInstant
         does via window.scrollTo) would fight the user's momentum scroll —
         the footer jumps, the resume view anchors back to the languages
         graph, and the studio tab flashes. When the height is unchanged we
         do nothing, so scrolling stays smooth. */
      if (panel.style.maxHeight === h + "px") return;
      panel.classList.add("home-panel--instant-height");
      panel.style.maxHeight = h + "px";
      /* Force a reflow so the height change is applied while
         transition: none (--instant-height) is in effect, then drop the
         class so transitions are restored for later animations. */
      void panel.offsetWidth;
      panel.classList.remove("home-panel--instant-height");
    }

    window.addEventListener("resize", resizeRemeasurePanels, { passive: true });

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
      // The endpoint is stored on the form as data-endpoint (managed via the admin panel).
      var FORM_ENDPOINT = form.getAttribute("data-endpoint") || "";

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
