/**
 * Generates _locales/*.json from embedded professional UI translations.
 * Run: node scripts/generate-locale-json.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const i18nPath = path.join(root, "i18n.js");
const s = fs.readFileSync(i18nPath, "utf8");
const m = s.match(/en:\s*\{([\s\S]*?)\r?\n  \},\r?\n  fr:/);
if (!m) throw new Error("Could not parse English locale from i18n.js");
const enKeys = [...m[1].matchAll(/"([^"]+)":/g)].map(x => x[1]);

/** @type {Record<string, Record<string, string>>} */
const LOCALES = require("./locale-translations-data.js");

const outDir = path.join(root, "_locales");
fs.mkdirSync(outDir, { recursive: true });

const report = [];
for (const [id, table] of Object.entries(LOCALES)) {
  const missing = enKeys.filter(k => !(k in table));
  const extra = Object.keys(table).filter(k => !enKeys.includes(k));
  if (missing.length) throw new Error(`${id}: missing keys: ${missing.join(", ")}`);
  if (extra.length) throw new Error(`${id}: extra keys: ${extra.join(", ")}`);
  const ordered = {};
  for (const k of enKeys) ordered[k] = table[k];
  const file = path.join(outDir, `${id}.json`);
  fs.writeFileSync(file, JSON.stringify(ordered, null, 2) + "\n", "utf8");
  report.push({ file: `_locales/${id}.json`, keys: enKeys.length });
}

console.log("Created locale files:");
for (const row of report) console.log(`  ${row.file}: ${row.keys} keys`);
