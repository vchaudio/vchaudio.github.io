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
    var VIDEOS_EXTRA_OPEN_MS = 550;
    var VIDEOS_EXTRA_THUMB_MS = 850;
    var VIDEOS_EXTRA_STAGGER_END_MS = 360;
    var VIDEOS_EXTRA_TOTAL_MS = VIDEOS_EXTRA_THUMB_MS + VIDEOS_EXTRA_STAGGER_END_MS;
    var VIDEOS_EXTRA_CONTAINER_START_MS = 720;
    var VIDEOS_EXTRA_CONTAINER_CLOSE_MS = 2200;
    var HOME_BOTTOM_HIDE_MS = 550;

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

    function lockPanelMainHeight() {
      if (!panelMain) return;
      panelMain.classList.remove("home-panel--flow");
      panelMain.classList.add("home-panel--instant-height");
      panelMain.style.maxHeight = measurePanel(panelMain, { live: true }) + "px";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          panelMain.style.maxHeight = measurePanel(panelMain, { live: true }) + "px";
          panelMain.classList.remove("home-panel--instant-height");
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

    function extraThumbs() {
      return videosExtra ? videosExtra.querySelectorAll(".best-works__videos-extra-inner .video-thumb") : [];
    }

    function restartExtraThumbAnimations() {
      extraThumbs().forEach(function (thumb) {
        thumb.style.animation = "none";
        void thumb.offsetWidth;
        thumb.style.animation = "";
      });
    }

    function clearVideosAnimation() {
      videosCloseFinished = false;
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
        videosExtra.classList.remove("is-closing", "is-container-closing", "is-hiding");
        videosExtra.style.transition = "";
        videosExtra.style.maxHeight = "";
      }
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
      videosCloseFinished = true;
      videosCloseTimers.forEach(function (id) {
        window.clearTimeout(id);
      });
      videosCloseTimers = [];
      if (videosExtra._onGridTransitionEnd) {
        videosExtra.removeEventListener("transitionend", videosExtra._onGridTransitionEnd);
        videosExtra._onGridTransitionEnd = null;
      }
      videosExtra.style.transition = "none";
      videosExtra.classList.remove("is-open", "is-hiding", "is-container-closing");
      videosExtra.setAttribute("aria-hidden", "true");
      void videosExtra.offsetWidth;
      videosExtra.style.transition = "";
      videosExtra.style.maxHeight = "";
      extraThumbs().forEach(function (thumb) {
        thumb.style.animation = "none";
      });
      if (showMoreBtn) {
        showMoreBtn.textContent = "Show More";
        showMoreBtn.setAttribute("aria-expanded", "false");
      }
      replayShowMoreButtonReveal();
      lockPanelMainHeight();
      videosAnimating = false;
    }

    function beginContainerClose() {
      if (!videosExtra || videosCloseFinished) return;
      var closeFromH = videosExtra.scrollHeight;
      videosExtra.style.transition = "none";
      videosExtra.style.maxHeight = closeFromH + "px";
      videosExtra.classList.add("is-container-closing");
      videosExtra.setAttribute("aria-hidden", "true");
      void videosExtra.offsetWidth;
      videosExtra.style.transition = "";
      videosExtra.style.maxHeight = "0px";
      videosExtra.classList.remove("is-open");

      function onTransitionEnd(e) {
        if (e.target !== videosExtra || e.propertyName !== "max-height") return;
        finishVideosClose();
      }

      videosExtra._onGridTransitionEnd = onTransitionEnd;
      videosExtra.addEventListener("transitionend", onTransitionEnd);
      pushVideosCloseTimer(
        window.setTimeout(finishVideosClose, VIDEOS_EXTRA_CONTAINER_CLOSE_MS + 100)
      );
    }

    function beginVideosOpen() {
      clearVideosAnimation();
      videosAnimating = true;
      unlockPanelMainFlow();
      videosExtra.classList.remove("is-hiding", "is-container-closing", "is-closing");
      videosExtra.setAttribute("aria-hidden", "false");
      videosExtra.classList.remove("is-open");
      void videosExtra.offsetWidth;
      videosExtra.classList.add("is-open");
      restartExtraThumbAnimations();

      function onTransitionEnd(e) {
        if (e.target !== videosExtra || e.propertyName !== "grid-template-rows") return;
        finishVideosOpen();
      }

      videosExtra._onGridTransitionEnd = onTransitionEnd;
      videosExtra.addEventListener("transitionend", onTransitionEnd);
      videosTransitionTimer = window.setTimeout(finishVideosOpen, VIDEOS_EXTRA_OPEN_MS + 100);
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

      pushVideosCloseTimer(
        window.setTimeout(function () {
          beginContainerClose();
        }, VIDEOS_EXTRA_CONTAINER_START_MS)
      );
      pushVideosCloseTimer(
        window.setTimeout(
          finishVideosClose,
          VIDEOS_EXTRA_CONTAINER_START_MS + VIDEOS_EXTRA_CONTAINER_CLOSE_MS + 100
        )
      );
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
