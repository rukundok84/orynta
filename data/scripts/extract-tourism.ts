/**
 * One-off extraction of the Travel & Tourism chapter text from the
 * NISR Statistical Yearbook 2025 PDF.
 *
 * Run: npx tsx data/scripts/extract-tourism.ts
 * Prerequisite (the raw PDF is git-ignored; download it first):
 *   Invoke-WebRequest -Uri "https://statistics.gov.rw/sites/default/files/documents/2026-01/RWANDA_STATISTICAL_YEARBOOK_2025.pdf" -OutFile data/raw/nisr_yearbook_2025.pdf
 * Output: data/raw/nisr_yearbook_2025.txt (full text, for audit)
 *         tourism chapter excerpt printed to the console.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
// pdf-parse v2 exports a PDFParse class (no bundled TS types).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require("pdf-parse");

const root = join(__dirname, "..", "..");
const pdfPath = join(root, "data", "raw", "nisr_yearbook_2025.pdf");
const txtPath = join(root, "data", "raw", "nisr_yearbook_2025.txt");

async function main() {
  const buffer = readFileSync(pdfPath);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const data = { text: result.text, numpages: result.total ?? 0 };
  await parser.destroy();

  writeFileSync(txtPath, data.text, "utf8");
  console.log(`Full text written: ${txtPath} (${data.text.length} chars, ${data.numpages} pages)`);

  // Locate the tourism section(s)
  const markers = ["Parks Visits", "Visitor Arrivals", "9.2 Tourism", "TOURISM"];
  for (const marker of markers) {
    const idx = data.text.indexOf(marker);
    console.log(`\n=== marker "${marker}" at ${idx} ===`);
    if (idx >= 0) {
      console.log(data.text.slice(idx, idx + 1500));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
