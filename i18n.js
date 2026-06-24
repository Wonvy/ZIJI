const I18N_LOCALE_META = [
  { id: "zh-CN", label: "中文" },
  { id: "zh-TW", label: "繁體中文" },
  { id: "en", label: "English" },
  { id: "ja", label: "日本語" },
  { id: "ko", label: "한국어" },
  { id: "fr", label: "Français" },
  { id: "de", label: "Deutsch" },
  { id: "es", label: "Español" },
  { id: "pt-BR", label: "Português" },
  { id: "it", label: "Italiano" },
  { id: "ru", label: "Русский" },
  { id: "nl", label: "Nederlands" },
  { id: "pl", label: "Polski" },
  { id: "tr", label: "Türkçe" },
  { id: "vi", label: "Tiếng Việt" },
  { id: "th", label: "ไทย" },
  { id: "id", label: "Indonesia" },
  { id: "ar", label: "العربية" }
];

const I18N_MESSAGES = {
  "zh-CN": {
    "meta.title": "字己 · 本地字体预览",
    "meta.langMenu": "界面语言",
    "brand.name": "字己",
    "brand.tagline": "找字体，也找自己",
    "welcome.lead": "授权后即可搜索、比较并细看系统中安装的字体，所有处理都在浏览器内完成",
    "welcome.loadFonts": "读取系统字体",
    "welcome.privacy": "字体仅在本机处理",
    "welcome.progressPreparing": "准备读取字体…",
    "welcome.supportNote": "推荐使用最新版 Chrome 或 Edge",
    "header.previewLabel": "预览文字",
    "header.previewInputAria": "卡片预览文字",
    "header.previewInputTitle": "双击清空预览文字",
    "header.previewHistoryAria": "最近预览文字",
    "header.previewHistoryTitle": "悬停查看最近输入",
    "header.previewHistoryPanelAria": "预览文字历史",
    "header.magnifierOff": "关闭放大镜",
    "header.magnifierOn": "开启放大镜",
    "header.themeToggle": "切换主题",
    "header.resizeTopbar": "拖动调整顶部栏高度",
    "toolbar.fontLibrary": "字体库",
    "toolbar.fontCountSuffix": " 款字体",
    "toolbar.reload": "刷新字体",
    "toolbar.filtersAria": "字体筛选",
    "toolbar.filterSortStyleAria": "筛选排序样式",
    "toolbar.viewControlsAria": "视图控制栏",
    "filter.all": "全部",
    "filter.favorite": "收藏",
    "filter.searchPlaceholder": "搜索字体 / 拼音",
    "filter.clearSearch": "清除搜索",
    "filter.suggestCommon": "常见类型",
    "filter.suggestBrands": "中文品牌",
    "filter.language": "语言",
    "filter.languageAll": "不限语言",
    "filter.languageChinese": "中文字体",
    "filter.languageLatin": "英文字体",
    "filter.variable": "可变字体",
    "filter.weight": "字重",
    "filter.weightScanning": "正在扫描字重…",
    "filter.sort": "排序",
    "filter.sortGeneral": "常规",
    "filter.sortByName": "名称排序",
    "filter.sortByFavorite": "收藏优先",
    "filter.sortLanguageGroup": "语言",
    "filter.sortChineseFirst": "中文优先",
    "filter.sortLatinFirst": "英文优先",
    "filter.sortShapeGroup": "字形比例",
    "filter.sortSquare": "首字接近正方形",
    "filter.sortNarrow": "首字由瘦到宽",
    "filter.sortWide": "首字由宽到瘦",
    "filter.style": "样式",
    "filter.styleDefault": "默认",
    "filter.styleMenu": "预览样式",
    "filter.styleMenuNamed": "预览样式：{name}",
    "filter.badgeAll": "全部",
    "filter.badgeItems": "{count} 项",
    "sort.name": "名称",
    "sort.favorite": "收藏",
    "sort.chineseFirst": "中文",
    "sort.latinFirst": "英文",
    "sort.square": "方形",
    "sort.narrow": "瘦→宽",
    "sort.wide": "宽→瘦",
    "view.grid": "网格视图",
    "view.single": "单字极简视图",
    "view.columns": "列",
    "view.columnsTitle": "每行显示列数",
    "view.columnsAria": "每行显示列数",
    "view.rows": "行",
    "view.rowsTitle": "每页显示行数",
    "view.rowsAria": "每页显示行数",
    "view.size": "大小",
    "view.sizeTitle": "单字卡片大小",
    "view.sizeAria": "单字卡片大小",
    "view.options": "视图选项",
    "view.focusMode": "仅显示预览",
    "view.collapseFamily": "折叠家族字体",
    "scan.variableFonts": "正在识别可变字体",
    "scan.variableDone": "可变字体识别完成",
    "scan.readingMeta": "正在读取字符与字重信息",
    "scan.measuringAspect": "正在测量首字宽高比",
    "favorite.categories": "收藏分类",
    "favorite.newCategory": "新建分类",
    "favorite.export": "导出",
    "favorite.import": "导入",
    "empty.noFonts": "没有找到匹配的字体",
    "status.hoverHint": "将鼠标移到字体卡片查看信息",
    "status.favorited": "★ 已收藏",
    "status.page": "第 {current} / {total} 页",
    "status.pageCount": "本页 {shown} / {total} 款",
    "status.sampleSize": "字号",
    "status.decreaseSize": "减小字号",
    "status.increaseSize": "增大字号",
    "status.sampleSizeAria": "卡片预览字号",
    "pagination.aria": "字体分页",
    "pagination.prev": "上一页",
    "pagination.next": "下一页",
    "panel.collapseLibrary": "折叠字体库",
    "panel.expandLibrary": "展开字体库",
    "panel.collapseDetail": "折叠详情",
    "panel.expandDetail": "展开详情",
    "panel.resizeDetail": "拖动调整栏宽",
    "detail.selectFont": "请选择字体",
    "detail.previewTab": "预览",
    "detail.infoTab": "信息",
    "detail.tabsAria": "详情面板",
    "detail.previewTextAria": "预览文字",
    "detail.previewPlaceholder": "双击编辑预览文字",
    "detail.stageHint": "双击编辑 · 悬停看细节 · 滚轮调字号",
    "detail.bgColor": "背景颜色",
    "detail.textColor": "文字颜色",
    "detail.axisDetecting": "正在检测可变轴…",
    "detail.reset": "恢复默认",
    "detail.fontSize": "字号",
    "detail.letterSpacing": "字间距",
    "detail.lineHeight": "行高",
    "detail.favorite": "收藏字体",
    "detail.category": "设置收藏分类",
    "detail.axisCount": "{count} 个可变轴",
    "detail.axisHover": "悬停预览",
    "detail.axisNone": "暂无字体参数",
    "detail.axisStandard": "标准字体 · 无可变轴",
    "detail.axisLive": "{count} 个可变轴 · 拖动实时预览",
    "detail.variableFont": "可变字体",
    "detail.standardFont": "标准字体",
    "detail.pendingDetect": "待检测",
    "info.basic": "基础信息",
    "info.naming": "命名与版权",
    "info.metrics": "度量与样式",
    "info.family": "字体家族",
    "info.postscript": "PostScript",
    "info.subfamily": "子族名称",
    "info.format": "轮廓格式",
    "info.fileSize": "文件大小",
    "info.glyphs": "字形数量",
    "info.upm": "Units per em",
    "info.weight": "内部字重",
    "info.width": "内部宽度",
    "info.languageSupport": "字符支持",
    "info.aspect": "首字宽高比",
    "info.tables": "数据表",
    "info.version": "版本",
    "info.designer": "设计师",
    "info.manufacturer": "厂商",
    "info.copyright": "版权",
    "info.license": "许可证",
    "info.ascender": "升部",
    "info.descender": "降部",
    "info.lineGap": "行距",
    "info.capHeight": "Cap 高度",
    "info.xHeight": "x 高度",
    "info.italicAngle": "斜体角度",
    "info.fixedPitch": "等宽字体",
    "info.created": "创建日期",
    "info.modified": "修改日期",
    "info.bbox": "边界框",
    "info.embedding": "嵌入限制",
    "info.features": "特性表",
    "info.copyFamily": "点击复制字体名称",
    "info.copyPostscript": "点击复制 PostScript 名称",
    "info.copyDesigner": "点击复制设计师",
    "info.copyCopyright": "点击复制版权信息",
    "info.copyLicense": "点击复制许可证",
    "hover.previewAria": "字体预览",
    "hover.close": "关闭预览",
    "hover.subsamplesAria": "附加样张",
    "hover.copyName": "点击复制字体名称",
    "hover.copyFullName": "点击复制完整字体名称",
    "previewStyle.title": "预览样式",
    "previewStyle.close": "关闭",
    "previewStyle.fontLabel": "预览字体",
    "previewStyle.fontAria": "预览字体",
    "previewStyle.tabsAria": "预览样式面板",
    "previewStyle.editTab": "编辑样式",
    "previewStyle.manageTab": "样式管理",
    "previewStyle.layers": "图层",
    "previewStyle.layerMoveUp": "上移图层",
    "previewStyle.layerMoveDown": "下移图层",
    "previewStyle.layerDelete": "删除图层",
    "previewStyle.manageStyles": "管理样式",
    "previewStyle.newStyle": "新建样式",
    "previewStyle.rename": "样式名称",
    "previewStyle.confirm": "确定",
    "previewStyle.cancel": "取消",
    "previewStyle.save": "保存",
    "previewStyle.export": "导出",
    "previewStyle.import": "导入",
    "defaults.cardPreviewText": "字体有光",
    "defaults.previewInputFallback": "在这里输入预览文字",
    "fontStyle.regular": "Regular",
    "toast.copied": "已复制{label}：{value}",
    "toast.localeChanged": "界面语言已切换",
    "toast.noLocalFontApi": "当前浏览器不支持 Local Font Access API",
    "toast.loadFontsFirst": "请先加载字体",
    "toast.styleRestored": "已恢复默认预览",
    "toast.styleNotFound": "样式不存在",
    "toast.styleApplied": "已应用「{name}」",
    "toast.defaultNotEditable": "默认样式不可编辑，请新建样式",
    "toast.singleCardSize": "单字卡片 {size} × {size}",
    "toast.gridLayout": "{rows} 行 × {columns} 列",
    "welcome.supportNoApi": "当前浏览器可能不支持系统字体读取，请使用最新版 Chrome 或 Edge。",
    "welcome.supportDenied": "未获得字体访问权限，请在浏览器设置中允许后重试。",
    "welcome.supportFailed": "读取失败：{message}",
    "welcome.supportBlocked": "当前浏览器不支持系统字体读取，请使用最新版 Chrome 或 Edge。",
    "copy.fontName": "字体名称",
    "copy.postscript": "PostScript 名称",
    "copy.designer": "设计师",
    "copy.copyright": "版权信息",
    "copy.license": "许可证",
    "copy.svg": "SVG 轮廓"
  },
  en: {
    "meta.title": "Ziji · Local Font Preview",
    "meta.langMenu": "Language",
    "brand.name": "Ziji",
    "brand.tagline": "Find typefaces, find yourself",
    "welcome.lead": "After permission is granted, search, compare, and inspect installed fonts locally — all in your browser.",
    "welcome.loadFonts": "Load System Fonts",
    "welcome.privacy": "Fonts stay on this device",
    "welcome.progressPreparing": "Preparing to read fonts…",
    "welcome.supportNote": "Chrome or Edge (latest) recommended",
    "header.previewLabel": "Preview text",
    "header.previewInputAria": "Card preview text",
    "header.previewInputTitle": "Double-click to clear preview text",
    "header.previewHistoryAria": "Recent preview text",
    "header.previewHistoryTitle": "Hover to view recent entries",
    "header.previewHistoryPanelAria": "Preview text history",
    "header.magnifierOff": "Disable magnifier",
    "header.magnifierOn": "Enable magnifier",
    "header.themeToggle": "Toggle theme",
    "header.resizeTopbar": "Drag to resize top bar",
    "toolbar.fontLibrary": "Library",
    "toolbar.fontCountSuffix": " fonts",
    "toolbar.reload": "Reload fonts",
    "toolbar.filtersAria": "Font filters",
    "toolbar.filterSortStyleAria": "Filter, sort, and style",
    "toolbar.viewControlsAria": "View controls",
    "filter.all": "All",
    "filter.favorite": "Favorites",
    "filter.searchPlaceholder": "Search fonts / pinyin",
    "filter.clearSearch": "Clear search",
    "filter.suggestCommon": "Common styles",
    "filter.suggestBrands": "Chinese brands",
    "filter.language": "Language",
    "filter.languageAll": "Any language",
    "filter.languageChinese": "Chinese fonts",
    "filter.languageLatin": "Latin fonts",
    "filter.variable": "Variable fonts",
    "filter.weight": "Weight",
    "filter.weightScanning": "Scanning weights…",
    "filter.sort": "Sort",
    "filter.sortGeneral": "General",
    "filter.sortByName": "Sort by name",
    "filter.sortByFavorite": "Favorites first",
    "filter.sortLanguageGroup": "Language",
    "filter.sortChineseFirst": "Chinese first",
    "filter.sortLatinFirst": "Latin first",
    "filter.sortShapeGroup": "Shape ratio",
    "filter.sortSquare": "First glyph near square",
    "filter.sortNarrow": "First glyph narrow → wide",
    "filter.sortWide": "First glyph wide → narrow",
    "filter.style": "Style",
    "filter.styleDefault": "Default",
    "filter.styleMenu": "Preview style",
    "filter.styleMenuNamed": "Preview style: {name}",
    "filter.badgeAll": "All",
    "filter.badgeItems": "{count}",
    "sort.name": "Name",
    "sort.favorite": "Favorite",
    "sort.chineseFirst": "Chinese",
    "sort.latinFirst": "Latin",
    "sort.square": "Square",
    "sort.narrow": "Narrow→Wide",
    "sort.wide": "Wide→Narrow",
    "view.grid": "Grid view",
    "view.single": "Single-glyph view",
    "view.columns": "Cols",
    "view.columnsTitle": "Columns per row",
    "view.columnsAria": "Columns per row",
    "view.rows": "Rows",
    "view.rowsTitle": "Rows per page",
    "view.rowsAria": "Rows per page",
    "view.size": "Size",
    "view.sizeTitle": "Single card size",
    "view.sizeAria": "Single card size",
    "view.options": "View options",
    "view.focusMode": "Preview only",
    "view.collapseFamily": "Collapse family fonts",
    "scan.variableFonts": "Detecting variable fonts",
    "scan.variableDone": "Variable font scan complete",
    "scan.readingMeta": "Reading glyph and weight data",
    "scan.measuringAspect": "Measuring first-glyph aspect ratio",
    "favorite.categories": "Favorite categories",
    "favorite.newCategory": "New category",
    "favorite.export": "Export",
    "favorite.import": "Import",
    "empty.noFonts": "No matching fonts",
    "status.hoverHint": "Hover a font card to see details",
    "status.favorited": "★ Favorited",
    "status.page": "Page {current} / {total}",
    "status.pageCount": "This page {shown} / {total}",
    "status.sampleSize": "Size",
    "status.decreaseSize": "Decrease size",
    "status.increaseSize": "Increase size",
    "status.sampleSizeAria": "Card preview size",
    "pagination.aria": "Font pagination",
    "pagination.prev": "Previous page",
    "pagination.next": "Next page",
    "panel.collapseLibrary": "Collapse library",
    "panel.expandLibrary": "Expand library",
    "panel.collapseDetail": "Collapse details",
    "panel.expandDetail": "Expand details",
    "panel.resizeDetail": "Drag to resize panel",
    "detail.selectFont": "Select a font",
    "detail.previewTab": "Preview",
    "detail.infoTab": "Info",
    "detail.tabsAria": "Details panel",
    "detail.previewTextAria": "Preview text",
    "detail.previewPlaceholder": "Double-click to edit preview text",
    "detail.stageHint": "Double-click to edit · Hover for detail · Scroll to resize",
    "detail.bgColor": "Background color",
    "detail.textColor": "Text color",
    "detail.axisDetecting": "Detecting variation axes…",
    "detail.reset": "Reset defaults",
    "detail.fontSize": "Size",
    "detail.letterSpacing": "Tracking",
    "detail.lineHeight": "Line height",
    "detail.favorite": "Favorite font",
    "detail.category": "Set favorite category",
    "detail.axisCount": "{count} variation axes",
    "detail.axisHover": "Hover preview",
    "detail.axisNone": "No font parameters",
    "detail.axisStandard": "Static font · no axes",
    "detail.axisLive": "{count} axes · drag to preview live",
    "detail.variableFont": "Variable",
    "detail.standardFont": "Static",
    "detail.pendingDetect": "Pending",
    "info.basic": "Basics",
    "info.naming": "Naming & copyright",
    "info.metrics": "Metrics & style",
    "info.family": "Family",
    "info.postscript": "PostScript",
    "info.subfamily": "Subfamily",
    "info.format": "Format",
    "info.fileSize": "File size",
    "info.glyphs": "Glyph count",
    "info.upm": "Units per em",
    "info.weight": "Internal weight",
    "info.width": "Internal width",
    "info.languageSupport": "Script support",
    "info.aspect": "First-glyph aspect",
    "info.tables": "Tables",
    "info.version": "Version",
    "info.designer": "Designer",
    "info.manufacturer": "Manufacturer",
    "info.copyright": "Copyright",
    "info.license": "License",
    "info.ascender": "Ascender",
    "info.descender": "Descender",
    "info.lineGap": "Line gap",
    "info.capHeight": "Cap height",
    "info.xHeight": "x height",
    "info.italicAngle": "Italic angle",
    "info.fixedPitch": "Fixed pitch",
    "info.created": "Created",
    "info.modified": "Modified",
    "info.bbox": "Bounding box",
    "info.embedding": "Embedding",
    "info.features": "OpenType features",
    "info.copyFamily": "Click to copy family name",
    "info.copyPostscript": "Click to copy PostScript name",
    "info.copyDesigner": "Click to copy designer",
    "info.copyCopyright": "Click to copy copyright",
    "info.copyLicense": "Click to copy license",
    "hover.previewAria": "Font preview",
    "hover.close": "Close preview",
    "hover.subsamplesAria": "Additional samples",
    "hover.copyName": "Click to copy family name",
    "hover.copyFullName": "Click to copy full name",
    "previewStyle.title": "Preview style",
    "previewStyle.close": "Close",
    "previewStyle.fontLabel": "Preview font",
    "previewStyle.fontAria": "Preview font",
    "previewStyle.tabsAria": "Preview style panel",
    "previewStyle.editTab": "Edit style",
    "previewStyle.manageTab": "Manage styles",
    "previewStyle.layers": "Layers",
    "previewStyle.layerMoveUp": "Move layer up",
    "previewStyle.layerMoveDown": "Move layer down",
    "previewStyle.layerDelete": "Delete layer",
    "previewStyle.manageStyles": "Manage styles",
    "previewStyle.newStyle": "New style",
    "previewStyle.rename": "Style name",
    "previewStyle.confirm": "OK",
    "previewStyle.cancel": "Cancel",
    "previewStyle.save": "Save",
    "previewStyle.export": "Export",
    "previewStyle.import": "Import",
    "defaults.cardPreviewText": "Type shines",
    "defaults.previewInputFallback": "Enter preview text here",
    "fontStyle.regular": "Regular",
    "toast.copied": "Copied {label}: {value}",
    "toast.localeChanged": "Language updated",
    "toast.noLocalFontApi": "Local Font Access API is not supported in this browser",
    "toast.loadFontsFirst": "Load fonts first",
    "toast.styleRestored": "Default preview restored",
    "toast.styleNotFound": "Style not found",
    "toast.styleApplied": "Applied “{name}”",
    "toast.defaultNotEditable": "Default style cannot be edited — create a new one",
    "toast.singleCardSize": "Single card {size} × {size}",
    "toast.gridLayout": "{rows} rows × {columns} cols",
    "welcome.supportNoApi": "This browser may not support reading system fonts. Use the latest Chrome or Edge.",
    "welcome.supportDenied": "Font access was denied. Allow it in browser settings and try again.",
    "welcome.supportFailed": "Failed to load fonts: {message}",
    "welcome.supportBlocked": "This browser does not support reading system fonts. Use the latest Chrome or Edge.",
    "copy.fontName": "family name",
    "copy.postscript": "PostScript name",
    "copy.designer": "designer",
    "copy.copyright": "copyright",
    "copy.license": "license",
    "copy.svg": "SVG outline"
  },
  fr: {
    "meta.title": "Ziji · Aperçu local des polices",
    "meta.langMenu": "Langue",
    "brand.name": "Ziji",
    "brand.tagline": "Trouver des polices, se trouver soi-même",
    "welcome.lead": "Après autorisation, recherchez, comparez et inspectez les polices installées — entièrement dans le navigateur.",
    "welcome.loadFonts": "Charger les polices système",
    "welcome.privacy": "Les polices restent sur cet appareil",
    "welcome.progressPreparing": "Préparation de la lecture des polices…",
    "welcome.supportNote": "Chrome ou Edge (dernière version) recommandé",
    "header.previewLabel": "Texte d’aperçu",
    "header.previewInputAria": "Texte d’aperçu des cartes",
    "header.previewInputTitle": "Double-cliquer pour effacer le texte",
    "header.previewHistoryAria": "Textes d’aperçu récents",
    "header.previewHistoryTitle": "Survoler pour voir l’historique",
    "header.previewHistoryPanelAria": "Historique du texte d’aperçu",
    "header.magnifierOff": "Désactiver la loupe",
    "header.magnifierOn": "Activer la loupe",
    "header.themeToggle": "Changer de thème",
    "header.resizeTopbar": "Glisser pour redimensionner la barre",
    "toolbar.fontLibrary": "Bibliothèque",
    "toolbar.fontCountSuffix": " polices",
    "toolbar.reload": "Actualiser les polices",
    "toolbar.filtersAria": "Filtres de polices",
    "toolbar.filterSortStyleAria": "Filtrer, trier et style",
    "toolbar.viewControlsAria": "Contrôles d’affichage",
    "filter.all": "Tout",
    "filter.favorite": "Favoris",
    "filter.searchPlaceholder": "Rechercher polices / pinyin",
    "filter.clearSearch": "Effacer la recherche",
    "filter.suggestCommon": "Styles courants",
    "filter.suggestBrands": "Marques chinoises",
    "filter.language": "Langue",
    "filter.languageAll": "Toutes langues",
    "filter.languageChinese": "Polices chinoises",
    "filter.languageLatin": "Polices latines",
    "filter.variable": "Polices variables",
    "filter.weight": "Graisse",
    "filter.weightScanning": "Analyse des graisses…",
    "filter.sort": "Tri",
    "filter.sortGeneral": "Général",
    "filter.sortByName": "Tri par nom",
    "filter.sortByFavorite": "Favoris en premier",
    "filter.sortLanguageGroup": "Langue",
    "filter.sortChineseFirst": "Chinois d’abord",
    "filter.sortLatinFirst": "Latin d’abord",
    "filter.sortShapeGroup": "Proportion",
    "filter.sortSquare": "Premier glyphe quasi carré",
    "filter.sortNarrow": "Premier glyphe étroit → large",
    "filter.sortWide": "Premier glyphe large → étroit",
    "filter.style": "Style",
    "filter.styleDefault": "Par défaut",
    "filter.styleMenu": "Style d’aperçu",
    "filter.styleMenuNamed": "Style d’aperçu : {name}",
    "filter.badgeAll": "Tout",
    "filter.badgeItems": "{count}",
    "sort.name": "Nom",
    "sort.favorite": "Favori",
    "sort.chineseFirst": "Chinois",
    "sort.latinFirst": "Latin",
    "sort.square": "Carré",
    "sort.narrow": "Étroit→Large",
    "sort.wide": "Large→Étroit",
    "view.grid": "Vue grille",
    "view.single": "Vue glyphe unique",
    "view.columns": "Col.",
    "view.columnsTitle": "Colonnes par ligne",
    "view.columnsAria": "Colonnes par ligne",
    "view.rows": "Lign.",
    "view.rowsTitle": "Lignes par page",
    "view.rowsAria": "Lignes par page",
    "view.size": "Taille",
    "view.sizeTitle": "Taille de carte unique",
    "view.sizeAria": "Taille de carte unique",
    "view.options": "Options d’affichage",
    "view.focusMode": "Apercu uniquement",
    "view.collapseFamily": "Replier les familles",
    "scan.variableFonts": "Détection des polices variables",
    "scan.variableDone": "Analyse des polices variables terminée",
    "scan.readingMeta": "Lecture des glyphes et graisses",
    "scan.measuringAspect": "Mesure du ratio du premier glyphe",
    "favorite.categories": "Catégories de favoris",
    "favorite.newCategory": "Nouvelle catégorie",
    "favorite.export": "Exporter",
    "favorite.import": "Importer",
    "empty.noFonts": "Aucune police correspondante",
    "status.hoverHint": "Survoler une carte pour voir les détails",
    "status.favorited": "★ En favori",
    "status.page": "Page {current} / {total}",
    "status.pageCount": "Cette page {shown} / {total}",
    "status.sampleSize": "Taille",
    "status.decreaseSize": "Réduire",
    "status.increaseSize": "Agrandir",
    "status.sampleSizeAria": "Taille d’aperçu des cartes",
    "pagination.aria": "Pagination des polices",
    "pagination.prev": "Page précédente",
    "pagination.next": "Page suivante",
    "panel.collapseLibrary": "Replier la bibliothèque",
    "panel.expandLibrary": "Déplier la bibliothèque",
    "panel.collapseDetail": "Replier les détails",
    "panel.expandDetail": "Déplier les détails",
    "panel.resizeDetail": "Glisser pour redimensionner",
    "detail.selectFont": "Sélectionner une police",
    "detail.previewTab": "Aperçu",
    "detail.infoTab": "Infos",
    "detail.tabsAria": "Panneau de détails",
    "detail.previewTextAria": "Texte d’aperçu",
    "detail.previewPlaceholder": "Double-cliquer pour modifier",
    "detail.stageHint": "Double-clic · Survol · Molette pour la taille",
    "detail.bgColor": "Couleur de fond",
    "detail.textColor": "Couleur du texte",
    "detail.axisDetecting": "Détection des axes…",
    "detail.reset": "Réinitialiser",
    "detail.fontSize": "Taille",
    "detail.letterSpacing": "Approche",
    "detail.lineHeight": "Interligne",
    "detail.favorite": "Ajouter aux favoris",
    "detail.category": "Catégorie de favori",
    "detail.axisCount": "{count} axes de variation",
    "detail.axisHover": "Aperçu au survol",
    "detail.axisNone": "Aucun paramètre",
    "detail.axisStandard": "Police statique · sans axes",
    "detail.axisLive": "{count} axes · glisser pour prévisualiser",
    "detail.variableFont": "Variable",
    "detail.standardFont": "Statique",
    "detail.pendingDetect": "En attente",
    "info.basic": "Informations de base",
    "info.naming": "Nom et copyright",
    "info.metrics": "Métriques et style",
    "info.family": "Famille",
    "info.postscript": "PostScript",
    "info.subfamily": "Sous-famille",
    "info.format": "Format",
    "info.fileSize": "Taille du fichier",
    "info.glyphs": "Nombre de glyphes",
    "info.upm": "Units per em",
    "info.weight": "Graisse interne",
    "info.width": "Largeur interne",
    "info.languageSupport": "Scripts pris en charge",
    "info.aspect": "Ratio du premier glyphe",
    "info.tables": "Tables",
    "info.version": "Version",
    "info.designer": "Designer",
    "info.manufacturer": "Fabricant",
    "info.copyright": "Copyright",
    "info.license": "Licence",
    "info.ascender": "Ascendante",
    "info.descender": "Descendante",
    "info.lineGap": "Interligne interne",
    "info.capHeight": "Hauteur capitale",
    "info.xHeight": "Hauteur x",
    "info.italicAngle": "Angle italique",
    "info.fixedPitch": "Chasse fixe",
    "info.created": "Création",
    "info.modified": "Modification",
    "info.bbox": "Boîte englobante",
    "info.embedding": "Intégration",
    "info.features": "Fonctionnalités OpenType",
    "info.copyFamily": "Cliquer pour copier le nom",
    "info.copyPostscript": "Cliquer pour copier le nom PostScript",
    "info.copyDesigner": "Cliquer pour copier le designer",
    "info.copyCopyright": "Cliquer pour copier le copyright",
    "info.copyLicense": "Cliquer pour copier la licence",
    "hover.previewAria": "Aperçu de police",
    "hover.close": "Fermer l’aperçu",
    "hover.subsamplesAria": "Échantillons supplémentaires",
    "hover.copyName": "Cliquer pour copier le nom",
    "hover.copyFullName": "Cliquer pour copier le nom complet",
    "previewStyle.title": "Style d’aperçu",
    "previewStyle.close": "Fermer",
    "previewStyle.fontLabel": "Police d’aperçu",
    "previewStyle.fontAria": "Police d’aperçu",
    "previewStyle.tabsAria": "Panneau de style",
    "previewStyle.editTab": "Modifier le style",
    "previewStyle.manageTab": "Gérer les styles",
    "previewStyle.layers": "Calques",
    "previewStyle.layerMoveUp": "Monter le calque",
    "previewStyle.layerMoveDown": "Descendre le calque",
    "previewStyle.layerDelete": "Supprimer le calque",
    "previewStyle.manageStyles": "Gérer les styles",
    "previewStyle.newStyle": "Nouveau style",
    "previewStyle.rename": "Nom du style",
    "previewStyle.confirm": "OK",
    "previewStyle.cancel": "Annuler",
    "previewStyle.save": "Enregistrer",
    "previewStyle.export": "Exporter",
    "previewStyle.import": "Importer",
    "defaults.cardPreviewText": "La lumière du type",
    "defaults.previewInputFallback": "Saisir le texte d’aperçu ici",
    "fontStyle.regular": "Regular",
    "toast.copied": "Copié {label} : {value}",
    "toast.localeChanged": "Langue mise à jour",
    "toast.noLocalFontApi": "L’API Local Font Access n’est pas prise en charge",
    "toast.loadFontsFirst": "Chargez d’abord les polices",
    "toast.styleRestored": "Aperçu par défaut restauré",
    "toast.styleNotFound": "Style introuvable",
    "toast.styleApplied": "« {name} » appliqué",
    "toast.defaultNotEditable": "Le style par défaut n’est pas modifiable",
    "toast.singleCardSize": "Carte unique {size} × {size}",
    "toast.gridLayout": "{rows} lignes × {columns} colonnes",
    "welcome.supportNoApi": "Ce navigateur ne prend peut-être pas en charge la lecture des polices système. Utilisez Chrome ou Edge (dernière version).",
    "welcome.supportDenied": "Accès aux polices refusé. Autorisez-le dans les paramètres du navigateur.",
    "welcome.supportFailed": "Échec de lecture : {message}",
    "welcome.supportBlocked": "Ce navigateur ne prend pas en charge la lecture des polices système.",
    "copy.fontName": "nom de famille",
    "copy.postscript": "nom PostScript",
    "copy.designer": "designer",
    "copy.copyright": "copyright",
    "copy.license": "licence",
    "copy.svg": "contour SVG"
  }
};

let currentLocale = "zh-CN";

const I18N_LOCALE_ALIASES = {
  zh: "zh-CN",
  "zh-hans": "zh-CN",
  "zh-cn": "zh-CN",
  "zh-hant": "zh-TW",
  "zh-tw": "zh-TW",
  "zh-hk": "zh-TW",
  "zh-mo": "zh-TW",
  "zh-sg": "zh-CN",
  jp: "ja",
  kr: "ko",
  pt: "pt-BR",
  "pt-br": "pt-BR",
  nb: "en",
  "en-us": "en",
  "en-gb": "en"
};

function normalizeLocale(locale) {
  const raw = String(locale || "").trim();
  const lower = raw.toLowerCase();
  const aliased = I18N_LOCALE_ALIASES[lower];
  if (aliased && I18N_MESSAGES[aliased]) return aliased;
  if (I18N_MESSAGES[raw]) return raw;
  if (I18N_MESSAGES[lower]) return lower;
  const short = lower.split("-")[0];
  const shortAliased = I18N_LOCALE_ALIASES[short];
  if (shortAliased && I18N_MESSAGES[shortAliased]) return shortAliased;
  if (I18N_MESSAGES[short]) return short;
  return "zh-CN";
}

function getLocaleDetectionCandidates() {
  const candidates = [];
  const add = locale => {
    const value = String(locale || "").trim();
    if (value && !candidates.includes(value)) candidates.push(value);
  };
  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
  browserLanguages.forEach(add);
  add(navigator.language);
  try {
    add(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {}
  [...candidates].forEach(locale => {
    try {
      const maximized = new Intl.Locale(locale).maximize();
      add(maximized.toString());
      if (maximized.language && maximized.region) add(`${maximized.language}-${maximized.region}`);
      if (maximized.language && maximized.script) add(`${maximized.language}-${maximized.script}`);
    } catch {}
  });
  return candidates;
}

function detectDefaultLocale() {
  for (const language of getLocaleDetectionCandidates()) {
    const normalized = normalizeLocale(language);
    if (I18N_MESSAGES[normalized]) return normalized;
  }
  return "zh-CN";
}

function t(key, params = {}) {
  const table = I18N_MESSAGES[currentLocale] || I18N_MESSAGES.en;
  let text = table[key] ?? I18N_MESSAGES.en?.[key] ?? I18N_MESSAGES["zh-CN"][key] ?? key;
  Object.entries(params).forEach(([name, value]) => {
    text = text.replaceAll(`{${name}}`, String(value ?? ""));
  });
  return text;
}

function getLocale() {
  return currentLocale;
}

function getLocaleMeta() {
  return I18N_LOCALE_META;
}

function setLocale(locale, { persist = true, notify = true } = {}) {
  const next = normalizeLocale(locale);
  if (next === currentLocale && !notify) return next;
  currentLocale = next;
  document.documentElement.lang = next;
  document.title = t("meta.title");
  applyStaticTranslations();
  if (typeof updateDynamicTranslations === "function") updateDynamicTranslations();
  if (persist) {
    try {
      const raw = localStorage.getItem("webfonts-ui-settings");
      const settings = raw ? JSON.parse(raw) : {};
      settings.uiLocale = next;
      localStorage.setItem("webfonts-ui-settings", JSON.stringify(settings));
    } catch {}
  }
  if (notify && typeof toast === "function") toast(t("toast.localeChanged"));
  document.dispatchEvent(new CustomEvent("webfonts:localechange", { detail: { locale: next } }));
  return next;
}

function applyStaticTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(node => {
    node.textContent = t(node.dataset.i18n);
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach(node => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  root.querySelectorAll("[data-i18n-title]").forEach(node => {
    node.title = t(node.dataset.i18nTitle);
  });
  root.querySelectorAll("[data-i18n-aria]").forEach(node => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
  root.querySelectorAll("[data-i18n-html]").forEach(node => {
    node.innerHTML = t(node.dataset.i18nHtml);
  });
  const previewText = $("#previewText");
  if (previewText) previewText.dataset.placeholder = t("detail.previewPlaceholder");
}

function initLocaleFromSettings(settings = null) {
  let locale = settings?.uiLocale;
  if (!locale) {
    try {
      const raw = localStorage.getItem("webfonts-ui-settings");
      locale = raw ? JSON.parse(raw).uiLocale : null;
    } catch {}
  }
  currentLocale = normalizeLocale(locale || detectDefaultLocale());
  document.documentElement.lang = currentLocale;
  document.title = t("meta.title");
}

function renderLocaleMenu() {
  const html = I18N_LOCALE_META.map(item =>
    `<button type="button" class="locale-option${item.id === currentLocale ? " active" : ""}" data-locale="${item.id}">${item.label}</button>`
  ).join("");
  document.querySelectorAll("#localeMenuPopover, #welcomeLocaleMenuPopover").forEach(menu => {
    menu.innerHTML = html;
  });
}

function wireLocaleDropdown(dropdown, menu) {
  const summary = dropdown?.querySelector("summary");
  if (!dropdown || !menu || !summary) return;
  const closeMenu = () => {
    dropdown.removeAttribute("open");
    menu.hidden = true;
  };
  summary.addEventListener("click", event => event.preventDefault());
  dropdown.addEventListener("toggle", () => {
    if (dropdown.open) {
      renderLocaleMenu();
      menu.hidden = false;
    } else {
      menu.hidden = true;
    }
  });
  menu.addEventListener("click", event => {
    const button = event.target.closest("[data-locale]");
    if (!button) return;
    event.preventDefault();
    setLocale(button.dataset.locale);
    document.querySelectorAll(".locale-menu[open]").forEach(openMenu => openMenu.removeAttribute("open"));
    document.querySelectorAll("#localeMenuPopover, #welcomeLocaleMenuPopover").forEach(popover => { popover.hidden = true; });
  });
}

function wireLocaleMenu() {
  renderLocaleMenu();
  wireLocaleDropdown(document.getElementById("localeMenu"), document.getElementById("localeMenuPopover"));
  wireLocaleDropdown(document.getElementById("welcomeLocaleMenu"), document.getElementById("welcomeLocaleMenuPopover"));
}

if (typeof registerExtraLocales === "function") registerExtraLocales();
