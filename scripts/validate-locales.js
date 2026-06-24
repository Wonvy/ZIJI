const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const s = fs.readFileSync(path.join(root, "i18n.js"), "utf8");
const enMatch = s.match(/en:\s*\{([\s\S]*?)\r?\n  \},\r?\n  fr:/);
if (!enMatch) throw new Error("Could not parse English locale from i18n.js");
const enKeys = [...enMatch[1].matchAll(/"([^"]+)":/g)].map(x => x[1]);
const locales = ["de", "es", "pt-BR", "it", "ru", "nl", "pl", "tr", "vi", "th", "id", "ar"];
for (const id of locales) {
  const j = JSON.parse(fs.readFileSync(path.join(root, "_locales", `${id}.json`), "utf8"));
  if (Object.keys(j).length !== 209) throw new Error(`${id}: ${Object.keys(j).length} keys`);
  for (const k of enKeys) if (!(k in j)) throw new Error(`${id} missing ${k}`);
  if (j["brand.name"] !== "Ziji") throw new Error(`${id} brand.name`);
  if (j["info.postscript"] !== "PostScript") throw new Error(`${id} info.postscript`);
  if (j["info.upm"] !== "Units per em") throw new Error(`${id} info.upm`);
  if (j["fontStyle.regular"] !== "Regular") throw new Error(`${id} fontStyle.regular`);
}
console.log("OK: 12 locales × 209 keys, brand/PostScript/UPM/Regular preserved");
