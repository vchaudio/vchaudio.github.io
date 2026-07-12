/* Shared, dependency-free CV print-HTML generator.
   Used by admin/admin.js (browser, for the "Print View" and to feed the PDF
   build) and by scripts/build-cv-pdf.mjs (Node, in the GitHub Action that
   regenerates Valentyn-Chumachenko-CV.pdf). Keep this in sync with the resume
   data shape (data/resume.json, data/site.json). Editing the markup/<style>
   below restyles both the on-screen print view and the generated PDF. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.buildCvPrintHtml = factory();
})(typeof self !== "undefined" ? self : this, function () {
function buildCvPrintHtml(r, site, assetBase = "") {
    var g = (r && r.general) || {};
    var hero = (site && site.hero) || {};
    function esc(s) {
      return (s == null ? "" : String(s)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    function asset(src) {
      if (!src) return "";
      if (/^https?:\/\//.test(src) || /^data:/.test(src)) return src;
      return (assetBase || "") + src.replace(/^\/+/, "");
    }
    /* Minimal inline stroke icons (no text content -> ATS reads only the labels). */
    function icon(name) {
      var p = {
        loc: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
        tel: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
        mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
        li: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
        web: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'
      };
      return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (p[name] || "") + "</svg>";
    }
    var fullName = esc((g.firstName || "") + " " + (g.lastName || "")).trim();
    var tagline = esc(g.cvTitle || hero.role || "");

    /* Single-line contact (location · phone · email · linkedin · web) with mini
       icons, plus a compact languages line — text-based, one column (ATS-safe). */
    var contactBits = [];
    if (g.location) contactBits.push('<span class="c-loc">' + icon("loc") + esc(g.location) + "</span>");
    if (g.phone) contactBits.push('<a class="c-tel" href="tel:' + esc(g.phoneHref) + '">' + icon("tel") + esc(g.phone) + "</a>");
    if (g.email) contactBits.push('<a class="c-mail" href="mailto:' + esc(g.email) + '">' + icon("mail") + esc(g.email) + "</a>");
    if (g.linkedinLabel) contactBits.push('<a class="c-li" href="' + esc(g.linkedinHref) + '">' + icon("li") + esc(g.linkedinLabel) + "</a>");
    contactBits.push('<a class="c-web" href="https://vchaudio.com/">' + icon("web") + 'vchaudio.com <span class="c-note">(portfolio)</span></a>');
    var contactLine = contactBits.join(' <span class="sep">·</span> ');

    /* Professional summary (from the site BIO block) and a Languages section
       rendered in the side column of the two-column lower band. */
    var summary = hero.bio
      ? '<section class="sec sum"><h2 class="sec-h">Professional Summary</h2><p class="sum-text">' + esc(hero.bio) + "</p></section>"
      : "";
    var languages = (r.languages && r.languages.length)
      ? '<section class="sec sec-col"><h2 class="sec-h">Languages</h2><ul class="vlist lang-list">' +
        r.languages.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul></section>"
      : "";

    /* Experience — typography only (no cards/borders) for a clean, compact,
       ATS-friendly single column. */
    var jobs = (r.experience || []).map(function (job) {
      var head = '<div class="job-head"><span class="job-title">' + esc(job.title) + "</span>" +
                 (job.meta ? '<span class="job-meta">' + esc(job.meta) + "</span>" : "") + "</div>";
      var body = "";
      if (job.type === "project" && job.project) body += '<p class="job-sub"><span class="job-sub-label">Project:</span> ' + esc(job.project) + "</p>";
      if (job.description) body += '<p class="job-role">' + esc(job.description) + "</p>";
      if (job.type === "studio" && job.awards && job.awards.length) {
        body += '<p class="job-awards"><span class="aw-label">Awards</span>' + job.awards.map(function (a) {
          var label = a.kind === "winner" ? "Winner" : (a.kind === "nominee" ? "Nominated" : (a.kind || ""));
          return '<span class="award">' + esc(label) + " — " + esc(a.title) + ", " + esc(a.year) + "</span>";
        }).join(' <span class="sep">·</span> ') + "</p>";
      }
      var hv = job.highlightsVisibility || "cv";
      if (job.highlights && job.highlights.length && (hv === "cv" || hv === "both")) {
        body += '<ul class="hl">' + job.highlights.map(function (hl) { return "<li>" + esc(hl) + "</li>"; }).join("") + "</ul>";
      }
      return '<article class="job">' + head + body + "</article>";
    }).join("");

    /* Education (items marked for the CV) — institution + period on line 1,
       degree on its own line 2 so long names don't crowd the degree. */
    var education = (r.education || []).filter(function (e) { return e.visibility === "cv"; })
      .map(function (e) {
        var line1 = '<div class="edu-line1"><span class="edu-inst">' + esc(e.institution || "") + "</span>" +
                    (e.period ? '<span class="edu-period">' + esc(e.period) + "</span>" : "") + "</div>";
        var line2 = e.degree ? '<div class="edu-degree">' + esc(e.degree) + "</div>" : "";
        return '<div class="edu-row">' + line1 + line2 + "</div>";
      }).join("");

    /* Certifications */
    var courses = (r.courses || []).map(function (c) {
      return '<div class="cert-row"><span class="cert-title">' + esc(c.title) + "</span>" +
             '<span class="cert-meta">' + esc(c.provider) + (c.year ? ", " + esc(c.year) : "") + "</span></div>";
    }).join("");

    /* Skills — vertical list per group (one item per line) so the sidebar
       doesn't look crammed; group heading as a small muted sub-label. */
    var skills = (r.skills || []).map(function (grp) {
      var items = (grp.items || []).map(function (it) { return "<li>" + esc(it) + "</li>"; }).join("");
      return '<div class="skill-group"><p class="skill-grp-h">' + esc(grp.heading) + "</p>" +
             '<ul class="vlist skill-list">' + items + "</ul></div>";
    }).join("");

    var style = [
      ":root{--accent:#b9783a;--ink:#1f1d1a;--muted:#6b6660;--line:#e4ddd3}",
      "@page{size:A4;margin:6.5mm 10mm}",
      "*{box-sizing:border-box}",
      "html,body{margin:0;padding:0}",
      'body{font-family:"Outfit","Segoe UI",system-ui,sans-serif;font-size:8.6pt;line-height:1.24;color:var(--ink);background:#fff}',
      "a{color:var(--ink);text-decoration:none}",
      ".hd{margin-bottom:0.3rem;border-bottom:2px solid var(--ink);padding-bottom:0.22rem}",
      ".hd h1{margin:0;font-size:16pt;font-weight:700;letter-spacing:-0.01em;line-height:1.05}",
      ".hd .tag{margin:0.05rem 0 0;font-size:9.3pt;font-weight:500;color:var(--accent)}",
      ".hd .contact{margin:0.14rem 0 0;font-size:8pt;color:var(--muted)}",
      ".hd .contact .sep{color:var(--line);margin:0 0.14rem}",
      ".hd .contact a{color:var(--muted)}",
      ".hd .contact .c-note{color:var(--line)}",
      ".ic{width:0.7rem;height:0.7rem;vertical-align:-0.09rem;color:var(--muted);margin-right:0.15rem;display:inline-block;flex:none}",
      ".sec{margin-top:0.46rem}",
      ".sec-col{margin-top:0.4rem}",
      ".col .sec:first-child{margin-top:0}",
      ".sec-h{margin:0 0 0.24rem;font-size:8.2pt;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:var(--ink);border-bottom:1px solid var(--line);padding-bottom:0.1rem}",
      ".sum .sum-text{margin:0;font-size:8.1pt;line-height:1.26;color:#2a2723}",
      ".vlist{margin:0;padding:0;list-style:none}",
      ".vlist li{position:relative;margin:0.06rem 0;padding-left:0.62rem;font-size:8.1pt;line-height:1.26;color:#2a2723}",
      '.vlist li::before{content:"";position:absolute;left:0;top:0.5em;width:0.22rem;height:0.22rem;border-radius:50%;background:var(--accent);opacity:0.7}',
      ".skill-group{margin:0 0 0.26rem}",
      ".skill-group:last-child{margin-bottom:0}",
      ".skill-grp-h{margin:0 0 0.1rem;font-size:7.4pt;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted)}",
      ".two-col{display:grid;grid-template-columns:1.85fr 1fr;gap:0 1.1rem;align-items:start;margin-top:0.46rem}",
      ".col{min-width:0}",
      ".tl{position:relative;padding-left:0.92rem;margin-top:0.06rem}",
      ".tl::before{content:\"\";position:absolute;left:0.27rem;top:0.38rem;bottom:0.28rem;width:2px;margin-left:-1px;background:rgba(183,120,58,0.4)}",
      ".job{position:relative;margin:0 0 0.2rem}",
      ".job:last-child{margin-bottom:0}",
      ".tl .job::before{content:\"\";position:absolute;left:-0.92rem;top:0.2rem;width:0.54rem;height:0.54rem;border-radius:50%;background:#fff;border:2px solid var(--accent);box-sizing:border-box}",
      ".job-head{display:flex;flex-direction:column;gap:0}",
      ".job-title{font-size:9pt;font-weight:700;color:var(--ink)}",
      ".job-meta{margin-top:0;font-size:7.9pt;color:var(--muted)}",
      ".job-sub{margin:0.03rem 0 0;font-size:8.4pt;font-weight:600;color:var(--ink)}",
      ".job-sub-label{color:var(--accent);font-weight:700;letter-spacing:0.04em;margin-right:0.25rem}",
      ".job-role{margin:0.02rem 0 0;font-size:8.3pt;color:var(--muted)}",
      ".job-awards{margin:0.08rem 0 0;font-size:7.9pt;color:var(--accent)}",
      ".job-awards .aw-label{font-size:7.2pt;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-right:0.3rem}",
      ".job-awards .sep{color:var(--line);margin:0 0.14rem}",
      ".hl{margin:0.06rem 0 0;padding:0;list-style:none}",
      ".hl li{position:relative;margin:0.01rem 0;padding-left:0.56rem;font-size:8.1pt;line-height:1.2;color:#2a2723}",
      '.hl li::before{content:"–";position:absolute;left:0;color:var(--accent);font-weight:700}',
      ".edu-row{margin:0 0 0.12rem}",
      ".edu-row:last-child{margin-bottom:0}",
      ".edu-line1{display:flex;justify-content:space-between;align-items:baseline;gap:0.4rem}",
      ".edu-inst{font-weight:700;font-size:8.3pt}",
      ".edu-degree{margin:0.04rem 0 0;font-size:7.9pt;color:var(--muted)}",
      ".edu-period{font-size:7.8pt;color:var(--muted);white-space:nowrap}",
      ".cert-row{display:flex;justify-content:space-between;align-items:baseline;gap:0.4rem;margin:0 0 0.1rem}",
      ".cert-title{font-weight:600;font-size:8.3pt}",
      ".cert-meta{font-size:7.8pt;color:var(--muted)}",
      "@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}"
    ].join("\n");

    var body = [
      '<div class="page">',
      '<header class="hd">',
      "<h1>" + fullName + "</h1>",
      '<p class="tag">' + tagline + "</p>",
      '<p class="contact">' + contactLine + "</p>",
      "</header>",
      summary,
      '<div class="two-col">',
      '<div class="col col-main"><section class="sec sec-col"><h2 class="sec-h">Experience</h2><div class="tl">' + jobs + "</div></section></div>",
      '<div class="col col-side">',
      languages,
      (r.skills && r.skills.length) ? '<section class="sec sec-col"><h2 class="sec-h">Skills</h2>' + skills + "</section>" : "",
      "</div>",
      "</div>",
      (r.courses && r.courses.length) ? '<section class="sec"><h2 class="sec-h">Certifications</h2>' + courses + "</section>" : "",
      education ? '<section class="sec"><h2 class="sec-h">Education</h2>' + education + "</section>" : "",
      "</div>"
    ].join("\n");

    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>' +
      "<title>" + fullName + " — CV</title>" +
      '<link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>' +
      '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet"/>' +
      "<style>\n" + style + "\n</style></head><body>\n" + body + "\n" +
      '<script>window.addEventListener("load",function(){setTimeout(function(){try{window.print()}catch(e){}},300)})</script>' +
      "</body></html>";
  }
  return buildCvPrintHtml;
});
