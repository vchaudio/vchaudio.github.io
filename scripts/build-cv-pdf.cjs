"use strict";
/* Regenerate Valentyn-Chumachenko-CV.pdf from the committed resume data.
   Run locally (`node scripts/build-cv-pdf.cjs [--orientation=portrait|landscape]`)
   or by the GitHub Actions workflow on a repository_dispatch from the admin
   "Generate file" buttons.
   Produces a real, text-based, ATS-friendly PDF via headless Chromium
   print-to-PDF on the same buildCvPrintHtml output the admin "Print View"
   uses — so the PDF matches the print view exactly. */
const fs = require("node:fs/promises");
const path = require("node:path");
const puppeteer = require("puppeteer");
const buildCvPrintHtml = require("../js/cv-print-html.js");

const root = path.resolve(__dirname, "..");

function parseOrientation(argv) {
  var fromArg = (argv || []).find(function (a) { return a.indexOf("--orientation=") === 0; });
  if (fromArg) {
    var v = fromArg.slice("--orientation=".length).toLowerCase();
    if (v === "portrait" || v === "landscape") return v;
  }
  var env = (process.env.CV_ORIENTATION || "").toLowerCase();
  if (env === "portrait" || env === "landscape") return env;
  return "landscape";
}

async function main() {
  var orientation = parseOrientation(process.argv.slice(2));
  var resume = JSON.parse(await fs.readFile(path.join(root, "data/resume.json"), "utf-8"));
  var site = JSON.parse(await fs.readFile(path.join(root, "data/site.json"), "utf-8"));
  var pdfName = (site && site.resumePdf) || "Valentyn-Chumachenko-CV.pdf";

  var html = buildCvPrintHtml(resume, site, "", { orientation: orientation, pdfSafe: true })
    .replace(/<script>[\s\S]*?<\/script>/, "");

  await fs.writeFile(path.join(root, "cv-print.html"), html);

  var browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  });
  try {
    var page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMediaType("print");
    var pdf = await page.pdf({
      format: "A4",
      landscape: orientation === "landscape",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false
    });
    var out = path.join(root, pdfName);
    await fs.writeFile(out, pdf);
    console.log("Wrote " + pdfName + " (" + orientation + ", " + pdf.length + " bytes) -> " + out);
  } finally {
    await browser.close();
  }
}

main().catch(function (e) { console.error(e); process.exit(1); });
