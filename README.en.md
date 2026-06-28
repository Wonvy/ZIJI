# Ziji · Local System Font Previewer

> Find typefaces, find yourself

A fully local, browser-based tool for browsing, searching, and previewing system fonts — including variable font axes. Font data never leaves your device.

[中文 README](./README.md)

## Preview

![Ziji interface (English)](./docs/screenshots/en.png)

![Ziji interface (中文)](./docs/screenshots/zh.png)

## Quick Start

The Local Font Access API requires a secure context — do not open `index.html` by double-clicking. Run this in the project directory:

```powershell
node server.js
```

Then open <http://localhost:4173> in the latest **Chrome** or **Edge**, click **Load System Fonts**, and grant permission when prompted.

## Features

- **Local access** — reads installed system fonts via the browser API; no font files are uploaded
- **Live preview** — customize preview text, size, tracking, line height, and colors
- **Smart search** — search by font name and Pinyin initials (for CJK fonts)
- **Variable fonts** — parses OpenType `fvar` tables and adjusts axes interactively
- **Glyph magnifier** — hover to inspect glyph details
- **Favorites & filters** — filter by language, weight, and style; organize favorites
- **Flexible layout** — grid / list views with adjustable columns, rows, and card size
- **Dark theme** — toggle light / dark mode
- **Multilingual UI** — 18 languages including English, 中文, 日本語, 한국어, and more

## Browser Compatibility

| Browser | Support |
| --- | --- |
| Chrome / Edge (latest) | ✅ |
| Safari / Firefox | ❌ `queryLocalFonts()` not available |

## Standalone Build

Bundle everything into a single HTML file for offline distribution:

```powershell
node build-standalone.js
```

This generates `ZIJI.html` with all styles and scripts inlined. You still need a local server or HTTPS to use the system font API.

## Privacy

Fonts are read and previewed entirely in your browser. Nothing is uploaded to any server.
