"use strict";
/* Regenerate Valentyn-Chumachenko-CV.pdf from the committed resume data.
   Run locally (`node scripts/build-cv-pdf.cjs`) or by the GitHub Actions
   workflow on a repository_dispatch from the admin "Generate PDF" button.
   Produces a real, text-based, ATS-friendly PDF via headless Chromium
   print-to-PDF on the same buildCvPrintHtml output the admin "Print View"
   uses — so the PDF matches the print view exactly. */
const fs = require("node:fs/promises");
const path = require("node:path");
const puppeteer = require("puppeteer");
const buildCvPrintHtml = require("../js/cv-print-html.js");

const root = path.resolve(__dirname, "..");

async function main() {
  const resume = JSON.parse(await fs.readFile(path.join(root, "data/resume.json"), "utf-8"));
  const site = JSON.parse(await fs.readFile(path.join(root, "data/site.json"), "utf-8"));
  const pdfName = (site && site.resumePdf) || "Valentyn-Chumachenko-CV.pdf";

  /* assetBase = "" -> relative asset paths; the CV has no external images, so
     this is fine. Strip the auto-print <script> (puppeteer page.pdf() doesn't
     need it and it can interfere in some headless environments). */
  const html = buildCvPrintHtml(resume, site, "").replace(/<script>[\s\S]*?<\/script>/, "");

  /* Refresh the gitignored cv-print.html source so local edits/inspection work. */
  await fs.writeFile(path.join(root, "cv-print.html"), html);

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    /* Wait for the Outfit web font so the PDF matches the print view. */
    await page.evaluate(function () { return document.fonts && document.fonts.ready; });
    await page.emulateMediaType("print");
    /* preferCSSPageSize honors the CV's @page { size: A4; margin: 6.5mm 10mm }. */
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false
    });
    const out = path.join(root, pdfName);
    await fs.writeFile(out, pdf);
    console.log("Wrote " + pdfName + " (" + pdf.length + " bytes) -> " + out);
  } finally {
    await browser.close();
  }
}

main().catch(function (e) { console.error(e); process.exit(1); });
