const fs = require("fs");
const path = require("path");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "app.js"), "utf8").replace(/<\/script/gi, "<\\/script");

const standalone = html
  .replace(/\s*<link rel="stylesheet" href="styles\.css" \/>/, `\n  <style>\n${css}\n  </style>`)
  .replace(/\s*<script src="app\.js"><\/script>/, `\n  <script>\n${js}\n  </script>`);

const output = path.join(root, "webfonts-standalone.html");
fs.writeFileSync(output, standalone, "utf8");
console.log(`Generated ${output}`);
