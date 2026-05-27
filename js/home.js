(function () {
  "use strict";

  var VIEW_MAIN = "main";
  var VIEW_RESUME = "resume";
  var VIEW_PORTFOLIO = "portfolio";
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
    var panelPortfolio = document.getElementById("home-panel-portfolio");
    var panelContact = document.getElementById("home-panel-contact");
    if (!toggleBtn || !panelMain || !panelResume || !panelPortfolio || !panelContact) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var view = VIEW_MAIN;
    var animating = false;

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
      setPanelOpen(panelPortfolio, next === VIEW_PORTFOLIO, {
        rollMode: rollOnOpen && next === VIEW_PORTFOLIO ? "open" : null,
        rollClose: rollOnOpen && prev === VIEW_PORTFOLIO && next !== VIEW_PORTFOLIO,
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
      if (mailBtn) mailBtn.setAttribute("aria-expanded", next === VIEW_CONTACT ? "true" : "false");

      if (next === VIEW_RESUME) revealInPanel(panelResume);
      if (next === VIEW_MAIN && (enteringMain || opts.initialLoad)) {
        scheduleBestWorksPuzzle();
      }
      if (next === VIEW_PORTFOLIO) {
        revealInPanel(panelPortfolio);
        requestAnimationFrame(function () {
          window.dispatchEvent(new Event("resize"));
        });
        window.setTimeout(function () {
          var firstSection = document.getElementById("portfolio-music");
          if (firstSection) {
            var top = firstSection.getBoundingClientRect().top + window.scrollY - 88;
            window.scrollTo({ top: Math.max(0, top), behavior: animate ? "smooth" : "auto" });
          }
          remeasurePanelInstant(panelPortfolio);
        }, animate ? 460 : 0);
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

    if (showMoreBtn) {
      showMoreBtn.addEventListener("click", function () {
        switchView(VIEW_PORTFOLIO);
      });
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
        if (view === VIEW_MAIN) setPanelOpen(panelMain, true);
        else if (view === VIEW_RESUME) setPanelOpen(panelResume, true);
        else if (view === VIEW_PORTFOLIO) setPanelOpen(panelPortfolio, true);
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
