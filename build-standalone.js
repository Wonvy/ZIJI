const fs = require("fs");
const path = require("path");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const escapeScript = source => source.replace(/<\/script/gi, "<\\/script");
const i18n = escapeScript(fs.readFileSync(path.join(root, "i18n.js"), "utf8"));
const i18nExtra = escapeScript(fs.readFileSync(path.join(root, "i18n-extra.js"), "utf8"));
const js = escapeScript(fs.readFileSync(path.join(root, "app.js"), "utf8"));

const standalone = html
  .replace(/\s*<link rel="stylesheet" href="styles\.css" \/>/, `\n  <style>\n${css}\n  </style>`)
  .replace(
    /\s*<script src="i18n\.js"><\/script>\s*<script src="i18n-extra\.js"><\/script>\s*<script src="app\.js"><\/script>/,
    `\n  <script>\n${i18n}\n${i18nExtra}\n${js}\n  </script>`
  );

if (/<script src="(?:i18n(?:-extra)?|app)\.js"><\/script>/.test(standalone) || /<link rel="stylesheet" href="styles\.css"/.test(standalone)) {
  console.error("Standalone build failed: external asset references remain. Update build-standalone.js to match index.html.");
  process.exit(1);
}

const output = path.join(root, "ZIJI.html");
fs.writeFileSync(output, standalone, "utf8");
console.log(`Generated ${output}`);
