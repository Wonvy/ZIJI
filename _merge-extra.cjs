const fs = require("fs");
const path = require("path");

function fmtPatch(id, patch) {
  const lines = Object.entries(patch).map(([k, v]) =>
    `    ${JSON.stringify(k)}: ${JSON.stringify(v)},`
  );
  return `  I18N_MESSAGES[${JSON.stringify(id)}] = { ...base, ...{\n${lines.join("\n")}\n  }};`;
}

const localeIds = ["de", "es", "pt-BR", "it", "ru", "nl", "pl", "tr", "vi", "th", "id", "ar"];
const blocks = localeIds.map(id => {
  const patch = JSON.parse(fs.readFileSync(path.join("_locales", `${id}.json`), "utf8"));
  return fmtPatch(id, patch);
}).join("\n\n");

let content = fs.readFileSync("i18n-extra.js", "utf8");
if (!content.includes("/* PLACEHOLDER_LOCALES */")) {
  throw new Error("placeholder not found");
}
content = content.replace("  /* PLACEHOLDER_LOCALES */", blocks);
fs.writeFileSync("i18n-extra.js", content, "utf8");

const src = fs.readFileSync("i18n.js", "utf8");
const enMatch = src.match(/en:\s*\{([\s\S]*?)\r?\n  \},\r?\n  fr:/);
const enKeys = [...enMatch[1].matchAll(/"([^"]+)":/g)].map(m => m[1]);
const extra = fs.readFileSync("i18n-extra.js", "utf8");
const allIds = [...extra.matchAll(/I18N_MESSAGES\["([^"]+)"\]/g)].map(m => m[1]);
console.log("Locales in i18n-extra.js:", allIds.join(", "));
for (const id of allIds) {
  const re = new RegExp(`I18N_MESSAGES\\["${id.replace(/-/g, "\\-")}"\\] = \\{ \\.\\.\\.base, \\.\\.\\.\\{([\\s\\S]*?)\\n  \\}\\};`);
  const m = extra.match(re);
  if (!m) { console.error("block not found:", id); continue; }
  const keys = [...m[1].matchAll(/"([^"]+)":/g)].map(x => x[1]);
  const missing = enKeys.filter(k => !keys.includes(k));
  console.log(id, missing.length ? `MISSING ${missing.length}` : "OK", keys.length);
}
