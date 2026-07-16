(function () {
  "use strict";

  var DATA_DIR = "data/";
  var DATA_FILES = ["site", "projects", "videos", "resume", "studio", "recommendations"];

  /* ---------- small DOM helpers ---------- */
  function h(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "class") node.className = v;
        else if (k === "html") node.innerHTML = v;
        else if (k === "text") node.textContent = v;
        else node.setAttribute(k, v === true ? "" : v);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      if (Array.isArray(c)) { c.forEach(function (cc) { if (cc == null) return; node.appendChild(typeof cc === "string" ? document.createTextNode(cc) : cc); }); return; }
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  var SVG_NS = "http://www.w3.org/2000/svg";
  function svg(tag, attrs, children) {
    var node = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        node.setAttribute(k, v);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      if (Array.isArray(c)) { c.forEach(function (cc) { if (cc == null) return; node.appendChild(typeof cc === "string" ? document.createTextNode(cc) : cc); }); return; }
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function ytThumb(id, res) {
    return "https://img.youtube.com/vi/" + encodeURIComponent(id) + "/" + (res || "hqdefault") + ".jpg";
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.defer = true;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("Failed to load " + src)); };
      document.body.appendChild(s);
    });
  }

  function fetchData() {
    var cacheMode = location.search.indexOf("preview=1") >= 0 ? "no-store" : "default";
    var type = pageType();

    if (type === "project") {
      var cached = null;
      try {
        var raw = sessionStorage.getItem("vchProjectsBoot");
        if (raw) {
          sessionStorage.removeItem("vchProjectsBoot");
          cached = JSON.parse(raw);
        }
      } catch (eBoot) {}
      if (cached) {
        return Promise.resolve({
          site: null,
          projects: cached,
          videos: null,
          resume: null,
          studio: null,
          recommendations: null
        });
      }
      var early = window.__VCH_PROJECTS_FETCH__;
      window.__VCH_PROJECTS_FETCH__ = null;
      var projectsPromise = early
        ? Promise.resolve(early).catch(function () {
            return fetch(DATA_DIR + "projects.json", { cache: cacheMode }).then(function (r) {
              if (!r.ok) throw new Error("Cannot load data/projects.json (" + r.status + ")");
              return r.json();
            });
          })
        : fetch(DATA_DIR + "projects.json", { cache: cacheMode }).then(function (r) {
            if (!r.ok) throw new Error("Cannot load data/projects.json (" + r.status + ")");
            return r.json();
          });
      return projectsPromise.then(function (projects) {
        return { site: null, projects: projects, videos: null, resume: null, studio: null, recommendations: null };
      });
    }

    return Promise.all(
      DATA_FILES.map(function (name) {
        return fetch(DATA_DIR + name + ".json", { cache: cacheMode }).then(function (r) {
          if (!r.ok) throw new Error("Cannot load data/" + name + ".json (" + r.status + ")");
          return r.json();
        });
      })
    ).then(function (results) {
      return {
        site: results[0],
        projects: results[1],
        videos: results[2],
        resume: results[3],
        studio: results[4],
        recommendations: results[5],
      };
    });
  }

  function fail(message) {
    revealSiteChrome();
    var main = document.querySelector("main") || document.body;
    var note = h("div", {
      class: "vch-render-error",
      style: "margin:2rem auto;max-width:640px;padding:1.2rem 1.4rem;border:1px solid rgba(220,90,70,0.4);border-radius:12px;background:#1a1714;color:#f0a39a;font-family:var(--font);"
    }, [h("p", { text: message })]);
    main.insertBefore(note, main.firstChild);
  }

  /* Footer (and project home button) stay hidden until JSON content is in the DOM. */
  function revealSiteChrome() {
    document.querySelectorAll("[data-vch-defer-chrome]").forEach(function (el) {
      el.hidden = false;
    });
  }

  /* ---------- homepage rendering ---------- */
  function renderHome(data) {
    var site = data.site;

    document.title = site.meta.title;
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", site.meta.description);

    /* brand mark in header */
    var brandMark = document.querySelector(".brand-vch-mark");
    if (brandMark) {
      brandMark.setAttribute("src", site.brand.mark);
      brandMark.setAttribute("width", site.brand.markWidth);
      brandMark.setAttribute("height", site.brand.markHeight);
    }
    var brandWord = document.querySelector(".brand span");
    if (brandWord) brandWord.textContent = site.brand.word;

    /* hero */
    var logo = document.querySelector(".brand-logo");
    if (logo) {
      logo.setAttribute("src", site.brand.logo);
      logo.setAttribute("width", site.brand.logoWidth);
      logo.setAttribute("height", site.brand.logoHeight);
    }
    /* Hide the hero logo (and its wrapper/spacing) entirely when configured.
       Inline style is used (not the `hidden` attribute) so no CSS rule — not
       even `.brand-logo-wrap { display: flex }` — can keep it visible. */
    var logoWrap = document.querySelector(".brand-logo-wrap");
    if (logoWrap) logoWrap.style.display = (site.brand && site.brand.hideLogo) ? "none" : "";
    var avatar = document.querySelector(".avatar-photo");
    if (avatar) {
      avatar.setAttribute("src", site.hero.avatar);
      avatar.setAttribute("width", site.hero.avatarWidth);
      avatar.setAttribute("height", site.hero.avatarHeight);
      avatar.setAttribute("alt", site.hero.name);
    }
    var nameEl = document.querySelector(".intro-name");
    if (nameEl) nameEl.textContent = site.hero.name;
    var roleEl = document.querySelector(".intro-role");
    if (roleEl) roleEl.textContent = site.hero.role;
    /* Configurable role block width (overrides the CSS max-width on
       .intro-role when set). Empty/absent keeps the stylesheet default. */
    if (roleEl) {
      var rw = site.hero && site.hero.roleMaxWidth;
      if (rw && String(rw).trim()) roleEl.style.maxWidth = rw.trim();
      else roleEl.style.maxWidth = "";
    }
    var bioEl = document.querySelector(".intro-bio");
    if (bioEl) bioEl.textContent = site.hero.bio;
    /* Configurable bio block width. Applied to .intro-block, and the whole
       .home-main column is widened to accommodate it (capped at 100% so
       mobile never overflows). Empty/absent keeps the stylesheet default
       (home-main 960px / intro-block 42rem). */
    var introBlock = document.querySelector(".intro-block");
    var homeMain = document.querySelector(".home-main");
    var bw = site.hero && site.hero.bioMaxWidth;
    var bwVal = bw && String(bw).trim();
    if (introBlock) introBlock.style.maxWidth = bwVal || "";
    if (homeMain && bwVal && !/%\s*$/.test(bwVal)) {
      homeMain.style.maxWidth = "min(max(960px, " + bwVal + "), 100%)";
    } else if (homeMain) {
      homeMain.style.maxWidth = "";
    }

    /* action buttons */
    var toggleBtn = document.getElementById("home-toggle-btn");
    if (toggleBtn) toggleBtn.textContent = site.sections.resumeButtonLabel;
    var showMoreBtn = document.getElementById("home-show-more-btn");
    if (showMoreBtn) showMoreBtn.textContent = site.sections.showMoreLabel;

    /* headings */
    var setHeading = function (selector, text) {
      var el2 = document.querySelector(selector);
      if (el2) el2.textContent = text;
    };
    setHeading(".best-works__subhead", site.sections.projectsHeading);
    setHeading(".best-works__subhead--videos", site.sections.videosHeading);
    setHeading(".best-works__subhead--tools", site.sections.toolsHeading);

    /* projects row */
    var projectsRow = document.querySelector(".best-works__row--projects");
    if (projectsRow) {
      clear(projectsRow);
      var projItems = data.projects.projects.filter(function (p) { return p.section === "projects" && !p.hidden; });
      projItems.forEach(function (p) { projectsRow.appendChild(buildProjectCard(p)); });
      layoutWorkRow(projectsRow, projItems.length, "projects");
    }

    /* tools row */
    var toolsRow = document.querySelector(".best-works__row--tools");
    if (toolsRow) {
      clear(toolsRow);
      var toolItems = data.projects.projects.filter(function (p) { return p.section === "tools" && !p.hidden; });
      toolItems.forEach(function (p) { toolsRow.appendChild(buildProjectCard(p)); });
      layoutWorkRow(toolsRow, toolItems.length, "tools");
    }

    /* videos */
    renderHomeVideos(data.videos.videos, site);

    /* contact */
    renderContact(site);

    /* resume */
    renderResume(data.resume, site);

    /* studio */
    renderStudio(data.studio);

    /* recommendations (above footer) */
    renderRecommendations(data.recommendations);

    /* footer social */
    renderFooter(site);
    revealSiteChrome();
  }

  function buildProjectCard(p) {
    var cardClass = "home-portfolio-project";
    if (p.cardType === "text-only") cardClass += " home-portfolio-project--text-only";
    var href = (p.blocks && p.blocks.length)
      ? ("project.html?slug=" + encodeURIComponent(p.slug))
      : (p.detailUrl || "#");
    var attrs = { class: cardClass, href: href };
    var children = [];
    if (p.cardType !== "text-only" && p.banner) {
      /* Wrapped in a clipping media box so the image can zoom on hover without
         overflowing the tile (and without scaling the tile itself, which would
         shove the carousel row). */
      children.push(h("span", { class: "home-portfolio-project__media" }, [
        h("img", {
          class: "home-portfolio-project__img",
          src: p.banner,
          alt: "",
          width: p.bannerW || 1200,
          height: p.bannerH || 514,
          loading: "lazy"
        })
      ]));
    }
    children.push(h("span", { class: "home-portfolio-project__title", text: p.title }));
    children.push(h("span", { class: "home-portfolio-project__category", text: p.category }));
    children.push(h("span", { class: "home-portfolio-project__desc", text: p.description }));
    return h("a", attrs, children);
  }

  /* Projects/tools rows: shared layout. The carousel width is fixed to exactly
     4 visible tiles at the comfortable (3-up baseline) size; 4 is the maximum
     comfortable to view. 5+ keep that same tile size, the 5th and beyond hidden
     under the hood of a bounded carousel reached via semi-transparent,
     tile-height side controls at the block edges (gentle fade hints there is
     more). 3 = 3-up grid; fewer than 3 = centered. The row never overflows. */
  var _workRows = {};
  var BW_GAP = 12;
  var BW_ROW_PAD_H = 24; /* horizontal padding of the carousel row (0.75rem × 2) */
  function workColCap() {
    var vw = window.innerWidth || document.documentElement.clientWidth || 1280;
    if (vw <= 720) return 1;
    if (vw <= 960) return 2;
    return 3;
  }
  function applyWorkCols(row, count) {
    var cols = Math.max(1, Math.min(count, workColCap()));
    row.style.setProperty("--work-cols", cols);
  }
  /* Visible tile count per breakpoint — 4 on desktop (the max comfortable),
     2 on tablet, 1 on mobile. Used both for the carousel tile/row sizing and
     to decide whether side controls are needed (any hidden tile => arrows). */
  function workVisibleCols() {
    var vw = window.innerWidth || document.documentElement.clientWidth || 1280;
    if (vw <= 720) return 1;
    if (vw <= 960) return 2;
    return 4;
  }
  /* Tile width + fixed row width for the 4-up carousel. The tile keeps the
     comfortable baseline size (3-up of the block ≈ 432px on desktop) and only
     shrinks when the viewport is narrower than the visible columns, so all
     visible columns always stay visible. rowW is the border-box width holding
     exactly `cols` tiles. */
  function workCarouselMetrics() {
    var vw = window.innerWidth || document.documentElement.clientWidth || 1280;
    var pad = vw <= 1329 ? Math.max(16, Math.min(32, vw * 0.03)) : 0;
    var avail = vw - 2 * pad - BW_ROW_PAD_H; /* row content-box available */
    var cols = workVisibleCols();
    var comfy;
    if (cols === 1) { comfy = avail; }
    else if (cols === 2) { comfy = (Math.min(1320, vw - 2 * pad) - BW_GAP) / 2; }
    else { comfy = (1320 - 2 * BW_GAP) / 3; } /* 3-up baseline, ~432 */
    var tile = Math.min(comfy, (avail - (cols - 1) * BW_GAP) / cols);
    tile = Math.max(150, tile);
    var rowW = cols * tile + (cols - 1) * BW_GAP + BW_ROW_PAD_H; /* border-box */
    return { tile: tile, rowW: rowW };
  }
  function applyWorkTileWidth(row) {
    var m = workCarouselMetrics();
    /* Set on the carousel wrapper (the row's parent once wrapped) so both the
       row (tiles + width) and the side controls (which read --work-row-w to
       sit at the block edge) inherit the values. */
    var host = (row.parentElement && row.parentElement.classList.contains("best-works__work-carousel")) ? row.parentElement : row;
    host.style.setProperty("--work-tile-w", m.tile + "px");
    host.style.setProperty("--work-row-w", m.rowW + "px");
  }
  function layoutWorkRow(row, count, kind) {
    _workRows[kind] = { row: row, count: count };
    var carClass = "best-works__row--" + kind + "--carousel";
    var ctrClass = "best-works__row--" + kind + "--center";
    row.classList.remove(carClass);
    row.classList.remove(ctrClass);
    if (count >= 4) {
      row.classList.add(carClass);
      row.style.removeProperty("--work-cols");
      /* Wrap first so applyWorkTileWidth can set the CSS vars on the wrapper
         (the side controls inherit --work-row-w from it). */
      ensureWorkCarousel(row, kind, count > workVisibleCols());
      applyWorkTileWidth(row);
    } else {
      removeWorkCarousel(row);
      if (count < 3) {
        row.classList.add(ctrClass);
        row.style.removeProperty("--work-cols");
      } else {
        applyWorkCols(row, count);
      }
    }
  }
  function ensureWorkCarousel(row, kind, withArrows) {
    var parent = row.parentElement;
    var wrapClass = "best-works__" + kind + "-carousel";
    var existing = parent && parent.classList.contains("best-works__work-carousel") ? parent : null;
    if (existing) {
      var hadArrows = existing.getAttribute("data-arrows") === "1";
      if (hadArrows && !withArrows) {
        var olds = existing.querySelectorAll(".best-works__carousel-arrow");
        Array.prototype.forEach.call(olds, function (a) { a.remove(); });
        existing.setAttribute("data-arrows", "0");
      } else if (!hadArrows && withArrows) {
        addArrows(existing, row, kind);
        existing.setAttribute("data-arrows", "1");
      }
      return;
    }
    var wrap = h("div", { class: "best-works__work-carousel " + wrapClass });
    wrap.setAttribute("data-arrows", withArrows ? "1" : "0");
    parent.insertBefore(wrap, row);
    wrap.appendChild(row);
    if (withArrows) addArrows(wrap, row, kind);
  }
  function addArrows(wrap, row, kind) {
    var chevL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var chevR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var prev = h("button", { type: "button", class: "best-works__carousel-arrow best-works__carousel-arrow--prev", "aria-label": "Previous " + kind, html: chevL });
    var next = h("button", { type: "button", class: "best-works__carousel-arrow best-works__carousel-arrow--next", "aria-label": "Next " + kind, html: chevR });
    function scrollBy(dir) {
      var tile = row.querySelector(".home-portfolio-project");
      /* Fractional width so the step exactly matches the snap spacing; an
         integer offsetWidth would drift sub-pixel and trigger a re-snap. */
      var step = tile ? (tile.getBoundingClientRect().width + BW_GAP) : (row.clientWidth / 4);
      row.scrollBy({ left: dir * step, behavior: "smooth" });
    }
    prev.addEventListener("click", function () { if (!prev.disabled) scrollBy(-1); });
    next.addEventListener("click", function () { if (!next.disabled) scrollBy(1); });
    wrap.appendChild(prev);
    wrap.appendChild(next);
    ensureArrowState(row);
    (window.requestAnimationFrame || function (f) { setTimeout(f, 16); })(function () { updateArrowState(row); });
  }
  /* Keep the prev/next controls enabled only where there's somewhere to scroll.
     Attached once per row (the row persists while arrows may come and go). */
  function ensureArrowState(row) {
    if (row._bwArrowState) return;
    row._bwArrowState = true;
    row.addEventListener("scroll", function () { updateArrowState(row); });
  }
  function updateArrowState(row) {
    var wrap = row.parentElement;
    if (!wrap || !wrap.classList.contains("best-works__work-carousel")) return;
    var prev = wrap.querySelector(".best-works__carousel-arrow--prev");
    var next = wrap.querySelector(".best-works__carousel-arrow--next");
    if (!prev || !next) return;
    var max = row.scrollWidth - row.clientWidth;
    var x = row.scrollLeft;
    if (x <= 0) prev.setAttribute("disabled", ""); else prev.removeAttribute("disabled");
    if (x >= max - 1) next.setAttribute("disabled", ""); else next.removeAttribute("disabled");
  }
  function removeWorkCarousel(row) {
    var wrap = (row.parentElement && row.parentElement.classList.contains("best-works__work-carousel")) ? row.parentElement : null;
    if (!wrap) return;
    wrap.parentElement.insertBefore(row, wrap);
    wrap.remove(); /* vars lived on the wrapper, gone with it */
  }
  window.addEventListener("resize", function () {
    Object.keys(_workRows).forEach(function (kind) {
      var r = _workRows[kind];
      if (!r) return;
      if (r.count === 3) applyWorkCols(r.row, r.count);
      if (r.count >= 4) {
        applyWorkTileWidth(r.row);
        /* visible columns may have changed across a breakpoint, so re-evaluate
           whether the side controls are needed. */
        ensureWorkCarousel(r.row, kind, r.count > workVisibleCols());
        /* scrollWidth changed with the new tile size → refresh disabled state
           on a rAF so layout has settled. */
        (window.requestAnimationFrame || function (f) { setTimeout(f, 16); })(function () { updateArrowState(r.row); });
      }
    });
  });

  function buildVideoThumb(v, res) {
    var thumbSrc = v.thumb || ytThumb(v.id, res || "hqdefault");
    var btnClass = "video-thumb video-thumb--card";
    if (v.poster) btnClass += " video-thumb--poster";
    if (v.thumbClass) btnClass += " " + v.thumbClass;
    var btnAttrs = {
      type: "button",
      class: btnClass,
      "data-youtube-id": v.id,
      "data-lightbox-heading": v.title,
      "data-lightbox-sub": v.role,
      "data-lightbox-year": v.year,
      "aria-label": "Play " + v.title
    };
    if (v.ratio) btnAttrs["data-lightbox-ratio"] = v.ratio;
    var media = h("span", { class: "video-thumb__media" }, [
      h("img", { src: thumbSrc, alt: "", width: v.thumbW || 480, height: v.thumbH || 360, loading: "lazy", decoding: "async" })
    ]);
    var caption = h("span", { class: "video-thumb__caption" }, [
      h("span", { class: "video-thumb__title", text: v.title }),
      h("span", { class: "video-thumb__role", text: v.role })
    ]);
    return h("div", { class: "video-thumb-wrap" }, [h("button", btnAttrs, [media, caption])]);
  }

  function renderHomeVideos(videos, site) {
    var row = document.querySelector(".best-works__row--videos");
    var extraInner = document.querySelector(".best-works__videos-extra-inner");
    var visible = videos.filter(function (v) { return !v.hidden; });
    var primary = visible.filter(function (v) { return v.primary; });
    var extra = visible.filter(function (v) { return !v.primary; });
    if (primary.length === 0 && extra.length === 0) {
      primary = visible.slice(0, 5);
      extra = visible.slice(5);
    }
    if (row) {
      clear(row);
      primary.forEach(function (v) { row.appendChild(buildVideoThumb(v, "hqdefault")); });
    }
    if (extraInner) {
      clear(extraInner);
      extra.forEach(function (v) { extraInner.appendChild(buildVideoThumb(v, "hqdefault")); });
    }
  }

  function renderContact(site) {
    var c = site.contact;
    var lead = document.querySelector(".home-contact__lead");
    if (lead) lead.textContent = c.lead;
    var formTitle = document.querySelector(".home-contact__form-title");
    if (formTitle) formTitle.textContent = c.formTitle;
    var form = document.getElementById("home-connect-form");
    if (form) form.setAttribute("data-endpoint", c.formEndpoint);
    setField("connect-email", c.fields.email);
    setField("connect-name", c.fields.name);
    setField("connect-subject", c.fields.subject);
    setField("connect-message", c.fields.message);
    var submit = form ? form.querySelector('button[type="submit"]') : null;
    if (submit) submit.textContent = c.submitLabel;
  }

  function setField(id, cfg) {
    var input = document.getElementById(id);
    if (!input || !cfg) return;
    input.setAttribute("placeholder", cfg.placeholder || "");
    if (cfg.required) input.setAttribute("required", "");
    var label = document.querySelector('label[for="' + id + '"]');
    if (label) {
      clear(label);
      label.appendChild(document.createTextNode(cfg.label + " "));
      if (cfg.required) {
        label.appendChild(h("span", { class: "required-asterisk", "aria-hidden": "true", text: "*" }));
      }
    }
  }

  function renderResume(resume, site) {
    var panel = document.getElementById("home-tab-panel-resume");
    if (!panel) return;
    clear(panel);

    /* General */
    var general = h("section", { class: "resume-section reveal", id: "general" }, [
      h("h2", { class: "resume-section__heading", text: "General" }),
      infoGrid([
        ["First name", resume.general.firstName],
        ["Last name", resume.general.lastName],
        ["Location", resume.general.location],
        ["Phone", linkEl("tel:" + resume.general.phoneHref, resume.general.phone)],
        ["Email", linkEl("mailto:" + resume.general.email, resume.general.email)],
        ["LinkedIn", linkEl(resume.general.linkedinHref, resume.general.linkedinLabel, true)]
      ]),
      h("div", { class: "divider" }),
      h("div", { class: "info-grid info-grid--languages" }, languagesGrid(resume.languages))
    ]);
    panel.appendChild(general);

    /* Experience */
    var expList = h("div", { class: "experience-list" });
    resume.experience.forEach(function (job) { expList.appendChild(buildJobCard(job)); });
    panel.appendChild(h("section", { class: "resume-section reveal", id: "experience" }, [
      h("h2", { class: "resume-section__heading", text: "Experience" }),
      expList
    ]));

    /* Education (only items marked to show on the site) */
    var eduItems = (resume.education || []).filter(function (e) { return e.visibility === "site"; });
    if (eduItems.length) {
      var eduList = h("div", { class: "experience-list" });
      eduItems.forEach(function (e) {
        eduList.appendChild(h("article", { class: "job-card job-card--experience" }, [
          h("div", { class: "job-card__head" }, [
            h("h3", { class: "job-card__title", text: e.institution || "" }),
            e.period ? h("p", { class: "job-card__meta", text: e.period }) : null
          ]),
          e.degree ? h("p", { class: "job-card__role", text: e.degree }) : null
        ]));
      });
      panel.appendChild(h("section", { class: "resume-section reveal", id: "education" }, [
        h("h2", { class: "resume-section__heading", text: "Education" }),
        eduList
      ]));
    }

    /* Skills */
    var skillsWrap = h("div", { class: "spoiler-inner spoiler-inner--skills" });
    resume.skills.forEach(function (g, i) {
      skillsWrap.appendChild(h("section", { class: "skills-group " + (g.groupClass || ""), "aria-labelledby": "skills-" + g.id + "-heading" }, [
        h("h3", { class: "skills-heading " + (g.headingClass || ""), id: "skills-" + g.id + "-heading", text: g.heading }),
        h("ul", { class: "skill-list" }, g.items.map(function (it) { return h("li", { text: it }); }))
      ]));
      if (i === resume.skills.length - 1) skillsWrap.appendChild(h("div", { class: "divider", role: "presentation" }));
    });
    skillsWrap.appendChild(h("section", { class: "skills-group skills-group--notes", "aria-labelledby": "skills-courses-heading" }, [
      h("h3", { class: "skills-heading skills-heading--notes", id: "skills-courses-heading", text: "Certifications" }),
      resume.courses.map(function (c) {
        return h("p", { class: "course-line", html: "<strong>" + esc(c.title) + "</strong> — " + esc(c.provider) + ", " + esc(String(c.year)) });
      })
    ]));
    skillsWrap.appendChild(h("p", { class: "resume-pdf-download" }, [
      h("a", { class: "resume-pdf-download__link", href: site.resumePdf, download: "", type: "application/pdf", text: site.resumePdfLabel })
    ]));
    panel.appendChild(h("section", { class: "resume-section reveal", id: "skills" }, [
      h("h2", { class: "resume-section__heading", text: "Skills" }),
      skillsWrap
    ]));
  }

  function infoGrid(rows) {
    var grid = h("div", { class: "info-grid" });
    rows.forEach(function (r) {
      grid.appendChild(h("span", { class: "info-label", text: r[0] }));
      var val = r[1];
      if (val == null) {
        val = h("span", { class: "info-value" });
      } else if (typeof val === "string") {
        val = h("span", { class: "info-value", text: val });
      } else if (val.className !== "info-value") {
        var wrap = h("span", { class: "info-value" });
        wrap.appendChild(val);
        val = wrap;
      }
      grid.appendChild(val);
    });
    return grid;
  }

  function languagesGrid(languages) {
    var nodes = [];
    languages.forEach(function (lang, i) {
      nodes.push(h("span", { class: "info-label", text: i === 0 ? "Languages" : "" }));
      nodes.push(h("span", { class: "info-value", text: lang }));
    });
    return nodes;
  }

  function linkEl(href, text, external) {
    var attrs = { class: "info-value__link", href: href, text: text };
    if (external) { attrs.rel = "me noopener noreferrer"; attrs.target = "_blank"; }
    var a = h("a", attrs);
    var wrap = h("span", { class: "info-value" });
    wrap.appendChild(a);
    return wrap;
  }

  function buildJobCard(job) {
    var cls = "job-card";
    var tag = "article";
    var attrs = { class: cls };
    if (job.type === "project") { cls += " job-card--to-project"; tag = "a"; attrs = { class: cls, href: job.link, "aria-label": job.aria || (job.title + " — " + job.project) }; }
    else if (job.type === "studio") { cls += " job-card--studio"; attrs = { class: cls }; }
    else { cls += " job-card--experience"; attrs = { class: cls }; }
    var kids = [];
    kids.push(h("h3", { text: job.title }));
    if (job.project) kids.push(h("p", { class: "job-card__project" }, [
      h("span", { class: "job-card__project-label", text: "Project:" }),
      " " + job.project
    ]));
    kids.push(h("div", { class: "job-meta", text: job.meta }));
    kids.push(h("p", { text: job.description }));
    var hv = job.highlightsVisibility || "cv";
    if (job.highlights && job.highlights.length && (hv === "site" || hv === "both")) {
      kids.push(h("ul", { class: "job-card__highlights" },
        job.highlights.map(function (hl) { return h("li", { text: hl }); })
      ));
    }
    if (job.awards && job.awards.length) {
      var awards = h("div", { class: "job-card__awards", role: "group", "aria-label": "Awards and nominations" });
      job.awards.forEach(function (a) {
        var emblem = a.kind === "winner" ? "job-card__awards-emblem--winner" : "job-card__awards-emblem--nominee";
        var icon = a.kind === "winner" ? "🏆" : "🎬";
        awards.appendChild(h("p", { class: "job-card__awards-item" }, [
          h("span", { class: "job-card__awards-title", text: a.title }),
          h("span", { class: "job-card__awards-meta" }, [
            h("span", { class: "job-card__awards-year", text: String(a.year) }),
            h("span", { class: "job-card__awards-emblem " + emblem, "aria-hidden": "true", text: icon })
          ])
        ]));
      });
      kids.push(awards);
    }
    return h(tag, attrs, kids);
  }

  function renderStudio(studio) {
    var lead = document.querySelector(".home-tab-studio__lead");
    if (lead) lead.textContent = studio.lead;

    var carousel = document.querySelector(".studio-gallery .video-scroller__strip");
    if (carousel) {
      clear(carousel);
      studio.photos.forEach(function (p, i) {
        var tileClass = "studio-gallery__tile studio-gallery__tile--" + p.orientation;
        carousel.appendChild(h("button", {
          type: "button",
          class: tileClass,
          "data-studio-lightbox": "",
          "data-lightbox-hq": p.hq,
          "aria-label": "Open enlarged photo " + (i + 1)
        }, [
          h("img", { src: p.preview, alt: p.alt || "", width: p.w, height: p.h, loading: "lazy", decoding: "async" })
        ]));
      });
    }

    var gearGrid = document.querySelector(".studio-gear-grid");
    if (gearGrid) {
      clear(gearGrid);
      studio.gear.forEach(function (card) {
        var cls = "studio-gear-card";
        if (card.wide) cls += " studio-gear-card--wide";
        var art = h("article", { class: cls }, [h("h2", { class: "studio-gear-card__title", text: card.title })]);
        if (card.type === "deflist") {
          var dl = h("dl", { class: "studio-deflist" });
          card.items.forEach(function (it) {
            dl.appendChild(h("dt", { text: it.dt }));
            dl.appendChild(h("dd", { html: it.dd }));
          });
          art.appendChild(dl);
        } else {
          art.appendChild(h("p", { class: "studio-gear-card__text", html: card.text }));
        }
        gearGrid.appendChild(art);
      });
    }
  }

  /* ---------- recommendations (homepage, above footer) ---------- */
  function renderRecommendations(data) {
    var root = document.getElementById("home-recommendations");
    if (!root) return;

    var cfg = data || {};
    var items = (cfg.items || []).filter(function (it) { return it && !it.hidden; });
    if (cfg.hidden || !items.length) {
      root.hidden = true;
      root.setAttribute("aria-hidden", "true");
      return;
    }

    root.hidden = false;
    root.removeAttribute("aria-hidden");

    var offsetTop = (cfg.offsetTop && String(cfg.offsetTop).trim()) || "1.25rem";
    var offsetBottom = (cfg.offsetBottom != null && String(cfg.offsetBottom).trim() !== "")
      ? String(cfg.offsetBottom).trim()
      : "0";
    root.style.setProperty("--rec-offset-top", offsetTop);
    root.style.setProperty("--rec-offset-bottom", offsetBottom);
    document.body.classList.add("has-home-recommendations");

    var heading = root.querySelector(".home-recommendations__heading");
    if (heading) {
      if (cfg.hideHeading) {
        heading.hidden = true;
        heading.textContent = "";
      } else {
        heading.hidden = false;
        heading.textContent = cfg.heading || "Recommendations";
      }
    }

    var stage = root.querySelector(".home-recommendations__stage");
    var card = root.querySelector(".home-recommendations__card");
    var avatarWrap = root.querySelector(".home-recommendations__avatar-wrap");
    var avatarRing = root.querySelector(".home-recommendations__avatar-ring");
    var avatarCrop = root.querySelector(".home-recommendations__avatar-crop");
    var avatar = root.querySelector(".home-recommendations__avatar");
    var nameWrap = root.querySelector(".home-recommendations__name-wrap");
    var metaEl = root.querySelector(".home-recommendations__meta");
    var yearEl = root.querySelector(".home-recommendations__year");
    var quoteEl = root.querySelector(".home-recommendations__quote");
    var carousel = root.querySelector(".home-recommendations__carousel");
    if (!stage || !card || !avatarWrap || !avatar || !nameWrap || !metaEl || !yearEl || !quoteEl || !carousel) return;

    var quoteBody = quoteEl.querySelector(".home-recommendations__quote-body");
    var quoteContent = quoteEl.querySelector(".home-recommendations__quote-content");
    if (!quoteBody || !quoteContent) {
      clear(quoteEl);
      quoteContent = h("div", { class: "home-recommendations__quote-content" });
      quoteBody = h("div", { class: "home-recommendations__quote-body" });
      quoteBody.appendChild(quoteContent);
      quoteEl.appendChild(quoteBody);
    }

    var minSec = Number(cfg.autoplayMinSec);
    var maxSec = Number(cfg.autoplayMaxSec);
    if (!(minSec > 0)) minSec = 5;
    if (!(maxSec > 0)) maxSec = 10;
    if (maxSec < minSec) {
      var swap = minSec;
      minSec = maxSec;
      maxSec = swap;
    }

    var animMs = Number(cfg.animMs);
    if (!(animMs > 0)) animMs = 350;
    animMs = Math.max(120, Math.min(2000, animMs));
    carousel.style.setProperty("--rec-anim-ms", animMs + "ms");

    var quoteSize = (cfg.quoteFontSize && String(cfg.quoteFontSize).trim()) || "0.9rem";
    root.style.setProperty("--rec-quote-size", quoteSize);

    var previewChars = Number(cfg.quotePreviewChars);
    if (!(previewChars > 0) && Number(cfg.quotePreviewWords) > 0) {
      /* Migrate older word-based setting to a character budget. */
      previewChars = Number(cfg.quotePreviewWords);
    }
    if (!(previewChars > 0)) previewChars = 280;

    var quoteExpandMs = Number(cfg.quoteExpandMs);
    if (!(quoteExpandMs > 0)) quoteExpandMs = 320;
    quoteExpandMs = Math.max(80, Math.min(2000, quoteExpandMs));

    var quoteCollapseMs = Number(cfg.quoteCollapseMs);
    if (!(quoteCollapseMs > 0)) quoteCollapseMs = 520;
    quoteCollapseMs = Math.max(80, Math.min(3000, quoteCollapseMs));

    root.style.setProperty("--rec-quote-expand-ms", quoteExpandMs + "ms");
    root.style.setProperty("--rec-quote-collapse-ms", quoteCollapseMs + "ms");

    var index = Math.floor(Math.random() * items.length);
    var timer = null;
    var transitioning = false;
    var quoteAnimating = false;
    var quoteExpanded = false;
    var previewSlotH = 0;
    var arrowPreviewY = null;
    var reduceMotion = false;
    try {
      reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e0) {}

    function metaLine(it) {
      var parts = [];
      if (it.role) parts.push(it.role);
      if (it.company) parts.push(it.company);
      return parts.join(" · ");
    }

    function syncPanelHeight() {
      var panel = root.closest(".home-panel");
      if (!panel || panel.classList.contains("is-hidden")) return;
      panel.style.maxHeight = panel.scrollHeight + "px";
    }

    /* Center arrows on the quote; when expanded, keep the character-preview mid-line. */
    function syncArrowPosition() {
      if (!carousel || !quoteEl || quoteEl.hidden) {
        arrowPreviewY = null;
        if (carousel) carousel.style.removeProperty("--rec-arrow-y");
        return;
      }
      if (quoteExpanded && arrowPreviewY != null) {
        carousel.style.setProperty("--rec-arrow-y", arrowPreviewY + "px");
        return;
      }
      var cRect = carousel.getBoundingClientRect();
      var qRect = quoteEl.getBoundingClientRect();
      if (!qRect.height) return;
      var y = qRect.top - cRect.top + qRect.height / 2;
      arrowPreviewY = y;
      carousel.style.setProperty("--rec-arrow-y", y + "px");
    }

    function afterQuoteLayout() {
      syncPanelHeight();
      syncArrowPosition();
    }

    function quoteNeedsClamp(full) {
      return full.length > previewChars;
    }

    function quotePreviewText(full) {
      if (full.length <= previewChars) return full;
      var clipped = full.slice(0, previewChars);
      var next = full.charAt(previewChars);
      /* Drop a trailing word fragment only when the cut lands mid-word; keep spaces and newlines. */
      if (next && /\S/.test(next) && /\S$/.test(clipped)) {
        clipped = clipped.replace(/\S+$/, "");
      }
      return clipped + "…";
    }

    function previewSlotRawText() {
      var sentence = "The quick brown fox jumps over the lazy dog. ";
      var raw = "";
      var lineLen = 0;
      while (raw.length < previewChars + 48) {
        if (lineLen >= 88) {
          raw += "\n";
          lineLen = 0;
        }
        raw += sentence;
        lineLen += sentence.length;
      }
      return raw;
    }

    function fillQuoteContent(target, it, expanded, withHandlers) {
      clear(target);
      var full = String(it.quote || "").trim();
      if (!full) return false;

      var needsClamp = quoteNeedsClamp(full);
      if (expanded && needsClamp) {
        target.appendChild(document.createTextNode(full + " "));
        var less = h("button", {
          type: "button",
          class: "home-recommendations__more",
          text: "show less"
        });
        if (withHandlers) {
          less.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (quoteAnimating || transitioning) return;
            quoteExpanded = false;
            animateQuoteTo(it, false, scheduleAutoplay);
          });
        }
        target.appendChild(less);
        return true;
      }

      if (!needsClamp) {
        target.appendChild(document.createTextNode(full));
        return true;
      }

      target.appendChild(document.createTextNode(quotePreviewText(full) + " "));
      var more = h("button", {
        type: "button",
        class: "home-recommendations__more",
        text: "read more"
      });
      if (withHandlers) {
        more.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (quoteAnimating || transitioning) return;
          quoteExpanded = true;
          animateQuoteTo(it, true, clearTimer);
        });
      }
      target.appendChild(more);
      return true;
    }

    function buildQuoteContent(it, expanded) {
      return fillQuoteContent(quoteContent, it, expanded, true);
    }

    function quoteMeasureWidth() {
      var w = quoteBody.getBoundingClientRect().width;
      if (w > 8) return w;
      w = quoteEl.getBoundingClientRect().width;
      if (w > 8) return w;
      var stageW = stage.getBoundingClientRect().width;
      if (stageW > 8) return Math.min(stageW, 576);
      return Math.min(560, root.getBoundingClientRect().width || 560);
    }

    function measurePreviewSlotHeight(width) {
      var probe = h("blockquote", { class: "home-recommendations__quote" });
      probe.style.cssText =
        "position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;width:" +
        width +
        "px;margin:0;height:auto;min-height:0;max-height:none;overflow:visible";
      var probeBody = h("div", { class: "home-recommendations__quote-body" });
      probeBody.style.cssText = "height:auto;min-height:0;overflow:visible";
      var probeContent = h("div", { class: "home-recommendations__quote-content" });
      probeBody.appendChild(probeContent);
      probe.appendChild(probeBody);
      fillQuoteContent(probeContent, { quote: previewSlotRawText() }, false, false);
      quoteEl.appendChild(probe);
      var height = probeBody.offsetHeight;
      quoteEl.removeChild(probe);
      return height;
    }

    function syncPreviewSlotHeight() {
      var width = quoteMeasureWidth();
      previewSlotH = measurePreviewSlotHeight(width);
      root.style.setProperty("--rec-quote-slot-h", previewSlotH + "px");
    }

    function ensurePreviewSlotMeasured(done) {
      function attempt() {
        var width = quoteMeasureWidth();
        if (width <= 8) {
          window.requestAnimationFrame(attempt);
          return;
        }
        syncPreviewSlotHeight();
        if (done) done();
      }
      attempt();
    }

    function applyQuoteSlotLayout(expanded) {
      if (!previewSlotH && quoteMeasureWidth() > 8) syncPreviewSlotHeight();
      if (!previewSlotH) return;
      if (expanded) {
        quoteBody.style.height = "";
        quoteBody.style.minHeight = "";
        quoteBody.style.overflow = "";
      } else {
        quoteBody.style.height = previewSlotH + "px";
        quoteBody.style.minHeight = "";
        quoteBody.style.overflow = "hidden";
      }
    }

    function measureQuoteBodyHeight(it, expanded) {
      var width = quoteMeasureWidth();
      var probe = h("blockquote", { class: "home-recommendations__quote" });
      probe.style.cssText =
        "position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;width:" +
        width +
        "px;margin:0;height:auto;min-height:0;overflow:visible";
      var probeBody = h("div", { class: "home-recommendations__quote-body" });
      probeBody.style.cssText = "height:auto;min-height:0;overflow:visible";
      var probeContent = h("div", { class: "home-recommendations__quote-content" });
      probeBody.appendChild(probeContent);
      probe.appendChild(probeBody);
      quoteEl.appendChild(probe);
      fillQuoteContent(probeContent, it, expanded, false);
      var height = probeBody.offsetHeight;
      quoteEl.removeChild(probe);
      return height;
    }

    function resetQuoteMotionStyles() {
      quoteBody.style.height = "";
      quoteBody.style.overflow = "";
      quoteBody.style.transition = "";
      stage.style.minHeight = "";
      stage.style.transition = "";
    }

    function paintQuoteInstant(it, expanded) {
      resetQuoteMotionStyles();
      var full = String(it.quote || "").trim();
      if (!full) {
        quoteEl.hidden = true;
        clear(quoteContent);
        quoteBody.style.minHeight = "";
        quoteBody.style.height = "";
        afterQuoteLayout();
        return;
      }
      quoteEl.hidden = false;
      buildQuoteContent(it, expanded);
      applyQuoteSlotLayout(expanded);
      afterQuoteLayout();
    }

    function animateQuoteTo(it, expanded, onDone) {
      var full = String(it.quote || "").trim();
      if (!full || !quoteNeedsClamp(full) || reduceMotion) {
        paintQuoteInstant(it, expanded);
        afterQuoteLayout();
        if (onDone) onDone();
        return;
      }

      quoteAnimating = true;
      var done = false;

      function finish() {
        if (done) return;
        done = true;
        quoteBody.removeEventListener("transitionend", onEnd);
        resetQuoteMotionStyles();
        applyQuoteSlotLayout(expanded);
        quoteAnimating = false;
        afterQuoteLayout();
        if (onDone) onDone();
      }

      function onEnd(e) {
        if (e.target !== quoteBody || e.propertyName !== "height") return;
        finish();
      }

      ensurePreviewSlotMeasured(function () {
        var startBodyH = quoteBody.offsetHeight;
        var startStageH = stage.offsetHeight;
        var ms = expanded ? quoteExpandMs : quoteCollapseMs;
        var easing = "cubic-bezier(0.22, 1, 0.36, 1)";

        quoteBody.style.height = startBodyH + "px";
        quoteBody.style.overflow = "hidden";
        quoteBody.style.minHeight = "";
        stage.style.minHeight = startStageH + "px";

        buildQuoteContent(it, expanded);
        var endBodyH = expanded ? measureQuoteBodyHeight(it, true) : previewSlotH;
        var endStageH = startStageH + (endBodyH - startBodyH);

        window.requestAnimationFrame(function () {
          quoteBody.style.transition = "height " + ms + "ms " + easing;
          quoteBody.style.height = endBodyH + "px";
          stage.style.transition = "min-height " + ms + "ms " + easing;
          stage.style.minHeight = Math.max(endStageH, 0) + "px";
        });

        quoteBody.addEventListener("transitionend", onEnd);
        window.setTimeout(finish, ms + 80);
      });
    }

    function paintName(it) {
      clear(nameWrap);
      var label = it.name || "";
      var href = (it.nameHref && String(it.nameHref).trim()) || "";
      var linkable = !!it.nameLink && !!href;
      var nameEl = h("span", { class: "home-recommendations__name", text: label });
      if (linkable) {
        nameWrap.appendChild(h("a", {
          class: "home-recommendations__name-link",
          href: href,
          rel: "noopener noreferrer",
          target: "_blank"
        }, [nameEl]));
      } else {
        nameWrap.appendChild(nameEl);
      }
    }

    function paint(it) {
      quoteExpanded = false;
      arrowPreviewY = null;
      if (it.avatar) {
        avatarWrap.hidden = false;
        avatar.setAttribute("src", it.avatar);
        avatar.setAttribute("alt", it.name || "");
      } else {
        avatar.removeAttribute("src");
        avatarWrap.hidden = true;
        avatar.setAttribute("alt", "");
      }
      if (avatarCrop) avatarCrop.style.transform = "";
      paintName(it);
      metaEl.textContent = metaLine(it);
      metaEl.hidden = !metaEl.textContent;
      yearEl.textContent = it.year || "";
      yearEl.hidden = !yearEl.textContent;
      paintQuoteInstant(it, false);
    }

    function pickNext(dir) {
      if (items.length < 2) return index;
      if (dir === 1 || dir === -1) {
        return (index + dir + items.length) % items.length;
      }
      if (items.length === 2) return index === 0 ? 1 : 0;
      var next = index;
      while (next === index) next = Math.floor(Math.random() * items.length);
      return next;
    }

    function clearTimer() {
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
    }

    function scheduleAutoplay() {
      clearTimer();
      if (items.length < 2 || reduceMotion || quoteExpanded) return;
      var span = Math.max(0, maxSec - minSec);
      var delay = (minSec + Math.random() * span) * 1000;
      timer = window.setTimeout(function () {
        showAt(pickNext(0), 1);
      }, delay);
    }

    function runCarousel(nextIndex) {
      var nextItem = items[nextIndex];
      if (!nextItem) return;

      if (reduceMotion) {
        index = nextIndex;
        paint(nextItem);
        scheduleAutoplay();
        return;
      }

      transitioning = true;
      clearTimer();
      carousel.classList.add("is-animating");
      card.classList.remove("is-enter", "is-enter-from-left", "is-enter-active", "is-leave-left", "is-leave-right");
      card.classList.add("is-leave-left");

      window.setTimeout(function () {
        index = nextIndex;
        paint(nextItem);
        card.classList.remove("is-leave-left");
        card.classList.add("is-enter");
        void card.offsetWidth;
        card.classList.add("is-enter-active");
        window.setTimeout(function () {
          card.classList.remove("is-enter", "is-enter-from-left", "is-enter-active");
          carousel.classList.remove("is-animating");
          transitioning = false;
          syncPanelHeight();
          syncArrowPosition();
          scheduleAutoplay();
        }, animMs);
      }, animMs);
    }

    function showAt(nextIndex, dir) {
      if (transitioning || nextIndex === index) {
        scheduleAutoplay();
        return;
      }
      var nextItem = items[nextIndex];
      if (!nextItem) return;

      if (quoteExpanded) {
        quoteExpanded = false;
        animateQuoteTo(items[index], false, null);
        runCarousel(nextIndex);
        return;
      }

      runCarousel(nextIndex);
    }

    /* Arrows — same chevron style as project carousels; only when 2+ items. */
    var prev = carousel.querySelector(".home-recommendations__arrow--prev");
    var next = carousel.querySelector(".home-recommendations__arrow--next");
    var showArrows = items.length > 1;
    if (prev) {
      prev.hidden = !showArrows;
      prev.onclick = function () {
        if (!showArrows || transitioning) return;
        showAt(pickNext(-1), -1);
      };
    }
    if (next) {
      next.hidden = !showArrows;
      next.onclick = function () {
        if (!showArrows || transitioning) return;
        showAt(pickNext(1), 1);
      };
    }

    if (avatarWrap && avatarCrop && !reduceMotion) {
      var parallaxRaf = 0;
      var parallaxX = 0;
      var parallaxY = 0;

      function applyRecParallax() {
        parallaxRaf = 0;
        var rect = avatarWrap.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (parallaxX - cx) / (rect.width / 2);
        var dy = (parallaxY - cy) / (rect.height / 2);
        avatarCrop.style.transform =
          "perspective(800px) rotateY(" + dx * 8 + "deg) rotateX(" + -dy * 6 + "deg)";
      }

      avatarWrap.addEventListener(
        "mousemove",
        function (e) {
          parallaxX = e.clientX;
          parallaxY = e.clientY;
          if (parallaxRaf) return;
          parallaxRaf = window.requestAnimationFrame(applyRecParallax);
        },
        { passive: true }
      );

      avatarWrap.addEventListener(
        "mouseleave",
        function () {
          if (parallaxRaf) {
            window.cancelAnimationFrame(parallaxRaf);
            parallaxRaf = 0;
          }
          avatarCrop.style.transform = "";
        },
        { passive: true }
      );
    }

    ensurePreviewSlotMeasured(function () {
      paint(items[index]);
      scheduleAutoplay();
    });

    window.addEventListener("resize", function onRecResize() {
      syncPreviewSlotHeight();
      applyQuoteSlotLayout(quoteExpanded);
      syncArrowPosition();
    });

    document.addEventListener("visibilitychange", function onVis() {
      if (document.hidden) clearTimer();
      else scheduleAutoplay();
    });
  }

  function renderFooter(site) {
    var wrap = document.getElementById("home-footer-social");
    if (!wrap) return;
    var icons = wrap.querySelector(".home-social__icons");
    if (!icons) return;
    var mailBtn = document.getElementById("home-mail-btn");
    clear(icons);
    (site.social || []).forEach(function (s) {
      if (!s || !s.href) return;
      var isMail = s.type === "mail" || /^mailto:/i.test(s.href);
      icons.appendChild(h("a", {
        class: "home-social-btn home-social-btn--icon",
        href: s.href,
        rel: isMail ? "noopener" : "me noopener noreferrer",
        target: isMail ? null : "_blank",
        "aria-label": s.label || s.type || "Social link"
      }, [
        svg("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, [
          svg("path", { d: s.icon || "" })
        ])
      ]));
    });
    if (mailBtn) icons.appendChild(mailBtn);
    var copy = document.querySelector(".site-footer__copy");
    if (copy) copy.textContent = site.footer.copyright;
  }

  /* ---------- project detail rendering ---------- */
  function renderProject(data) {
    /* Strip the hash before block ids land in the DOM — otherwise the browser
       scrolls to #anchor natively when assignProjectBlockIds runs, then
       deeplink.js dockOnce scrolls again (the visible double attach). */
    if (location.hash) {
      if (!window.__vchPendingHash) window.__vchPendingHash = location.hash;
      history.replaceState(null, "", location.pathname + location.search);
    }
    var params = new URLSearchParams(location.search);
    var slug = params.get("slug");
    var project = null;
    if (slug) {
      project = data.projects.projects.filter(function (p) { return p.slug === slug && !p.hidden; })[0] || null;
    }
    if (!project) {
      document.title = "Project not found · VCHAudio";
      var main = document.querySelector("main");
      if (main) main.appendChild(h("section", { class: "resume-section reveal" }, [
        h("h1", { class: "resume-section__heading", text: "Project not found" }),
        h("p", { class: "project-about", text: "The project you are looking for does not exist. " }),
        h("p", {}, [h("a", { href: "index.html", text: "← Back to home" })])
      ]));
      revealSiteChrome();
      return;
    }

    document.title = project.title + " · VCHAudio";
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", project.title + " — " + project.description);

    var main = document.querySelector("main#project-main");
    if (!main) main = document.querySelector("main");
    clear(main);
    if (project.slug) main.classList.add("project-page--" + project.slug);

    var bannerAdded = false;
    (project.blocks || []).forEach(function (block) {
      var node = buildProjectBlock(block, project);
      if (!node) return;
      if (block.type === "banner" || block.type === "raw-banner") {
        main.parentNode.insertBefore(node, main);
        bannerAdded = true;
      } else {
        main.appendChild(node);
      }
    });

    if (!bannerAdded) {
      var banner = h("div", { class: "page-overview-banner" }, [
        h("img", { class: "page-overview-banner__img", src: project.banner, alt: "", width: 1024, height: 576, loading: "eager", decoding: "async", fetchpriority: "high" })
      ]);
      main.parentNode.insertBefore(banner, main);
    }

    assignProjectBlockIds(main);

    /* Start entrance in the same turn as DOM insert — first paint is already visible. */
    (function primeProjectEnter() {
      var reduceMotion = false;
      try {
        reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch (e0) {}
      if (reduceMotion) return;
      var bannerEl = document.querySelector(".page-overview-banner");
      if (bannerEl) bannerEl.classList.add("project-enter");
      main.querySelectorAll(".reveal").forEach(function (el, index) {
        el.classList.add("project-enter");
        el.style.animationDelay = (0.14 + index * 0.1) + "s";
      });
    })();
    revealSiteChrome();
    document.dispatchEvent(new CustomEvent("vch:project-rendered", { detail: { slug: project.slug } }));
  }

  /* ---------- deep-link anchor ids for project page blocks ----------
     Each top-level block in #project-main gets a stable id derived from its
     heading text, so the page can be deep-linked (#<slug>) and scroll-spy can
     update the URL hash as the user scrolls between blocks. */
  function slugifyBlock(text) {
    return String(text == null ? "" : text)
      .trim()
      .toLowerCase()
      .replace(/&[a-z0-9#]+;/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function assignProjectBlockIds(main) {
    var taken = {};
    var spoilers = [];
    [].slice.call(main.children).forEach(function (child) {
      if (child.id) return;
      if (child.querySelector("details.spoiler")) {
        /* Spoiler group: anchor each <details> individually by its summary
           label, not the wrapper. */
        [].slice.call(child.querySelectorAll("details.spoiler")).forEach(function (d) {
          if (d.id) { taken[d.id] = true; return; }
          spoilers.push(d);
        });
        return;
      }
      var headingEl = child.querySelector("h1, h2, h3");
      var slug = slugifyBlock(headingEl ? headingEl.textContent : "");
      if (!slug) return;
      var id = slug, n = 1;
      while (document.getElementById(id) || taken[id]) { n++; id = slug + "-" + n; }
      taken[id] = true;
      child.id = id;
    });
    spoilers.forEach(function (d) {
      var label = d.querySelector(".spoiler-summary-label");
      var slug = slugifyBlock(label ? label.textContent : "");
      if (!slug) return;
      var id = slug, n = 1;
      while (document.getElementById(id) || taken[id]) { n++; id = slug + "-" + n; }
      taken[id] = true;
      d.id = id;
    });
  }

  function buildProjectBlock(block, project) {
    switch (block.type) {
      case "banner":
        return h("div", { class: "page-overview-banner" }, [
          h("img", { class: "page-overview-banner__img", src: block.src, alt: "", width: block.w || 1024, height: block.h || 576, loading: "eager", decoding: "async", fetchpriority: "high" })
        ]);
      case "raw-banner":
        return h("div", { class: "page-overview-banner " + (block.class || ""), html: block.html || "" });
      case "hero":
        return buildHeroBlock(block);
      case "about":
        return h("section", { class: "resume-section reveal" }, [
          h("h2", { class: "resume-section__heading", text: block.heading }),
          h("p", { class: "project-about", html: block.html })
        ]);
      case "responsibilities":
        return buildResponsibilitiesBlock(block);
      case "video-single":
        return buildVideoSingleBlock(block);
      case "video-showreel":
        return buildShowreelBlock(block);
      case "video-grid":
        return buildVideoGridBlock(block);
      case "raw":
        return h("section", { class: "resume-section reveal", html: block.html });
      case "raw-flat": {
        var tpl = document.createElement("div");
        tpl.innerHTML = block.html || "";
        var frag = document.createDocumentFragment();
        while (tpl.firstChild) frag.appendChild(tpl.firstChild);
        return frag;
      }
      case "releases":
        return buildReleasesBlock(block);
      case "accordion":
        return buildAccordionBlock(block);
      default:
        return null;
    }
  }

  var SPOILER_CHEVRON_SVG = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

  function buildSpoilerSummary(label) {
    return h("summary", {}, [
      h("span", { class: "spoiler-summary-label", text: label }),
      h("span", { class: "spoiler-chevron", "aria-hidden": "true", html: SPOILER_CHEVRON_SVG })
    ]);
  }

  /* Releases / downloads block: one "Latest" version shown prominently, the rest
     nested under an "Older Versions" disclosure. Mirrors the static VM-Xctrl
     markup so the existing vm-xctrl-* styles apply unchanged. */
  function buildReleasesBlock(block) {
    var items = block.items || [];
    if (!items.length) return null;
    var latestIdx = 0;
    for (var i = 0; i < items.length; i++) {
      if (items[i].badge === "latest") { latestIdx = i; break; }
    }
    var latest = items[latestIdx];
    var older = items.filter(function (_, i) { return i !== latestIdx; });

    var releases = h("div", { class: "vm-xctrl-releases", role: "list" });
    releases.appendChild(buildReleaseArticle(latest));

    if (older.length) {
      var nested = h("div", { class: "vm-xctrl-releases vm-xctrl-releases--nested", role: "list" });
      older.forEach(function (it) { nested.appendChild(buildReleaseArticle(it)); });
      var olderDetails = h("details", { class: "vm-xctrl-older-versions" }, [
        h("summary", { text: "Older Versions" }),
        nested
      ]);
      releases.appendChild(olderDetails);
    }

    var inner = h("div", { class: "spoiler-inner" });
    if (block.lead) inner.appendChild(h("p", { class: "vm-xctrl-download-lead", html: block.lead }));
    inner.appendChild(releases);

    var details = h("details", { class: "spoiler reveal", open: block.open ? "" : null }, [
      buildSpoilerSummary(block.heading || "Download"),
      h("div", { class: "spoiler-body" }, [inner])
    ]);
    return h("div", { class: "project-page-spoilers " + (block.wrapClass || "") }, [details]);
  }

  function buildReleaseArticle(it) {
    var heading = h("h3", { class: "vm-xctrl-release__heading" }, [
      h("a", { href: it.href || "#", download: "", text: it.version || "Version" })
    ]);
    if (it.badge === "latest") {
      heading.appendChild(h("span", { class: "vm-xctrl-release__badge vm-xctrl-release__badge--latest", text: "Latest" }));
    } else if (it.badge === "prerelease") {
      heading.appendChild(h("span", { class: "vm-xctrl-release__badge vm-xctrl-release__badge--prerelease", text: "Pre-release" }));
    }
    var article = h("article", { class: "vm-xctrl-release", role: "listitem" }, [heading]);
    if (it.date) article.appendChild(h("p", { class: "vm-xctrl-release__meta", text: it.date }));
    var changes = it.changes || [];
    if (changes.length) {
      var ul = h("ul", { class: "detail-list" });
      changes.forEach(function (c) { ul.appendChild(h("li", { html: c || "" })); });
      article.appendChild(ul);
    }
    return article;
  }

  /* Accordion block: a set of collapsible <details> sections, each holding a
     list (ul/ol) of { strong, text } items. Mirrors the static VM-Xctrl
     Features / Requirements / Getting started markup. */
  function buildAccordionBlock(block) {
    var sections = block.items || [];
    if (!sections.length) return null;
    var wrap = h("div", { class: "project-page-spoilers " + (block.wrapClass || "") });
    sections.forEach(function (sec) {
      var inner = h("div", { class: "spoiler-inner" });
      var items = sec.items || [];
      if (items.length) {
        var tag = sec.ordered ? "ol" : "ul";
        var list = h(tag, { class: "detail-list" });
        items.forEach(function (it) {
          if (typeof it === "string") { list.appendChild(h("li", { html: it })); return; }
          var li = h("li");
          /* strong and text are both HTML-allowed so inline markup (e.g.
             <strong> mid-sentence in a numbered list) survives editing. */
          li.innerHTML = (it.strong ? "<strong>" + it.strong + "</strong>" : "") + (it.text || "");
          list.appendChild(li);
        });
        inner.appendChild(list);
      }
      var details = h("details", { class: "spoiler reveal" });
      if (sec.open) details.setAttribute("open", "");
      details.appendChild(buildSpoilerSummary(sec.label || "Section"));
      details.appendChild(h("div", { class: "spoiler-body" }, [inner]));
      wrap.appendChild(details);
    });
    return wrap;
  }

  function buildHeroBlock(block) {
    var stack = h("div", { class: "page-hero-title-stack" }, [
      h("h1", { text: block.title })
    ]);
    if (block.platform) {
      if (Array.isArray(block.platform)) {
        var values = h("span", { class: "page-hero-platform__values" });
        block.platform.forEach(function (p, i) {
          values.appendChild(h("span", { text: p }));
          if (i < block.platform.length - 1) values.appendChild(h("span", { class: "page-hero-platform__sep", "aria-hidden": "true", text: "·" }));
        });
        stack.appendChild(h("p", { class: "page-hero-platform" }, [
          h("span", { class: "page-hero-platform__label", text: "Platform" }), values
        ]));
      } else {
        stack.appendChild(h("p", { class: "page-hero-platform" }, [
          h("span", { class: "page-hero-platform__label", text: "Platform" }),
          h("span", { text: " " + block.platform })
        ]));
      }
    }
    if (block.companyHtml) {
      stack.appendChild(h("p", { class: "page-hero-company", html: block.companyHtml }));
    } else if (block.company) {
      if (block.companyHref) {
        stack.appendChild(h("p", { class: "page-hero-company" }, [
          h("a", { href: block.companyHref, rel: "noopener noreferrer", target: "_blank", text: block.company })
        ]));
      } else {
        stack.appendChild(h("p", { class: "page-hero-company", text: block.company }));
      }
    }
    var hero = h("div", { class: "page-hero reveal" }, [stack]);
    if (block.lead) hero.appendChild(h("p", { class: "lead", text: block.lead }));
    if (block.steam && block.steam.href) {
      hero.appendChild(h("div", { class: "project-page__steam" }, [
        h("a", { class: "project-steam-btn", href: block.steam.href, rel: "noopener noreferrer", target: "_blank", text: block.steam.label || "View on Steam" })
      ]));
    }
    return hero;
  }

  function buildResponsibilitiesBlock(block) {
    var inner = h("div", { class: "spoiler-inner" });
    var ul = h("ul", { class: "detail-list" });
    block.items.forEach(function (it) {
      var li = h("li", {});
      if (it.strong) li.appendChild(h("strong", { html: it.strong }));
      if (it.text) li.appendChild(document.createTextNode(" " + it.text));
      ul.appendChild(li);
    });
    inner.appendChild(ul);
    var details = h("details", { class: "spoiler reveal", open: "" }, [
      h("summary", {}, [
        h("span", { class: "spoiler-summary-label", text: block.heading }),
        h("span", { class: "spoiler-chevron", "aria-hidden": "true" }, [
          svg("svg", { viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true" }, [
            svg("path", { d: "M6 9l6 6 6-6", "stroke-linecap": "round", "stroke-linejoin": "round" })
          ])
        ])
      ]),
      h("div", { class: "spoiler-body" }, [inner])
    ]);
    return h("div", { class: "project-page-spoilers" }, [details]);
  }

  function projectVideoButton(v, res) {
    var useCustom = v.poster && v.thumb;
    var thumbSrc = useCustom ? v.thumb : ytThumb(v.id, res || "maxresdefault");
    var btnClass = "video-thumb";
    if (useCustom) btnClass += " video-thumb--poster";
    if (v.thumbClass) btnClass += " " + v.thumbClass;
    var attrs = { type: "button", class: btnClass, "data-youtube-id": v.id, "aria-label": "Play " + (v.heading || v.captionTitle || "") };
    if (v.heading) attrs["data-lightbox-heading"] = v.heading;
    if (v.sub) attrs["data-lightbox-sub"] = v.sub;
    if (v.ratio) attrs["data-lightbox-ratio"] = v.ratio;
    return h("button", attrs, [
      h("img", { src: thumbSrc, alt: "", width: v.thumbW || 1280, height: v.thumbH || 720, loading: "lazy", decoding: "async" })
    ]);
  }

  function buildVideoSingleBlock(block) {
    var wrap = h("div", { class: "project-portfolio-block project-portfolio-block--presentation" });
    if (block.intro) wrap.appendChild(h("p", { class: "project-about", html: block.intro }));
    wrap.appendChild(h("div", { class: "ratio-embed" }, [projectVideoButton(block.video, "maxresdefault")]));
    if (block.captionHtml) {
      wrap.appendChild(h("p", { class: "video-thumb-caption video-thumb-caption--presentation-title", html: block.captionHtml }));
    } else if (block.captionTitle) {
      wrap.appendChild(h("p", { class: "video-thumb-caption video-thumb-caption--presentation-title", html: "<strong>" + esc(block.captionTitle) + "</strong>" }));
    }
    return h("section", { class: "resume-section reveal" }, [
      h("h2", { class: "resume-section__heading", text: block.heading }),
      wrap
    ]);
  }

  function buildShowreelBlock(block) {
    var feature = h("div", { class: "project-showreel-feature" });
    block.videos.forEach(function (v) {
      var w = h("div", { class: "video-thumb-wrap" }, [
        projectVideoButton(v, "maxresdefault"),
        h("p", { class: "video-thumb-caption", html: "<strong>" + esc(v.captionTitle || v.heading) + "</strong>" + esc(v.captionSub || v.sub || "") })
      ]);
      feature.appendChild(w);
    });
    return h("section", { class: "resume-section reveal" }, [
      h("h2", { class: "resume-section__heading", text: block.heading }),
      h("div", { class: "project-portfolio-block project-portfolio-block--showreel" }, [feature])
    ]);
  }

  function buildVideoGridBlock(block) {
    var scrollerAttrs = { class: "video-scroller", "data-video-scroller": "", "data-video-scroller-rows": String(block.rows || 2), "aria-label": block.heading + " videos" };
    if (block.noNav) { scrollerAttrs.class += " video-scroller--no-nav"; scrollerAttrs["data-video-scroller-no-nav"] = ""; }
    var strip = h("div", { class: "video-scroller__strip video-scroller__strip--grid-2" });
    block.videos.forEach(function (v) {
      strip.appendChild(h("div", { class: "video-thumb-wrap" }, [
        projectVideoButton(v, "maxresdefault"),
        h("p", { class: "video-thumb-caption", html: "<strong>" + esc(v.captionTitle || v.heading) + "</strong>" + esc(v.captionSub || v.sub || "") })
      ]));
    });
    var scroller = h("div", scrollerAttrs, [
      h("button", { type: "button", class: "video-scroller__btn video-scroller__btn--prev", "aria-label": "Scroll videos left" }, [h("span", { "aria-hidden": "true", text: "‹" })]),
      h("div", { class: "video-scroller__viewport" }, [strip]),
      h("button", { type: "button", class: "video-scroller__btn video-scroller__btn--next", "aria-label": "Scroll videos right" }, [h("span", { "aria-hidden": "true", text: "›" })])
    ]);
    var section = h("section", { class: "resume-section reveal" }, [
      h("h2", { class: "resume-section__heading", text: block.heading })
    ]);
    if (block.intro) section.appendChild(h("p", { class: "project-about project-about--gameplay-intro", html: block.intro }));
    if (block.date) section.appendChild(h("p", { class: "project-section__date", text: block.date }));
    section.appendChild(h("div", { class: "project-portfolio-block" }, [scroller]));
    return section;
  }

  /* ---------- escape helper for HTML-assembled strings ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* ---------- page bootstrap ---------- */
  function pageType() {
    var p = location.pathname.split("/").pop().toLowerCase();
    if (!p || p === "" || p === "index.html") return "home";
    if (p === "project.html") return "project";
    return p;
  }

  function readPreviewData() {
    /* One-shot preview data set by the admin panel (admin/admin.js). */
    if (location.search.indexOf("preview=1") < 0) return null;
    try {
      var raw = localStorage.getItem("vchPreview");
      if (!raw) return null;
      localStorage.removeItem("vchPreview");
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function boot() {
    var preview = readPreviewData();
    var work = preview
      ? Promise.resolve(preview)
      : fetchData();
    work
      .then(function (data) {
        window.__VCH_DATA__ = data;
        var type = pageType();
        if (type === "project") {
          renderProject(data);
          return loadScript("js/main.js?v=20260714l").then(function () { return loadScript("js/audio-player.js"); });
        }
        if (type === "home") {
          renderHome(data);
          return loadScript("js/main.js?v=20260714l").then(function () { return loadScript("js/home.js?v=20260714c"); });
        }
      })
      .catch(function (err) {
        fail("Site content could not be loaded: " + (err && err.message ? err.message : err));
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
