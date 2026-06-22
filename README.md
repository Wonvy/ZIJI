# 字观 · 本地系统字体预览器

一个完全在浏览器本地运行的系统字体浏览、搜索与可变字体预览工具。

## 启动

Local Font Access API 需要安全上下文，请不要直接双击 `index.html`。在项目目录运行：

```powershell
node server.js
```

然后使用最新版 Chrome 或 Edge 打开 <http://localhost:4173>，点击“读取系统字体”并允许访问。

## 功能

- 读取系统已安装字体（不上传字体文件）
- 实时预览文字、字号、字距、行高与配色
- 中文名称及拼音首字母即时搜索
- 自动解析 OpenType `fvar` 表并调整可变字体轴
- 跟随鼠标的字形细节放大镜
- 字体收藏、筛选和深色主题

Safari 和 Firefox 目前不提供 `queryLocalFonts()`，页面会显示兼容性提示。
