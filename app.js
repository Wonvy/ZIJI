const $ = (selector) => document.querySelector(selector);
const COMMON_DETAIL_PREVIEW = "天地玄黄 宇宙洪荒\nABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789\n，。！？；：“”「」";
const COMMON_SEARCH_TERMS = ["黑", "宋", "楷", "圆", "仿宋", "等线", "手写", "书法", "像素"];
const DEFAULT_CHINESE_BRANDS = ["思源", "方正", "汉仪", "华文", "阿里巴巴", "站酷", "霞鹜", "鸿蒙", "小米", "文泉驿"];
function loadCachedSearchBrands() {
  try {
    const value = JSON.parse(localStorage.getItem("font-search-brands") || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}
function loadCachedFavorites() {
  try {
    const value = JSON.parse(localStorage.getItem("font-favorites") || "[]");
    return new Set(Array.isArray(value) ? value : []);
  } catch {
    return new Set();
  }
}
const cachedFavorites = loadCachedFavorites();
function loadFavoriteData() {
  try {
    const data = JSON.parse(localStorage.getItem("font-favorite-data") || "{}");
    const categories = Array.isArray(data.categories) ? data.categories.filter(item => item?.id && item?.name) : [];
    const assignments = new Map();
    if (data.assignments && typeof data.assignments === "object") {
      Object.entries(data.assignments).forEach(([font, ids]) => assignments.set(font, new Set(Array.isArray(ids) ? ids : [])));
    }
    assignments.forEach((_, font) => cachedFavorites.add(font));
    const recentCategories = Array.isArray(data.recentCategories) ? data.recentCategories : [];
    return { categories, assignments, recentCategories };
  } catch {
    return { categories: [], assignments: new Map(), recentCategories: [] };
  }
}
const cachedFavoriteData = loadFavoriteData();
const state = {
  fonts: [], filtered: [], selected: null, previewed: null, hovered: null, categoryTarget: null, contextFont: null, editingCategoryId: null, draggingCategoryId: null, draggingFontId: null, favoriteCategoryView: "all", pointerInFontView: false, brandScanRunning: false, prefetchCards: new Set(), filters: new Set(), languageFilters: new Set(), weightFilters: new Set(), weightOptions: [], searchBrands: new Set([...DEFAULT_CHINESE_BRANDS, ...loadCachedSearchBrands()]), magnifier: true,
  view: "grid", sort: "name", cardWidth: 245, singleCardSize: 82, page: 0, pageSize: 1, totalPages: 1, preloadVersion: 0, renderVersion: 0, aspectCharacter: "字", selectionVersion: 0, scanningVariables: false, scanningCapabilities: false, scanningShapes: false,
  favorites: cachedFavorites, categories: cachedFavoriteData.categories, categoryAssignments: cachedFavoriteData.assignments, recentCategories: cachedFavoriteData.recentCategories,
  axes: {}, objectUrls: []
};
let fontObserver;
const pinyinBoundaries = [
  ["A", "阿"], ["B", "八"], ["C", "嚓"], ["D", "搭"], ["E", "蛾"], ["F", "发"], ["G", "噶"],
  ["H", "哈"], ["J", "击"], ["K", "喀"], ["L", "垃"], ["M", "妈"], ["N", "拿"], ["O", "哦"],
  ["P", "啪"], ["Q", "期"], ["R", "然"], ["S", "撒"], ["T", "塌"], ["W", "挖"], ["X", "昔"],
  ["Y", "压"], ["Z", "匝"]
];
const pinyinCollator = new Intl.Collator("zh-CN-u-co-pinyin");

document.addEventListener("wheel", event => {
  if (event.ctrlKey) event.preventDefault();
}, { passive: false, capture: true });
document.addEventListener("contextmenu", event => event.preventDefault());

const ui = {
  welcome: $("#welcome"), workspace: $("#workspace"), load: $("#loadFontsButton"), reload: $("#reloadButton"),
  loadProgress: $("#loadProgress"), progressBar: $("#progressBar"), progressText: $("#progressText"), progressValue: $("#progressValue"),
  scanProgress: $("#scanProgress"), scanBar: $("#scanBar"), scanText: $("#scanText"),
  support: $("#supportNote"), search: $("#searchInput"), list: $("#fontList"), count: $("#fontCount"),
  pagination: $("#paginationBar"), previousPage: $("#previousPage"), nextPage: $("#nextPage"), pageInfo: $("#pageInfo"), fontStatus: $("#fontStatus"), viewStatus: $("#viewStatus"),
  empty: $("#emptyState"), previewInput: $("#previewInput"), previewText: $("#previewText"),
  selectedName: $("#selectedName"), selectedStyle: $("#selectedStyle"), size: $("#fontSize"), sizeOut: $("#fontSizeOutput"),
  stage: $("#previewStage"), magnifier: $("#magnifier"), magnifiedText: $("#magnifiedText"), magnifierButton: $("#magnifierButton"),
  cardMagnifier: $("#cardMagnifier"), cardMagnifiedText: $("#cardMagnifiedText"),
  favorite: $("#favoriteButton"), axes: $("#axisControls"), axisStatus: $("#axisStatus"),
  spacing: $("#letterSpacing"), spacingOut: $("#spacingOutput"), lineHeight: $("#lineHeight"), lineHeightOut: $("#lineHeightOutput"),
  bg: $("#backgroundColor"), color: $("#textColor"), reset: $("#resetButton"), toast: $("#toast"),
  infoFamily: $("#infoFamily"), infoPostscript: $("#infoPostscript"), infoFormat: $("#infoFormat"), infoSize: $("#infoSize"),
  infoGlyphs: $("#infoGlyphs"), infoUpm: $("#infoUpm"), infoWeight: $("#infoWeight"), infoWidth: $("#infoWidth"),
  infoLanguage: $("#infoLanguage"), infoAspect: $("#infoAspect"), infoTables: $("#infoTables"),
  infoVersion: $("#infoVersion"), infoCopyright: $("#infoCopyright"), infoDesigner: $("#infoDesigner"),
  infoManufacturer: $("#infoManufacturer"), infoLicense: $("#infoLicense"), infoSubfamily: $("#infoSubfamily"),
  infoAscender: $("#infoAscender"), infoDescender: $("#infoDescender"), infoLineGap: $("#infoLineGap"),
  infoCapHeight: $("#infoCapHeight"), infoXHeight: $("#infoXHeight"), infoItalicAngle: $("#infoItalicAngle"),
  infoFixedPitch: $("#infoFixedPitch"), infoCreated: $("#infoCreated"), infoModified: $("#infoModified"),
  infoBBox: $("#infoBBox"), infoEmbedding: $("#infoEmbedding"), infoFeatures: $("#infoFeatures"),
  categoryButton: $("#categoryAssignmentButton"), favoriteSidebar: $("#favoriteSidebar"), favoriteCategoryList: $("#favoriteCategoryList")
};
const INFO_BASIC_FIELDS = [ui.infoFormat, ui.infoSize, ui.infoGlyphs, ui.infoUpm, ui.infoWeight, ui.infoWidth, ui.infoLanguage, ui.infoAspect, ui.infoTables];
const INFO_EXTENDED_FIELDS = [ui.infoVersion, ui.infoCopyright, ui.infoDesigner, ui.infoManufacturer, ui.infoLicense, ui.infoSubfamily, ui.infoAscender, ui.infoDescender, ui.infoLineGap, ui.infoCapHeight, ui.infoXHeight, ui.infoItalicAngle, ui.infoFixedPitch, ui.infoCreated, ui.infoModified, ui.infoBBox, ui.infoEmbedding, ui.infoFeatures];
const INFO_COPY_TARGETS = [[ui.infoFamily, "字体名称"], [ui.infoPostscript, "PostScript 名称"], [ui.infoCopyright, "版权信息"], [ui.infoDesigner, "设计师"], [ui.infoLicense, "许可证"]];
ui.contextMenu = $("#cardContextMenu");
ui.searchSuggestions = $("#searchSuggestions");
ui.commonSearchTags = $("#commonSearchTags");
ui.brandSearchTags = $("#brandSearchTags");

const cachedPreviewText = localStorage.getItem("font-preview-text");
if (cachedPreviewText !== null) ui.previewInput.value = cachedPreviewText;

function toast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ui.toast.classList.remove("show"), 2300);
}

function showMagnifier(element) {
  clearTimeout(element.hideTimer);
  if (element.classList.contains("visible")) return;
  element.hidden = false;
  element.style.display = "block";
  requestAnimationFrame(() => element.classList.add("visible"));
}

function hideMagnifier(element) {
  if (element.hidden) return;
  element.classList.remove("visible");
  clearTimeout(element.hideTimer);
  element.hideTimer = setTimeout(() => {
    element.hidden = true;
    element.style.display = "none";
  }, 190);
}

async function copyValue(value, label) {
  if (!value || value === "—" || value.includes("读取中")) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const input = document.createElement("textarea");
    input.value = value;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }
  toast(`已复制${label}：${value}`);
}

function copyDetailValue(element, label) {
  return copyValue(element.textContent.trim(), label);
}

function setDetailTab(tab) {
  const isPreview = tab === "preview";
  $("#previewTabButton").classList.toggle("active", isPreview);
  $("#infoTabButton").classList.toggle("active", !isPreview);
  $("#previewTabButton").setAttribute("aria-selected", isPreview);
  $("#infoTabButton").setAttribute("aria-selected", !isPreview);
  $("#previewTabPanel").classList.toggle("active", isPreview);
  $("#infoTabPanel").classList.toggle("active", !isPreview);
  $("#previewTabPanel").hidden = !isPreview;
  $("#infoTabPanel").hidden = isPreview;
}

function setLoadProgress(text, value = null) {
  ui.loadProgress.hidden = false;
  ui.progressText.textContent = text;
  ui.loadProgress.classList.toggle("indeterminate", value === null);
  ui.progressValue.textContent = value === null ? "" : `${Math.round(value)}%`;
  ui.progressBar.style.width = value === null ? "" : `${value}%`;
}

function pinyinInitials(text) {
  return [...text].map(char => {
    if (/\p{Script=Han}/u.test(char)) {
      let initial = "";
      for (const [letter, start] of pinyinBoundaries) if (pinyinCollator.compare(char, start) >= 0) initial = letter;
      return initial;
    }
    return /[a-z0-9]/i.test(char) ? char : "";
  }).join("").toLowerCase();
}

function setSearchTerm(term) {
  ui.search.value = term;
  applyFilter();
  renderSearchSuggestions();
  ui.searchSuggestions.hidden = true;
  ui.search.focus();
}

function renderSearchSuggestions() {
  const current = ui.search.value.trim();
  const renderTags = terms => terms.map(term => `<button type="button" class="suggestion-tag${current === term ? " active" : ""}" data-search-term="${escapeHtml(term)}">${escapeHtml(term)}</button>`).join("");
  ui.commonSearchTags.innerHTML = renderTags(COMMON_SEARCH_TERMS);
  const brands = [...state.searchBrands].sort((a, b) => a.localeCompare(b, "zh-CN"));
  ui.brandSearchTags.innerHTML = brands.length ? renderTags(brands) : `<span class="suggestion-empty">正在扫描中文字体品牌…</span>`;
  ui.searchSuggestions.querySelectorAll("[data-search-term]").forEach(button => {
    button.addEventListener("mousedown", event => event.preventDefault());
    button.addEventListener("click", () => setSearchTerm(button.dataset.searchTerm));
  });
}

function inferChineseBrands(names) {
  const inferred = new Set();
  const typePattern = /^(.{2,8}?)(?:黑体|宋体|楷体|圆体|仿宋|等线|明朝体|书体|隶书|行书|草书|魏碑)/;
  const prefixCounts = new Map();
  const ignored = new Set(["中文", "简体", "繁体", "字体", "新字", "常用"]);
  for (const rawName of names) {
    const name = rawName.replace(/[\s·・_-]/g, "");
    const matched = name.match(typePattern);
    if (matched && !ignored.has(matched[1])) inferred.add(matched[1]);
    for (let length = 2; length <= Math.min(6, [...name].length); length++) {
      const prefix = [...name].slice(0, length).join("");
      if (!/^\p{Script=Han}+$/u.test(prefix) || ignored.has(prefix)) continue;
      prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);
    }
  }
  [...prefixCounts].filter(([, count]) => count >= 2).map(([prefix]) => prefix).sort((a, b) => a.length - b.length).forEach(prefix => {
    if (![...inferred].some(existing => prefix.startsWith(existing))) inferred.add(prefix);
  });
  return inferred;
}

async function scanChineseSearchBrands() {
  if (state.brandScanRunning || !state.fonts.length) return;
  state.brandScanRunning = true;
  const chineseNames = new Set(state.fonts.map(font => font.displayName).filter(name => /\p{Script=Han}/u.test(name || "")));
  for (let index = 0; index < state.fonts.length; index += 3) {
    const batch = state.fonts.slice(index, index + 3);
    const names = await Promise.all(batch.map(font => getLocalizedName(font).catch(() => null)));
    names.filter(name => /\p{Script=Han}/u.test(name || "")).forEach(name => chineseNames.add(name));
    if (index % 30 === 0) {
      inferChineseBrands(chineseNames).forEach(brand => state.searchBrands.add(brand));
      renderSearchSuggestions();
    }
    await new Promise(resolve => setTimeout(resolve, 12));
  }
  inferChineseBrands(chineseNames).forEach(brand => state.searchBrands.add(brand));
  localStorage.setItem("font-search-brands", JSON.stringify([...state.searchBrands]));
  renderSearchSuggestions();
  state.brandScanRunning = false;
  console.debug(`[字体品牌扫描 ${new Date().toISOString()}] 完成`, { chineseFonts: chineseNames.size, brands: [...state.searchBrands] });
}

function cssName(font) { return `local-font-${font.id}`; }

function toolbarVariationSettings() {
  const value = Object.entries(state.axes).map(([tag, amount]) => `"${tag}" ${amount}`).join(", ");
  return value || "normal";
}

function syncToolbarPreview(font) {
  if (!font) {
    ui.previewInput.style.fontFamily = "";
    ui.previewInput.style.fontVariationSettings = "";
    $("#previewInputWrap")?.classList.remove("is-previewing");
    return;
  }
  registerFont(font);
  ui.previewInput.style.fontFamily = cssName(font);
  ui.previewInput.style.fontVariationSettings = toolbarVariationSettings();
  $("#previewInputWrap")?.classList.add("is-previewing");
}

function registerFont(font) {
  if (font.registered) return;
  const style = document.createElement("style");
  const localNames = [font.postscriptName, font.fullName, font.family].filter(Boolean)
    .map(name => `local(${JSON.stringify(name)})`).join(",");
  style.textContent = `@font-face{font-family:${JSON.stringify(cssName(font))};src:${localNames};font-weight:1 1000;font-style:normal;}`;
  document.head.appendChild(style);
  font.registered = true;
}

async function loadFonts() {
  if (!("queryLocalFonts" in window)) {
    ui.support.textContent = "当前浏览器不支持系统字体读取，请使用最新版 Chrome 或 Edge。";
    toast("当前浏览器不支持 Local Font Access API");
    return;
  }
  ui.load.disabled = true;
  ui.load.querySelector("span").textContent = "正在读取…";
  setLoadProgress("请在浏览器弹窗中允许访问字体");
  try {
    const data = await window.queryLocalFonts();
    setLoadProgress(`已读取 ${data.length} 个字体文件，正在建立索引`, 55);
    await new Promise(resolve => requestAnimationFrame(resolve));
    const seen = new Set();
    state.fonts = data.map((font, index) => ({
      id: index,
      family: font.family || "未命名字体",
      fullName: font.fullName || font.family || "未命名字体",
      displayName: pickInitialDisplayName(font.family, font.fullName),
      postscriptName: font.postscriptName || `${font.family}-${font.style || index}`,
      style: font.style || "Regular",
      blob: () => font.blob(),
      variable: null,
      weightClass: inferWeight(`${font.style} ${font.fullName}`),
      search: `${font.family} ${font.fullName} ${font.postscriptName} ${font.style}`.toLowerCase(),
      initials: pinyinInitials(`${font.family}${font.fullName}`)
    })).filter(font => {
      const key = `${font.postscriptName}|${font.style}`;
      if (seen.has(key)) return false; seen.add(key); return true;
    }).sort((a, b) => a.family.localeCompare(b.family, "zh-CN"));
    buildWeightOptions();
    setLoadProgress(`索引建立完成，共 ${state.fonts.length} 款字体`, 100);
    await new Promise(resolve => setTimeout(resolve, 250));
    ui.workspace.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add("workspace-active")));
    applyFilter();
    clearPreview();
    setTimeout(scanChineseSearchBrands, 800);
  } catch (error) {
    const message = error?.name === "NotAllowedError" ? "未获得字体访问权限，请在浏览器设置中允许后重试。" : `读取失败：${error.message}`;
    ui.support.textContent = message;
    setLoadProgress(message, 0);
    toast(message);
  } finally {
    ui.load.disabled = false;
    ui.load.querySelector("span").textContent = "读取系统字体";
  }
}

function applyFilter() {
  const query = ui.search.value.trim().toLowerCase().replace(/\s/g, "");
  state.filtered = state.fonts.filter(font => {
    const filterMatch = (!state.filters.has("variable") || font.variable === true) &&
      (!state.filters.has("favorite") || state.favorites.has(font.postscriptName));
    const searchMatch = !query || font.search.replace(/\s/g, "").includes(query) || font.initials.includes(query);
    const languageMatch = state.languageFilters.size === 0 ||
      (state.languageFilters.has("chinese") && font.details?.supportsChinese) ||
      (state.languageFilters.has("latin") && font.details?.supportsLatin && !font.details?.supportsChinese);
    const weightMatch = state.weightFilters.size === 0 || state.weightFilters.has(font.weightLabel);
    const assignments = state.categoryAssignments.get(font.postscriptName) || new Set();
    const categoryIds = expandedFavoriteCategoryView();
    const categoryMatch = !state.filters.has("favorite") || state.favoriteCategoryView === "all" ||
      (state.favoriteCategoryView === "uncategorized" ? assignments.size === 0 : [...categoryIds].some(id => assignments.has(id)));
    return filterMatch && searchMatch && languageMatch && weightMatch && categoryMatch;
  });
  state.filtered.sort((a, b) => {
    if (state.sort === "favorite") {
      const favoriteDifference = Number(state.favorites.has(b.postscriptName)) - Number(state.favorites.has(a.postscriptName));
      if (favoriteDifference) return favoriteDifference;
    }
    if (state.sort === "square") return Math.abs((a.aspectRatio ?? 99) - 1) - Math.abs((b.aspectRatio ?? 99) - 1);
    if (state.sort === "narrow") return (a.aspectRatio ?? 99) - (b.aspectRatio ?? 99);
    if (state.sort === "wide") return (b.aspectRatio ?? -1) - (a.aspectRatio ?? -1);
    return (a.displayName || a.family).localeCompare(b.displayName || b.family, "zh-CN");
  });
  state.page = 0;
  renderFavoriteSidebar();
  renderFontList();
}

function inferWeight(name = "") {
  const value = name.toLowerCase().replace(/[\s_-]/g, "");
  if (/thin|hairline|纤细|极细/.test(value)) return 100;
  if (/extralight|ultralight/.test(value)) return 200;
  if (/light|细体|细/.test(value)) return 300;
  if (/medium|中等|中黑/.test(value)) return 500;
  if (/semibold|demibold/.test(value)) return 600;
  if (/extrabold|ultrabold|heavy/.test(value)) return 800;
  if (/black|extrablack|ultrablack/.test(value)) return 900;
  if (/bold|粗体|粗/.test(value)) return 700;
  return 400;
}

const WEIGHT_CATALOG = [
  { label: "Thin", value: 100, aliases: ["thin", "hairline", "extrathin", "ultrathin", "纤细", "极细"] },
  { label: "ExtraLight", value: 200, aliases: ["extralight", "ultralight"] },
  { label: "Light", value: 300, aliases: ["light", "细体", "细"] },
  { label: "Regular", value: 400, aliases: ["regular", "normal", "book", "roman", "常规", "标准"] },
  { label: "Medium", value: 500, aliases: ["medium", "中等", "中黑"] },
  { label: "SemiBold", value: 600, aliases: ["semibold", "demibold", "半粗"] },
  { label: "Bold", value: 700, aliases: ["bold", "粗体", "粗"] },
  { label: "ExtraBold", value: 800, aliases: ["extrabold", "ultrabold", "heavy", "特粗"] },
  { label: "Black", value: 900, aliases: ["black", "extrablack", "ultrablack"] }
];

function normalizeWeightToken(value = "") {
  return value.toLowerCase().replace(/[\s._-]+/g, "");
}

function weightLabelOrder(label) {
  return WEIGHT_CATALOG.find(item => item.label === label)?.value ?? 450;
}

function matchWeightLabel(text = "") {
  if (!text || /^italic$/i.test(text.trim())) return null;
  const spaced = text.replace(/([a-z])([A-Z])/g, "$1 $2");
  const compact = normalizeWeightToken(spaced);
  const matches = [];
  for (const item of WEIGHT_CATALOG) {
    const labelToken = normalizeWeightToken(item.label);
    if (compact === labelToken || compact.includes(labelToken)) {
      matches.push({ label: item.label, value: item.value, len: labelToken.length });
    }
    for (const alias of item.aliases) {
      const token = normalizeWeightToken(alias);
      if (!token) continue;
      if (compact === token || compact.includes(token)) {
        matches.push({ label: item.label, value: item.value, len: token.length });
      }
    }
  }
  if (!matches.length) return null;
  matches.sort((a, b) => b.len - a.len || b.value - a.value);
  return matches[0].label;
}

function extractWeightLabel(font) {
  const styleLabel = matchWeightLabel(font.style || "");
  if (styleLabel) return styleLabel;
  for (const source of [font.fullName, font.postscriptName, font.family]) {
    const label = matchWeightLabel(source || "");
    if (label) return label;
  }
  return weightClassToLabel(font.weightClass);
}

function weightClassToLabel(weightClass) {
  if (!Number.isFinite(weightClass)) return "Regular";
  let best = WEIGHT_CATALOG.find(item => item.label === "Regular");
  let bestDiff = Infinity;
  for (const item of WEIGHT_CATALOG) {
    const diff = Math.abs(item.value - weightClass);
    if (diff < bestDiff) { best = item; bestDiff = diff; }
  }
  return best.label;
}

function buildWeightOptions() {
  const counts = new Map();
  for (const font of state.fonts) {
    font.weightLabel = extractWeightLabel(font);
    counts.set(font.weightLabel, (counts.get(font.weightLabel) || 0) + 1);
  }
  state.weightOptions = [...counts.entries()]
    .sort((a, b) => weightLabelOrder(a[0]) - weightLabelOrder(b[0]) || a[0].localeCompare(b[0], "en"))
    .map(([label, count]) => ({ label, count }));
  renderWeightFilterMenu();
}

function renderWeightFilterMenu() {
  const container = $("#weightFilterList");
  if (!container) return;
  if (!state.weightOptions.length) {
    container.innerHTML = `<span class="filter-empty">暂无字重标签</span>`;
    return;
  }
  container.innerHTML = state.weightOptions.map(({ label, count }) => `
    <label><span><input type="checkbox" data-weight-label="${escapeHtml(label)}"${state.weightFilters.has(label) ? " checked" : ""}> ${escapeHtml(label)}</span><small>${count}</small></label>
  `).join("");
  container.querySelectorAll("[data-weight-label]").forEach(input => {
    input.addEventListener("change", () => {
      input.checked ? state.weightFilters.add(input.dataset.weightLabel) : state.weightFilters.delete(input.dataset.weightLabel);
      updateFilterControls();
      applyFilter();
    });
  });
}

function pickInitialDisplayName(family = "", fullName = "") {
  if (/\p{Script=Han}/u.test(family)) return family;
  if (/\p{Script=Han}/u.test(fullName)) return fullName;
  return family || fullName || "未命名字体";
}

function renderFontList({ deferFonts = false } = {}) {
  const renderToken = ++state.renderVersion;
  fontObserver?.disconnect();
  state.prefetchCards.clear();
  state.pageSize = calculatePageSize();
  state.totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
  state.page = Math.max(0, Math.min(state.page, state.totalPages - 1));
  const start = state.page * state.pageSize;
  const pageFonts = state.filtered.slice(start, start + state.pageSize);
  const fragment = document.createDocumentFragment();
  for (const font of pageFonts) {
    const readyForRender = font.previewState === "ready";
    const card = document.createElement("div");
    card.draggable = true;
    card.className = `font-card${state.selected === font ? " active" : ""}${readyForRender ? " font-ready" : " font-pending"}${font.previewState === "loading" ? " font-loading" : ""}${font.previewState === "failed" ? " font-failed" : ""}`;
    card.dataset.id = font.id;
    const ratioText = Number.isFinite(font.aspectRatio) ? ` · ${font.aspectRatio.toFixed(2)}:1` : "";
    const displayName = font.displayName || font.family;
    card.title = `${displayName} · ${font.style || "Regular"}${ratioText}`;
    card.innerHTML = `<strong>${escapeHtml(displayName)}</strong><span class="sample">${escapeHtml(cardPreviewText())}</span><small>${escapeHtml(font.style || "Regular")}${font.variable ? " · Variable" : ""}${ratioText}</small><button class="star" type="button" title="${state.favorites.has(font.postscriptName) ? "取消收藏" : "收藏字体"}" aria-label="${state.favorites.has(font.postscriptName) ? "取消收藏" : "收藏"} ${escapeHtml(displayName)}">${state.favorites.has(font.postscriptName) ? "★" : "☆"}</button><button class="card-copy" type="button" title="复制字体名称" aria-label="复制 ${escapeHtml(displayName)} 的字体名称">⧉</button>`;
    card.querySelector(".sample").style.fontSize = `${cardBaseFontSize()}px`;
    if (readyForRender) {
      registerFont(font);
      card.querySelector(".sample").style.fontFamily = cssName(font);
      card.dataset.fontLoaded = "true";
      requestAnimationFrame(() => fitCardSample(card.querySelector(".sample")));
    }
    card.querySelector(".card-copy").addEventListener("click", event => {
      event.stopPropagation();
      copyValue(font.displayName || font.family, "字体名称");
    });
    card.querySelector(".star").addEventListener("click", event => {
      event.stopPropagation();
      toggleFavoriteFor(font);
    });
    card.addEventListener("click", () => selectFont(font));
    fragment.appendChild(card);
  }
  ui.list.replaceChildren(fragment);
  ui.list.classList.toggle("list-view", state.view === "list");
  ui.list.classList.toggle("single-view", state.view === "single");
  ui.list.classList.toggle("focus-view", state.view === "focus");
  ui.list.style.gridTemplateColumns = ["grid", "focus"].includes(state.view) ? `repeat(auto-fill, minmax(${state.cardWidth}px, 1fr))` : "";
  ui.list.style.setProperty("--single-card-size", `${state.singleCardSize}px`);
  ui.count.textContent = `${state.filtered.length} 款字体`;
  ui.empty.hidden = state.filtered.length > 0;
  ui.pagination.hidden = state.filtered.length === 0;
  ui.pageInfo.textContent = `第 ${state.page + 1} / ${state.totalPages} 页`;
  ui.previousPage.disabled = state.page === 0;
  ui.nextPage.disabled = state.page >= state.totalPages - 1;
  const viewName = ({ grid: "网格视图", list: "列表视图", single: "单字视图", focus: "无干扰视图" })[state.view] || "字体视图";
  ui.viewStatus.textContent = `${viewName} · 本页 ${pageFonts.length} / ${state.filtered.length} 款`;
  const hydratePage = () => {
    if (renderToken !== state.renderVersion) return;
    setupLazyFontLoading();
    preloadAdjacentPages();
  };
  if (deferFonts) requestAnimationFrame(() => requestAnimationFrame(hydratePage));
  else hydratePage();
}

function updateFontStatus(font) {
  if (!font) {
    ui.fontStatus.textContent = "将鼠标移到字体卡片查看信息";
    return;
  }
  const details = font.details;
  const weight = details?.weight || font.weightClass || 400;
  const parts = [
    font.style || "Regular",
    `W${weight}`,
    font.variable === true ? "可变字体" : font.variable === false ? "标准字体" : "待检测",
    details?.format || "OpenType",
    Number.isFinite(font.aspectRatio) ? `${font.aspectRatio.toFixed(2)}:1` : null
  ].filter(Boolean);
  ui.fontStatus.innerHTML = `<strong>${escapeHtml(font.displayName || font.family)}</strong>${parts.map(item => `<span>${escapeHtml(String(item))}</span>`).join("")}${state.favorites.has(font.postscriptName) ? `<span class="favorite-status">★ 已收藏</span>` : ""}`;
}

function calculatePageSize() {
  const width = Math.max(320, ui.list.clientWidth || 800);
  const height = Math.max(160, ui.list.clientHeight || 500);
  if (state.view === "single") {
    const columns = Math.max(1, Math.floor(width / state.singleCardSize));
    const rows = Math.max(1, Math.floor(height / state.singleCardSize));
    return columns * rows;
  }
  if (state.view === "list") return Math.max(1, Math.floor(height / 102));
  const columns = Math.max(1, Math.floor((width + 14) / (state.cardWidth + 14)));
  const rows = Math.max(1, Math.floor((height + 14) / 192));
  return columns * rows;
}

function goToPage(page) {
  const next = Math.max(0, Math.min(page, state.totalPages - 1));
  if (next === state.page) return;
  const targetFonts = state.filtered.slice(next * state.pageSize, (next + 1) * state.pageSize);
  preloadLog(`准备进入第 ${next + 1} 页`, {
    total: targetFonts.length,
    ready: targetFonts.filter(font => font.previewState === "ready").length,
    loading: targetFonts.filter(font => font.previewState === "loading").length,
    pending: targetFonts.filter(font => !font.previewState).length
  });
  const cancelledTask = state.preloadVersion;
  state.preloadVersion++;
  preloadLog(`翻页立即终止任务 #${cancelledTask}`, { nextPage: next + 1, replacementToken: state.preloadVersion });
  state.page = next;
  hideMagnifier(ui.cardMagnifier);
  state.hovered = null;
  renderFontList({ deferFonts: true });
  requestAnimationFrame(restorePinnedPreview);
}

function preloadAdjacentPages() {
  const token = ++state.preloadVersion;
  const basePage = state.page;
  const scheduledPages = Array.from({ length: 3 }, (_, index) => basePage + index + 2).filter(page => page <= state.totalPages);
  preloadLog(`预加载任务 #${token} 已排队`, { currentPage: basePage + 1, scheduledPages, pageSize: state.pageSize });
  const run = async () => {
    for (let offset = 1; offset <= 3; offset++) {
      if (token !== state.preloadVersion) {
        preloadLog(`预加载任务 #${token} 已取消`, { replacedBy: state.preloadVersion });
        return;
      }
      const start = (basePage + offset) * state.pageSize;
      const pageFonts = state.filtered.slice(start, start + state.pageSize);
      if (!pageFonts.length) break;
      const pageNumber = basePage + offset + 1;
      const pageStarted = performance.now();
      preloadLog(`开始预加载第 ${pageNumber} 页`, { task: token, fonts: pageFonts.length });
      const results = [];
      for (let index = 0; index < pageFonts.length; index += 6) {
        if (token !== state.preloadVersion) {
          preloadLog(`预加载任务 #${token} 在第 ${pageNumber} 页中止`, { completed: results.length, total: pageFonts.length });
          return;
        }
        const batch = pageFonts.slice(index, index + 6);
        results.push(...await Promise.all(batch.map(async font => {
          const started = performance.now();
          const [loaded, localizedName] = await Promise.all([
            ensureFontLoaded(font, cardPreviewText()),
            getLocalizedName(font).catch(() => null)
          ]);
          return {
            字体: font.displayName || font.family,
            PostScript: font.postscriptName,
            状态: loaded ? "已预览" : "失败",
            中文名: localizedName || "—",
            耗时ms: Math.round(performance.now() - started)
          };
        })));
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      const elapsed = Math.round(performance.now() - pageStarted);
      console.groupCollapsed(`[字体预加载 ${new Date().toISOString()}] 第 ${pageNumber} 页完成 · ${elapsed}ms · ${results.filter(item => item.状态 === "已预览").length}/${results.length}`);
      console.table(results);
      console.groupEnd();
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    preloadLog(`预加载任务 #${token} 完成`);
  };
  setTimeout(run, 0);
}

function preloadLog(message, data) {
  const prefix = `[字体预加载 ${new Date().toISOString()}]`;
  data === undefined ? console.debug(prefix, message) : console.debug(prefix, message, data);
}

function cardPreviewText() {
  const text = ui.previewInput.value || "字";
  return state.view === "single" ? ([...text.trim()][0] || "字") : text;
}

function loadCardFont(card) {
  const font = state.fonts.find(item => item.id === Number(card.dataset.id));
  if (!font) return;
  registerFont(font);
  const sample = card.querySelector(".sample");
  sample.style.fontFamily = cssName(font);
  card.dataset.fontLoaded = "true";
  getLocalizedName(font).then(name => {
    if (!name || !card.isConnected) return;
    card.querySelector("strong").textContent = name;
    card.title = `${name} · ${font.style || "Regular"}`;
    if (state.previewed === font) ui.selectedName.textContent = name;
    if (state.previewed === font) updateFontStatus(font);
  }).catch(() => {});
  if (font.previewState === "ready") {
    card.classList.remove("font-pending", "font-loading", "font-failed");
    card.classList.add("font-ready");
    requestAnimationFrame(() => fitCardSample(sample));
    return;
  }
  card.classList.add("font-loading");
  const finish = success => {
    if (!card.isConnected) return;
    card.classList.remove("font-pending", "font-loading", "font-ready", "font-failed");
    card.classList.add(success ? "font-ready" : "font-failed");
    if (success) fitCardSample(sample);
  };
  ensureFontLoaded(font, sample.textContent).then(finish);
}

function ensureFontLoaded(font, text = "字体有光") {
  registerFont(font);
  if (font.previewState === "ready") return Promise.resolve(true);
  if (!font.previewPromise) {
    font.previewState = "loading";
    font.previewPromise = document.fonts?.load
      ? document.fonts.load(`32px ${JSON.stringify(cssName(font))}`, text).then(faces => faces.length > 0).catch(() => false)
      : Promise.resolve(true);
    font.previewPromise = font.previewPromise.then(success => {
      font.previewState = success ? "ready" : "failed";
      return success;
    });
  }
  return font.previewPromise;
}

function getFontAspect(font) {
  if (font.aspectPromise) return font.aspectPromise;
  const character = [...(ui.previewInput.value.trim() || "字")][0];
  font.aspectPromise = ensureFontLoaded(font, character).then(success => {
    if (!success) return font.aspectRatio = null;
    const canvas = getFontAspect.canvas || (getFontAspect.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = `100px ${JSON.stringify(cssName(font))}`;
    const metrics = context.measureText(character);
    const boundsWidth = (metrics.actualBoundingBoxLeft || 0) + (metrics.actualBoundingBoxRight || 0);
    const boundsHeight = (metrics.actualBoundingBoxAscent || 0) + (metrics.actualBoundingBoxDescent || 0);
    const width = boundsWidth || metrics.width;
    const height = boundsHeight || 100;
    return font.aspectRatio = height > 0 ? width / height : null;
  });
  return font.aspectPromise;
}

function setupLazyFontLoading() {
  if (!("IntersectionObserver" in window)) {
    ui.list.querySelectorAll(".font-card").forEach(card => { state.prefetchCards.add(card); loadCardFont(card); });
    return;
  }
  fontObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        state.prefetchCards.add(entry.target);
        const sample = entry.target.querySelector(".sample");
        if (sample.textContent !== cardPreviewText()) sample.textContent = cardPreviewText();
        loadCardFont(entry.target);
      } else {
        state.prefetchCards.delete(entry.target);
      }
    }
  }, { root: ui.list, rootMargin: `${Math.max(800, ui.list.clientHeight * 2)}px 0px` });
  ui.list.querySelectorAll(".font-card").forEach(card => fontObserver.observe(card));
}

function fitCardSample(sample) {
  if (!sample || state.view === "single") return;
  const maximum = cardBaseFontSize();
  sample.style.fontSize = `${maximum}px`;
  if (!sample.clientWidth || sample.scrollWidth <= sample.clientWidth) return;
  let low = 10, high = maximum;
  for (let i = 0; i < 7; i++) {
    const middle = (low + high) / 2;
    sample.style.fontSize = `${middle}px`;
    if (sample.scrollWidth <= sample.clientWidth) low = middle;
    else high = middle;
  }
  sample.style.fontSize = `${Math.max(10, low - .5)}px`;
}

function cardBaseFontSize() {
  if (state.view === "list") return 32;
  return Math.max(28, Math.min(64, state.cardWidth * .2));
}

function scheduleCardFit() {
  cancelAnimationFrame(scheduleCardFit.frame);
  scheduleCardFit.frame = requestAnimationFrame(() => {
    state.prefetchCards.forEach(card => {
      if (card.dataset.fontLoaded === "true") fitCardSample(card.querySelector(".sample"));
    });
  });
}

function selectFont(font) {
  state.selected = font;
  ui.list.querySelector(".font-card.active")?.classList.remove("active");
  ui.list.querySelector(`[data-id="${font.id}"]`)?.classList.add("active");
  previewFont(font, false);
}

function previewFont(font, temporary = true) {
  state.previewed = font;
  $("#detailPanel").classList.remove("empty-preview");
  const selectionVersion = ++state.selectionVersion;
  clearTimeout(previewFont.timer);
  registerFont(font);
  syncToolbarPreview(font);
  ui.selectedName.textContent = font.displayName || font.fullName || font.family;
  ui.selectedStyle.textContent = font.style || "REGULAR";
  ui.previewText.style.fontFamily = cssName(font);
  ui.magnifiedText.style.fontFamily = cssName(font);
  renderFontDetails(font);
  ui.favorite.textContent = state.favorites.has(font.postscriptName) ? "★" : "☆";
  updateFontStatus(font);
  ui.previewText.textContent = COMMON_DETAIL_PREVIEW;
  ui.magnifiedText.textContent = ui.previewText.textContent;
  ui.axisStatus.textContent = font.axes ? `${font.axes.length} 个可变轴` : (temporary ? "悬停预览" : "正在检测可变轴…");
  ui.axes.replaceChildren();
  if (font.axes) renderAxes(font.axes);
  if (font.details) renderFontDetails(font, font.details);
  else renderFontDetails(font);
  previewFont.timer = setTimeout(async () => {
    const tasks = [
      getVariationAxes(font),
      getFontDetails(font),
      getFontAspect(font),
      getExtendedFontDetails(font)
    ];
    const [axesResult, detailsResult, aspectResult, extendedResult] = await Promise.allSettled(tasks);
    if (state.selectionVersion !== selectionVersion) return;
    const axes = axesResult.status === "fulfilled" ? axesResult.value : [];
    font.variable = axes.length > 0;
    renderAxes(axes);
    renderFontDetails(font, detailsResult.status === "fulfilled" ? detailsResult.value : false);
    updateFontStatus(font);
  }, temporary ? 220 : 0);
}

function clearPreview() {
  clearTimeout(previewFont.timer);
  state.previewed = null;
  $("#detailPanel").classList.add("empty-preview");
  state.selectionVersion++;
  ui.selectedName.textContent = "将鼠标移到字体卡片";
  ui.selectedStyle.textContent = "未选择字体";
  ui.previewText.textContent = "";
  ui.magnifiedText.textContent = "";
  ui.previewText.style.fontFamily = "";
  syncToolbarPreview(null);
  ui.axisStatus.textContent = "暂无字体参数";
  ui.axes.replaceChildren();
  ui.favorite.textContent = "☆";
  updateFontStatus(null);
  [ui.infoFamily, ui.infoPostscript, ...INFO_BASIC_FIELDS, ...INFO_EXTENDED_FIELDS].forEach(item => item.textContent = "—");
}

function restorePinnedPreview() {
  state.hovered = null;
  if (state.selected) previewFont(state.selected, false);
  else clearPreview();
}

async function detectVariableFonts() {
  if (state.scanningVariables) return;
  if (state.scanningCapabilities || state.scanningShapes) { setTimeout(detectVariableFonts, 120); return; }
  state.scanningVariables = true;
  let completed = state.fonts.filter(item => item.variable !== null).length;
  const total = state.fonts.length;
  ui.scanProgress.hidden = total === 0 || completed >= total;
  const updateScanProgress = () => {
    const percent = total ? completed / total * 100 : 100;
    ui.scanBar.style.width = `${percent}%`;
    ui.scanText.textContent = `正在识别可变字体 ${completed} / ${total}`;
  };
  updateScanProgress();
  const workers = Array.from({length: 1}, async () => {
    while (true) {
      const font = state.fonts.find(item => item.variable === null && !item.detecting);
      if (!font) break;
      font.detecting = true;
      try { font.variable = (await getVariationAxes(font)).length > 0; }
      catch { font.variable = false; }
      completed++;
      if (completed % 3 === 0 || completed === total) {
        updateScanProgress();
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  });
  await Promise.all(workers);
  ui.scanProgress.hidden = true;
  ui.scanText.textContent = "可变字体识别完成";
  state.scanningVariables = false;
  if (state.filters.has("variable")) applyFilter();
}

async function scanFontCapabilities() {
  if (state.scanningCapabilities) return;
  if (state.scanningVariables || state.scanningShapes) { setTimeout(scanFontCapabilities, 120); return; }
  state.scanningCapabilities = true;
  let completed = state.fonts.filter(font => font.details).length;
  const total = state.fonts.length;
  ui.scanProgress.hidden = total === 0 || completed >= total;
  const update = () => {
    ui.scanBar.style.width = `${total ? completed / total * 100 : 100}%`;
    ui.scanText.textContent = `正在读取字符与字重信息 ${completed} / ${total}`;
  };
  update();
  for (const font of state.fonts) {
    if (font.details) continue;
    try { await getFontDetails(font); }
    catch { font.details = { supportsChinese: false, supportsLatin: false, weight: font.weightClass }; }
    completed++;
    if (completed % 3 === 0 || completed === total) {
      update();
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  state.scanningCapabilities = false;
  ui.scanProgress.hidden = true;
  applyFilter();
}

async function scanFontShapes() {
  if (state.scanningShapes) return;
  if (state.scanningVariables || state.scanningCapabilities) { setTimeout(scanFontShapes, 150); return; }
  state.scanningShapes = true;
  let completed = state.fonts.filter(font => font.aspectRatio !== undefined).length;
  const total = state.fonts.length;
  ui.scanProgress.hidden = total === 0 || completed >= total;
  const update = () => {
    ui.scanBar.style.width = `${total ? completed / total * 100 : 100}%`;
    ui.scanText.textContent = `正在测量首字宽高比 ${completed} / ${total}`;
  };
  update();
  for (const font of state.fonts) {
    if (font.aspectRatio !== undefined) continue;
    try { await getFontAspect(font); }
    catch { font.aspectRatio = null; }
    completed++;
    if (completed % 3 === 0 || completed === total) {
      update();
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  state.scanningShapes = false;
  ui.scanProgress.hidden = true;
  applyFilter();
}

function getVariationAxes(font) {
  if (font.axes) return Promise.resolve(font.axes);
  if (!font.axisPromise) font.axisPromise = readVariationAxes(font).then(axes => font.axes = axes);
  return font.axisPromise;
}

function getFontBlob(font) {
  if (!font.blobPromise) font.blobPromise = font.blob();
  return font.blobPromise;
}

const FONT_FORMATS = {
  0x00010000: "TrueType outlines",
  0x4F54544F: "OpenType CFF",
  0x74727565: "TrueType",
  0x74746366: "TrueType Collection",
  0x774F4646: "WOFF",
  0x774F4632: "WOFF2"
};
const UNSUPPORTED_FONT_SIGNATURES = new Set([0x774F4646, 0x774F4632, 0x74746366]);
const NAME_FIELD_IDS = { 0: "copyright", 2: "subfamily", 5: "version", 8: "manufacturer", 9: "designer", 13: "license" };
const FEATURE_TABLE_TAGS = new Set(["GSUB", "GPOS", "GDEF", "kern", "math", "morx", "mort", "feat", "aalt", "calt", "liga"]);

async function getFontContext(font) {
  if (!font.contextPromise) {
    font.contextPromise = (async () => {
      const blob = await getFontBlob(font);
      const header = new DataView(await blob.slice(0, 12).arrayBuffer());
      const signature = header.byteLength >= 12 ? header.getUint32(0) : 0;
      const unsupported = UNSUPPORTED_FONT_SIGNATURES.has(signature);
      const tableMap = new Map();
      if (!unsupported && header.byteLength >= 12) {
        const numTables = header.getUint16(4);
        const directory = new DataView(await blob.slice(12, 12 + numTables * 16).arrayBuffer());
        for (let i = 0; i < numTables; i++) {
          const p = i * 16;
          const tag = String.fromCharCode(directory.getUint8(p), directory.getUint8(p + 1), directory.getUint8(p + 2), directory.getUint8(p + 3));
          tableMap.set(tag, { offset: directory.getUint32(p + 8), length: directory.getUint32(p + 12) });
        }
      }
      const readTable = async tag => {
        const table = tableMap.get(tag);
        return table ? new DataView(await blob.slice(table.offset, table.offset + table.length).arrayBuffer()) : null;
      };
      return {
        blob,
        signature,
        unsupported,
        format: FONT_FORMATS[signature] || "OpenType",
        tables: [...tableMap.keys()],
        readTable
      };
    })();
  }
  return font.contextPromise;
}

function decodeNameString(view, offset, length, platform) {
  if (length <= 0 || offset + length > view.byteLength) return "";
  if (platform === 3) {
    let value = "";
    for (let index = 0; index + 1 < length; index += 2) value += String.fromCharCode(view.getUint16(offset + index));
    return value.replace(/\0/g, "").trim();
  }
  let value = "";
  for (let index = 0; index < length; index++) value += String.fromCharCode(view.getUint8(offset + index));
  return value.replace(/\0/g, "").trim();
}

function scoreNameRecord(platform, language, nameId) {
  return (platform === 3 ? 100 : 60) +
    (language === 0x0804 ? 30 : language === 0x0409 ? 18 : [0x0404, 0x0C04, 0x1004, 0x1404].includes(language) ? 22 : 0) +
    (nameId === 16 ? 8 : 0);
}

function parseNameFields(nameView) {
  if (!nameView || nameView.byteLength < 6) return {};
  const recordCount = nameView.getUint16(2);
  const stringsOffset = nameView.getUint16(4);
  const best = {};
  for (let i = 0; i < recordCount; i++) {
    const p = 6 + i * 12;
    if (p + 12 > nameView.byteLength) break;
    const platform = nameView.getUint16(p);
    const language = nameView.getUint16(p + 4);
    const nameId = nameView.getUint16(p + 6);
    const field = NAME_FIELD_IDS[nameId];
    if (!field) continue;
    const length = nameView.getUint16(p + 8);
    const offset = stringsOffset + nameView.getUint16(p + 10);
    const value = decodeNameString(nameView, offset, length, platform);
    if (!value) continue;
    const score = scoreNameRecord(platform, language, nameId);
    if (!best[field] || score > best[field].score) best[field] = { value, score };
  }
  return Object.fromEntries(Object.entries(best).map(([key, item]) => [key, item.value]));
}

function pickChineseDisplayName(nameView) {
  if (!nameView || nameView.byteLength < 6) return null;
  const recordCount = nameView.getUint16(2);
  const stringsOffset = nameView.getUint16(4);
  const chineseLanguages = new Set([0x0804, 0x0404, 0x0C04, 0x1004, 0x1404]);
  let best = null, bestScore = -1;
  for (let i = 0; i < recordCount; i++) {
    const p = 6 + i * 12;
    if (p + 12 > nameView.byteLength) break;
    const platform = nameView.getUint16(p);
    const language = nameView.getUint16(p + 4);
    const nameId = nameView.getUint16(p + 6);
    if (![0, 3].includes(platform) || ![1, 4, 16].includes(nameId)) continue;
    const length = nameView.getUint16(p + 8);
    const offset = stringsOffset + nameView.getUint16(p + 10);
    const value = decodeNameString(nameView, offset, length, platform);
    if (!/\p{Script=Han}/u.test(value)) continue;
    const score = (nameId === 16 ? 300 : nameId === 1 ? 200 : 100) +
      (language === 0x0804 ? 50 : chineseLanguages.has(language) ? 35 : 0) + (platform === 3 ? 10 : 0);
    if (score > bestScore) { best = value; bestScore = score; }
  }
  return best;
}

function formatMacTimestamp(view, offset) {
  if (!view || view.byteLength < offset + 4) return null;
  const seconds = view.getUint32(offset);
  if (!seconds) return null;
  return new Date((seconds - 2082844800) * 1000);
}

function formatFontDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("zh-CN");
}

function formatFsType(value) {
  if (!Number.isFinite(value) || value === 0) return "无限制";
  const flags = [];
  if (value & 0x0008) flags.push("可编辑嵌入");
  else if (value & 0x0004) flags.push("可预览与打印");
  else if (value & 0x0002) flags.push("Restricted License");
  if (value & 0x0001) flags.push("可安装嵌入");
  if (!flags.length) flags.push(`位标记 ${value}`);
  return flags.join(" · ");
}

function formatPostFixed(value) {
  return Number((value / 65536).toFixed(2));
}

function getLocalizedName(font) {
  if (!font.namePromise) {
    font.namePromise = readLocalizedName(font).then(name => {
      if (!name) return null;
      font.displayName = name;
      const normalized = name.toLowerCase();
      if (!font.search.includes(normalized)) font.search += ` ${normalized}`;
      const initials = pinyinInitials(name);
      if (!font.initials.includes(initials)) font.initials += initials;
      return name;
    });
  }
  return font.namePromise;
}

async function readLocalizedName(font) {
  const ctx = await getFontContext(font);
  if (ctx.unsupported) return null;
  const name = await ctx.readTable("name");
  return pickChineseDisplayName(name);
}

function getFontDetails(font) {
  if (!font.detailsPromise) font.detailsPromise = readFontDetails(font).then(details => font.details = details);
  return font.detailsPromise;
}

async function readFontDetails(font) {
  const ctx = await getFontContext(font);
  const details = {
    format: ctx.format,
    size: ctx.blob.size,
    glyphs: null,
    upm: null,
    weight: null,
    width: null,
    supportsChinese: false,
    supportsLatin: false,
    tables: ctx.tables
  };
  if (ctx.unsupported) return details;
  const [head, maxp, os2, cmap] = await Promise.all([ctx.readTable("head"), ctx.readTable("maxp"), ctx.readTable("OS/2"), ctx.readTable("cmap")]);
  if (head?.byteLength >= 20) details.upm = head.getUint16(18);
  if (maxp?.byteLength >= 6) details.glyphs = maxp.getUint16(4);
  if (os2?.byteLength >= 8) {
    details.weight = os2.getUint16(4);
    details.width = os2.getUint16(6);
  }
  if (cmap) {
    details.supportsLatin = cmapHasCodepoint(cmap, 0x41);
    details.supportsChinese = cmapHasCodepoint(cmap, 0x5B57) || cmapHasCodepoint(cmap, 0x4E2D);
  }
  await getLocalizedName(font);
  return details;
}

function getExtendedFontDetails(font) {
  if (!font.extendedDetailsPromise) {
    font.extendedDetailsPromise = readExtendedFontDetails(font).then(details => font.extendedDetails = details);
  }
  return font.extendedDetailsPromise;
}

async function readExtendedFontDetails(font) {
  const ctx = await getFontContext(font);
  if (ctx.unsupported) return null;
  const [name, head, hhea, post, os2] = await Promise.all([
    ctx.readTable("name"), ctx.readTable("head"), ctx.readTable("hhea"), ctx.readTable("post"), ctx.readTable("OS/2")
  ]);
  const names = parseNameFields(name);
  const extended = {
    version: names.version || null,
    copyright: names.copyright || null,
    designer: names.designer || null,
    manufacturer: names.manufacturer || null,
    license: names.license || null,
    subfamily: names.subfamily || null,
    ascender: null,
    descender: null,
    lineGap: null,
    capHeight: null,
    xHeight: null,
    italicAngle: null,
    fixedPitch: null,
    created: null,
    modified: null,
    bbox: null,
    embedding: null,
    features: ctx.tables.filter(tag => FEATURE_TABLE_TAGS.has(tag))
  };
  if (hhea?.byteLength >= 10) {
    extended.ascender = hhea.getInt16(4);
    extended.descender = hhea.getInt16(6);
    extended.lineGap = hhea.getInt16(8);
  }
  if (post?.byteLength >= 16) {
    extended.italicAngle = formatPostFixed(post.getInt32(4));
    extended.fixedPitch = post.getUint32(12) !== 0;
  }
  if (head?.byteLength >= 36) {
    extended.created = formatFontDate(formatMacTimestamp(head, 8));
    extended.modified = formatFontDate(formatMacTimestamp(head, 12));
    extended.bbox = [head.getInt16(36), head.getInt16(38), head.getInt16(40), head.getInt16(42)].join(", ");
  }
  if (os2?.byteLength >= 10) extended.embedding = formatFsType(os2.getUint16(8));
  if (os2?.byteLength >= 90) {
    extended.xHeight = os2.getInt16(86) || null;
    extended.capHeight = os2.getInt16(88) || null;
  }
  return extended;
}

function cmapHasCodepoint(cmap, codepoint) {
  if (cmap.byteLength < 4) return false;
  const count = cmap.getUint16(2);
  const offsets = [];
  for (let i = 0; i < count; i++) {
    const record = 4 + i * 8;
    if (record + 8 > cmap.byteLength) break;
    const offset = cmap.getUint32(record + 4);
    if (offset < cmap.byteLength && !offsets.includes(offset)) offsets.push(offset);
  }
  offsets.sort((a, b) => {
    const formatA = a + 2 <= cmap.byteLength ? cmap.getUint16(a) : 0;
    const formatB = b + 2 <= cmap.byteLength ? cmap.getUint16(b) : 0;
    return (formatB === 12 ? 2 : formatB === 4 ? 1 : 0) - (formatA === 12 ? 2 : formatA === 4 ? 1 : 0);
  });
  for (const offset of offsets) {
    if (offset + 8 > cmap.byteLength) continue;
    const format = cmap.getUint16(offset);
    if (format === 12 && offset + 16 <= cmap.byteLength) {
      const groups = cmap.getUint32(offset + 12);
      let low = 0, high = groups - 1;
      while (low <= high) {
        const middle = (low + high) >> 1;
        const p = offset + 16 + middle * 12;
        if (p + 12 > cmap.byteLength) break;
        const start = cmap.getUint32(p), end = cmap.getUint32(p + 4);
        if (codepoint < start) high = middle - 1;
        else if (codepoint > end) low = middle + 1;
        else return true;
      }
    } else if (format === 4 && codepoint <= 0xFFFF) {
      const segCount = cmap.getUint16(offset + 6) / 2;
      const endCodes = offset + 14;
      const startCodes = endCodes + segCount * 2 + 2;
      for (let i = 0; i < segCount; i++) {
        if (startCodes + i * 2 + 2 > cmap.byteLength) break;
        const end = cmap.getUint16(endCodes + i * 2);
        const start = cmap.getUint16(startCodes + i * 2);
        if (codepoint >= start && codepoint <= end) return true;
      }
    }
  }
  return false;
}

function setInfoText(element, value, { title } = {}) {
  const text = value ?? "—";
  element.textContent = text;
  element.title = title ?? (text === "—" ? "" : String(text));
}

function renderFontDetails(font, details = null) {
  ui.infoFamily.textContent = font.displayName || font.family || "—";
  ui.infoPostscript.textContent = font.postscriptName || "—";
  const extended = font.extendedDetails;
  const extendedPending = details !== false && state.previewed === font && !extended;
  if (details === null) {
    INFO_BASIC_FIELDS.forEach(item => item.textContent = "读取中…");
    INFO_EXTENDED_FIELDS.forEach(item => item.textContent = "读取中…");
    return;
  }
  if (details === false) {
    INFO_BASIC_FIELDS.forEach(item => item.textContent = "不可用");
    INFO_EXTENDED_FIELDS.forEach(item => item.textContent = "不可用");
    return;
  }
  ui.infoFormat.textContent = details.format;
  ui.infoSize.textContent = formatFileSize(details.size);
  ui.infoGlyphs.textContent = details.glyphs?.toLocaleString() || "—";
  ui.infoUpm.textContent = details.upm || "—";
  ui.infoWeight.textContent = details.weight || "—";
  ui.infoWidth.textContent = details.width || "—";
  ui.infoLanguage.textContent = [details.supportsChinese ? "中文" : "", details.supportsLatin ? "英文" : ""].filter(Boolean).join(" / ") || "其他";
  ui.infoAspect.textContent = Number.isFinite(font.aspectRatio) ? `${font.aspectRatio.toFixed(3)} : 1` : "—";
  ui.infoTables.textContent = details.tables.length ? `${details.tables.length} · ${details.tables.slice(0, 8).join(" ")}` : "—";
  ui.infoTables.title = details.tables.join(", ");
  if (extendedPending) {
    INFO_EXTENDED_FIELDS.forEach(item => item.textContent = "读取中…");
    return;
  }
  if (!extended) {
    INFO_EXTENDED_FIELDS.forEach(item => item.textContent = "—");
    return;
  }
  setInfoText(ui.infoSubfamily, extended.subfamily);
  setInfoText(ui.infoVersion, extended.version);
  setInfoText(ui.infoCopyright, extended.copyright);
  setInfoText(ui.infoDesigner, extended.designer);
  setInfoText(ui.infoManufacturer, extended.manufacturer);
  setInfoText(ui.infoLicense, extended.license);
  setInfoText(ui.infoAscender, extended.ascender);
  setInfoText(ui.infoDescender, extended.descender);
  setInfoText(ui.infoLineGap, extended.lineGap);
  setInfoText(ui.infoCapHeight, extended.capHeight);
  setInfoText(ui.infoXHeight, extended.xHeight);
  setInfoText(ui.infoItalicAngle, extended.italicAngle == null ? null : `${extended.italicAngle}°`);
  setInfoText(ui.infoFixedPitch, extended.fixedPitch == null ? null : extended.fixedPitch ? "是" : "否");
  setInfoText(ui.infoCreated, extended.created);
  setInfoText(ui.infoModified, extended.modified);
  setInfoText(ui.infoBBox, extended.bbox);
  setInfoText(ui.infoEmbedding, extended.embedding);
  setInfoText(ui.infoFeatures, extended.features?.length ? extended.features.join(" · ") : "无");
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return "—";
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

async function readVariationAxes(font) {
  if (font.axes) return font.axes;
  const ctx = await getFontContext(font);
  if (ctx.unsupported) return font.axes = [];
  const table = await ctx.readTable("fvar");
  if (!table || table.byteLength < 12) return font.axes = [];
  const axesOffset = table.getUint16(4);
  const axisCount = table.getUint16(8);
  const axisSize = table.getUint16(10);
  const axes = [];
  for (let i = 0; i < axisCount; i++) {
    const p = axesOffset + i * axisSize;
    if (p + 16 > table.byteLength) break;
    const tag = String.fromCharCode(table.getUint8(p), table.getUint8(p + 1), table.getUint8(p + 2), table.getUint8(p + 3));
    axes.push({ tag, min: fixed(table.getInt32(p + 4)), default: fixed(table.getInt32(p + 8)), max: fixed(table.getInt32(p + 12)) });
  }
  return font.axes = axes;
}

function fixed(value) { return value / 65536; }
function renderAxes(axes) {
  state.axes = {};
  ui.axes.replaceChildren();
  if (!axes.length) {
    ui.axisStatus.textContent = "标准字体 · 无可变轴";
    return updateVariation();
  }
  ui.axisStatus.textContent = `${axes.length} 个可变轴 · 拖动实时预览`;
  for (const axis of axes) {
    state.axes[axis.tag] = axis.default;
    const label = document.createElement("label");
    label.className = "axis-control";
    const step = (axis.max - axis.min) > 20 ? 1 : .1;
    label.innerHTML = `<span>${axisLabel(axis.tag)} <output>${formatNumber(axis.default)}</output></span><input type="range" min="${axis.min}" max="${axis.max}" step="${step}" value="${axis.default}">`;
    const input = label.querySelector("input"), output = label.querySelector("output");
    input.addEventListener("input", () => { state.axes[axis.tag] = Number(input.value); output.textContent = formatNumber(input.value); updateVariation(); });
    ui.axes.appendChild(label);
  }
  updateVariation();
}

function axisLabel(tag) { return ({wght:"粗细 Wght", wdth:"宽度 Wdth", slnt:"倾斜 Slnt", ital:"斜体 Ital", opsz:"光学尺寸 Opsz"})[tag] || tag.toUpperCase(); }
function formatNumber(value) { return Number(value).toFixed(Number(value) % 1 ? 1 : 0); }
function updateVariation() {
  const value = toolbarVariationSettings();
  ui.previewText.style.fontVariationSettings = value;
  ui.magnifiedText.style.fontVariationSettings = value;
  if (state.previewed) ui.previewInput.style.fontVariationSettings = value;
}

function updatePreview() {
  const text = ui.previewInput.value || "在这里输入预览文字";
  const firstCharacter = [...text.trim()][0] || "字";
  if (firstCharacter !== state.aspectCharacter) {
    state.aspectCharacter = firstCharacter;
    state.fonts.forEach(font => { delete font.aspectRatio; delete font.aspectPromise; });
    if (["square", "narrow", "wide"].includes(state.sort)) {
      clearTimeout(updatePreview.shapeTimer);
      updatePreview.shapeTimer = setTimeout(scanFontShapes, 260);
    }
  }
  ui.previewText.textContent = state.previewed ? COMMON_DETAIL_PREVIEW : "";
  ui.magnifiedText.textContent = state.previewed ? COMMON_DETAIL_PREVIEW : "";
  ui.cardMagnifiedText.textContent = cardPreviewText();
  scheduleLazyCardTextUpdate();
}

function scheduleLazyCardTextUpdate() {
  cancelAnimationFrame(scheduleLazyCardTextUpdate.frame);
  scheduleLazyCardTextUpdate.frame = requestAnimationFrame(() => {
    const cardText = cardPreviewText();
    state.prefetchCards.forEach(card => {
      const sample = card.querySelector(".sample");
      if (sample && sample.textContent !== cardText) sample.textContent = cardText;
    });
    scheduleCardFit();
  });
}

function updateVisualSettings() {
  ui.sizeOut.textContent = ui.size.value;
  ui.spacingOut.textContent = ui.spacing.value;
  ui.lineHeightOut.textContent = ui.lineHeight.value;
  [ui.previewText, ui.magnifiedText].forEach(el => {
    el.style.fontSize = `${ui.size.value}px`;
    el.style.letterSpacing = `${ui.spacing.value}px`;
    el.style.lineHeight = ui.lineHeight.value;
    el.style.color = ui.color.value;
  });
  ui.stage.style.backgroundColor = ui.bg.value;
  ui.magnifier.style.backgroundColor = ui.bg.value;
}

function toggleFavorite() {
  const font = state.selected || state.previewed;
  if (!font) return;
  toggleFavoriteFor(font);
}

function toggleFavoriteFor(font) {
  const key = font.postscriptName;
  if (state.favorites.has(key)) {
    state.favorites.delete(key);
    state.categoryAssignments.delete(key);
  } else state.favorites.add(key);
  persistFavorites();
  ui.favorite.textContent = state.favorites.has(key) ? "★" : "☆";
  if (state.previewed === font || state.selected === font) updateFontStatus(font);
  applyFilter();
}

function persistFavorites() {
  localStorage.setItem("font-favorites", JSON.stringify([...state.favorites]));
  const assignments = Object.fromEntries([...state.categoryAssignments].map(([font, ids]) => [font, [...ids]]));
  localStorage.setItem("font-favorite-data", JSON.stringify({ version: 2, categories: state.categories, assignments, recentCategories: state.recentCategories }));
}

function touchRecentCategory(id) {
  state.recentCategories = [id, ...state.recentCategories.filter(item => item !== id)]
    .filter(item => state.categories.some(category => category.id === item)).slice(0, 6);
}

function setFontCategory(font, categoryId, enabled) {
  const ids = new Set(state.categoryAssignments.get(font.postscriptName) || []);
  enabled ? ids.add(categoryId) : ids.delete(categoryId);
  if (ids.size) state.categoryAssignments.set(font.postscriptName, ids); else state.categoryAssignments.delete(font.postscriptName);
  if (enabled) {
    state.favorites.add(font.postscriptName);
    touchRecentCategory(categoryId);
  }
  if (state.previewed === font || state.selected === font) ui.favorite.textContent = state.favorites.has(font.postscriptName) ? "★" : "☆";
  if (state.previewed === font || state.selected === font) updateFontStatus(font);
  persistFavorites();
}

function orderedCategories() {
  const roots = state.categories.filter(item => !item.parentId);
  return roots.flatMap(root => [root, ...state.categories.filter(item => item.parentId === root.id)]);
}

function expandedFavoriteCategoryView() {
  const result = new Set();
  if (!["all", "uncategorized"].includes(state.favoriteCategoryView)) {
    result.add(state.favoriteCategoryView);
    state.categories.filter(item => item.parentId === state.favoriteCategoryView).forEach(child => result.add(child.id));
  }
  return result;
}

function renderFavoriteSidebar() {
  const visible = state.filters.has("favorite");
  ui.favoriteSidebar.hidden = !visible;
  if (!visible) return;
  const installedFavorites = state.fonts.filter(font => state.favorites.has(font.postscriptName));
  const countFor = id => installedFavorites.filter(font => {
    const ids = state.categoryAssignments.get(font.postscriptName) || new Set();
    if (id === "all") return true;
    if (id === "uncategorized") return ids.size === 0;
    const expanded = new Set([id, ...state.categories.filter(item => item.parentId === id).map(item => item.id)]);
    return [...expanded].some(item => ids.has(item));
  }).length;
  const items = [
    { id: "all", name: "全部收藏", parentId: null },
    { id: "uncategorized", name: "未分类", parentId: null },
    ...orderedCategories()
  ];
  ui.favoriteCategoryList.innerHTML = items.map(item => {
    if (state.editingCategoryId === item.id) return `<div class="favorite-category-row" data-category-id="${escapeHtml(item.id)}"><input class="category-inline-input" value="${escapeHtml(item.name)}" maxlength="30" aria-label="分类名称"></div>`;
    const button = `<button type="button" class="favorite-category-item${item.parentId ? " child" : ""}${state.favoriteCategoryView === item.id ? " active" : ""}" data-favorite-category="${escapeHtml(item.id)}"><span>${item.parentId ? "↳ " : ""}${escapeHtml(item.name)}</span><b>${countFor(item.id)}</b></button>`;
    if (["all", "uncategorized"].includes(item.id)) return button;
    return `<div class="favorite-category-row" draggable="true" data-category-id="${escapeHtml(item.id)}">${button}<span class="favorite-category-actions"><button type="button" data-category-action="rename" title="重命名">✎</button><button type="button" data-category-action="delete" title="删除">×</button></span></div>`;
  }).join("");
  ui.favoriteCategoryList.querySelectorAll("[data-favorite-category]").forEach(button => button.addEventListener("click", () => {
    state.favoriteCategoryView = button.dataset.favoriteCategory;
    applyFilter();
  }));
  ui.favoriteCategoryList.querySelectorAll("[data-category-action]").forEach(button => button.addEventListener("click", event => {
    event.stopPropagation();
    const id = button.closest("[data-category-id]").dataset.categoryId;
    button.dataset.categoryAction === "rename" ? renameCategory(id) : deleteCategory(id);
  }));
  const inlineInput = ui.favoriteCategoryList.querySelector(".category-inline-input");
  if (inlineInput) {
    const id = inlineInput.closest("[data-category-id]").dataset.categoryId;
    const commit = () => {
      if (inlineInput.dataset.done) return;
      inlineInput.dataset.done = "true";
      commitCategoryRename(id, inlineInput.value);
    };
    inlineInput.addEventListener("keydown", event => {
      if (event.key === "Enter") { event.preventDefault(); commit(); }
      if (event.key === "Escape") { inlineInput.dataset.done = "true"; state.editingCategoryId = null; renderFavoriteSidebar(); }
    });
    inlineInput.addEventListener("blur", commit);
    setTimeout(() => { inlineInput.focus(); inlineInput.select(); }, 0);
  }
  ui.favoriteCategoryList.querySelectorAll(".favorite-category-row[draggable='true']").forEach(row => bindCategoryDragEvents(row));
}

function renderCategoryUI() {
  renderFavoriteSidebar();
}

function addCategory() {
  const selected = state.categories.find(item => item.id === state.favoriteCategoryView);
  const parentId = selected ? (selected.parentId || selected.id) : null;
  const base = "新建分类";
  let name = base, index = 2;
  while (state.categories.some(item => item.parentId === parentId && item.name === name)) name = `${base} (${index++})`;
  const category = { id: `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`, name, parentId };
  state.categories.push(category);
  state.favoriteCategoryView = category.id;
  state.editingCategoryId = category.id;
  persistFavorites();
  applyFilter();
}

function renameCategory(id) {
  state.editingCategoryId = id;
  renderFavoriteSidebar();
}

function commitCategoryRename(id, value) {
  const category = state.categories.find(item => item.id === id);
  if (!category) return;
  const name = value.trim();
  if (!name) return deleteCategory(id);
  if (state.categories.some(item => item.id !== id && item.parentId === category.parentId && item.name === name)) {
    toast("同级分类名称已存在");
    state.editingCategoryId = id;
    return renderFavoriteSidebar();
  }
  category.name = name;
  state.editingCategoryId = null;
  persistFavorites();
  renderFavoriteSidebar();
}

function clearCategoryDropStates() {
  ui.favoriteCategoryList.querySelectorAll(".favorite-category-row").forEach(row => row.classList.remove("dragging", "drop-before", "drop-after", "drop-inside", "font-drop"));
}

function bindCategoryDragEvents(row) {
  row.addEventListener("dragstart", event => {
    if (event.target.closest("button, input")) return event.preventDefault();
    state.draggingCategoryId = row.dataset.categoryId;
    row.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-font-category", state.draggingCategoryId);
  });
  row.addEventListener("dragover", event => {
    if (!state.draggingFontId && (!state.draggingCategoryId || state.draggingCategoryId === row.dataset.categoryId)) return;
    event.preventDefault();
    clearCategoryDropStates();
    if (state.draggingFontId) {
      row.classList.add("font-drop");
      event.dataTransfer.dropEffect = "copy";
      return;
    }
    const rect = row.getBoundingClientRect();
    const ratio = (event.clientY - rect.top) / rect.height;
    row.dataset.dropMode = ratio < .25 ? "before" : ratio > .75 ? "after" : "inside";
    row.classList.add(`drop-${row.dataset.dropMode}`);
  });
  row.addEventListener("dragleave", event => { if (!row.contains(event.relatedTarget)) clearCategoryDropStates(); });
  row.addEventListener("drop", event => {
    event.preventDefault();
    const targetId = row.dataset.categoryId;
    const mode = row.dataset.dropMode || "inside";
    clearCategoryDropStates();
    if (state.draggingFontId) {
      const font = state.fonts.find(item => item.postscriptName === state.draggingFontId);
      if (font) { setFontCategory(font, targetId, true); toast(`已加入“${state.categories.find(item => item.id === targetId)?.name || "分类"}”`); applyFilter(); }
      state.draggingFontId = null;
      return;
    }
    moveCategory(state.draggingCategoryId, targetId, mode);
    state.draggingCategoryId = null;
  });
  row.addEventListener("dragend", () => { state.draggingCategoryId = null; clearCategoryDropStates(); });
}

function moveCategory(dragId, targetId, mode) {
  if (!dragId || dragId === targetId) return;
  const dragged = state.categories.find(item => item.id === dragId);
  const target = state.categories.find(item => item.id === targetId);
  if (!dragged || !target) return;
  const draggedHasChildren = state.categories.some(item => item.parentId === dragId);
  if (mode === "inside" && !target.parentId) {
    if (draggedHasChildren) return toast("包含二级分类的分类不能再作为子分类");
    dragged.parentId = target.id;
  } else {
    if (target.parentId && draggedHasChildren) return toast("包含二级分类的分类不能移动到二级");
    dragged.parentId = target.parentId || null;
  }
  const from = state.categories.indexOf(dragged);
  state.categories.splice(from, 1);
  const targetIndex = state.categories.indexOf(target);
  const insertAt = mode === "before" ? targetIndex : targetIndex + 1;
  state.categories.splice(Math.max(0, insertAt), 0, dragged);
  state.favoriteCategoryView = dragged.id;
  persistFavorites();
  renderFavoriteSidebar();
}

function deleteCategory(id) {
  const category = state.categories.find(item => item.id === id);
  if (!category) return;
  const removed = new Set([id, ...state.categories.filter(item => item.parentId === id).map(item => item.id)]);
  state.categories = state.categories.filter(item => !removed.has(item.id));
  if (removed.has(state.favoriteCategoryView)) state.favoriteCategoryView = "all";
  state.recentCategories = state.recentCategories.filter(item => !removed.has(item));
  state.categoryAssignments.forEach((ids, font) => {
    removed.forEach(item => ids.delete(item));
    if (!ids.size) state.categoryAssignments.delete(font);
  });
  persistFavorites();
  renderCategoryUI();
  applyFilter();
}

function openFavoriteCategoryView() {
  state.filters.add("favorite");
  updateFilterControls();
  applyFilter();
}

function categoryPath(category) {
  const parent = category.parentId ? state.categories.find(item => item.id === category.parentId) : null;
  return parent ? `${parent.name} / ${category.name}` : category.name;
}

function contextCategoryButton(category, assigned, recent = false) {
  return `<button class="context-menu-item" type="button" data-context-category="${escapeHtml(category.id)}">
    <span class="check">${assigned.has(category.id) ? "✓" : ""}</span><span>${escapeHtml(recent ? categoryPath(category) : category.name)}</span>
  </button>`;
}

function renderContextMenuContents() {
  const font = state.contextFont;
  if (!font) return;
  const assigned = state.categoryAssignments.get(font.postscriptName) || new Set();
  const recent = state.recentCategories.map(id => state.categories.find(item => item.id === id)).filter(Boolean).slice(0, 4);
  const roots = state.categories.filter(item => !item.parentId);
  const categoriesHtml = roots.length ? roots.map(root => {
    const children = state.categories.filter(item => item.parentId === root.id);
    if (!children.length) return contextCategoryButton(root, assigned);
    return `<div class="context-submenu">
      <button class="context-menu-item" type="button" data-context-category="${escapeHtml(root.id)}"><span class="check">${assigned.has(root.id) ? "✓" : ""}</span><span>${escapeHtml(root.name)}</span><span class="arrow">›</span></button>
      <div class="context-submenu-panel">${children.map(child => contextCategoryButton(child, assigned)).join("")}</div>
    </div>`;
  }).join("") : `<div class="context-empty">暂无分类，可从下方创建</div>`;
  ui.contextMenu.innerHTML = `
    <div class="context-menu-header">${escapeHtml(font.displayName || font.family)}</div>
    <button class="context-menu-item" type="button" data-context-action="favorite"><span class="check">${state.favorites.has(font.postscriptName) ? "✓" : ""}</span><span>${state.favorites.has(font.postscriptName) ? "取消收藏" : "快速收藏"}</span></button>
    ${recent.length ? `<div class="context-menu-divider"></div><div class="context-menu-label">最近使用</div>${recent.map(item => contextCategoryButton(item, assigned, true)).join("")}` : ""}
    <div class="context-menu-divider"></div><div class="context-menu-label">收藏分类</div>${categoriesHtml}
    <div class="context-menu-divider"></div><button class="context-menu-item" type="button" data-context-action="manage"><span class="check">＋</span><span>管理收藏分类</span></button>`;
  ui.contextMenu.querySelectorAll("[data-context-category]").forEach(button => button.addEventListener("click", event => {
    event.stopPropagation();
    const id = button.dataset.contextCategory;
    const current = state.categoryAssignments.get(font.postscriptName) || new Set();
    setFontCategory(font, id, !current.has(id));
    renderContextMenuContents();
    applyFilter();
  }));
  ui.contextMenu.querySelector('[data-context-action="favorite"]').addEventListener("click", () => {
    toggleFavoriteFor(font);
    hideContextMenu();
  });
  ui.contextMenu.querySelector('[data-context-action="manage"]').addEventListener("click", () => {
    hideContextMenu();
    openFavoriteCategoryView();
  });
}

function showContextMenu(font, x, y) {
  state.contextFont = font;
  renderContextMenuContents();
  ui.contextMenu.hidden = false;
  ui.contextMenu.classList.toggle("open-left", x + 420 > window.innerWidth);
  ui.contextMenu.style.left = `${Math.min(x, window.innerWidth - 230)}px`;
  ui.contextMenu.style.top = `${Math.min(y, window.innerHeight - Math.min(520, ui.contextMenu.scrollHeight + 12))}px`;
  requestAnimationFrame(() => ui.contextMenu.classList.add("visible"));
}

function hideContextMenu() {
  ui.contextMenu.classList.remove("visible");
  state.contextFont = null;
  setTimeout(() => { if (!ui.contextMenu.classList.contains("visible")) ui.contextMenu.hidden = true; }, 130);
}

function exportFavorites() {
  const favorites = [...state.favorites].map(postscriptName => {
    const font = state.fonts.find(item => item.postscriptName === postscriptName);
    return font ? {
      postscriptName,
      family: font.family,
      displayName: font.displayName || font.family,
      fullName: font.fullName,
      style: font.style,
      categoryIds: [...(state.categoryAssignments.get(postscriptName) || [])]
    } : { postscriptName, categoryIds: [...(state.categoryAssignments.get(postscriptName) || [])] };
  });
  const data = { type: "webfonts-favorites", version: 2, exportedAt: new Date().toISOString(), categories: state.categories, recentCategories: state.recentCategories, favorites };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `font-favorites-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`已导出 ${favorites.length} 个收藏`);
}

async function importFavorites(file) {
  try {
    const data = JSON.parse(await file.text());
    const items = Array.isArray(data) ? data : data?.favorites;
    if (!Array.isArray(items)) throw new Error("JSON 中没有 favorites 数组");
    const names = items.map(item => typeof item === "string" ? item : item?.postscriptName).filter(Boolean);
    if (!names.length && items.length) throw new Error("没有有效的 PostScript 名称");
    const before = state.favorites.size;
    names.forEach(name => state.favorites.add(String(name)));
    const idMap = new Map();
    const importedCategories = Array.isArray(data?.categories) ? data.categories : [];
    importedCategories.filter(item => !item.parentId).forEach(item => {
      let local = state.categories.find(category => !category.parentId && category.name === item.name);
      if (!local) { local = { id: `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`, name: item.name, parentId: null }; state.categories.push(local); }
      idMap.set(item.id, local.id);
    });
    importedCategories.filter(item => item.parentId).forEach(item => {
      const parentId = idMap.get(item.parentId);
      if (!parentId) return;
      let local = state.categories.find(category => category.parentId === parentId && category.name === item.name);
      if (!local) { local = { id: `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`, name: item.name, parentId }; state.categories.push(local); }
      idMap.set(item.id, local.id);
    });
    if (Array.isArray(data?.recentCategories)) {
      data.recentCategories.map(id => idMap.get(id)).filter(Boolean).reverse().forEach(touchRecentCategory);
    }
    items.forEach(item => {
      if (typeof item === "string" || !item?.postscriptName || !Array.isArray(item.categoryIds)) return;
      const ids = new Set(state.categoryAssignments.get(item.postscriptName) || []);
      item.categoryIds.map(id => idMap.get(id)).filter(Boolean).forEach(id => ids.add(id));
      if (ids.size) state.categoryAssignments.set(item.postscriptName, ids);
    });
    persistFavorites();
    renderCategoryUI();
    applyFilter();
    toast(`导入完成，新增 ${state.favorites.size - before} 个收藏`);
  } catch (error) {
    toast(`导入失败：${error.message}`);
  }
}

function resetSettings() {
  ui.size.value = 28; ui.spacing.value = 0; ui.lineHeight.value = 1.2;
  ui.bg.value = "#f3efe7"; ui.color.value = "#171714";
  updateVisualSettings();
  if (state.selected?.axes) renderAxes(state.selected.axes);
}

function escapeHtml(value = "") {
  const el = document.createElement("span"); el.textContent = value; return el.innerHTML;
}

ui.load.addEventListener("click", loadFonts);
ui.reload.addEventListener("click", loadFonts);
ui.search.addEventListener("input", () => { applyFilter(); renderSearchSuggestions(); });
ui.search.addEventListener("focus", () => { renderSearchSuggestions(); ui.searchSuggestions.hidden = false; });
ui.search.addEventListener("click", () => ui.searchSuggestions.hidden = false);
document.addEventListener("pointerdown", event => {
  if (!event.target.closest(".search-control")) ui.searchSuggestions.hidden = true;
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !ui.searchSuggestions.hidden) ui.searchSuggestions.hidden = true;
});
ui.previewInput.addEventListener("input", () => {
  localStorage.setItem("font-preview-text", ui.previewInput.value);
  updatePreview();
});
[ui.size, ui.spacing, ui.lineHeight, ui.bg, ui.color].forEach(input => input.addEventListener("input", updateVisualSettings));
ui.favorite.addEventListener("click", toggleFavorite);
ui.categoryButton.addEventListener("click", () => {
  const font = state.selected || state.previewed;
  if (!font) return toast("请先选择一个字体");
  const rect = ui.categoryButton.getBoundingClientRect();
  showContextMenu(font, rect.left, rect.bottom + 5);
});
ui.reset.addEventListener("click", resetSettings);
$("#addCategoryButton").addEventListener("click", addCategory);
document.addEventListener("keydown", event => { if (event.key === "Escape" && !ui.contextMenu.hidden) hideContextMenu(); });
document.addEventListener("pointerdown", event => {
  if (!ui.contextMenu.hidden && !ui.contextMenu.contains(event.target)) hideContextMenu();
});
document.addEventListener("wheel", () => { if (!ui.contextMenu.hidden) hideContextMenu(); }, { passive: true });
window.addEventListener("blur", hideContextMenu);
$("#exportFavorites").addEventListener("click", exportFavorites);
$("#importFavorites").addEventListener("click", () => $("#favoritesFile").click());
$("#favoritesFile").addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (file) importFavorites(file);
  event.target.value = "";
});
INFO_COPY_TARGETS.forEach(([element, label]) => {
  element.addEventListener("click", () => copyDetailValue(element, label));
  element.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      copyDetailValue(element, label);
    }
  });
});
ui.magnifierButton.addEventListener("click", () => {
  state.magnifier = !state.magnifier;
  ui.magnifierButton.classList.toggle("active", state.magnifier);
  ui.magnifierButton.title = state.magnifier ? "关闭放大镜" : "开启放大镜";
  ui.magnifierButton.setAttribute("aria-label", ui.magnifierButton.title);
  ui.magnifierButton.setAttribute("aria-pressed", String(state.magnifier));
  if (!state.magnifier) { hideMagnifier(ui.magnifier); hideMagnifier(ui.cardMagnifier); }
});
document.querySelectorAll(".chip").forEach(button => button.addEventListener("click", () => {
  const filter = button.dataset.filter;
  if (filter === "all") {
    state.filters.clear(); state.languageFilters.clear(); state.weightFilters.clear(); state.favoriteCategoryView = "all";
    document.querySelectorAll("[data-language], [data-weight-label], [data-capability]").forEach(input => input.checked = false);
    document.querySelector('[data-language="all"]').checked = true;
    updateFilterControls();
    return applyFilter();
  }
  state.filters.has(filter) ? state.filters.delete(filter) : state.filters.add(filter);
  updateFilterControls();
  if (filter === "variable" && state.filters.has("variable") && state.fonts.some(font => font.variable === null)) {
    state.filtered = [];
    renderFontList();
    ui.empty.hidden = true;
    detectVariableFonts();
  } else applyFilter();
}));
$("#gridViewButton").addEventListener("click", () => setView("grid"));
$("#listViewButton").addEventListener("click", () => setView("list"));
$("#singleViewButton").addEventListener("click", () => setView("single"));
$("#focusViewButton").addEventListener("click", () => setView("focus"));
$("#cardDensity").addEventListener("input", event => {
  state.cardWidth = Number(event.target.value);
  if (["grid", "focus"].includes(state.view)) {
    state.page = 0;
    renderFontList();
  }
});
$("#sortSelect").addEventListener("change", event => {
  state.sort = event.target.value;
  if (["square", "narrow", "wide"].includes(state.sort) && state.fonts.some(font => font.aspectRatio === undefined)) scanFontShapes();
  else applyFilter();
});
document.querySelectorAll("[data-language]").forEach(input => input.addEventListener("change", () => {
  if (!input.checked) return;
  state.languageFilters.clear();
  if (input.dataset.language !== "all") state.languageFilters.add(input.dataset.language);
  updateFilterControls();
  if (state.languageFilters.size && state.fonts.some(font => !font.details)) {
    state.filtered = [];
    renderFontList();
    ui.empty.hidden = true;
    scanFontCapabilities();
  } else applyFilter();
}));
document.querySelectorAll("[data-capability]").forEach(input => input.addEventListener("change", () => {
  const capability = input.dataset.capability;
  input.checked ? state.filters.add(capability) : state.filters.delete(capability);
  updateFilterControls();
  if (capability === "variable" && input.checked && state.fonts.some(font => font.variable === null)) {
    state.filtered = [];
    renderFontList();
    ui.empty.hidden = true;
    detectVariableFonts();
  } else applyFilter();
}));
document.querySelectorAll(".filter-menu").forEach(menu => {
  menu.addEventListener("mouseenter", () => clearTimeout(menu.closeTimer));
  menu.addEventListener("mouseleave", () => {
    clearTimeout(menu.closeTimer);
    menu.closeTimer = setTimeout(() => menu.removeAttribute("open"), 320);
  });
});
function updateFilterControls() {
  document.querySelector('[data-filter="all"]').classList.toggle("active", state.filters.size === 0 && state.languageFilters.size === 0 && state.weightFilters.size === 0);
  document.querySelectorAll('[data-filter]:not([data-filter="all"])').forEach(button => button.classList.toggle("active", state.filters.has(button.dataset.filter)));
  document.querySelectorAll("[data-capability]").forEach(input => input.checked = state.filters.has(input.dataset.capability));
  document.querySelectorAll("[data-language]").forEach(input => input.checked = input.dataset.language === (state.languageFilters.values().next().value || "all"));
  const supportCount = state.languageFilters.size + Number(state.filters.has("variable"));
  $("#languageBadge").textContent = supportCount ? `${supportCount} 项` : "全部";
  $("#weightBadge").textContent = state.weightFilters.size
    ? [...state.weightFilters].sort((a, b) => weightLabelOrder(a) - weightLabelOrder(b)).join(" · ")
    : "全部";
}
function setView(view) {
  state.view = view;
  $("#gridViewButton").classList.toggle("active", view === "grid");
  $("#listViewButton").classList.toggle("active", view === "list");
  $("#singleViewButton").classList.toggle("active", view === "single");
  $("#focusViewButton").classList.toggle("active", view === "focus");
  $("#cardDensity").disabled = !["grid", "focus"].includes(view);
  renderFontList();
}
ui.list.addEventListener("wheel", event => {
  if (!event.ctrlKey || state.view === "list") return;
  event.preventDefault();
  const direction = event.deltaY < 0 ? 1 : -1;
  if (state.view === "single") {
    state.singleCardSize = Math.max(48, Math.min(180, state.singleCardSize + direction * 6));
    state.page = 0;
    renderFontList();
    toast(`单字卡片 ${state.singleCardSize} × ${state.singleCardSize}`);
  } else {
    state.cardWidth = Math.max(160, Math.min(480, state.cardWidth + direction * 10));
    $("#cardDensity").value = Math.max(Number($("#cardDensity").min), Math.min(Number($("#cardDensity").max), state.cardWidth));
    state.page = 0;
    renderFontList();
    toast(`卡片宽度 ${state.cardWidth}`);
  }
}, { passive: false });
ui.previousPage.addEventListener("click", () => goToPage(state.page - 1));
ui.nextPage.addEventListener("click", () => goToPage(state.page + 1));
ui.list.addEventListener("pointerenter", () => state.pointerInFontView = true);
ui.list.addEventListener("pointerleave", () => state.pointerInFontView = false);
document.addEventListener("keydown", event => {
  if (!state.pointerInFontView || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target.matches("input, textarea, select, [contenteditable='true']")) return;
  const actions = {
    PageDown: () => goToPage(state.page + 1), ArrowRight: () => goToPage(state.page + 1), ArrowDown: () => goToPage(state.page + 1),
    PageUp: () => goToPage(state.page - 1), ArrowLeft: () => goToPage(state.page - 1), ArrowUp: () => goToPage(state.page - 1),
    Home: () => goToPage(0), End: () => goToPage(state.totalPages - 1)
  };
  if (!actions[event.key]) return;
  event.preventDefault();
  actions[event.key]();
});
ui.list.addEventListener("wheel", event => {
  if (event.ctrlKey) return;
  event.preventDefault();
  const now = performance.now();
  if (now - (ui.list.lastPageTurn || 0) < 180) return;
  ui.list.lastPageTurn = now;
  goToPage(state.page + (event.deltaY > 0 ? 1 : -1));
}, { passive: false });
$("#themeButton").addEventListener("click", () => document.body.classList.toggle("dark"));
$("#previewTabButton").addEventListener("click", () => setDetailTab("preview"));
$("#infoTabButton").addEventListener("click", () => setDetailTab("info"));
$("#detailToggle").addEventListener("click", () => {
  const panel = $("#detailPanel");
  if (!panel.classList.contains("collapsed")) panel.dataset.openWidth = `${panel.getBoundingClientRect().width}`;
  const collapsed = panel.classList.toggle("collapsed");
  if (collapsed) {
    panel.style.width = "";
    panel.style.minWidth = "";
  } else if (panel.dataset.openWidth) {
    panel.style.width = `${panel.dataset.openWidth}px`;
    panel.style.minWidth = `${panel.dataset.openWidth}px`;
  }
  $("#detailToggle").title = collapsed ? "展开详情" : "折叠详情";
  $("#detailToggle").setAttribute("aria-label", collapsed ? "展开详情" : "折叠详情");
});
const resizeHandle = $("#resizeHandle");
resizeHandle.addEventListener("pointerdown", event => {
  const panel = $("#detailPanel");
  if (panel.classList.contains("collapsed")) return;
  event.preventDefault();
  resizeHandle.setPointerCapture(event.pointerId);
  panel.classList.add("resizing");
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
});
resizeHandle.addEventListener("pointermove", event => {
  if (!resizeHandle.hasPointerCapture(event.pointerId)) return;
  const panel = $("#detailPanel");
  const bounds = $(".library-body").getBoundingClientRect();
  const maximum = Math.min(800, bounds.width - 360);
  const width = Math.max(320, Math.min(maximum, bounds.right - event.clientX));
  panel.style.width = `${width}px`;
  panel.style.minWidth = `${width}px`;
  panel.dataset.openWidth = `${width}`;
});
resizeHandle.addEventListener("pointerup", event => {
  if (resizeHandle.hasPointerCapture(event.pointerId)) resizeHandle.releasePointerCapture(event.pointerId);
  $("#detailPanel").classList.remove("resizing");
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
});
document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); ui.search.focus(); }
});
ui.stage.addEventListener("mousemove", event => {
  if (!state.magnifier) return;
  const rect = ui.stage.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
  const lens = 190, zoom = 2.5;
  const lensLeft = Math.min(rect.width-lens/2, Math.max(lens/2, x)) - lens/2;
  const lensTop = Math.min(rect.height-lens/2, Math.max(lens/2, y)) - lens/2;
  showMagnifier(ui.magnifier);
  ui.magnifier.style.left = `${lensLeft}px`;
  ui.magnifier.style.top = `${lensTop}px`;
  const textRect = ui.previewText.getBoundingClientRect();
  const textStyle = getComputedStyle(ui.previewText);
  ui.magnifiedText.style.left = `${lens/2 - (event.clientX - textRect.left) * zoom}px`;
  ui.magnifiedText.style.top = `${lens/2 - (event.clientY - textRect.top) * zoom}px`;
  ui.magnifiedText.style.transform = `scale(${zoom})`;
  ui.magnifiedText.style.width = `${textRect.width}px`;
  ui.magnifiedText.style.height = `${textRect.height}px`;
  ui.magnifiedText.style.padding = textStyle.padding;
  ui.magnifiedText.style.boxSizing = "border-box";
});
ui.stage.addEventListener("mouseleave", () => hideMagnifier(ui.magnifier));
ui.list.addEventListener("pointermove", event => {
  const card = event.target.closest(".font-card");
  if (!card) {
    if (state.hovered) restorePinnedPreview();
    hideMagnifier(ui.cardMagnifier);
    return;
  }
  const sample = card.querySelector(".sample");
  const font = state.fonts.find(item => item.id === Number(card.dataset.id));
  if (!sample || !font) return;
  if (state.hovered !== font) {
    state.hovered = font;
    previewFont(font, true);
  }
  if (!state.magnifier) {
    hideMagnifier(ui.cardMagnifier);
    return;
  }
  const textRange = document.createRange();
  textRange.selectNodeContents(sample);
  const glyphBounds = textRange.getBoundingClientRect();
  const overGlyph = event.clientX >= glyphBounds.left && event.clientX <= glyphBounds.right &&
    event.clientY >= glyphBounds.top && event.clientY <= glyphBounds.bottom;
  if (!overGlyph || !sample.textContent.trim()) {
    hideMagnifier(ui.cardMagnifier);
    return;
  }
  if (card.dataset.fontLoaded !== "true") loadCardFont(card);
  const lens = 210, zoom = 3;
  const sampleRect = sample.getBoundingClientRect();
  const sampleStyle = getComputedStyle(sample);
  const cardStyle = getComputedStyle(card);
  const left = Math.max(8, Math.min(window.innerWidth - lens - 8, event.clientX - lens / 2));
  const top = Math.max(8, Math.min(window.innerHeight - lens - 8, event.clientY - lens / 2));
  showMagnifier(ui.cardMagnifier);
  ui.cardMagnifier.style.left = `${left}px`;
  ui.cardMagnifier.style.top = `${top}px`;
  ui.cardMagnifier.style.backgroundColor = cardStyle.backgroundColor;
  const enlarged = ui.cardMagnifiedText;
  enlarged.textContent = sample.textContent;
  enlarged.style.left = `${lens / 2 - (event.clientX - sampleRect.left) * zoom}px`;
  enlarged.style.top = `${lens / 2 - (event.clientY - sampleRect.top) * zoom}px`;
  enlarged.style.width = `${sampleRect.width}px`;
  enlarged.style.height = `${sampleRect.height}px`;
  enlarged.style.transform = `scale(${zoom})`;
  enlarged.style.fontFamily = sampleStyle.fontFamily;
  enlarged.style.fontSize = sampleStyle.fontSize;
  enlarged.style.fontWeight = sampleStyle.fontWeight;
  enlarged.style.lineHeight = sampleStyle.lineHeight;
  enlarged.style.letterSpacing = sampleStyle.letterSpacing;
  enlarged.style.color = sampleStyle.color;
  enlarged.style.padding = sampleStyle.padding;
  enlarged.style.boxSizing = "border-box";
  enlarged.style.display = sampleStyle.display;
  enlarged.style.alignItems = sampleStyle.alignItems;
  enlarged.style.justifyContent = sampleStyle.justifyContent;
  enlarged.style.placeItems = sampleStyle.placeItems;
  enlarged.style.textAlign = sampleStyle.textAlign;
});
ui.list.addEventListener("contextmenu", event => {
  const card = event.target.closest(".font-card");
  if (!card) return hideContextMenu();
  const font = state.fonts.find(item => item.id === Number(card.dataset.id));
  if (font) showContextMenu(font, event.clientX, event.clientY);
});
ui.list.addEventListener("pointerleave", () => {
  hideMagnifier(ui.cardMagnifier);
  restorePinnedPreview();
});
ui.list.addEventListener("dragstart", event => {
  const card = event.target.closest(".font-card");
  if (!card || event.target.closest("button")) return event.preventDefault();
  const font = state.fonts.find(item => item.id === Number(card.dataset.id));
  if (!font) return;
  state.draggingFontId = font.postscriptName;
  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData("application/x-font-postscript", font.postscriptName);
  hideMagnifier(ui.cardMagnifier);
});
ui.list.addEventListener("dragend", () => { state.draggingFontId = null; clearCategoryDropStates(); });
if ("ResizeObserver" in window) new ResizeObserver(() => {
  scheduleCardFit();
  clearTimeout(ui.list.pageResizeTimer);
  ui.list.pageResizeTimer = setTimeout(() => {
    if (calculatePageSize() !== state.pageSize) renderFontList();
  }, 120);
}).observe(ui.list);

renderCategoryUI();
renderSearchSuggestions();
updateVisualSettings();
if (!("queryLocalFonts" in window)) ui.support.textContent = "当前浏览器可能不支持系统字体读取，请使用最新版 Chrome 或 Edge。";
