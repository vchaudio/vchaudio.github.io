(function () {
  "use strict";

  /* ============================== config & storage ============================== */
  var STORAGE_KEY = "vchAdminConfig";
  var SESSION_KEY = "vchAdminSession";
  var PREVIEW_KEY = "vchPreview";

  var COLLECTIONS = [
    { id: "site", label: "Site & Home", file: "data/site.json" },
    { id: "projects", label: "Projects", file: "data/projects.json" },
    { id: "videos", label: "Videos", file: "data/videos.json" },
    { id: "resume", label: "Resume", file: "data/resume.json" },
    { id: "studio", label: "Studio", file: "data/studio.json" },
    { id: "recommendations", label: "Recommendations", file: "data/recommendations.json" }
  ];

  /* Preset social icons (24x24 viewBox, single fill path — matches the site style). */
  var SOCIAL_ICONS = [
    { type: "linkedin", label: "LinkedIn", icon: "M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.65 1.65 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.77v1.21h.04a3.11 3.11 0 012.7-1.48c1.78 0 3.16 1.16 3.16 3.61z" },
    { type: "telegram", label: "Telegram", icon: "M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" },
    { type: "facebook", label: "Facebook", icon: "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" },
    { type: "instagram", label: "Instagram", icon: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.12 1.38C1.35 2.67.94 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.12.66.66 1.34 1.07 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.86 5.86 0 002.12-1.38c.66-.66 1.07-1.34 1.38-2.12.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.86 5.86 0 00-1.38-2.12A5.86 5.86 0 0019.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1018.16 12 6.16 6.16 0 0012 5.84zm0 10.16A4 4 0 1116 12a4 4 0 01-4 4zm6.41-11.85a1.44 1.44 0 11-1.44-1.44 1.44 1.44 0 011.44 1.44z" },
    { type: "youtube", label: "YouTube", icon: "M23.5 6.2a3 3 0 00-2.12-2.12C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.53A3 3 0 00.5 6.2 31.3 31.3 0 000 12a31.3 31.3 0 00.5 5.8 3 3 0 002.12 2.12c1.88.53 9.38.53 9.38.53s7.5 0 9.38-.53a3 3 0 002.12-2.12A31.3 31.3 0 0024 12a31.3 31.3 0 00-.5-5.8zM9.6 15.6V8.4l6.2 3.6z" },
    { type: "twitter", label: "X / Twitter", icon: "M18.9 1.5h3.7l-8 9.1L24 22.5h-7.4l-5.8-7.6-6.6 7.6H.5l8.5-9.7L0 1.5h7.6l5.2 6.9zM17.7 20.3h2L6.4 3.6H4.3z" },
    { type: "soundcloud", label: "SoundCloud", icon: "M1.6 14.3v3.4c0 .2.1.3.3.3s.3-.1.3-.3v-3.4c0-.2-.1-.3-.3-.3s-.3.1-.3.3zm1.8-1.6v5c0 .2.1.3.3.3s.3-.1.3-.3v-5c0-.2-.1-.3-.3-.3s-.3.1-.3.3zm1.8-1.4v6.4c0 .2.1.3.3.3s.3-.1.3-.3v-6.4c0-.2-.1-.3-.3-.3s-.3.1-.3.3zm1.8-.7v7.1c0 .2.1.3.3.3s.3-.1.3-.3v-7.1c0-.2-.1-.3-.3-.3s-.3.1-.3.3zm1.8-.5v7.6c0 .2.1.3.3.3s.3-.1.3-.3v-7.6c0-.2-.1-.3-.3-.3s-.3.1-.3.3zm1.8-1.3v8.9c0 .2.1.3.3.3s.3-.1.3-.3v-8.9c0-.2-.1-.3-.3-.3s-.3.1-.3.3zm1.8-1.5v10.4c0 .2.1.3.3.3s.3-.1.3-.3V8.3c0-.2-.1-.3-.3-.3s-.3.1-.3.3zm1.8-.6v11c0 .2.1.3.3.3s.3-.1.3-.3v-11c0-.2-.1-.3-.3-.3s-.3.1-.3.3zm11.4 4.2c-.4 0-.8.1-1.1.3-.3-2.3-2.2-4.1-4.6-4.1-.6 0-1.1.1-1.6.3-.2.1-.2.1-.2.3v10.2c0 .2.1.3.3.3h7.1c1.6 0 2.9-1.3 2.9-2.9s-1.3-2.9-2.9-2.9z" },
    { type: "mail", label: "Mail", icon: "M2 4h20a2 2 0 012 2v12a2 2 0 01-2 2H2a2 2 0 01-2-2V6a2 2 0 012-2zm0 2v.4l10 6 10-6V6H2zm20 12V8.2l-10 6-10-6V18h20z" },
    { type: "link", label: "Custom link (own icon below)", icon: "" }
  ];
  function socialIconByType(type) {
    for (var i = 0; i < SOCIAL_ICONS.length; i++) if (SOCIAL_ICONS[i].type === type) return SOCIAL_ICONS[i];
    return null;
  }

  var state = {
    config: null,
    authenticated: false,
    files: {},      // { id: { obj, sha } }
    dirty: {},      // { id: true }
    current: "site",
    selected: null,  // index within an array collection
    _navBuilt: false
  };

  /* ============================== DOM helpers ============================== */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "html") node.innerHTML = v;
      else node.setAttribute(k, v === true ? "" : v);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function $(id) { return document.getElementById(id); }

  /* ============================== toast ============================== */
  var toastTimer = null;
  function toast(message, kind) {
    var t = $("admin-toast");
    t.textContent = message;
    t.setAttribute("data-kind", kind || "");
    t.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* ============================== GitHub API ============================== */
  function api(path, method, body) {
    var c = state.config;
    var url = "https://api.github.com" + path;
    var opts = {
      method: method || "GET",
      headers: {
        "Authorization": "Bearer " + c.token,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    };
    if (body !== undefined) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    return fetch(url, opts).then(function (r) {
      if (r.status === 404) return { __status: 404, ok: false };
      if (!r.ok) return r.json().then(function (j) { var e = new Error((j && j.message) || "GitHub API error " + r.status); e.status = r.status; e.payload = j; throw e; }, function () { var e2 = new Error("GitHub API error " + r.status); e2.status = r.status; throw e2; });
      if (r.status === 204) return { __status: 204, ok: true };
      return r.json().then(function (j) { j.__status = r.status; j.ok = true; return j; });
    });
  }

  function b64Encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function b64Decode(b64) {
    return decodeURIComponent(escape(atob(b64)));
  }

  function getContents(path) {
    var c = state.config;
    return api("/repos/" + c.owner + "/" + c.repo + "/contents/" + path + "?ref=" + encodeURIComponent(c.branch))
      .then(function (res) {
        if (!res.ok && res.__status === 404) return { content: null, sha: null, missing: true };
        if (res.content) {
          var raw = res.content.replace(/\n/g, "");
          var decoded = null, binary = false;
          try { decoded = b64Decode(raw); }
          catch (e) { binary = true; /* binary file (e.g. PDF) — keep sha, skip text decode */ }
          return { content: decoded, sha: res.sha, missing: false, binary: binary };
        }
        return { content: null, sha: null, missing: true };
      });
  }

  function putContents(path, contentStr, sha, message) {
    var c = state.config;
    return api("/repos/" + c.owner + "/" + c.repo + "/contents/" + path, "PUT", {
      message: message || ("admin: update " + path),
      content: b64Encode(contentStr),
      sha: sha || undefined,
      branch: c.branch
    });
  }

  /* Like putContents, but takes a raw base64 string (for binary files such as a
     PDF), so it isn't run through the text-only b64Encode() round-trip. */
  function putContentsB64(path, b64, sha, message) {
    var c = state.config;
    return api("/repos/" + c.owner + "/" + c.repo + "/contents/" + path, "PUT", {
      message: message || ("admin: update " + path),
      content: b64,
      sha: sha || undefined,
      branch: c.branch
    });
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () {
        var dataUrl = fr.result;
        var comma = dataUrl.indexOf(",");
        resolve(dataUrl.slice(comma + 1));
      };
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () {
        var dataUrl = fr.result;
        var comma = dataUrl.indexOf(",");
        resolve(dataUrl.slice(comma + 1));
      };
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }

  function uploadAsset(file, onProgress) {
    var c = state.config;
    var safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, "-");
    var path = "assets/" + safeName;
    return getContents(path).then(function (existing) {
      return fileToBase64(file).then(function (b64) {
        if (onProgress) onProgress("Uploading " + safeName + "…");
        return api("/repos/" + c.owner + "/" + c.repo + "/contents/" + path, "PUT", {
          message: "admin: upload asset " + safeName,
          content: b64,
          sha: existing.missing ? undefined : existing.sha,
          branch: c.branch
        }).then(function () {
          return path;
        });
      });
    });
  }

  /* ============================== auth ============================== */
  function loadConfig() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }
  function saveConfig(cfg, remember) {
    try {
      if (remember) localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      else sessionStorage.setItem(SESSION_KEY, JSON.stringify(cfg));
    } catch (e) {}
  }
  function clearConfig() {
    try { localStorage.removeItem(STORAGE_KEY); sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  /* The repository is fixed for this site — derive owner/repo/branch from
     the hostname (vchaudio.github.io → owner vchaudio, repo vchaudio.github.io),
     falling back to the known values for local dev. */
  function detectRepo() {
    var host = (window.location.hostname || "").toLowerCase();
    var m = host.match(/^([a-z0-9-]+)\.github\.io$/);
    if (m) return { owner: m[1], repo: host, branch: "main" };
    return { owner: "vchaudio", repo: "vchaudio.github.io", branch: "main" };
  }

  function loginSubmit(e) {
    e.preventDefault();
    var status = $("admin-login-status");
    var btn = $("admin-login-submit");
    var cfg = detectRepo();
    cfg.token = $("login-token").value.trim();
    status.textContent = "Checking access…";
    status.setAttribute("data-kind", "");
    btn.disabled = true;
    state.config = cfg;
    api("/repos/" + cfg.owner + "/" + cfg.repo)
      .then(function (info) {
        if (!info || !info.ok) throw new Error("Repository not found or token lacks read access.");
        saveConfig(cfg, true);
        if (isLoginPage()) {
          /* Dedicated login page: go to the app, which restores the session. */
          window.location.href = "index.html";
        } else {
          var hasData = Object.keys(state.files).length > 0;
          (hasData ? fetchShasOnly() : loadAll()).then(function () { enterApp(true); });
        }
      })
      .catch(function (err) {
        status.textContent = err.message || "Sign in failed.";
        status.setAttribute("data-kind", "error");
        state.config = null;
      })
      .finally(function () { btn.disabled = false; });
  }

  function isLoginPage() {
    return document.body.classList.contains("admin-body--login");
  }

  function goLogin() {
    window.location.href = "login.html";
  }

  function startApp(repoInfo) {
    /* Used after a classic login when no local data was available. */
    loadAll().then(function () {
      enterApp(true);
    }).catch(function (err) {
      toast("Load failed: " + (err.message || err), "error");
      enterApp(true);
    });
  }

  function enterApp(authenticated) {
    state.authenticated = !!authenticated;
    var login = $("admin-login"); if (login) login.hidden = true;
    var app = $("admin-app"); if (app) app.hidden = false;
    var previewBtn = $("admin-preview-btn"); if (previewBtn) previewBtn.hidden = false;
    var signinBtn = $("admin-signin-btn"); if (signinBtn) signinBtn.hidden = state.authenticated;
    var logoutBtn = $("admin-logout-btn"); if (logoutBtn) logoutBtn.hidden = !state.authenticated;
    var label = $("admin-repo-label");
    if (label) {
      if (state.authenticated && state.config) {
        label.textContent = state.config.owner + "/" + state.config.branch;
      } else {
        label.textContent = "Local data — sign in to save";
      }
      label.hidden = false;
    }
    if (!state._navBuilt) {
      buildCollectionNav();
      state._navBuilt = true;
    }
    openCollection(state.current);
  }

  function showLogin() {
    /* Login lives on its own page now; navigate there (loaded data is preserved
       on the app page via the saved session restore). */
    goLogin();
  }

  function loadAll() {
    var tasks = COLLECTIONS.map(function (col) {
      return getContents(col.file).then(function (r) {
        var obj = r.missing ? {} : JSON.parse(r.content || "{}");
        state.files[col.id] = { obj: obj, sha: r.sha };
      });
    });
    return Promise.all(tasks);
  }

  /* Load the deployed/local data files directly (no auth needed) so the admin
     shows the current site content immediately. shas are fetched later on login. */
  function loadLocalData() {
    var tasks = COLLECTIONS.map(function (col) {
      return fetch("../" + col.file, { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw new Error("Cannot load " + col.file + " (" + r.status + ")");
        return r.json();
      }).then(function (obj) {
        state.files[col.id] = { obj: obj, sha: null };
      });
    });
    return Promise.all(tasks);
  }

  /* After auth, fetch shas for already-loaded files without overwriting edits. */
  function fetchShasOnly() {
    var tasks = COLLECTIONS.map(function (col) {
      if (!state.files[col.id]) state.files[col.id] = { obj: {}, sha: null };
      return getContents(col.file).then(function (r) {
        state.files[col.id].sha = r.sha;
      });
    });
    return Promise.all(tasks);
  }

  function logout() {
    clearConfig();
    state.config = null;
    state.authenticated = false;
    state.dirty = {};
    /* The panel requires authorization — after logout, go back to login. */
    goLogin();
  }

  /* ============================== collection nav ============================== */
  function buildCollectionNav() {
    var nav = $("admin-collections");
    clear(nav);
    COLLECTIONS.forEach(function (col) {
      var btn = el("button", { type: "button", class: "admin-collection-btn" + (col.id === state.current ? " is-active" : ""), "data-col": col.id, text: col.label });
      btn.addEventListener("click", function () { openCollection(col.id); });
      nav.appendChild(btn);
    });
    refreshDirtyDots();
  }

  function refreshDirtyDots() {
    COLLECTIONS.forEach(function (col) {
      var btn = $("admin-collections").querySelector('[data-col="' + col.id + '"]');
      if (!btn) return;
      var dot = btn.querySelector(".admin-collection-btn__dirty");
      if (state.dirty[col.id]) {
        if (!dot) btn.appendChild(el("span", { class: "admin-collection-btn__dirty", "aria-hidden": "true" }));
      } else if (dot) dot.remove();
    });
  }

  function openCollection(id) {
    state.current = id;
    state.selected = null;
    state.selectedObj = null;
    state._socSel = null;
    state._blockSel = null;
    $("admin-collections").querySelectorAll(".admin-collection-btn").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-col") === id);
    });
    renderEditor();
  }

  function markDirty(id) { state.dirty[id] = true; refreshDirtyDots(); }
  function getCol() { return COLLECTIONS.filter(function (c) { return c.id === state.current; })[0]; }
  function getFile() { return state.files[state.current]; }

  /* ============================== editor dispatch ============================== */
  function renderEditor() {
    var root = $("admin-editor");
    clear(root);
    var id = state.current;
    if (id === "site") renderSiteEditor(root);
    else if (id === "projects") renderProjectsEditor(root);
    else if (id === "videos") renderVideosEditor(root);
    else if (id === "resume") renderResumeEditor(root);
    else if (id === "studio") renderStudioEditor(root);
    else if (id === "recommendations") renderRecommendationsEditor(root);
  }

  function saveHeader(root, onSave) {
    var header = el("div", { class: "admin-editor__header" }, [
      el("h2", { class: "admin-editor__title", text: getCol().label }),
      el("span", { class: "admin-editor__sub", text: getCol().file }),
      el("div", { class: "admin-editor__save-row" }, [
        el("button", { type: "button", class: "admin-btn admin-btn--primary", id: "admin-save-btn", text: "Save & commit" })
      ])
    ]);
    root.appendChild(header);
    $("admin-save-btn", root).addEventListener("click", onSave);
  }

  function saveCurrentCollection() {
    if (!state.authenticated || !state.config) {
      toast("Sign in to save changes.", "error");
      showLogin();
      return;
    }
    var col = getCol();
    var file = getFile();
    var btn = $("admin-save-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Saving…"; }
    var json = JSON.stringify(file.obj, null, 2);
    function doSave() {
      putContents(col.file, json, file.sha, "admin: update " + col.file)
        .then(function (res) {
          if (res && res.content) file.sha = res.content.sha;
          state.dirty[col.id] = false;
          refreshDirtyDots();
          toast("Saved. GitHub Pages will rebuild shortly.", "success");
        })
        .catch(function (err) {
          toast("Save failed: " + (err.message || err), "error");
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = "Save & commit"; }
        });
    }
    if (!file.sha) {
      getContents(col.file).then(function (r) { file.sha = r.sha; doSave(); })
        .catch(function (err) {
          if (btn) { btn.disabled = false; btn.textContent = "Save & commit"; }
          toast("Cannot read file: " + (err.message || err), "error");
        });
    } else {
      doSave();
    }
  }

  /* ============================== field components ============================== */
  function fieldText(label, value, onInput, opts) {
    opts = opts || {};
    var input = el("input", { type: opts.type || "text", value: value == null ? "" : value, placeholder: opts.placeholder || "" });
    input.addEventListener("input", function () { onInput(input.value); });
    var f = el("label", { class: "admin-field" + (opts.full ? " admin-field--full" : "") }, [
      el("span", { text: label }), input
    ]);
    return f;
  }
  function fieldTextarea(label, value, onInput, opts) {
    opts = opts || {};
    var ta = el("textarea", { placeholder: opts.placeholder || "" });
    ta.value = value == null ? "" : value;
    ta.addEventListener("input", function () { onInput(ta.value); });
    return el("label", { class: "admin-field admin-field--full" }, [el("span", { text: label }), ta]);
  }
  function fieldNumber(label, value, onInput) {
    var input = el("input", { type: "number", value: value == null ? "" : value });
    input.addEventListener("input", function () { onInput(input.value === "" ? null : Number(input.value)); });
    return el("label", { class: "admin-field" }, [el("span", { text: label }), input]);
  }
  function fieldBool(label, value, onInput) {
    var cb = el("input", { type: "checkbox" });
    cb.checked = !!value;
    cb.addEventListener("change", function () { onInput(cb.checked); });
    return el("label", { class: "admin-check" }, [cb, el("span", { text: label })]);
  }
  function fieldSelect(label, value, options, onInput) {
    var sel = el("select");
    options.forEach(function (o) {
      var opt = el("option", { value: o.value, text: o.label });
      if (o.value === value) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", function () { onInput(sel.value); });
    return el("label", { class: "admin-field" }, [el("span", { text: label }), sel]);
  }

  /* Keep list scroll position when a row button rebuilds the list (Hide/Show/etc.).
     The editor often grows unbounded so window scrollY is what actually moves; after
     re-render, focus must be cleared or the browser jumps to the first row button. */
  function adminScrollContainer() {
    var editor = document.getElementById("admin-editor");
    if (editor && editor.scrollHeight > editor.clientHeight + 1) return editor;
    return null;
  }

  function blurActiveAdminFocus(exceptWithin) {
    var active = document.activeElement;
    if (exceptWithin && active && exceptWithin.contains(active)) return;
    if (active && active !== document.body && active !== document.documentElement && active.blur) {
      active.blur();
    }
  }

  function readAdminScrollPos() {
    var editor = adminScrollContainer();
    return {
      editor: editor,
      y: editor ? editor.scrollTop : window.scrollY,
      x: editor ? editor.scrollLeft : window.scrollX
    };
  }

  function writeAdminScrollPos(pos) {
    if (!pos) return;
    if (pos.editor) {
      pos.editor.scrollTop = pos.y;
      pos.editor.scrollLeft = pos.x;
    } else {
      window.scrollTo(pos.x, pos.y);
    }
  }

  function fixAdminScrollAnchor(anchorTop, anchorEl) {
    if (anchorTop == null || !anchorEl) return;
    var delta = anchorEl.getBoundingClientRect().top - anchorTop;
    if (Math.abs(delta) < 0.5) return;
    var editor = adminScrollContainer();
    if (editor) editor.scrollTop += delta;
    else window.scrollBy(0, delta);
  }

  function restoreAdminListScroll(anchorIndex, listEl, scrollPos, anchorTop) {
    function restore() {
      if (anchorTop != null && anchorIndex != null && listEl && listEl.children[anchorIndex]) {
        fixAdminScrollAnchor(anchorTop, listEl.children[anchorIndex]);
      } else {
        writeAdminScrollPos(scrollPos);
      }
    }
    restore();
    window.requestAnimationFrame(restore);
  }

  /* Lightbox aspect ratio: 16:9 (default) / Ultrawide 2.37 / Custom. The exact
     ratio is stored in v.ratio ("" = 16:9, "2.37", or a custom "W:H"/decimal like
     "2560:1080"). The lightbox sets the frame to this ratio BEFORE the video loads,
     so there's no resize (synchronous like 16:9). */
  function fieldLightboxRatio(v, dirty) {
    var box = el("div", { class: "admin-field admin-field--full" });
    var isCustom = v.ratio && v.ratio !== "2.37";
    var sel = el("select");
    [
      { value: "", label: "16:9 (default)" },
      { value: "2.37", label: "Ultrawide 21:9 — 2560×1080 (2.37)" },
      { value: "custom", label: "Custom ultrawide ratio…" }
    ].forEach(function (o) {
      var opt = el("option", { value: o.value, text: o.label });
      if (o.value === (isCustom ? "custom" : (v.ratio || ""))) opt.selected = true;
      sel.appendChild(opt);
    });
    var customWrap = el("label", { class: "admin-field admin-field--full", style: "margin-top:0.4rem" }, [
      el("span", { text: "Custom aspect (W:H or decimal, e.g. 2560:1080 or 2.35:1; empty = 2.37)" }),
      el("input", { type: "text", value: isCustom ? v.ratio : "", placeholder: "2560:1080" })
    ]);
    var customInput = customWrap.querySelector("input");
    function syncCustom() { customWrap.style.display = sel.value === "custom" ? "" : "none"; }
    sel.addEventListener("change", function () {
      if (sel.value === "custom") {
        v.ratio = customInput.value.trim() || "2.37";
      } else {
        v.ratio = sel.value; /* "" or "2.37" */
      }
      syncCustom();
      dirty();
    });
    customInput.addEventListener("input", function () {
      if (sel.value === "custom") { v.ratio = customInput.value.trim() || "2.37"; dirty(); }
    });
    syncCustom();
    box.appendChild(el("span", { text: "Lightbox aspect ratio" }));
    box.appendChild(sel);
    box.appendChild(customWrap);
    return box;
  }

  /* Segmented visibility toggle. states is a list of {value,label}; field is
     the property name on entry; defaultValue is used when the property is unset.
     Used for Education (Site/CV/Hide) and Highlights (Site/CV/Both/Hide). */
  function segControl(entry, field, states, defaultValue, onInput) {
    var current = entry[field] || defaultValue;
    var group = el("div", { class: "admin-field admin-field--full admin-seg" }, [el("span", { text: "Show in" })]);
    var btns = {};
    states.forEach(function (s) {
      var b = el("button", { type: "button", class: "admin-btn admin-btn--small admin-seg__btn", text: s.label });
      b.addEventListener("click", function () {
        entry[field] = s.value;
        current = s.value;
        refresh();
        onInput();
      });
      btns[s.value] = b;
      group.appendChild(b);
    });
    function refresh() {
      Object.keys(btns).forEach(function (k) {
        btns[k].classList.toggle("admin-btn--primary", k === current);
        btns[k].setAttribute("aria-pressed", k === current ? "true" : "false");
      });
    }
    refresh();
    return group;
  }

  function visibilityControl(entry, onInput) {
    return segControl(entry, "visibility",
      [{ value: "site", label: "Site" }, { value: "cv", label: "CV" }, { value: "hidden", label: "Hide" }],
      "cv", onInput);
  }

  /* Friendly width control: a slider + number input + unit selector (rem/px/%)
     plus a "Default" button. The stored value is a CSS length string such as
     "42rem" / "640px" / "100%", or "" for the stylesheet default. opts can
     override the default value/unit and the per-unit slider ranges. */
  function fieldWidth(label, value, onInput, opts) {
    opts = opts || {};
    var defaultNum = opts.defaultNum != null ? opts.defaultNum : 42;
    var defaultUnit = opts.defaultUnit || "rem";
    var ranges = opts.ranges || { rem: [16, 100, 0.5], px: [320, 1600, 8], "%": [50, 100, 1] };
    var raw = (value == null ? "" : String(value)).trim();
    var m = raw.match(/^([\d.]+)\s*(rem|px|%)$/i);
    var num = m ? parseFloat(m[1]) : defaultNum;
    var unit = m ? m[2].toLowerCase() : defaultUnit;
    var isDefault = !m;
    function clamp(n, u) { var r = ranges[u]; return Math.max(r[0], Math.min(r[1], n)); }

    var box = el("label", { class: "admin-field admin-field--full admin-width" }, [el("span", { text: label })]);
    var slider = el("input", { type: "range", class: "admin-width__slider" });
    var numInput = el("input", { type: "number", class: "admin-width__num" });
    var unitSel = el("select", { class: "admin-width__unit" });
    Object.keys(ranges).forEach(function (u) {
      var o = el("option", { value: u, text: u });
      if (u === unit) o.selected = true;
      unitSel.appendChild(o);
    });
    var resetBtn = el("button", { type: "button", class: "admin-btn admin-btn--small admin-width__reset", text: "Default" });
    var preview = el("span", { class: "admin-width__preview" });

    function applyRange() {
      var r = ranges[unit];
      slider.min = r[0]; slider.max = r[1]; slider.step = r[2]; slider.value = num;
      numInput.min = r[0]; numInput.max = r[1]; numInput.step = r[2]; numInput.value = num;
    }
    function emit() { onInput(isDefault ? "" : num + unit); }
    function refresh() {
      applyRange();
      preview.textContent = isDefault ? "default" : num + unit;
      resetBtn.classList.toggle("admin-btn--primary", isDefault);
    }
    slider.addEventListener("input", function () { num = parseFloat(slider.value) || 0; numInput.value = num; isDefault = false; emit(); refresh(); });
    numInput.addEventListener("input", function () { num = clamp(parseFloat(numInput.value) || 0, unit); isDefault = false; emit(); refresh(); });
    unitSel.addEventListener("change", function () { unit = unitSel.value; num = clamp(num, unit); isDefault = false; emit(); refresh(); });
    resetBtn.addEventListener("click", function () { isDefault = true; num = defaultNum; unit = defaultUnit; unitSel.value = defaultUnit; emit(); refresh(); });

    refresh();
    box.appendChild(slider);
    box.appendChild(el("div", { class: "admin-width__row" }, [numInput, unitSel, resetBtn, preview]));
    return box;
  }

  function fieldImage(label, value, onInput) {
    var input = el("input", { type: "text", value: value || "", placeholder: "assets/… or URL" });
    var preview = el("img", { alt: "" });
    function setPreview(src) {
      var resolved = src && src.indexOf("http") === 0 ? src : (src ? "../" + src : "");
      preview.src = resolved;
      if (!resolved) preview.style.visibility = "hidden"; else preview.style.visibility = "";
    }
    setPreview(value);
    input.addEventListener("input", function () { setPreview(input.value); onInput(input.value); });
    var fileInput = el("input", { type: "file", class: "admin-upload-input", accept: "image/*" });
    var upBtn = el("button", { type: "button", class: "admin-btn admin-btn--small", text: "Upload…" });
    upBtn.addEventListener("click", function () { fileInput.click(); });
    fileInput.addEventListener("change", function () {
      if (!fileInput.files || !fileInput.files.length) return;
      upBtn.disabled = true; upBtn.textContent = "Uploading…";
      uploadAsset(fileInput.files[0])
        .then(function (path) {
          input.value = path;
          setPreview(path);
          onInput(path);
          toast("Uploaded " + path, "success");
        })
        .catch(function (err) { toast("Upload failed: " + (err.message || err), "error"); })
        .finally(function () { upBtn.disabled = false; upBtn.textContent = "Upload…"; fileInput.value = ""; });
    });
    var wrap = el("label", { class: "admin-field admin-field--full" }, [
      el("span", { text: label }),
      el("div", { class: "admin-image-field" }, [preview, input, upBtn, fileInput])
    ]);
    return wrap;
  }

  /* strings list (array of strings). opts.addOnRow is an optional node placed
     on the same row as the "+ Add" button (e.g. the Highlights visibility
     toggle), so it visibly belongs to this block. Each row has ↑/↓ to reorder. */
  function stringsList(label, arr, onChange, opts) {
    opts = opts || {};
    var list = arr.slice();
    /* Skip the inner label when empty — the surrounding wrapSection() already
       provides the title, so a non-empty label here would duplicate it
       (e.g. "Languages Languages"). */
    var box = el("div", { class: "admin-field admin-field--full" }, label ? [el("span", { text: label })] : []);
    var rows = el("div", { class: "admin-string-list" });
    function render() {
      clear(rows);
      list.forEach(function (val, i) {
        var input = el("input", { type: "text", value: val });
        input.addEventListener("input", function () { list[i] = input.value; onChange(list); });
        var upBtn = el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↑", title: "Move up" });
        upBtn.disabled = i === 0;
        upBtn.addEventListener("click", function () {
          if (i > 0) { var t = list[i - 1]; list[i - 1] = list[i]; list[i] = t; onChange(list); render(); }
        });
        var downBtn = el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↓", title: "Move down" });
        downBtn.disabled = i === list.length - 1;
        downBtn.addEventListener("click", function () {
          if (i < list.length - 1) { var t = list[i + 1]; list[i + 1] = list[i]; list[i] = t; onChange(list); render(); }
        });
        var del = el("button", { type: "button", class: "admin-btn admin-btn--small admin-btn--danger", text: "✕" });
        del.addEventListener("click", function () { list.splice(i, 1); onChange(list); render(); });
        rows.appendChild(el("div", { class: "admin-string-list__row" }, [input, upBtn, downBtn, del]));
      });
    }
    var addBtn = el("button", { type: "button", class: "admin-btn admin-btn--small admin-add-btn", text: "+ Add" });
    addBtn.addEventListener("click", function () { list.push(""); onChange(list); render(); });
    var addRow = el("div", { class: "admin-add-row" }, [addBtn]);
    if (opts.addOnRow) addRow.appendChild(opts.addOnRow);
    render();
    box.appendChild(rows);
    box.appendChild(addRow);
    return box;
  }

  /* object list editor (array of homogeneous objects) */
  function objectList(label, arr, fieldsFor, opts) {
    opts = opts || {};
    var box = el("div", { class: "admin-obj-list-box" }, []);
    /* Skip the inner title when empty — the surrounding wrapSection() already
       provides the heading, so a non-empty label would duplicate it
       (e.g. "Experience Experience"). */
    if (label) box.appendChild(el("h3", { class: "admin-section__title", text: label }));

    var items = el("div", { class: "admin-items" });
    function renderItems() {
      clear(items);
      arr.forEach(function (item, i) {
        var row = el("div", { class: "admin-item-row" + (state.selectedObj === item ? " is-active" : "") }, [
          el("div", { class: "admin-item-row__label" }, [
            document.createTextNode(opts.label(item, i) || ("Item " + (i + 1))),
            el("small", { text: opts.sub ? opts.sub(item, i) : "" })
          ]),
          el("div", { class: "admin-item-row__btns" }, [
            el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↑", title: "Move up" }),
            el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↓", title: "Move down" }),
            el("button", { type: "button", class: "admin-btn admin-btn--small admin-btn--danger", text: "✕", title: "Delete" })
          ])
        ]);
        var btns = row.querySelectorAll("button");
        row.querySelector(".admin-item-row__label").addEventListener("click", function () { state.selectedObj = item; renderItems(); renderDetail(); });
        btns[0].addEventListener("click", function () { if (i > 0) { var t = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = t; markDirty(state.current); renderItems(); } });
        btns[1].addEventListener("click", function () { if (i < arr.length - 1) { var t = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t; markDirty(state.current); renderItems(); } });
        btns[2].addEventListener("click", function () { if (confirm("Delete this item?")) { arr.splice(i, 1); state.selectedObj = null; markDirty(state.current); renderItems(); renderDetail(); } });
        items.appendChild(row);
      });
    }

    var detail = el("div", {});
    function renderDetail() {
      clear(detail);
      if (!state.selectedObj) { detail.appendChild(el("div", { class: "admin-empty", text: "Select an item above to edit, or add a new one." })); return; }
      var card = el("div", { class: "admin-obj-card" }, [el("div", { class: "admin-obj-card__head" }, [el("strong", { text: opts.label(state.selectedObj) || "Item" })])]);
      fieldsFor(state.selectedObj, function () { markDirty(state.current); /* labels may change */ }).forEach(function (f) { card.appendChild(f); });
      detail.appendChild(card);
    }

    var addBtn = el("button", { type: "button", class: "admin-btn", text: opts.addLabel || "+ Add item" });
    addBtn.addEventListener("click", function () {
      var n = opts.makeNew ? opts.makeNew() : {};
      arr.push(n);
      state.selectedObj = n;
      markDirty(state.current);
      renderItems();
      renderDetail();
    });

    renderItems();
    renderDetail();
    box.appendChild(items);
    box.appendChild(addBtn);
    box.appendChild(detail);
    return box;
  }

  /* ============================== Site editor ============================== */
  function renderSiteEditor(root) {
    saveHeader(root, saveCurrentCollection);
    var s = getFile().obj;
    var onDirty = function () { markDirty("site"); };

    root.appendChild(section("Branding & meta", [
      fieldText("Page title", s.meta && s.meta.title, function (v) { ensure(s, "meta").title = v; onDirty(); }, { full: true }),
      fieldTextarea("Meta description", s.meta && s.meta.description, function (v) { ensure(s, "meta").description = v; onDirty(); }),
      fieldImage("Brand mark (header logo)", s.brand && s.brand.mark, function (v) { ensure(s, "brand").mark = v; onDirty(); }),
      fieldText("Brand word", s.brand && s.brand.word, function (v) { ensure(s, "brand").word = v; onDirty(); }),
      fieldImage("Hero logo", s.brand && s.brand.logo, function (v) { ensure(s, "brand").logo = v; onDirty(); }),
      fieldBool("Hide hero logo (removes the logo above the photo, with its spacing)", s.brand && s.brand.hideLogo, function (v) { ensure(s, "brand").hideLogo = v; onDirty(); })
    ]));

    root.appendChild(section("Hero", [
      fieldImage("Avatar", s.hero && s.hero.avatar, function (v) { ensure(s, "hero").avatar = v; onDirty(); }),
      fieldText("Name", s.hero && s.hero.name, function (v) { ensure(s, "hero").name = v; onDirty(); }, { full: true }),
      fieldText("Role", s.hero && s.hero.role, function (v) { ensure(s, "hero").role = v; onDirty(); }, { full: true }),
      fieldWidth("Role block width", s.hero && s.hero.roleMaxWidth, function (v) { ensure(s, "hero").roleMaxWidth = v; onDirty(); }, { defaultNum: 20, ranges: { rem: [8, 100, 0.5], px: [160, 1600, 8], "%": [50, 100, 1] } }),
      fieldTextarea("Bio", s.hero && s.hero.bio, function (v) { ensure(s, "hero").bio = v; onDirty(); }),
      fieldWidth("Bio block width", s.hero && s.hero.bioMaxWidth, function (v) { ensure(s, "hero").bioMaxWidth = v; onDirty(); })
    ]));

    root.appendChild(section("Section headings & buttons", [
      fieldText("Projects heading", s.sections && s.sections.projectsHeading, function (v) { ensure(s, "sections").projectsHeading = v; onDirty(); }),
      fieldText("Videos heading", s.sections && s.sections.videosHeading, function (v) { ensure(s, "sections").videosHeading = v; onDirty(); }),
      fieldText("Tools heading", s.sections && s.sections.toolsHeading, function (v) { ensure(s, "sections").toolsHeading = v; onDirty(); }),
      fieldText("Resume button", s.sections && s.sections.resumeButtonLabel, function (v) { ensure(s, "sections").resumeButtonLabel = v; onDirty(); }),
      fieldText("Show more label", s.sections && s.sections.showMoreLabel, function (v) { ensure(s, "sections").showMoreLabel = v; onDirty(); }),
      fieldText("Show less label", s.sections && s.sections.showLessLabel, function (v) { ensure(s, "sections").showLessLabel = v; onDirty(); })
    ]));

    root.appendChild(section("Contact", [
      fieldTextarea("Contact lead", s.contact && s.contact.lead, function (v) { ensure(s, "contact").lead = v; onDirty(); }),
      fieldText("Form title", s.contact && s.contact.formTitle, function (v) { ensure(s, "contact").formTitle = v; onDirty(); }, { full: true }),
      fieldText("Form endpoint (Formspree URL)", s.contact && s.contact.formEndpoint, function (v) { ensure(s, "contact").formEndpoint = v; onDirty(); }, { full: true, type: "url" }),
      fieldText("Submit button", s.contact && s.contact.submitLabel, function (v) { ensure(s, "contact").submitLabel = v; onDirty(); }),
      contactFieldsEditor(s, onDirty)
    ]));

    root.appendChild(section("Social links", [
      socialListEditor(s, onDirty)
    ]));

    root.appendChild(section("Footer", [
      fieldText("Copyright", s.footer && s.footer.copyright, function (v) { ensure(s, "footer").copyright = v; onDirty(); }, { full: true }),
      fieldText("Resume PDF path", s.resumePdf, function (v) { s.resumePdf = v; onDirty(); }, { full: true }),
      fieldText("Resume PDF button label", s.resumePdfLabel, function (v) { s.resumePdfLabel = v; onDirty(); }, { full: true })
    ]));
  }

  function contactFieldsEditor(s, onDirty) {
    var box = el("div", {}, []);
    var fields = s.contact && s.contact.fields ? s.contact.fields : {};
    ["email", "name", "subject", "message"].forEach(function (key) {
      var f = fields[key] || { label: "", placeholder: "" };
      var card = el("div", { class: "admin-obj-card" }, [el("div", { class: "admin-obj-card__head" }, [el("strong", { text: "Field: " + key })])]);
      card.appendChild(fieldText("Label", f.label, function (v) { f.label = v; ensure(s.contact, "fields")[key] = f; onDirty(); }));
      card.appendChild(fieldText("Placeholder", f.placeholder, function (v) { f.placeholder = v; onDirty(); }));
      card.appendChild(fieldBool("Required", f.required, function (v) { f.required = v; onDirty(); }));
      box.appendChild(card);
    });
    return box;
  }

  function socialListEditor(s, onDirty) {
    var arr = s.social || (s.social = []);
    var box = el("div", {}, []);
    var items = el("div", { class: "admin-items" });
    function renderItems() {
      clear(items);
      arr.forEach(function (item, i) {
        var preset = socialIconByType(item.type);
        var row = el("div", { class: "admin-item-row" }, [
          el("div", { class: "admin-item-row__label", text: (preset ? preset.label : item.type || "Link") + " — " + (item.label || "") }),
          el("div", { class: "admin-item-row__btns" }, [
            el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↑" }),
            el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↓" }),
            el("button", { type: "button", class: "admin-btn admin-btn--small admin-btn--danger", text: "✕" })
          ])
        ]);
        var btns = row.querySelectorAll("button");
        btns[0].onclick = function () { if (i > 0) { arr[i] = arr.splice(i - 1, 1, arr[i])[0]; markDirty("site"); renderItems(); } };
        btns[1].onclick = function () { if (i < arr.length - 1) { var t = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t; markDirty("site"); renderItems(); } };
        btns[2].onclick = function () { arr.splice(i, 1); markDirty("site"); renderItems(); renderDetail(); };
        row.querySelector(".admin-item-row__label").onclick = function () { state._socSel = i; renderItems(); renderDetail(); };
        if (state._socSel === i) row.classList.add("is-active");
        items.appendChild(row);
      });
    }
    var detail = el("div", {});
    function renderDetail() {
      clear(detail);
      var idx = state._socSel;
      if (idx == null || !arr[idx]) { detail.appendChild(el("div", { class: "admin-empty", text: "Select a link to edit." })); return; }
      var item = arr[idx];
      var card = el("div", { class: "admin-obj-card" }, [el("div", { class: "admin-obj-card__head" }, [el("strong", { text: "Social link" })])]);
      var iconOpts = SOCIAL_ICONS.map(function (ic) { return { value: ic.type, label: ic.label }; });
      card.appendChild(fieldSelect("Icon", item.type || "link", iconOpts, function (v) {
        item.type = v;
        var preset = socialIconByType(v);
        if (preset && preset.icon) item.icon = preset.icon;
        markDirty("site");
        renderItems(); renderDetail();
      }));
      card.appendChild(fieldText("Label", item.label, function (v) { item.label = v; markDirty("site"); renderItems(); }));
      card.appendChild(fieldText("URL", item.href, function (v) { item.href = v; markDirty("site"); }, { type: "url", full: true }));
      card.appendChild(fieldTextarea("SVG path data (icon — auto-filled by the Icon choice; edit only for a custom icon)", item.icon || "", function (v) { item.icon = v; markDirty("site"); }));
      detail.appendChild(card);
    }
    var addBtn = el("button", { type: "button", class: "admin-btn", text: "+ Add link" });
    addBtn.onclick = function () { var preset = socialIconByType("link"); arr.push({ type: "link", label: "New link", href: "", icon: preset ? preset.icon : "" }); state._socSel = arr.length - 1; markDirty("site"); renderItems(); renderDetail(); };
    renderItems(); renderDetail();
    box.appendChild(items); box.appendChild(addBtn); box.appendChild(el("div", { style: "height:0.6rem" })); box.appendChild(detail);
    return box;
  }

  /* ============================== Videos editor ============================== */
  function renderVideosEditor(root) {
    saveHeader(root, saveCurrentCollection);
    var data = getFile().obj;
    var arr = data.videos || (data.videos = []);
    var dirty = function () { markDirty("videos"); };
    var fieldsFor = function (v) {
      return [
        fieldText("YouTube ID", v.id, function (val) { v.id = val; dirty(); }),
        fieldText("Title", v.title, function (val) { v.title = val; dirty(); }, { full: true }),
        fieldText("Role / caption", v.role, function (val) { v.role = val; dirty(); }, { full: true }),
        fieldText("Year", v.year, function (val) { v.year = val; dirty(); }),
        fieldBool("Poster (custom thumbnail)", v.poster, function (val) { v.poster = val; dirty(); }),
        fieldImage("Thumbnail (leave empty to use YouTube)", v.thumb, function (val) { v.thumb = val || null; dirty(); }),
        fieldText("Extra thumb CSS class", v.thumbClass, function (val) { v.thumbClass = val; dirty(); }),
        fieldNumber("Thumb width", v.thumbW, function (val) { v.thumbW = val; dirty(); }),
        fieldNumber("Thumb height", v.thumbH, function (val) { v.thumbH = val; dirty(); }),
        fieldLightboxRatio(v, dirty)
      ];
    };

    var primaryList = el("div", { class: "admin-items" });
    var moreList = el("div", { class: "admin-items" });
    var detail = el("div", {});

    function renderLists() {
      clear(primaryList); clear(moreList);
      arr.forEach(function (v, i) {
        var list = v.primary ? primaryList : moreList;
        var row = el("div", { class: "admin-item-row" + (state.selectedObj === v ? " is-active" : "") + (v.hidden ? " is-hidden" : "") }, [
          el("div", { class: "admin-item-row__label" }, [
            document.createTextNode(v.title || "(untitled)"),
            v.hidden ? el("span", { class: "admin-item-row__badge", text: "hidden" }) : null,
            el("small", { text: (v.role || "") + " · " + (v.year || "") })
          ]),
          el("div", { class: "admin-item-row__btns" }, [
            el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↑", title: "Move up" }),
            el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↓", title: "Move down" }),
            el("button", { type: "button", class: "admin-btn admin-btn--small", text: v.primary ? "→ More" : "← Primary", title: v.primary ? "Move to More" : "Move to Primary" }),
            el("button", { type: "button", class: "admin-btn admin-btn--small", text: v.hidden ? "Show" : "Hide", title: v.hidden ? "Show on the site" : "Hide from the site (without deleting)" }),
            el("button", { type: "button", class: "admin-btn admin-btn--small admin-btn--danger", text: "✕", title: "Delete" })
          ])
        ]);
        var btns = row.querySelectorAll("button");
        btns[0].onclick = function () {
          for (var j = i - 1; j >= 0; j--) { if (!!arr[j].primary === !!v.primary) { var t = arr[j]; arr[j] = arr[i]; arr[i] = t; dirty(); renderLists(); return; } }
        };
        btns[1].onclick = function () {
          for (var j = i + 1; j < arr.length; j++) { if (!!arr[j].primary === !!v.primary) { var t = arr[j]; arr[j] = arr[i]; arr[i] = t; dirty(); renderLists(); return; } }
        };
        btns[2].onclick = function () {
          if (!v.primary && arr.filter(function (x) { return x.primary; }).length >= 5) {
            toast("Primary videos are limited to 5. Move one to “More” first.");
            return;
          }
          v.primary = !v.primary; dirty(); renderLists();
        };
        btns[3].onclick = function () { v.hidden = !v.hidden; dirty(); renderLists(); };
        btns[4].onclick = function () {
          if (confirm("Delete this video?")) { if (state.selectedObj === v) state.selectedObj = null; arr.splice(i, 1); dirty(); renderLists(); renderDetail(); }
        };
        row.querySelector(".admin-item-row__label").onclick = function () { state.selectedObj = v; renderLists(); renderDetail(); };
        list.appendChild(row);
      });
    }

    function renderDetail() {
      clear(detail);
      var v = state.selectedObj;
      if (!v) { detail.appendChild(el("div", { class: "admin-empty", text: "Select a video above to edit, or add a new one." })); return; }
      var card = el("div", { class: "admin-obj-card" }, [el("div", { class: "admin-obj-card__head" }, [el("strong", { text: v.title || "Video" })])]);
      fieldsFor(v).forEach(function (f) { card.appendChild(f); });
      detail.appendChild(card);
    }

    function add(primary) {
      if (primary && arr.filter(function (v) { return v.primary; }).length >= 5) {
        toast("Primary videos are limited to 5. Move one to “More” first.");
        return;
      }
      var n = { id: "", title: "New video", role: "", year: "", primary: primary, hidden: false, poster: false, thumb: null, thumbClass: "", thumbW: 480, thumbH: 360, ratio: "" };
      arr.push(n); state.selectedObj = n; dirty(); renderLists(); renderDetail();
    }

    renderLists(); renderDetail();

    var primaryAdd = makeAddButton("+ Add primary video", function () { add(true); });
    function refreshPrimaryAdd() {
      var count = arr.filter(function (v) { return v.primary; }).length;
      primaryAdd.disabled = count >= 5;
      primaryAdd.textContent = count >= 5 ? "Primary limit reached (5)" : "+ Add primary video";
    }
    var _renderLists0 = renderLists;
    renderLists = function () { _renderLists0(); refreshPrimaryAdd(); };
    refreshPrimaryAdd();

    root.appendChild(wrapSection("Primary videos (shown always on the homepage — max 5)", el("div", {}, [
      primaryList, primaryAdd
    ])));
    root.appendChild(wrapSection("More videos (Show More section)", el("div", {}, [
      moreList, makeAddButton("+ Add more video", function () { add(false); })
    ])));
    root.appendChild(wrapSection("Edit selected video", detail));
  }

  function makeAddButton(label, onclick) {
    var b = el("button", { type: "button", class: "admin-btn", text: label });
    b.onclick = onclick;
    return b;
  }

  /* ============================== Projects editor ============================== */
  function renderProjectsEditor(root) {
    saveHeader(root, saveCurrentCollection);
    var data = getFile().obj;
    var arr = data.projects || (data.projects = []);
    var projectsList = el("div", { class: "admin-items" });
    var toolsList = el("div", { class: "admin-items" });
    var detail = el("div", {});

    function renderItems() {
      clear(projectsList); clear(toolsList);
      arr.forEach(function (p, i) {
        var list = p.section === "tools" ? toolsList : projectsList;
        var row = el("div", { class: "admin-item-row" + (state.selectedObj === p ? " is-active" : "") + (p.hidden ? " is-hidden" : "") }, [
          el("div", { class: "admin-item-row__label" }, [
            document.createTextNode(p.title || "(untitled)"),
            p.hidden ? el("span", { class: "admin-item-row__badge", text: "hidden" }) : null
          ]),
          el("div", { class: "admin-item-row__btns" }, [
            el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↑", title: "Move up" }),
            el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↓", title: "Move down" }),
            el("button", { type: "button", class: "admin-btn admin-btn--small", text: p.hidden ? "Show" : "Hide", title: p.hidden ? "Show on the site" : "Hide from the site (without deleting)" }),
            el("button", { type: "button", class: "admin-btn admin-btn--small admin-btn--danger", text: "✕", title: "Delete" })
          ])
        ]);
        var btns = row.querySelectorAll("button");
        row.querySelector(".admin-item-row__label").onclick = function () { state.selectedObj = p; renderItems(); renderDetail(); };
        btns[0].onclick = function () {
          for (var j = i - 1; j >= 0; j--) { if (arr[j].section === p.section) { var t = arr[j]; arr[j] = arr[i]; arr[i] = t; markDirty("projects"); renderItems(); return; } }
        };
        btns[1].onclick = function () {
          for (var j = i + 1; j < arr.length; j++) { if (arr[j].section === p.section) { var t = arr[j]; arr[j] = arr[i]; arr[i] = t; markDirty("projects"); renderItems(); return; } }
        };
        btns[2].onclick = function () { p.hidden = !p.hidden; markDirty("projects"); renderItems(); };
        btns[3].onclick = function () { if (confirm("Delete " + (p.section === "tools" ? "tool" : "project") + " " + (p.title || "") + "?")) { arr.splice(i, 1); if (state.selectedObj === p) state.selectedObj = null; markDirty("projects"); renderItems(); renderDetail(); } };
        list.appendChild(row);
      });
    }
    function renderDetail() {
      clear(detail);
      var p = state.selectedObj;
      if (!p) { detail.appendChild(el("div", { class: "admin-empty", text: "Select a project or tool to edit, or add a new one." })); return; }
      var headStrong = el("strong", { text: (p.section === "tools" ? "Tool — " : "Project — ") + (p.title || "Untitled") });
      var card = el("div", { class: "admin-obj-card" }, [el("div", { class: "admin-obj-card__head" }, [headStrong])]);
      var dirty = function () { markDirty("projects"); };
      /* Update head + list label without rebuilding the card (keeps input focus while typing). */
      function titleChanged(v) {
        p.title = v; markDirty("projects");
        headStrong.textContent = (p.section === "tools" ? "Tool — " : "Project — ") + (v || "Untitled");
        var activeLabel = root.querySelector(".admin-item-row.is-active .admin-item-row__label");
        if (activeLabel && activeLabel.firstChild) activeLabel.firstChild.nodeValue = v || "(untitled)";
      }
      card.appendChild(fieldText("Slug (URL id)", p.slug, function (v) { p.slug = v; dirty(); }));
      card.appendChild(fieldSelect("Card type", p.cardType, [{ value: "project", label: "Project (with banner)" }, { value: "text-only", label: "Text only" }], function (v) { p.cardType = v; dirty(); }));
      card.appendChild(fieldText("Title", p.title, titleChanged, { full: true }));
      card.appendChild(fieldText("Category", p.category, function (v) { p.category = v; dirty(); }));
      card.appendChild(fieldTextarea("Card description", p.description, function (v) { p.description = v; dirty(); }));
      card.appendChild(fieldImage("Card banner", p.banner, function (v) { p.banner = v; dirty(); }));
      card.appendChild(fieldText("Detail page URL (static page — used only when there are no blocks below)", p.detailUrl, function (v) { p.detailUrl = v; dirty(); }, { full: true }));
      card.appendChild(el("p", { class: "admin-editor__sub", text: "Add blocks below to build a dynamic detail page (project.html?slug=…). When a project has blocks, its card automatically links to the dynamic page instead of the static URL above." }));
      if (!p.blocks) p.blocks = [];
      card.appendChild(blocksEditor(p, dirty));
      detail.appendChild(card);
    }
    function addOne(section) {
      var n = { slug: (section === "tools" ? "tool-" : "new-project-") + Date.now().toString(36), section: section, cardType: section === "tools" ? "text-only" : "project", title: section === "tools" ? "New tool" : "New project", category: "", description: "", banner: "", bannerW: 1200, bannerH: 514, detailUrl: "", hidden: false, blocks: [] };
      arr.push(n); state.selectedObj = n; markDirty("projects"); renderItems(); renderDetail();
    }
    renderItems(); renderDetail();
    root.appendChild(wrapSection("Projects", el("div", {}, [
      el("p", { class: "admin-editor__sub", text: "Project cards on the homepage. Up to 3 fill the row at the baseline size; 4+ use a fixed carousel width that shows exactly 4 (the max comfortable to view, same tile size) — the 5th and beyond are hidden under the hood and reached via the semi-transparent side controls / swipe. Add blocks below to build a dynamic detail page." }),
      el("div", { style: "height:0.6rem" }),
      projectsList, makeAddButton("+ Add project", function () { addOne("projects"); }), el("div", { style: "height:0.6rem" })
    ])));
    root.appendChild(wrapSection("Tools", el("div", {}, [
      el("p", { class: "admin-editor__sub", text: "Tool cards (separate section with its own rules). Tools and projects cannot be moved between each other." }),
      el("div", { style: "height:0.6rem" }),
      toolsList, makeAddButton("+ Add tool", function () { addOne("tools"); }), el("div", { style: "height:0.6rem" })
    ])));
    root.appendChild(wrapSection("Edit selected", detail));
  }

  function blocksEditor(project, dirty) {
    var arr = project.blocks || (project.blocks = []);
    var box = el("div", { class: "admin-section", style: "margin-top:1rem" }, [el("h3", { class: "admin-section__title", text: "Detail page blocks" })]);
    var list = el("div", {});
    function renderList() {
      clear(list);
      arr.forEach(function (b, i) {
        var block = el("div", { class: "admin-block" });
        var head = el("div", { class: "admin-block__head" }, [
          el("strong", { text: blockLabel(b) }),
          el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↑" }),
          el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↓" }),
          el("button", { type: "button", class: "admin-btn admin-btn--small admin-btn--danger", text: "✕" })
        ]);
        var btns = head.querySelectorAll("button");
        btns[0].onclick = function () { if (i > 0) { arr[i] = arr.splice(i - 1, 1, arr[i])[0]; dirty(); renderList(); } };
        btns[1].onclick = function () { if (i < arr.length - 1) { var t = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t; dirty(); renderList(); } };
        btns[2].onclick = function () { arr.splice(i, 1); dirty(); renderList(); renderBody(); };
        head.onclick = function (e) { if (e.target.closest("button")) return; state._blockSel = i; renderList(); renderBody(); };
        if (state._blockSel === i) block.classList.add("is-active");
        block.appendChild(head);
        list.appendChild(block);
      });
    }
    var body = el("div", { class: "admin-block__body" });
    function renderBody() {
      clear(body);
      var b = arr[state._blockSel];
      if (!b) { body.appendChild(el("div", { class: "admin-empty", text: "Select a block to edit or add one." })); return; }
      blockFields(b, dirty, function () { dirty(); renderList(); /* label may change */ })
        .forEach(function (f) { if (f) body.appendChild(f); });
    }
    var addRow = el("div", { style: "display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.6rem" });
    BLOCK_TYPES.forEach(function (bt) {
      var b = el("button", { type: "button", class: "admin-btn admin-btn--small", text: "+ " + bt.label });
      b.onclick = function () { arr.push(bt.make()); state._blockSel = arr.length - 1; dirty(); renderList(); renderBody(); };
      addRow.appendChild(b);
    });
    renderList(); renderBody();
    box.appendChild(list);
    box.appendChild(addRow);
    box.appendChild(body);
    return box;
  }

  var BLOCK_TYPES = [
    { label: "Banner", type: "banner", make: function () { return { type: "banner", src: "", w: 1024, h: 576 }; } },
    { label: "Raw banner (custom HTML above main)", type: "raw-banner", make: function () { return { type: "raw-banner", class: "", html: "" }; } },
    { label: "Hero", type: "hero", make: function () { return { type: "hero", title: "", platform: "", company: "", lead: "", steam: { label: "View on Steam", href: "" } }; } },
    { label: "About", type: "about", make: function () { return { type: "about", heading: "About", html: "" }; } },
    { label: "Responsibilities", type: "responsibilities", make: function () { return { type: "responsibilities", heading: "Responsibilities & Contributions", items: [] }; } },
      { label: "Video (single)", type: "video-single", make: function () { return { type: "video-single", heading: "", intro: "", stretchPreview: false, video: { id: "", heading: "", sub: "", poster: false, thumb: null, thumbClass: "", thumbW: 1280, thumbH: 720, ratio: "" }, captionTitle: "" }; } },
    { label: "Showreel (2-up)", type: "video-showreel", make: function () { return { type: "video-showreel", heading: "ShowReels", videos: [] }; } },
    { label: "Video grid", type: "video-grid", make: function () { return { type: "video-grid", heading: "", date: "", rows: 2, noNav: true, videos: [] }; } },
    { label: "Releases / downloads (versioned)", type: "releases", make: function () { return { type: "releases", heading: "Download", open: true, wrapClass: "vm-xctrl-spoilers", lead: "", github: "", items: [] }; } },
    { label: "Accordion (collapsible sections)", type: "accordion", make: function () { return { type: "accordion", wrapClass: "vm-xctrl-spoilers", items: [] }; } },
    { label: "Raw HTML section", type: "raw", make: function () { return { type: "raw", html: "" }; } },
    { label: "Raw HTML (no wrapper)", type: "raw-flat", make: function () { return { type: "raw-flat", html: "" }; } }
  ];

  function blockLabel(b) {
    if (b.type === "hero") return "Hero — " + (b.title || "…");
    if (b.type === "about") return "About — " + (b.heading || "…");
    if (b.type === "responsibilities") return "Responsibilities — " + (b.items ? b.items.length : 0) + " items";
    if (b.type === "banner") return "Banner";
    if (b.type === "raw-banner") return "Raw banner";
    if (b.type === "video-single") return "Video single — " + (b.video ? b.video.id : "");
    if (b.type === "video-showreel") return "Showreel — " + (b.videos ? b.videos.length : 0) + " videos";
    if (b.type === "video-grid") return "Video grid — " + (b.videos ? b.videos.length : 0) + " videos";
    if (b.type === "releases") return b.github ? "Releases — GitHub " + b.github : "Releases — " + (b.items ? b.items.length : 0) + " versions";
    if (b.type === "accordion") return "Accordion — " + (b.items ? b.items.length : 0) + " sections";
    if (b.type === "raw") return "Raw HTML section";
    if (b.type === "raw-flat") return "Raw HTML (no wrapper)";
    return b.type;
  }

  function blockFields(b, dirty, onChange) {
    var out = [];
    if (b.type === "banner") {
      out.push(fieldImage("Image", b.src, function (v) { b.src = v; dirty(); }));
      out.push(fieldNumber("Width", b.w, function (v) { b.w = v; dirty(); }));
      out.push(fieldNumber("Height", b.h, function (v) { b.h = v; dirty(); }));
    } else if (b.type === "raw-banner") {
      out.push(fieldText("Extra class (e.g. page-overview-banner--vm-xctrl-hero)", b.class || "", function (v) { b.class = v; dirty(); }, { full: true }));
      out.push(fieldTextarea("HTML (inside the banner)", b.html || "", function (v) { b.html = v; dirty(); }));
    } else if (b.type === "hero") {
      out.push(fieldText("Title", b.title, function (v) { b.title = v; dirty(); onChange(); }, { full: true }));
      out.push(fieldText("Platform (text or comma list)", b.platform, function (v) { b.platform = v; dirty(); }, { full: true }));
      out.push(fieldText("Company", b.company, function (v) { b.company = v; dirty(); }, { full: true }));
      out.push(fieldText("Company URL (optional — links the company name)", b.companyHref, function (v) { b.companyHref = v; dirty(); }, { type: "url", full: true }));
      out.push(fieldTextarea("Company HTML (optional — overrides Company/URL, e.g. for partial links)", b.companyHtml, function (v) { b.companyHtml = v; dirty(); }));
      out.push(fieldTextarea("Lead line", b.lead, function (v) { b.lead = v; dirty(); }));
      out.push(fieldText("Steam label", b.steam && b.steam.label, function (v) { ensure(b, "steam").label = v; dirty(); }));
      out.push(fieldText("Steam URL", b.steam && b.steam.href, function (v) { ensure(b, "steam").href = v; dirty(); }, { type: "url" }));
    } else if (b.type === "about") {
      out.push(fieldText("Heading", b.heading, function (v) { b.heading = v; dirty(); onChange(); }));
      out.push(fieldTextarea("HTML content", b.html, function (v) { b.html = v; dirty(); }));
    } else if (b.type === "responsibilities") {
      out.push(fieldText("Heading", b.heading, function (v) { b.heading = v; dirty(); onChange(); }, { full: true }));
      out.push(respItemsEditor(b, dirty));
    } else if (b.type === "video-single") {
      out.push(fieldText("Heading", b.heading, function (v) { b.heading = v; dirty(); onChange(); }, { full: true }));
      out.push(fieldTextarea("Intro (HTML)", b.intro, function (v) { b.intro = v; dirty(); }));
      out.push(fieldBool("Stretch preview to block width", b.stretchPreview, function (v) { b.stretchPreview = v; dirty(); }));
      out.push(fieldText("Video ID", b.video && b.video.id, function (v) { ensure(b, "video").id = v; dirty(); onChange(); }));
      out.push(fieldText("Heading (lightbox)", b.video && b.video.heading, function (v) { ensure(b, "video").heading = v; dirty(); }));
      out.push(fieldText("Sub (lightbox)", b.video && b.video.sub, function (v) { ensure(b, "video").sub = v; dirty(); }));
      out.push(fieldText("Caption title", b.captionTitle, function (v) { b.captionTitle = v; dirty(); }));
      out.push(fieldTextarea("Caption HTML (optional — overrides Caption title)", b.captionHtml, function (v) { b.captionHtml = v; dirty(); }));
      videoThumbFields(ensure(b, "video"), dirty).forEach(function (f) { out.push(f); });
    } else if (b.type === "video-showreel" || b.type === "video-grid") {
      out.push(fieldText("Heading", b.heading, function (v) { b.heading = v; dirty(); onChange(); }, { full: true }));
      if (b.type === "video-grid") {
        out.push(fieldTextarea("Intro (HTML, optional)", b.intro, function (v) { b.intro = v; dirty(); }));
        out.push(fieldText("Date", b.date, function (v) { b.date = v; dirty(); }));
        out.push(fieldNumber("Rows", b.rows, function (v) { b.rows = v; dirty(); }));
        out.push(fieldBool("No side nav (paged grid)", b.noNav, function (v) { b.noNav = v; dirty(); }));
      }
      out.push(projectVideosEditor(b, dirty));
    } else if (b.type === "releases") {
      out.push(fieldText("Summary label (spoiler title)", b.heading, function (v) { b.heading = v; dirty(); onChange(); }, { full: true }));
      out.push(fieldBool("Open by default", b.open, function (v) { b.open = v; dirty(); }));
      out.push(fieldText("Extra wrapper class (e.g. vm-xctrl-spoilers)", b.wrapClass, function (v) { b.wrapClass = v; dirty(); }, { full: true }));
      out.push(fieldTextarea("Lead (HTML — intro above the version list)", b.lead, function (v) { b.lead = v; dirty(); }));
      out.push(fieldText("GitHub repo (owner/name — loads releases automatically)", b.github || "", function (v) { b.github = v; dirty(); onChange(); }, { full: true, placeholder: "vchaudio/VM-Xctrl" }));
      if (b.github) {
        out.push(el("p", {
          style: "color:var(--text-muted);font-size:0.85rem;margin:0 0 0.75rem",
          text: "The live site fetches versions from GitHub Releases. Manual versions below are only used if GitHub is unreachable."
        }));
      }
      out.push(releasesItemsEditor(b, dirty));
    } else if (b.type === "accordion") {
      out.push(fieldText("Extra wrapper class (e.g. vm-xctrl-spoilers)", b.wrapClass, function (v) { b.wrapClass = v; dirty(); }, { full: true }));
      out.push(accordionSectionsEditor(b, dirty));
    } else if (b.type === "raw" || b.type === "raw-flat") {
      out.push(fieldTextarea("HTML", b.html, function (v) { b.html = v; dirty(); }));
    }
    return out;
  }

  function respItemsEditor(b, dirty) {
    var arr = b.items || (b.items = []);
    var box = el("div", { class: "admin-sub" }, [el("span", { text: "Items", style: "font-weight:500;color:var(--text)" })]);
    var list = el("div", { class: "admin-obj-list" });
    function render() {
      clear(list);
      arr.forEach(function (it, i) {
        var card = el("div", { class: "admin-obj-card" }, [el("div", { class: "admin-obj-card__head" }, [
          el("strong", { text: "Item " + (i + 1) }),
          el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↑" }),
          el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↓" }),
          el("button", { type: "button", class: "admin-btn admin-btn--small admin-btn--danger", text: "✕" })
        ])]);
        var btns = card.querySelectorAll("button");
        btns[0].onclick = function () { if (i > 0) { arr[i] = arr.splice(i - 1, 1, arr[i])[0]; dirty(); render(); } };
        btns[1].onclick = function () { if (i < arr.length - 1) { var t = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t; dirty(); render(); } };
        btns[2].onclick = function () { arr.splice(i, 1); dirty(); render(); };
        card.appendChild(fieldTextarea("Strong lead (HTML)", it.strong, function (v) { it.strong = v; dirty(); }));
        card.appendChild(fieldTextarea("Text", it.text, function (v) { it.text = v; dirty(); }));
        list.appendChild(card);
      });
    }
    var addBtn = el("button", { type: "button", class: "admin-btn admin-btn--small", text: "+ Add item" });
    addBtn.onclick = function () { arr.push({ strong: "", text: "" }); dirty(); render(); };
    render();
    box.appendChild(list); box.appendChild(addBtn);
    return box;
  }

  function videoThumbFields(v, dirty) {
    return [
      fieldBool("Use custom thumbnail (off = YouTube)", v.poster, function (val) { v.poster = val; dirty(); }),
      fieldImage("Thumbnail (custom poster image)", v.thumb, function (val) { v.thumb = val || null; dirty(); }),
      fieldText("Extra thumb CSS class", v.thumbClass, function (val) { v.thumbClass = val; dirty(); }),
      fieldNumber("Thumb width", v.thumbW, function (val) { v.thumbW = val; dirty(); }),
      fieldNumber("Thumb height", v.thumbH, function (val) { v.thumbH = val; dirty(); }),
      fieldLightboxRatio(v, dirty)
    ];
  }

  function projectVideosEditor(b, dirty) {
    var arr = b.videos || (b.videos = []);
    var box = el("div", {}, [el("span", { text: "Videos", style: "font-weight:500;color:var(--text)" })]);
    var list = el("div", { class: "admin-obj-list" });
    function render() {
      clear(list);
      arr.forEach(function (v, i) {
        var card = el("div", { class: "admin-obj-card" }, [el("div", { class: "admin-obj-card__head" }, [
          el("strong", { text: "Video " + (i + 1) + (v.id ? " — " + v.id : "") }),
          el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↑" }),
          el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↓" }),
          el("button", { type: "button", class: "admin-btn admin-btn--small admin-btn--danger", text: "✕" })
        ])]);
        var btns = card.querySelectorAll("button");
        btns[0].onclick = function () { if (i > 0) { arr[i] = arr.splice(i - 1, 1, arr[i])[0]; dirty(); render(); } };
        btns[1].onclick = function () { if (i < arr.length - 1) { var t = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t; dirty(); render(); } };
        btns[2].onclick = function () { arr.splice(i, 1); dirty(); render(); };
        card.appendChild(fieldText("YouTube ID", v.id, function (val) { v.id = val; dirty(); render(); }));
        card.appendChild(fieldText("Heading (lightbox)", v.heading, function (val) { v.heading = val; dirty(); }));
        card.appendChild(fieldText("Sub (lightbox)", v.sub, function (val) { v.sub = val; dirty(); }));
        card.appendChild(fieldText("Caption title", v.captionTitle, function (val) { v.captionTitle = val; dirty(); }));
        card.appendChild(fieldText("Caption sub", v.captionSub, function (val) { v.captionSub = val; dirty(); }));
        videoThumbFields(v, dirty).forEach(function (f) { card.appendChild(f); });
        list.appendChild(card);
      });
    }
    var addBtn = el("button", { type: "button", class: "admin-btn admin-btn--small", text: "+ Add video" });
    addBtn.onclick = function () { arr.push({ id: "", heading: "", sub: "", captionTitle: "", captionSub: "", poster: false, thumb: null, thumbClass: "", thumbW: 480, thumbH: 360, ratio: "" }); dirty(); render(); };
    render();
    box.appendChild(list); box.appendChild(addBtn);
    return box;
  }

  /* Releases / downloadable versions editor for the `releases` block. */
  function releasesItemsEditor(b, dirty) {
    var arr = b.items || (b.items = []);
    var box = el("div", { class: "admin-sub" }, [el("span", { text: "Versions", style: "font-weight:500;color:var(--text)" })]);
    var list = el("div", { class: "admin-obj-list" });
    function render() {
      clear(list);
      arr.forEach(function (it, i) {
        var card = el("div", { class: "admin-obj-card" }, [el("div", { class: "admin-obj-card__head" }, [
          el("strong", { text: "v" + (i + 1) + (it.version ? " — " + it.version : "") }),
          el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↑", title: "Move up" }),
          el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↓", title: "Move down" }),
          el("button", { type: "button", class: "admin-btn admin-btn--small admin-btn--danger", text: "✕", title: "Delete" })
        ])]);
        var btns = card.querySelectorAll("button");
        btns[0].onclick = function () { if (i > 0) { arr[i] = arr.splice(i - 1, 1, arr[i])[0]; dirty(); render(); } };
        btns[1].onclick = function () { if (i < arr.length - 1) { var t = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t; dirty(); render(); } };
        btns[2].onclick = function () { arr.splice(i, 1); dirty(); render(); };
        card.appendChild(fieldText("Version label (e.g. v.1.0.0.6 — API handling rework)", it.version, function (v) { it.version = v; dirty(); }, { full: true }));
        card.appendChild(fieldText("Date (e.g. 17 Jan 2026)", it.date, function (v) { it.date = v; dirty(); }));
        card.appendChild(fieldSelect("Badge", it.badge || "", [{ value: "", label: "None" }, { value: "latest", label: "Latest" }, { value: "prerelease", label: "Pre-release" }], function (v) { it.badge = v; dirty(); }));
        card.appendChild(fieldText("Download URL", it.href, function (v) { it.href = v; dirty(); }, { type: "url", full: true }));
        card.appendChild(stringsList("Change notes (one per line, HTML allowed)", it.changes || (it.changes = []), function (a) { it.changes = a; dirty(); }));
        list.appendChild(card);
      });
    }
    var addBtn = el("button", { type: "button", class: "admin-btn admin-btn--small admin-add-btn", text: "+ Add version" });
    addBtn.onclick = function () { arr.push({ version: "New version", date: "", badge: arr.length ? "" : "latest", href: "", changes: [] }); dirty(); render(); };
    render();
    box.appendChild(list); box.appendChild(addBtn);
    return box;
  }

  /* Accordion sections editor for the `accordion` block (Features / Requirements / etc.). */
  function accordionSectionsEditor(b, dirty) {
    var arr = b.items || (b.items = []);
    var box = el("div", { class: "admin-sub" }, [el("span", { text: "Sections", style: "font-weight:500;color:var(--text)" })]);
    var list = el("div", { class: "admin-obj-list" });
    function render() {
      clear(list);
      arr.forEach(function (sec, i) {
        var card = el("div", { class: "admin-obj-card" }, [el("div", { class: "admin-obj-card__head" }, [
          el("strong", { text: (i + 1) + ". " + (sec.label || "(untitled)") }),
          el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↑", title: "Move up" }),
          el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↓", title: "Move down" }),
          el("button", { type: "button", class: "admin-btn admin-btn--small admin-btn--danger", text: "✕", title: "Delete" })
        ])]);
        var btns = card.querySelectorAll("button");
        btns[0].onclick = function () { if (i > 0) { arr[i] = arr.splice(i - 1, 1, arr[i])[0]; dirty(); render(); } };
        btns[1].onclick = function () { if (i < arr.length - 1) { var t = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t; dirty(); render(); } };
        btns[2].onclick = function () { arr.splice(i, 1); dirty(); render(); };
        card.appendChild(fieldText("Summary label (e.g. Features)", sec.label, function (v) { sec.label = v; dirty(); render(); }, { full: true }));
        card.appendChild(fieldBool("Open by default", sec.open, function (v) { sec.open = v; dirty(); }));
        card.appendChild(fieldBool("Numbered list (ol) instead of bullets (ul)", sec.ordered, function (v) { sec.ordered = v; dirty(); }));
        card.appendChild(accordionListItemsEditor(sec, dirty));
        list.appendChild(card);
      });
    }
    var addBtn = el("button", { type: "button", class: "admin-btn admin-btn--small admin-add-btn", text: "+ Add section" });
    addBtn.onclick = function () { arr.push({ label: "New section", open: true, ordered: false, items: [] }); dirty(); render(); };
    render();
    box.appendChild(list); box.appendChild(addBtn);
    return box;
  }

  /* List items inside an accordion section. Each item is { strong, text } — the
     strong lead is optional; text is HTML and may include the leading separator
     (e.g. " — rest of the line"). */
  function accordionListItemsEditor(sec, dirty) {
    var arr = sec.items || (sec.items = []);
    var box = el("div", { class: "admin-field admin-field--full admin-sub" }, [el("span", { text: "Items" })]);
    var list = el("div", { class: "admin-obj-list" });
    function render() {
      clear(list);
      arr.forEach(function (it, i) {
        var card = el("div", { class: "admin-obj-card" }, [el("div", { class: "admin-obj-card__head" }, [
          el("strong", { text: "Item " + (i + 1) }),
          el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↑" }),
          el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↓" }),
          el("button", { type: "button", class: "admin-btn admin-btn--small admin-btn--danger", text: "✕" })
        ])]);
        var btns = card.querySelectorAll("button");
        btns[0].onclick = function () { if (i > 0) { arr[i] = arr.splice(i - 1, 1, arr[i])[0]; dirty(); render(); } };
        btns[1].onclick = function () { if (i < arr.length - 1) { var t = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t; dirty(); render(); } };
        btns[2].onclick = function () { arr.splice(i, 1); dirty(); render(); };
        if (typeof it === "string") { it = { strong: "", text: it }; arr[i] = it; }
        card.appendChild(fieldText("Strong lead (optional)", it.strong, function (v) { it.strong = v; dirty(); }, { full: true }));
        card.appendChild(fieldTextarea("Text (HTML allowed, keep the leading separator like ' — ')", it.text, function (v) { it.text = v; dirty(); }));
        list.appendChild(card);
      });
    }
    var addBtn = el("button", { type: "button", class: "admin-btn admin-btn--small admin-add-btn", text: "+ Add item" });
    addBtn.onclick = function () { arr.push({ strong: "", text: "" }); dirty(); render(); };
    render();
    box.appendChild(list); box.appendChild(addBtn);
    return box;
  }

  /* ============================== Resume editor ============================== */
  /* CV print-HTML generator lives in js/cv-print-html.js (shared with
     scripts/build-cv-pdf.mjs so the admin print view and the generated PDF stay
     in sync). Loaded as a global <script> in admin/index.html before admin.js. */
  function renderResumeEditor(root) {
    saveHeader(root, saveCurrentCollection);
    var r = getFile().obj;
    var dirty = function () { markDirty("resume"); };

    root.appendChild(section("General", [
      fieldText("First name", r.general && r.general.firstName, function (v) { ensure(r, "general").firstName = v; dirty(); }),
      fieldText("Last name", r.general && r.general.lastName, function (v) { ensure(r, "general").lastName = v; dirty(); }),
      fieldText("CV headline / title", r.general && r.general.cvTitle, function (v) { ensure(r, "general").cvTitle = v; dirty(); }, { full: true }),
      fieldText("Location", r.general && r.general.location, function (v) { ensure(r, "general").location = v; dirty(); }),
      fieldText("Phone (display)", r.general && r.general.phone, function (v) { ensure(r, "general").phone = v; dirty(); }),
      fieldText("Phone (tel: link)", r.general && r.general.phoneHref, function (v) { ensure(r, "general").phoneHref = v; dirty(); }),
      fieldText("Email", r.general && r.general.email, function (v) { ensure(r, "general").email = v; dirty(); }),
      fieldText("LinkedIn label", r.general && r.general.linkedinLabel, function (v) { ensure(r, "general").linkedinLabel = v; dirty(); }),
      fieldText("LinkedIn URL", r.general && r.general.linkedinHref, function (v) { ensure(r, "general").linkedinHref = v; dirty(); }, { type: "url" })
    ]));

    root.appendChild(wrapSection("Languages", stringsList("", r.languages || (r.languages = []), function (arr) { r.languages = arr; dirty(); })));

    var expFields = function (job, d) {
      var out = [
        fieldSelect("Type", job.type, [{ value: "studio", label: "Studio (with awards)" }, { value: "project", label: "Project (links to page)" }, { value: "plain", label: "Plain" }], function (v) { job.type = v; d(); }),
        fieldText("Title", job.title, function (v) { job.title = v; d(); }, { full: true }),
        fieldText("Meta (dates · location)", job.meta, function (v) { job.meta = v; d(); }, { full: true }),
        fieldText("Role", job.role, function (v) { job.role = v; d(); }, { full: true }),
        fieldTextarea("Description", job.description, function (v) { job.description = v; d(); })
      ];
      if (job.type === "project") {
        out.push(fieldText("Project name", job.project, function (v) { job.project = v; d(); }));
        out.push(fieldText("Link URL", job.link, function (v) { job.link = v; d(); }, { type: "url", full: true }));
        out.push(fieldText("Aria label", job.aria, function (v) { job.aria = v; d(); }, { full: true }));
      }
      if (job.type === "studio") {
        out.push(awardsEditor(job, d));
      }
      var hlSeg = segControl(job, "highlightsVisibility",
        [{ value: "site", label: "Site" }, { value: "cv", label: "CV" }, { value: "both", label: "Both" }, { value: "hidden", label: "Hide" }],
        "cv", d);
      out.push(stringsList("Highlights", job.highlights || (job.highlights = []), function (arr) { job.highlights = arr; d(); }, { addOnRow: hlSeg }));
      return out;
    };
    root.appendChild(wrapSection("Experience", objectList("", r.experience || (r.experience = []), expFields, {
      label: function (j) { return j.title || "(untitled)"; },
      sub: function (j) { return j.meta; },
      addLabel: "+ Add experience",
      makeNew: function () { return { type: "plain", title: "New role", meta: "", role: "", description: "" }; }
    })));

    var eduFields = function (e, d) {
      return [
        fieldText("Institution", e.institution, function (v) { e.institution = v; d(); }, { full: true }),
        fieldText("Degree / detail", e.degree, function (v) { e.degree = v; d(); }, { full: true }),
        fieldText("Period", e.period, function (v) { e.period = v; d(); }),
        visibilityControl(e, d)
      ];
    };
    root.appendChild(wrapSection("Education", objectList("", r.education || (r.education = []), eduFields, {
      label: function (e) { return e.institution || "(untitled)"; },
      sub: function (e) { return (e.period || "") + " · " + (e.visibility || "cv"); },
      addLabel: "+ Add education",
      makeNew: function () { return { period: "", institution: "New entry", degree: "", visibility: "cv" }; }
    })));

    var skillFields = function (g, d) {
      return [
        fieldText("Heading", g.heading, function (v) { g.heading = v; d(); }, { full: true }),
        fieldText("Group CSS class", g.groupClass, function (v) { g.groupClass = v; d(); }),
        fieldText("Heading CSS class", g.headingClass, function (v) { g.headingClass = v; d(); }),
        stringsList("Skills", g.items || (g.items = []), function (arr) { g.items = arr; d(); })
      ];
    };
    root.appendChild(wrapSection("Skills", objectList("", r.skills || (r.skills = []), skillFields, {
      label: function (g) { return g.heading || "(untitled)"; },
      addLabel: "+ Add skill group",
      makeNew: function () { return { id: "g" + Date.now().toString(36), groupClass: "skills-group--core", heading: "New group", headingClass: "skills-heading--featured", items: [] }; }
    })));

    var courseFields = function (c, d) {
      return [
        fieldText("Title", c.title, function (v) { c.title = v; d(); }, { full: true }),
        fieldText("Provider", c.provider, function (v) { c.provider = v; d(); }),
        fieldText("Year", c.year, function (v) { c.year = v; d(); })
      ];
    };
    root.appendChild(wrapSection("Certifications", objectList("", r.courses || (r.courses = []), courseFields, {
      label: function (c) { return c.title || "(untitled)"; },
      sub: function (c) { return (c.provider || "") + " " + (c.year || ""); },
      addLabel: "+ Add certification",
      makeNew: function () { return { title: "New certification", provider: "", year: "" }; }
    })));

    root.appendChild(generatePdfSection(r));
  }

  /* Generate / publish the resume PDF.
     - "Print View — portrait / landscape" opens cv-print HTML for browser print.
     - "Generate file — portrait / landscape" triggers GitHub Actions to build
       and commit Valentyn-Chumachenko-CV.pdf with the chosen orientation. */
  function generatePdfSection(r) {
    var siteObj = (state.files.site && state.files.site.obj) || {};

    function openPrintView(orientation) {
      var base = (window.location.href || "").replace(/\/admin\/.*$/, "/");
      var html = buildCvPrintHtml(r, siteObj, base, { orientation: orientation, pdfSafe: true });
      var w = window.open("", "_blank");
      if (!w) { toast("Allow pop-ups to open the print view.", "error"); return; }
      w.document.open();
      w.document.write(html);
      w.document.close();
    }

    function makePrintBtn(label, orientation) {
      var btn = el("button", { type: "button", class: "admin-btn admin-btn--primary admin-btn--small", text: label });
      btn.addEventListener("click", function () { openPrintView(orientation); });
      return btn;
    }

    var genBtns = [];
    function makeGenBtn(label, orientation) {
      var btn = el("button", { type: "button", class: "admin-btn admin-btn--small", text: label });
      btn.__label = label;
      btn.addEventListener("click", function () {
        if (!state.authenticated || !state.config) { toast("Sign in to generate the PDF.", "error"); showLogin(); return; }
        if (state.dirty && state.dirty["resume"]) { toast("Save the resume first — the PDF is built from the committed data.", "error"); return; }
        genBtns.forEach(function (b) { b.disabled = true; if (b !== btn) b.textContent = b.__label; });
        btn.textContent = "Triggering…";
        triggerCvPdfRebuild(orientation).then(function () {
          toast("PDF rebuild started (" + orientation + ") — commits in ~1 min.", "success");
        }).catch(function (err) { toast("Could not start PDF rebuild: " + (err.message || err), "error"); })
          .finally(function () {
            genBtns.forEach(function (b) { b.disabled = false; b.textContent = b.__label; });
          });
      });
      genBtns.push(btn);
      return btn;
    }

    var printPortrait = makePrintBtn("Print View — portrait", "portrait");
    var printLandscape = makePrintBtn("Print View — landscape", "landscape");
    var genPortrait = makeGenBtn("Generate file — portrait", "portrait");
    var genLandscape = makeGenBtn("Generate file — landscape", "landscape");

    return wrapSection("Generate PDF file", el("div", { style: "display:flex;gap:0.5rem;flex-wrap:wrap" }, [
      printPortrait, printLandscape, genPortrait, genLandscape
    ]));
  }

  /* Trigger the CV PDF rebuild workflow on GitHub via a repository_dispatch
     event. orientation: "portrait" | "landscape". */
  function triggerCvPdfRebuild(orientation) {
    var c = state.config;
    return api("/repos/" + c.owner + "/" + c.repo + "/dispatches", "POST", {
      event_type: "cv-pdf-rebuild",
      client_payload: { branch: c.branch, sender: "admin", orientation: orientation || "landscape" }
    });
  }

  function awardsEditor(job, dirty) {
    var arr = job.awards || (job.awards = []);
    var box = el("div", { class: "admin-sub" }, [el("span", { text: "Awards", style: "font-weight:500;color:var(--text)" })]);
    var list = el("div", { class: "admin-obj-list" });
    function render() {
      clear(list);
      arr.forEach(function (a, i) {
        var card = el("div", { class: "admin-obj-card" }, [el("div", { class: "admin-obj-card__head" }, [
          el("strong", { text: "Award " + (i + 1) }),
          el("button", { type: "button", class: "admin-btn admin-btn--small admin-btn--danger", text: "✕" })
        ])]);
        card.querySelector("button").onclick = function () { arr.splice(i, 1); dirty(); render(); };
        card.appendChild(fieldText("Title", a.title, function (v) { a.title = v; dirty(); }, { full: true }));
        card.appendChild(fieldText("Year", a.year, function (v) { a.year = v; dirty(); }));
        card.appendChild(fieldSelect("Kind", a.kind, [{ value: "winner", label: "Winner 🏆" }, { value: "nominee", label: "Nominee 🎬" }], function (v) { a.kind = v; dirty(); }));
        list.appendChild(card);
      });
    }
    var addBtn = el("button", { type: "button", class: "admin-btn admin-btn--small admin-add-btn", text: "+ Add award" });
    addBtn.onclick = function () { arr.push({ title: "New award", year: "", kind: "nominee" }); dirty(); render(); };
    render(); box.appendChild(list); box.appendChild(addBtn);
    return box;
  }

  /* ============================== Studio editor ============================== */
  function renderStudioEditor(root) {
    saveHeader(root, saveCurrentCollection);
    var st = getFile().obj;
    var dirty = function () { markDirty("studio"); };

    root.appendChild(section("Studio intro", [
      fieldTextarea("Lead text", st.lead, function (v) { st.lead = v; dirty(); })
    ]));

    var photoFields = function (p, d) {
      return [
        fieldImage("Preview image", p.preview, function (v) { p.preview = v; d(); }),
        fieldImage("Full image (lightbox)", p.hq, function (v) { p.hq = v; d(); }),
        fieldSelect("Orientation", p.orientation, [{ value: "portrait", label: "Portrait" }, { value: "landscape", label: "Landscape" }], function (v) { p.orientation = v; d(); }),
        fieldNumber("Width", p.w, function (v) { p.w = v; d(); }),
        fieldNumber("Height", p.h, function (v) { p.h = v; d(); }),
        fieldText("Alt text", p.alt, function (v) { p.alt = v; d(); }, { full: true })
      ];
    };
    root.appendChild(wrapSection("Photos", objectList("Studio photos", st.photos || (st.photos = []), photoFields, {
      label: function (p, i) { return "Photo " + (i + 1); },
      sub: function (p) { return p.orientation; },
      addLabel: "+ Add photo",
      makeNew: function () { return { preview: "", hq: "", orientation: "landscape", w: 1000, h: 563, alt: "" }; }
    })));

    var gearFields = function (g, d) {
      var out = [
        fieldText("Title", g.title, function (v) { g.title = v; d(); }, { full: true }),
        fieldSelect("Type", g.type, [{ value: "deflist", label: "Definition list (dt/dd)" }, { value: "text", label: "Free text" }], function (v) { g.type = v; if (v === "deflist" && !g.items) g.items = []; if (v === "text" && g.text == null) g.text = ""; d(); }),
        fieldBool("Wide card", g.wide, function (v) { g.wide = v; d(); })
      ];
      if (g.type === "deflist") out.push(gearItemsEditor(g, d));
      else out.push(fieldTextarea("Text (HTML allowed)", g.text, function (v) { g.text = v; d(); }));
      return out;
    };
    root.appendChild(wrapSection("Gear", objectList("Gear cards", st.gear || (st.gear = []), gearFields, {
      label: function (g) { return g.title || "(untitled)"; },
      sub: function (g) { return g.type; },
      addLabel: "+ Add gear card",
      makeNew: function () { return { title: "New card", wide: false, type: "deflist", items: [] }; }
    })));
  }

  /* ============================== Recommendations editor ============================== */
  function renderRecommendationsEditor(root) {
    saveHeader(root, saveCurrentCollection);
    var data = getFile().obj || (getFile().obj = {});
    if (!Array.isArray(data.items)) data.items = [];
    var arr = data.items;
    var list = el("div", { class: "admin-items" });
    var detail = el("div", {});

    function dirty() { markDirty("recommendations"); }

    function updateActiveListRow(it) {
      var idx = arr.indexOf(it);
      if (idx < 0 || !list.children[idx]) return;
      var row = list.children[idx];
      row.classList.toggle("is-hidden", !!it.hidden);
      var label = row.querySelector(".admin-item-row__label");
      if (!label) return;
      if (label.firstChild && label.firstChild.nodeType === 3) {
        label.firstChild.nodeValue = it.name || "(unnamed)";
      }
      var badge = label.querySelector(".admin-item-row__badge");
      if (it.hidden && !badge) {
        var small = label.querySelector("small");
        label.insertBefore(el("span", { class: "admin-item-row__badge", text: "hidden" }), small || null);
      } else if (!it.hidden && badge) {
        badge.remove();
      }
      var small = label.querySelector("small");
      if (small) small.textContent = [it.role, it.company, it.year].filter(Boolean).join(" · ");
      var hideBtn = row.querySelector(".admin-item-row__btns button:nth-child(3)");
      if (hideBtn) {
        hideBtn.textContent = it.hidden ? "Show" : "Hide";
        hideBtn.title = it.hidden ? "Show on the site" : "Hide from the site (without deleting)";
      }
    }

    function renderLists(anchorIndex) {
      var anchorTop =
        anchorIndex != null && list.children[anchorIndex]
          ? list.children[anchorIndex].getBoundingClientRect().top
          : null;
      var scrollPos = readAdminScrollPos();
      if (anchorIndex != null) blurActiveAdminFocus(detail);
      clear(list);
      arr.forEach(function (it, i) {
        var row = el("div", { class: "admin-item-row" + (state.selectedObj === it ? " is-active" : "") + (it.hidden ? " is-hidden" : "") }, [
          el("div", { class: "admin-item-row__label" }, [
            document.createTextNode(it.name || "(unnamed)"),
            it.hidden ? el("span", { class: "admin-item-row__badge", text: "hidden" }) : null,
            el("small", { text: [it.role, it.company, it.year].filter(Boolean).join(" · ") })
          ]),
          el("div", { class: "admin-item-row__btns" }, [
            el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↑", title: "Move up" }),
            el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↓", title: "Move down" }),
            el("button", { type: "button", class: "admin-btn admin-btn--small", text: it.hidden ? "Show" : "Hide", title: it.hidden ? "Show on the site" : "Hide from the site (without deleting)" }),
            el("button", { type: "button", class: "admin-btn admin-btn--small admin-btn--danger", text: "✕", title: "Delete" })
          ])
        ]);
        var btns = row.querySelectorAll("button");
        btns[0].onclick = function () {
          if (i > 0) { var t = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = t; dirty(); renderLists(i - 1); }
        };
        btns[1].onclick = function () {
          if (i < arr.length - 1) { var t = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t; dirty(); renderLists(i + 1); }
        };
        btns[2].onclick = function () { it.hidden = !it.hidden; dirty(); renderLists(i); };
        btns[3].onclick = function () {
          if (confirm("Delete this recommendation?")) {
            if (state.selectedObj === it) state.selectedObj = null;
            arr.splice(i, 1);
            dirty();
            renderLists();
            renderDetail();
          }
        };
        row.querySelector(".admin-item-row__label").onclick = function () {
          state.selectedObj = it;
          renderLists(i);
          renderDetail();
        };
        list.appendChild(row);
      });
      restoreAdminListScroll(anchorIndex, list, scrollPos, anchorTop);
    }

    function renderDetail() {
      clear(detail);
      var it = state.selectedObj;
      if (!it || arr.indexOf(it) < 0) {
        detail.appendChild(el("div", { class: "admin-empty", text: "Select a recommendation above to edit, or add a new one." }));
        return;
      }
      var card = el("div", { class: "admin-obj-card" }, [
        el("div", { class: "admin-obj-card__head" }, [el("strong", { text: it.name || "Recommendation" })])
      ]);
      var headStrong = card.querySelector(".admin-obj-card__head strong");
      function syncListLabels() {
        if (headStrong) headStrong.textContent = it.name || "Recommendation";
        updateActiveListRow(it);
      }
      card.appendChild(fieldImage("Avatar", it.avatar, function (v) { it.avatar = v; dirty(); }));
      card.appendChild(fieldText("Name", it.name, function (v) { it.name = v; dirty(); syncListLabels(); }, { full: true }));
      card.appendChild(fieldBool("Make name a clickable link (profile / LinkedIn / site)", it.nameLink, function (v) {
        it.nameLink = v;
        dirty();
        renderDetail();
      }));
      if (it.nameLink) {
        card.appendChild(fieldText("Name link URL", it.nameHref, function (v) { it.nameHref = v; dirty(); }, { type: "url", full: true }));
      }
      card.appendChild(fieldText("Role / title", it.role, function (v) { it.role = v; dirty(); syncListLabels(); }, { full: true }));
      card.appendChild(fieldText("Company", it.company, function (v) { it.company = v; dirty(); syncListLabels(); }, { full: true }));
      card.appendChild(fieldText("Year", it.year, function (v) { it.year = v; dirty(); syncListLabels(); }));
      card.appendChild(fieldTextarea("Quote / recommendation", it.quote, function (v) { it.quote = v; dirty(); }));
      card.appendChild(fieldBool("Hide this recommendation", it.hidden, function (v) { it.hidden = v; dirty(); syncListLabels(); }));
      detail.appendChild(card);
    }

    root.appendChild(section("Section settings", [
      fieldBool("Hide entire Recommendations block on the homepage", data.hidden, function (v) { data.hidden = v; dirty(); }),
      fieldBool("Hide heading label", data.hideHeading, function (v) { data.hideHeading = v; dirty(); }),
      fieldText("Heading", data.heading, function (v) { data.heading = v; dirty(); }, { full: true }),
      fieldText("Offset from Tools tiles (CSS, e.g. 1.25rem or 24px)", data.offsetTop || "1.25rem", function (v) {
        data.offsetTop = v;
        dirty();
      }),
      fieldText("Offset from footer (CSS, e.g. 1.5rem or 24px)", data.offsetBottom || "1.5rem", function (v) {
        data.offsetBottom = v;
        dirty();
      }),
      fieldNumber("Autoplay min (seconds)", data.autoplayMinSec, function (v) {
        data.autoplayMinSec = v == null || v === "" ? 5 : v;
        dirty();
      }),
      fieldNumber("Autoplay max (seconds)", data.autoplayMaxSec, function (v) {
        data.autoplayMaxSec = v == null || v === "" ? 10 : v;
        dirty();
      }),
      fieldNumber("Slide animation (ms)", data.animMs, function (v) {
        data.animMs = v == null || v === "" ? 350 : v;
        dirty();
      }),
      fieldText("Quote font size (CSS, e.g. 0.9rem)", data.quoteFontSize || "0.9rem", function (v) {
        data.quoteFontSize = v;
        dirty();
      }),
      fieldNumber("Quote preview length (characters)", data.quotePreviewChars != null ? data.quotePreviewChars : data.quotePreviewWords, function (v) {
        data.quotePreviewChars = v == null || v === "" ? 280 : v;
        if (data.quotePreviewWords != null) delete data.quotePreviewWords;
        dirty();
      }),
      fieldNumber("Quote expand animation (ms)", data.quoteExpandMs, function (v) {
        data.quoteExpandMs = v == null || v === "" ? 320 : v;
        dirty();
      }),
      fieldNumber("Quote collapse animation (ms)", data.quoteCollapseMs, function (v) {
        data.quoteCollapseMs = v == null || v === "" ? 520 : v;
        dirty();
      })
    ]));
    root.appendChild(el("p", {
      class: "admin-empty",
      text: "Visible recommendations rotate at a random interval between min and max. Longer quotes collapse after N characters with gray “read more” / “show less” (expand/collapse speeds configurable above). Arrows appear when there are 2+ visible items."
    }));

    renderLists();
    renderDetail();

    root.appendChild(wrapSection("Recommendations", el("div", {}, [
      list,
      makeAddButton("+ Add recommendation", function () {
        var n = {
          name: "New person",
          nameLink: false,
          nameHref: "",
          role: "",
          company: "",
          year: "",
          quote: "",
          avatar: "",
          hidden: false
        };
        arr.push(n);
        state.selectedObj = n;
        dirty();
        renderLists();
        renderDetail();
      })
    ])));
    root.appendChild(wrapSection("Edit selected", detail));
  }

  function gearItemsEditor(g, dirty) {
    var arr = g.items || (g.items = []);
    var box = el("div", { class: "admin-sub" }, [el("span", { text: "Definition items (dt / dd)", style: "font-weight:500;color:var(--text)" })]);
    var list = el("div", { class: "admin-obj-list" });
    function render() {
      clear(list);
      arr.forEach(function (it, i) {
        var card = el("div", { class: "admin-obj-card" }, [el("div", { class: "admin-obj-card__head" }, [
          el("strong", { text: "Item " + (i + 1) }),
          el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↑" }),
          el("button", { type: "button", class: "admin-btn admin-btn--small", text: "↓" }),
          el("button", { type: "button", class: "admin-btn admin-btn--small admin-btn--danger", text: "✕" })
        ])]);
        var btns = card.querySelectorAll("button");
        btns[0].onclick = function () { if (i > 0) { arr[i] = arr.splice(i - 1, 1, arr[i])[0]; dirty(); render(); } };
        btns[1].onclick = function () { if (i < arr.length - 1) { var t = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t; dirty(); render(); } };
        btns[2].onclick = function () { arr.splice(i, 1); dirty(); render(); };
        card.appendChild(fieldText("Label (dt)", it.dt, function (v) { it.dt = v; dirty(); }));
        card.appendChild(fieldTextarea("Value (dd, HTML allowed)", it.dd, function (v) { it.dd = v; dirty(); }));
        list.appendChild(card);
      });
    }
    var addBtn = el("button", { type: "button", class: "admin-btn admin-btn--small", text: "+ Add item" });
    addBtn.onclick = function () { arr.push({ dt: "", dd: "" }); dirty(); render(); };
    render(); box.appendChild(list); box.appendChild(addBtn);
    return box;
  }

  /* ============================== shared builders ============================== */
  function section(title, fields) {
    var sec = el("section", { class: "admin-section" }, [el("h3", { class: "admin-section__title", text: title })]);
    var grid = el("div", { class: "admin-grid" });
    fields.forEach(function (f) { if (f) grid.appendChild(f); });
    sec.appendChild(grid);
    return sec;
  }
  function wrapSection(title, contentNode) {
    var sec = el("section", { class: "admin-section" }, [el("h3", { class: "admin-section__title", text: title })]);
    sec.appendChild(contentNode);
    return sec;
  }
  function ensure(obj, key) { if (!obj[key]) obj[key] = {}; return obj[key]; }

  /* ============================== preview ============================== */
  function previewSite() {
    var data = {};
    COLLECTIONS.forEach(function (c) { data[c.id] = (state.files[c.id] && state.files[c.id].obj) || {}; });
    try { localStorage.setItem(PREVIEW_KEY, JSON.stringify(data)); } catch (e) {}
    window.open("../index.html?preview=1", "_blank");
  }

  /* ============================== init ============================== */
  function init() {
    if (isLoginPage()) { initLoginPage(); return; }
    initAppPage();
  }

  function initLoginPage() {
    var form = $("admin-login-form");
    if (form) form.addEventListener("submit", loginSubmit);
  }

  function initAppPage() {
    var form = $("admin-login-form");
    if (form) form.addEventListener("submit", loginSubmit);
    var logoutBtn = $("admin-logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);
    var previewBtn = $("admin-preview-btn");
    if (previewBtn) previewBtn.addEventListener("click", previewSite);
    var signinBtn = $("admin-signin-btn");
    if (signinBtn) signinBtn.addEventListener("click", goLogin);

    var cfg = loadConfig();

    /* The admin panel requires authorization. No saved session → go to login
       (the panel never opens unauthenticated). */
    if (!cfg || !cfg.token || !cfg.owner || !cfg.repo) { goLogin(); return; }

    state.config = cfg;
    api("/repos/" + cfg.owner + "/" + cfg.repo)
      .then(function (info) {
        if (!info || !info.ok) { state.config = null; goLogin(); return; }
        /* Authenticated: load site data (local files first for speed, then
           shas from the API) and enter the app. */
        loadLocalData()
          .then(function () { fetchShasOnly().then(function () { enterApp(true); }); })
          .catch(function () { startApp(info); });
      })
      .catch(function () { state.config = null; goLogin(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
