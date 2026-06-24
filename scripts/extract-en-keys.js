const fs = require("fs");
const path = require("path");
const i18nPath = path.join(__dirname, "..", "i18n.js");
const s = fs.readFileSync(i18nPath, "utf8");
const m = s.match(/en:\s*\{([\s\S]*?)\r?\n  \},\r?\n  fr:/);
if (!m) throw new Error("en block not found");
const en = {};
for (const line of m[1].split("\n")) {
  const km = line.match(/^\s*"([^"]+)":\s*"(.*)",?\s*$/);
  if (km) en[km[1]] = km[2];
}
console.log(JSON.stringify(Object.keys(en), null, 2));
console.error("count:", Object.keys(en).length);
