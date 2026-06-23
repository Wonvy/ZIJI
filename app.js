const $ = (selector) => document.querySelector(selector);
const LOAD_BUTTON_LABEL = "读取系统字体";
const DEFAULT_DETAIL_PREVIEW = `天地玄黄 宇宙洪荒
ABCDEFGHIJKLMNOPQRSTUVWXYZ
abcdefghijklmnopqrstuvwxyz
0123456789
，。！？；：“”「」`;
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
const UI_SETTINGS_KEY = "webfonts-ui-settings";
const UI_SETTINGS_VERSION = 1;
const SORT_LABELS = {
  name: "名称",
  favorite: "收藏",
  "chinese-first": "中文",
  "latin-first": "英文",
  square: "方形",
  narrow: "瘦→宽",
  wide: "宽→瘦"
};
const CARD_GRID_GAP = 14;
const CARD_GRID_PADDING_BLOCK = 24;
const CARD_GRID_META_HEIGHT = 39;
const CARD_COLUMNS_MIN = 3;
const CARD_COLUMNS_MAX = 12;
const CARD_COLUMNS_DEFAULT = 7;

function clampCardColumns(value) {
  return Math.max(CARD_COLUMNS_MIN, Math.min(CARD_COLUMNS_MAX, Math.round(Number(value) || CARD_COLUMNS_DEFAULT)));
}

function deriveCardColumnsFromWidth(cardWidth, containerWidth = 1100) {
  return clampCardColumns(Math.floor((containerWidth + CARD_GRID_GAP) / (Number(cardWidth) + CARD_GRID_GAP)));
}

function resolveCardColumns(settings = {}) {
  if (Number.isFinite(Number(settings.cardColumns))) return clampCardColumns(settings.cardColumns);
  if (Number.isFinite(Number(settings.cardWidth))) return deriveCardColumnsFromWidth(settings.cardWidth);
  return CARD_COLUMNS_DEFAULT;
}

function getCardGridSampleHeight() {
  return Math.max(44, Math.round(state.cardSampleSize * 1.35));
}

function getCardGridCardHeight() {
  return getCardGridSampleHeight() + CARD_GRID_META_HEIGHT + CARD_GRID_PADDING_BLOCK;
}

function getCardGridRowPitch() {
  return getCardGridCardHeight() + CARD_GRID_GAP;
}

function syncCardGridLayoutVars() {
  if (!ui.list) return;
  const sampleHeight = getCardGridSampleHeight();
  const cardHeight = getCardGridCardHeight();
  const rowPitch = getCardGridRowPitch();
  ui.list.style.setProperty("--card-grid-sample-height", `${sampleHeight}px`);
  ui.list.style.setProperty("--card-grid-min-height", `${cardHeight}px`);
  ui.list.style.setProperty("--card-grid-row-pitch", `${rowPitch}px`);
}

function getFontGridViewportSize() {
  const viewShell = ui.list?.closest(".font-view-shell");
  const pageArea = ui.list?.closest(".font-page-area");
  const listStyles = ui.list ? getComputedStyle(ui.list) : null;
  const padX = listStyles ? parseFloat(listStyles.paddingLeft) + parseFloat(listStyles.paddingRight) : 72;
  const padY = listStyles ? parseFloat(listStyles.paddingTop) + parseFloat(listStyles.paddingBottom) : 64;
  let viewportWidth = ui.list?.clientWidth || 800;
  let viewportHeight = 500;
  const measureEl = viewShell || pageArea;
  if (measureEl) {
    const rect = measureEl.getBoundingClientRect();
    if (rect.width > 0) viewportWidth = rect.width;
    if (rect.height > 0) viewportHeight = rect.height;
  } else if (ui.list?.parentElement?.clientHeight) {
    viewportHeight = ui.list.parentElement.clientHeight;
    viewportWidth = ui.list.parentElement.clientWidth || viewportWidth;
  }
  return {
    width: Math.max(320, viewportWidth - padX),
    height: Math.max(getCardGridCardHeight(), viewportHeight - padY)
  };
}

function getCardGridLayout() {
  const { width, height } = getFontGridViewportSize();
  const columns = clampCardColumns(state.cardColumns);
  const cardWidth = Math.max(140, Math.floor((width - (columns - 1) * CARD_GRID_GAP) / columns));
  const rowPitch = getCardGridRowPitch();
  const rows = Math.max(1, Math.floor((height + CARD_GRID_GAP) / rowPitch));
  return { width, height, columns, cardWidth, rows, rowPitch };
}

function syncCardColumnsControl() {
  const input = $("#cardColumns");
  const output = $("#cardColumnsOutput");
  if (!input) return;
  const disabled = !["grid", "focus"].includes(state.view);
  input.disabled = disabled;
  input.value = String(clampCardColumns(state.cardColumns));
  if (output) output.textContent = input.value;
}

function sortLabel(sort) {
  return SORT_LABELS[sort] || "名称";
}
const UI_SETTINGS_DEFAULTS = {
  theme: "light",
  view: "grid",
  cardColumns: 7,
  singleCardSize: 82,
  cardSampleSize: 49,
  sort: "name",
  magnifier: true,
  filters: [],
  languageFilter: "all",
  weightFilters: [],
  previewFontSize: 28,
  previewLetterSpacing: 0,
  previewLineHeight: 1.2,
  previewBackground: "#f3efe7",
  previewTextColor: "#171714",
  detailTab: "preview",
  detailPanelCollapsed: false,
  cardAreaCollapsed: false,
  detailPanelWidth: null,
  favoriteCategoryView: "all",
  collapseFamilyFonts: false,
  cardPreviewStyle: null,
  cardPreviewStylePresets: [],
  activeCardPreviewStylePresetId: null
};

const CARD_PREVIEW_STYLE_DEFAULTS = {
  fill: {
    enabled: true,
    mode: "solid",
    color: "#171714",
    color2: "#e85832",
    angle: 90,
    opacity: 100,
    stops: [
      { color: "#171714", opacity: 100, offset: 0 },
      { color: "#e85832", opacity: 100, offset: 100 }
    ]
  },
  layers: []
};
const PREVIEW_EFFECT_TYPE_ORDER = ["dropShadow", "stroke"];
const STROKE_POSITION_OPTIONS = [
  { value: "outside", label: "向外" },
  { value: "center", label: "居中" },
  { value: "inside", label: "向内" }
];
const MANAGE_PRESET_PREVIEW_CHAR = "永";
const PREVIEW_EFFECT_TYPES = {
  dropShadow: {
    label: "投影",
    fields: [
      { key: "color", type: "color", label: "颜色" },
      { key: "opacity", type: "range", label: "不透明度", min: 0, max: 100, step: 1 },
      { key: "offsetX", type: "range", label: "X 偏移", min: -40, max: 40, step: 1 },
      { key: "offsetY", type: "range", label: "Y 偏移", min: -40, max: 40, step: 1 },
      { key: "blur", type: "range", label: "模糊", min: 0, max: 40, step: 1 }
    ],
    defaults: { color: "#000000", opacity: 35, offsetX: 2, offsetY: 3, blur: 4 }
  },
  stroke: {
    label: "轮廓",
    fields: [
      { key: "color", type: "color", label: "颜色" },
      { key: "opacity", type: "range", label: "不透明度", min: 0, max: 100, step: 1 },
      { key: "width", type: "range", label: "粗细", min: 1, max: 16, step: 1 },
      { key: "position", type: "select", label: "位置", options: STROKE_POSITION_OPTIONS }
    ],
    defaults: {
      color: "#000000",
      color2: "#e85832",
      opacity: 100,
      width: 2,
      position: "outside",
      colorMode: "solid",
      angle: 90,
      stops: [
        { color: "#000000", opacity: 100, offset: 0 },
        { color: "#e85832", opacity: 100, offset: 100 }
      ]
    }
  }
};
let cardPreviewStyleLayerCounter = 0;
let cardPreviewStylePresetCounter = 0;

function cloneCardPreviewStyle(style = CARD_PREVIEW_STYLE_DEFAULTS) {
  return JSON.parse(JSON.stringify(style));
}

function nextPreviewStyleLayerId() {
  cardPreviewStyleLayerCounter += 1;
  return `preview-layer-${cardPreviewStyleLayerCounter}`;
}

function normalizePreviewLayer(layer) {
  if (layer?.type === "outerStroke") {
    layer = { ...layer, type: "stroke", position: layer.position || "outside" };
  } else if (layer?.type === "innerStroke") {
    layer = { ...layer, type: "stroke", position: layer.position || "inside" };
  }
  const type = PREVIEW_EFFECT_TYPES[layer?.type] ? layer.type : null;
  if (!type) return null;
  const defaults = PREVIEW_EFFECT_TYPES[type].defaults;
  const normalized = { id: String(layer.id || nextPreviewStyleLayerId()), type, enabled: layer.enabled === true };
  PREVIEW_EFFECT_TYPES[type].fields.forEach(field => {
    if (field.type === "color") {
      normalized[field.key] = typeof layer[field.key] === "string" ? layer[field.key] : defaults[field.key];
    } else if (field.type === "select") {
      const allowed = field.options.map(option => option.value);
      normalized[field.key] = allowed.includes(layer[field.key]) ? layer[field.key] : defaults[field.key];
    } else {
      normalized[field.key] = Number.isFinite(Number(layer[field.key])) ? Number(layer[field.key]) : defaults[field.key];
    }
  });
  if (type === "stroke") {
    normalized.colorMode = layer.colorMode === "gradient" ? "gradient" : "solid";
    normalized.angle = Number.isFinite(Number(layer.angle)) ? Number(layer.angle) : defaults.angle;
    normalized.color2 = typeof layer.color2 === "string" ? layer.color2 : defaults.color2;
    normalized.stops = normalizeGradientStops(layer.stops, normalized);
    syncStrokeLayerLegacyColors(normalized);
  }
  return normalized;
}

function normalizeGradientStops(rawStops, fill) {
  const fallbackColor = fill?.color || CARD_PREVIEW_STYLE_DEFAULTS.fill.color;
  const fallbackColor2 = fill?.color2 || CARD_PREVIEW_STYLE_DEFAULTS.fill.color2;
  const fallbackOpacity = Number.isFinite(Number(fill?.opacity)) ? Number(fill.opacity) : 100;
  if (Array.isArray(rawStops) && rawStops.length >= 2) {
    return rawStops.map((stop, index, list) => ({
      color: typeof stop?.color === "string" ? stop.color : (index === list.length - 1 ? fallbackColor2 : fallbackColor),
      opacity: Number.isFinite(Number(stop?.opacity)) ? Number(stop.opacity) : fallbackOpacity,
      offset: Number.isFinite(Number(stop?.offset))
        ? Math.max(0, Math.min(100, Number(stop.offset)))
        : (list.length <= 1 ? 0 : (index / (list.length - 1)) * 100)
    })).sort((a, b) => a.offset - b.offset);
  }
  return [
    { color: fallbackColor, opacity: fallbackOpacity, offset: 0 },
    { color: fallbackColor2, opacity: fallbackOpacity, offset: 100 }
  ];
}

function syncFillLegacyColors(fill) {
  if (fill.mode !== "gradient") {
    const opacity = Number.isFinite(Number(fill.opacity)) ? Number(fill.opacity) : 100;
    const color = fill.color || CARD_PREVIEW_STYLE_DEFAULTS.fill.color;
    fill.stops = [{ color, opacity, offset: 0 }, { color, opacity, offset: 100 }];
  } else {
    fill.stops = normalizeGradientStops(fill.stops, fill);
  }
  fill.color = fill.stops[0].color;
  fill.color2 = fill.stops[fill.stops.length - 1].color;
}

function syncStrokeLayerLegacyColors(layer) {
  if (layer.colorMode !== "gradient") {
    const opacity = Number.isFinite(Number(layer.opacity)) ? Number(layer.opacity) : 100;
    const color = layer.color || PREVIEW_EFFECT_TYPES.stroke.defaults.color;
    layer.stops = [{ color, opacity, offset: 0 }, { color, opacity, offset: 100 }];
  } else {
    layer.stops = normalizeGradientStops(layer.stops, layer);
  }
  layer.color = layer.stops[0].color;
  layer.color2 = layer.stops[layer.stops.length - 1].color;
}

function ensureDefaultPreviewLayers(layers) {
  const normalized = (Array.isArray(layers) ? layers : []).map(normalizePreviewLayer).filter(Boolean);
  for (const type of PREVIEW_EFFECT_TYPE_ORDER) {
    if (!normalized.some(layer => layer.type === type)) normalized.push(createPreviewStyleLayer(type, false));
  }
  return normalized;
}

function normalizeCardPreviewStyle(raw) {
  const style = cloneCardPreviewStyle(CARD_PREVIEW_STYLE_DEFAULTS);
  if (!raw || typeof raw !== "object") {
    style.layers = ensureDefaultPreviewLayers([]);
    return style;
  }
  if (raw.fill && typeof raw.fill === "object") {
    style.fill.enabled = raw.fill.enabled !== false;
    style.fill.mode = raw.fill.mode === "gradient" ? "gradient" : "solid";
    style.fill.color = typeof raw.fill.color === "string" ? raw.fill.color : style.fill.color;
    style.fill.color2 = typeof raw.fill.color2 === "string" ? raw.fill.color2 : style.fill.color2;
    style.fill.angle = Number.isFinite(Number(raw.fill.angle)) ? Number(raw.fill.angle) : style.fill.angle;
    style.fill.opacity = Number.isFinite(Number(raw.fill.opacity)) ? Number(raw.fill.opacity) : style.fill.opacity;
    style.fill.stops = normalizeGradientStops(raw.fill.stops, style.fill);
    syncFillLegacyColors(style.fill);
  }
  style.layers = ensureDefaultPreviewLayers(raw.layers);
  return style;
}

function loadUiSettings() {
  try {
    const raw = localStorage.getItem(UI_SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const settings = { ...UI_SETTINGS_DEFAULTS, ...parsed };
    if (!raw) {
      const legacyCardSize = localStorage.getItem("card-sample-size");
      if (legacyCardSize !== null) settings.cardSampleSize = Number(legacyCardSize) || settings.cardSampleSize;
    }
    return settings;
  } catch {
    return { ...UI_SETTINGS_DEFAULTS };
  }
}
function collectUiSettings() {
  const detailPanel = $("#detailPanel");
  return {
    version: UI_SETTINGS_VERSION,
    theme: document.body.classList.contains("dark") ? "dark" : "light",
    view: state.view,
    cardColumns: state.cardColumns,
    singleCardSize: state.singleCardSize,
    cardSampleSize: state.cardSampleSize,
    sort: state.sort,
    magnifier: state.magnifier,
    filters: [...state.filters],
    languageFilter: state.languageFilters.values().next().value || "all",
    weightFilters: [...state.weightFilters],
    previewFontSize: Number(ui.size.value),
    previewLetterSpacing: Number(ui.spacing.value),
    previewLineHeight: Number(ui.lineHeight.value),
    previewBackground: ui.bg.value,
    previewTextColor: ui.color.value,
    detailTab: $("#infoTabPanel").classList.contains("active") ? "info" : "preview",
    detailPanelCollapsed: detailPanel?.classList.contains("collapsed") ?? false,
    cardAreaCollapsed: $(".card-area")?.classList.contains("collapsed") ?? false,
    detailPanelWidth: detailPanel?.dataset.openWidth ? Number(detailPanel.dataset.openWidth) : null,
    favoriteCategoryView: state.favoriteCategoryView,
    collapseFamilyFonts: state.collapseFamilyFonts,
    cardPreviewStyle: state.cardPreviewStyle,
    cardPreviewStylePresets: state.cardPreviewStylePresets,
    activeCardPreviewStylePresetId: state.activeCardPreviewStylePresetId
  };
}
let persistUiSettingsTimer;
function persistUiSettings() {
  clearTimeout(persistUiSettingsTimer);
  persistUiSettingsTimer = setTimeout(() => {
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(collectUiSettings()));
    localStorage.setItem("card-sample-size", String(state.cardSampleSize));
  }, 180);
}
function syncMagnifierControl() {
  ui.magnifierButton.classList.toggle("active", state.magnifier);
  ui.magnifierButton.title = state.magnifier ? "关闭放大镜" : "开启放大镜";
  ui.magnifierButton.setAttribute("aria-label", ui.magnifierButton.title);
  ui.magnifierButton.setAttribute("aria-pressed", String(state.magnifier));
}
function syncDetailPanelToggle(collapsed) {
  $("#detailToggle").title = collapsed ? "展开详情" : "折叠详情";
  $("#detailToggle").setAttribute("aria-label", collapsed ? "展开详情" : "折叠详情");
}
function syncCardAreaToggle(collapsed) {
  $("#cardAreaToggle").title = collapsed ? "展开字体库" : "折叠字体库";
  $("#cardAreaToggle").setAttribute("aria-label", collapsed ? "展开字体库" : "折叠字体库");
}
function applyStoredUiSettings(settings) {
  document.body.classList.toggle("dark", settings.theme === "dark");
  ui.size.value = settings.previewFontSize;
  ui.spacing.value = settings.previewLetterSpacing;
  ui.lineHeight.value = settings.previewLineHeight;
  ui.bg.value = settings.previewBackground;
  ui.color.value = settings.previewTextColor;
  state.cardColumns = resolveCardColumns(settings);
  syncCardColumnsControl();
  syncMagnifierControl();
  const detailPanel = $("#detailPanel");
  const cardArea = $(".card-area");
  if (settings.detailPanelCollapsed) {
    detailPanel.classList.add("collapsed");
    detailPanel.style.width = "";
    detailPanel.style.minWidth = "";
  } else if (settings.detailPanelWidth) {
    detailPanel.dataset.openWidth = String(settings.detailPanelWidth);
    detailPanel.style.width = `${settings.detailPanelWidth}px`;
    detailPanel.style.minWidth = `${settings.detailPanelWidth}px`;
  }
  cardArea.classList.toggle("collapsed", settings.cardAreaCollapsed);
  syncDetailPanelToggle(settings.detailPanelCollapsed);
  syncCardAreaToggle(settings.cardAreaCollapsed);
  setDetailTab(settings.detailTab);
  updateFilterControls();
  setView(settings.view);
}
const uiSettings = loadUiSettings();
document.body.classList.toggle("dark", uiSettings.theme === "dark");
const loadedCardPreviewStylePresets = normalizeCardPreviewStylePresets(uiSettings.cardPreviewStylePresets);
const state = {
  fonts: [], filtered: [], selected: null, previewed: null, hovered: null, categoryTarget: null, contextFont: null, editingCategoryId: null, draggingCategoryId: null, draggingFontId: null, favoriteCategoryView: uiSettings.favoriteCategoryView, pointerInFontView: false, brandScanRunning: false, prefetchCards: new Set(), filters: new Set(uiSettings.filters), languageFilters: uiSettings.languageFilter === "all" ? new Set() : new Set([uiSettings.languageFilter]), weightFilters: new Set(uiSettings.weightFilters), weightOptions: [], searchBrands: new Set([...DEFAULT_CHINESE_BRANDS, ...loadCachedSearchBrands()]), magnifier: uiSettings.magnifier,
  view: uiSettings.view, sort: uiSettings.sort, cardColumns: resolveCardColumns(uiSettings), cardSampleSize: uiSettings.cardSampleSize, singleCardSize: uiSettings.singleCardSize, page: 0, pageSize: 1, totalPages: 1, preloadVersion: 0, renderVersion: 0, filterVersion: 0, aspectCharacter: "字", selectionVersion: 0, scanningVariables: false, scanningCapabilities: false, scanningShapes: false,
  familyIndex: new Map(), pendingSelectionId: null, collapseFamilyFonts: uiSettings.collapseFamilyFonts,
  cardPreviewStyle: loadStoredCardPreviewStyle(uiSettings.cardPreviewStyle),
  cardPreviewStylePresets: loadedCardPreviewStylePresets,
  activeCardPreviewStylePresetId: resolveActiveCardPreviewStylePresetId(uiSettings.activeCardPreviewStylePresetId, loadedCardPreviewStylePresets),
  favorites: cachedFavorites, categories: cachedFavoriteData.categories, categoryAssignments: cachedFavoriteData.assignments, recentCategories: cachedFavoriteData.recentCategories,
  axes: {}, objectUrls: []
};
if (state.activeCardPreviewStylePresetId) {
  const activePreset = findCardPreviewStylePreset(state.activeCardPreviewStylePresetId);
  if (activePreset) {
    state.cardPreviewStyle = hasActiveCardPreviewStyle(activePreset.style)
      ? cloneCardPreviewStyle(activePreset.style)
      : null;
  } else {
    state.activeCardPreviewStylePresetId = null;
  }
}
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
  pagination: $("#paginationBar"), previousPage: $("#previousPage"), nextPage: $("#nextPage"), pageInfo: $("#pageInfo"), fontStatus: $("#fontStatus"), viewStatus: $("#viewStatus"), cardSampleSize: $("#cardSampleSize"), cardSampleSizeOutput: $("#cardSampleSizeOutput"),
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
const cachedDetailPreviewText = localStorage.getItem("detail-preview-text");
ui.previewText.textContent = cachedDetailPreviewText ?? DEFAULT_DETAIL_PREVIEW;

const INFO_COLLAPSE_LENGTH = 96;

function setInfoPlain(element, text) {
  element.classList.remove("info-collapsible", "is-expanded");
  delete element.dataset.infoValue;
  element.replaceChildren();
  element.textContent = text;
}

function setInfoText(element, value, { title } = {}) {
  const fullText = value ?? "—";
  element.classList.remove("info-collapsible", "is-expanded");
  element.replaceChildren();
  delete element.dataset.infoValue;
  if (fullText === "—" || String(fullText).length <= INFO_COLLAPSE_LENGTH) {
    element.textContent = fullText;
    element.title = title ?? (fullText === "—" ? "" : String(fullText));
    return;
  }
  const text = String(fullText);
  element.dataset.infoValue = text;
  element.classList.add("info-collapsible");
  element.title = title ?? text;
  const body = document.createElement("span");
  body.className = "info-collapsible-body";
  body.textContent = text;
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "info-collapsible-toggle";
  toggle.textContent = "展开";
  element.append(body, toggle);
}

function syncDetailPreviewStage() {
  applyDetailMagnifierStyles();
  localStorage.setItem("detail-preview-text", ui.previewText.textContent);
}

function isDetailPreviewEditing() {
  return ui.stage.classList.contains("is-editing");
}

function setDetailPreviewEditing(editing) {
  ui.stage.classList.toggle("is-editing", editing);
  ui.previewText.contentEditable = editing ? "true" : "false";
  if (!editing) hideMagnifier(ui.magnifier);
}

function applyDetailMagnifierStyles() {
  const textStyle = getComputedStyle(ui.previewText);
  ui.magnifiedText.textContent = ui.previewText.textContent;
  ui.magnifiedText.style.fontFamily = textStyle.fontFamily;
  ui.magnifiedText.style.fontSize = textStyle.fontSize;
  ui.magnifiedText.style.fontWeight = textStyle.fontWeight;
  ui.magnifiedText.style.fontStyle = textStyle.fontStyle;
  ui.magnifiedText.style.lineHeight = textStyle.lineHeight;
  ui.magnifiedText.style.letterSpacing = textStyle.letterSpacing;
  ui.magnifiedText.style.color = textStyle.color;
  ui.magnifiedText.style.fontVariationSettings = textStyle.fontVariationSettings;
  ui.magnifiedText.style.whiteSpace = "pre-wrap";
  ui.magnifiedText.style.textAlign = textStyle.textAlign;
}

function updateDetailMagnifier(event) {
  if (!state.magnifier || !state.previewed || isDetailPreviewEditing()) {
    hideMagnifier(ui.magnifier);
    return;
  }
  const rect = ui.stage.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const lens = 190;
  const zoom = 2.5;
  const lensLeft = Math.min(rect.width - lens / 2, Math.max(lens / 2, x)) - lens / 2;
  const lensTop = Math.min(rect.height - lens / 2, Math.max(lens / 2, y)) - lens / 2;
  applyDetailMagnifierStyles();
  ui.magnifier.style.backgroundColor = resolveMagnifierBackground(ui.stage.style.backgroundColor || ui.bg.value, "--stage");
  showMagnifier(ui.magnifier);
  ui.magnifier.style.left = `${lensLeft}px`;
  ui.magnifier.style.top = `${lensTop}px`;
  const textRect = ui.previewText.getBoundingClientRect();
  const textStyle = getComputedStyle(ui.previewText);
  ui.magnifiedText.style.left = `${lens / 2 - (event.clientX - textRect.left) * zoom}px`;
  ui.magnifiedText.style.top = `${lens / 2 - (event.clientY - textRect.top) * zoom}px`;
  ui.magnifiedText.style.transform = `scale(${zoom})`;
  ui.magnifiedText.style.width = `${textRect.width}px`;
  ui.magnifiedText.style.height = `${textRect.height}px`;
  ui.magnifiedText.style.padding = textStyle.padding;
  ui.magnifiedText.style.boxSizing = "border-box";
}

function toast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ui.toast.classList.remove("show"), 2300);
}

function showMagnifier(element) {
  clearTimeout(element.hideTimer);
  element.hidden = false;
  element.style.display = "block";
  if (!element.classList.contains("visible")) requestAnimationFrame(() => element.classList.add("visible"));
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

function resolveMagnifierBackground(color, fallbackVar = "--paper") {
  if (color && color !== "transparent" && color !== "rgba(0, 0, 0, 0)") return color;
  const fallback = getComputedStyle(document.body).getPropertyValue(fallbackVar).trim();
  if (fallback) return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(fallbackVar).trim() || "#fbf9f4";
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
  toast(`已复制${label}：${value.replace(/\s+/g, " ").trim().slice(0, 40)}${value.replace(/\s+/g, " ").trim().length > 40 ? "…" : ""}`);
}

function copyDetailValue(element, label) {
  const value = element.dataset.infoValue || element.querySelector(".info-collapsible-body")?.textContent || element.textContent;
  return copyValue(value.trim(), label);
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
  persistUiSettings();
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
    syncDetailMetaFonts(null);
    return;
  }
  registerFont(font);
  ui.previewInput.style.fontFamily = cssName(font);
  ui.previewInput.style.fontVariationSettings = toolbarVariationSettings();
  $("#previewInputWrap")?.classList.add("is-previewing");
  syncDetailMetaFonts(font);
}

function syncDetailMetaFonts(font) {
  if (!font) {
    ui.selectedName.style.fontFamily = "";
    ui.selectedStyle.style.fontFamily = "";
    ui.selectedName.style.fontVariationSettings = "";
    ui.selectedStyle.style.fontVariationSettings = "";
    return;
  }
  const family = cssName(font);
  const variation = toolbarVariationSettings();
  [ui.selectedName, ui.selectedStyle].forEach(el => {
    el.style.fontFamily = family;
    el.style.fontVariationSettings = variation;
  });
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
  ui.load.textContent = "正在读取…";
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
    ui.load.textContent = LOAD_BUTTON_LABEL;
  }
}

function compareFontName(a, b) {
  return (a.displayName || a.family).localeCompare(b.displayName || b.family, "zh-CN");
}

function fontLanguageRank(font, { prefer = "chinese" } = {}) {
  const chinese = font.details?.supportsChinese;
  const latin = font.details?.supportsLatin;
  if (font.details) {
    if (prefer === "chinese") {
      if (chinese && !latin) return 0;
      if (chinese && latin) return 1;
      if (latin) return 2;
      return 3;
    }
    if (latin && !chinese) return 0;
    if (latin && chinese) return 1;
    if (chinese) return 2;
    return 3;
  }
  const name = font.displayName || font.family || "";
  if (/\p{Script=Han}/u.test(name)) return prefer === "chinese" ? 0 : 2;
  if (/^[A-Za-z0-9\s.-]+$/.test(name)) return prefer === "latin" ? 0 : 2;
  return 3;
}

function compareFilteredFonts(a, b) {
  if (state.sort === "favorite") {
    const favoriteDifference = Number(state.favorites.has(b.postscriptName)) - Number(state.favorites.has(a.postscriptName));
    if (favoriteDifference) return favoriteDifference;
  }
  if (state.sort === "chinese-first") {
    const rankDifference = fontLanguageRank(a, { prefer: "chinese" }) - fontLanguageRank(b, { prefer: "chinese" });
    if (rankDifference) return rankDifference;
    return compareFontName(a, b);
  }
  if (state.sort === "latin-first") {
    const rankDifference = fontLanguageRank(a, { prefer: "latin" }) - fontLanguageRank(b, { prefer: "latin" });
    if (rankDifference) return rankDifference;
    return compareFontName(a, b);
  }
  if (state.sort === "square") return Math.abs((a.aspectRatio ?? 99) - 1) - Math.abs((b.aspectRatio ?? 99) - 1);
  if (state.sort === "narrow") return (a.aspectRatio ?? 99) - (b.aspectRatio ?? 99);
  if (state.sort === "wide") return (b.aspectRatio ?? -1) - (a.aspectRatio ?? -1);
  return compareFontName(a, b);
}

function fontFamilyKey(font) {
  return font.family || font.displayName || "未命名字体";
}

function compareFamilyMembers(a, b) {
  const weightDifference = weightLabelOrder(a.weightLabel) - weightLabelOrder(b.weightLabel);
  if (weightDifference) return weightDifference;
  return (a.style || "").localeCompare(b.style || "", "en");
}

function rebuildFamilyIndex() {
  state.familyIndex = new Map();
  for (const font of state.fonts) {
    const key = fontFamilyKey(font);
    if (!state.familyIndex.has(key)) state.familyIndex.set(key, []);
    state.familyIndex.get(key).push(font);
  }
  for (const members of state.familyIndex.values()) members.sort(compareFamilyMembers);
}

function getFamilyMembers(font) {
  return state.familyIndex.get(fontFamilyKey(font)) || [font];
}

function navigateToFont(font) {
  const index = state.filtered.indexOf(font);
  if (index < 0) {
    selectFont(font);
    return;
  }
  const page = Math.floor(index / state.pageSize);
  state.pendingSelectionId = font.id;
  if (page !== state.page) goToPage(page);
  else {
    state.pendingSelectionId = null;
    selectFont(font);
  }
}

function stepFamilyFont(font, direction) {
  const members = getFamilyMembers(font);
  if (members.length <= 1) return false;
  let index = members.findIndex(item => item.id === font.id);
  if (index < 0) index = 0;
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= members.length) return false;
  navigateToFont(members[nextIndex]);
  return true;
}

const CARD_WHEEL_NO_PAGE = ".card-family-switch, .card-family-menu, .card-family-option, strong, .star, .card-actions, .card-download-svg, .card-copy, .card-copy-svg, small";

function isCardWheelPageZone(target, card) {
  if (!card?.contains(target)) return false;
  if (target.closest(CARD_WHEEL_NO_PAGE)) return false;
  if (target.closest(".sample")) return true;
  return target === card;
}

function turnFontListPage(direction) {
  const now = performance.now();
  if (now - (ui.list.lastPageTurn || 0) < 180) return;
  ui.list.lastPageTurn = now;
  goToPage(state.page + direction);
}

function handleFontListWheel(event) {
  if (event.ctrlKey) return;
  const card = event.target.closest(".font-card");
  if (card) {
    const font = state.fonts.find(item => item.id === Number(card.dataset.id));
    if (event.target.closest("small") && card.querySelector(".card-family-switch") && font) {
      event.preventDefault();
      event.stopPropagation();
      stepFamilyFont(font, event.deltaY > 0 ? 1 : -1);
      return;
    }
    if (event.target.closest(CARD_WHEEL_NO_PAGE)) return;
    if (!isCardWheelPageZone(event.target, card)) return;
  }
  event.preventDefault();
  turnFontListPage(event.deltaY > 0 ? 1 : -1);
}

function pickFamilyRepresentative(members) {
  if (state.selected && members.some(item => item.id === state.selected.id)) return state.selected;
  const regular = members.find(item => item.weightLabel === "Regular");
  if (regular) return regular;
  return [...members].sort(compareFamilyMembers)[0];
}

function mountFloatingPopover(popover, anchor, { align = "left", minWidth = 145, gap = 4 } = {}) {
  if (!popover || !anchor) return;
  document.body.appendChild(popover);
  popover.classList.add("is-floating");
  const rect = anchor.getBoundingClientRect();
  popover.style.position = "fixed";
  popover.style.zIndex = "220";
  popover.style.top = `${rect.bottom + gap}px`;
  if (align === "right") {
    popover.style.left = "auto";
    popover.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;
  } else {
    popover.style.left = `${Math.max(8, rect.left)}px`;
    popover.style.right = "auto";
  }
  popover.style.minWidth = `${Math.max(rect.width, minWidth)}px`;
}

function resetFloatingPopover(popover, host) {
  if (!popover) return;
  popover.classList.remove("is-floating");
  popover.style.position = "";
  popover.style.left = "";
  popover.style.top = "";
  popover.style.right = "";
  popover.style.minWidth = "";
  popover.style.zIndex = "";
  if (popover.parentElement === document.body) {
    if (host?.isConnected) host.appendChild(popover);
    else popover.remove();
  }
}

function isWithinFloatingMenu(target, menu, popover) {
  return Boolean(target && (menu?.contains(target) || popover?.contains(target)));
}

function closeAllFamilyMenus() {
  document.querySelectorAll(".card-family-switch.is-open").forEach(familySwitch => {
    familySwitch.classList.remove("is-open");
    const menu = familySwitch._familyMenu;
    if (menu) resetFloatingPopover(menu, familySwitch);
  });
  document.querySelectorAll("body > .card-family-menu.is-floating").forEach(menu => {
    resetFloatingPopover(menu, menu._floatHost);
  });
}

function setupFilterMenus() {
  document.querySelectorAll(".filter-menu").forEach(menu => {
    const popover = menu.querySelector(".filter-popover");
    const summary = menu.querySelector("summary");
    if (!popover || !summary) return;
    const align = menu.id === "weightMenu" || menu.id === "sortMenu" || menu.id === "viewOptionsMenu" ? "right" : "left";
    const minWidth = menu.id === "weightMenu" ? 240 : menu.id === "sortMenu" || menu.id === "viewOptionsMenu" ? 168 : 145;
    const closeMenu = () => {
      menu.removeAttribute("open");
      resetFloatingPopover(popover, menu);
    };
    const syncPopover = () => {
      if (menu.open) {
        document.querySelectorAll(".filter-menu[open]").forEach(other => {
          if (other === menu) return;
          other.removeAttribute("open");
          resetFloatingPopover(other.querySelector(".filter-popover"), other);
        });
        mountFloatingPopover(popover, summary, { align, minWidth });
      } else resetFloatingPopover(popover, menu);
    };
    const scheduleClose = event => {
      if (isWithinFloatingMenu(event?.relatedTarget, menu, popover)) return;
      clearTimeout(menu.closeTimer);
      menu.closeTimer = setTimeout(closeMenu, 320);
    };
    menu.addEventListener("toggle", syncPopover);
    menu.addEventListener("mouseenter", () => clearTimeout(menu.closeTimer));
    menu.addEventListener("mouseleave", scheduleClose);
    popover.addEventListener("mouseenter", () => clearTimeout(menu.closeTimer));
    popover.addEventListener("mouseleave", scheduleClose);
    window.addEventListener("resize", () => {
      if (menu.open) mountFloatingPopover(popover, summary, { align, minWidth });
    });
  });
}

function collapseFilteredByFamily(fonts) {
  const groups = new Map();
  for (const font of fonts) {
    const key = fontFamilyKey(font);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(font);
  }
  const representatives = [...groups.values()].map(pickFamilyRepresentative);
  representatives.sort(compareFilteredFonts);
  return representatives;
}

function syncCollapsedRepresentative(font) {
  if (!state.collapseFamilyFonts || !font) return;
  const key = fontFamilyKey(font);
  const index = state.filtered.findIndex(item => fontFamilyKey(item) === key);
  if (index < 0 || state.filtered[index].id === font.id) return;
  state.filtered[index] = font;
  state.filtered.sort(compareFilteredFonts);
  renderFontList();
  ui.list.querySelector(`[data-id="${font.id}"]`)?.classList.add("active");
}

function beginFilterWork() {
  state.filterVersion++;
  state.preloadVersion++;
  clearTimeout(beginFilterWork.debounceTimer);
  beginFilterWork.debounceTimer = null;
  clearTimeout(updatePreview.shapeTimer);
  updatePreview.shapeTimer = null;
  return state.filterVersion;
}

function getFilterScanNeeds() {
  if (!state.fonts.length) return { variable: false, capabilities: false, shapes: false };
  return {
    variable: state.filters.has("variable") && state.fonts.some(font => font.variable === null),
    capabilities: (
      (state.languageFilters.size > 0 || ["chinese-first", "latin-first"].includes(state.sort)) &&
      state.fonts.some(font => !font.details)
    ),
    shapes: ["square", "narrow", "wide"].includes(state.sort) && state.fonts.some(font => font.aspectRatio === undefined)
  };
}

function showPendingFilterScan() {
  state.filtered = [];
  state.page = 0;
  renderFontList();
  ui.empty.hidden = true;
}

async function runFilterScanChain(token) {
  const needs = getFilterScanNeeds();
  if (needs.variable) {
    ui.scanProgress.hidden = false;
    if (!await detectVariableFonts(token)) return;
  }
  if (token !== state.filterVersion) return;
  if (getFilterScanNeeds().capabilities) {
    if (!await scanFontCapabilities(token)) return;
  }
  if (token !== state.filterVersion) return;
  if (getFilterScanNeeds().shapes) {
    if (!await scanFontShapes(token)) return;
  }
  if (token !== state.filterVersion) return;
  ui.scanProgress.hidden = true;
  applyFilter();
}

function refreshFilters() {
  const token = beginFilterWork();
  const needs = getFilterScanNeeds();
  if (needs.variable || needs.capabilities || needs.shapes) {
    showPendingFilterScan();
    runFilterScanChain(token);
    return;
  }
  applyFilter();
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
  state.filtered.sort(compareFilteredFonts);
  if (state.collapseFamilyFonts) state.filtered = collapseFilteredByFamily(state.filtered);
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
  rebuildFamilyIndex();
}

function renderWeightFilterMenu() {
  const container = $("#weightFilterList");
  if (!container) return;
  if (!state.weightOptions.length) {
    container.innerHTML = `<span class="filter-empty">暂无字重标签</span>`;
    return;
  }
  container.innerHTML = state.weightOptions.map(({ label, count }) => `
    <label class="weight-filter-item">
      <span class="weight-filter-name">
        <input type="checkbox" data-weight-label="${escapeHtml(label)}"${state.weightFilters.has(label) ? " checked" : ""}>
        <span class="weight-filter-label">${escapeHtml(label)}</span>
        <small class="weight-filter-count">${count}</small>
      </span>
    </label>
  `).join("");
  container.querySelectorAll("[data-weight-label]").forEach(input => {
    input.addEventListener("change", () => {
      input.checked ? state.weightFilters.add(input.dataset.weightLabel) : state.weightFilters.delete(input.dataset.weightLabel);
      updateFilterControls();
      refreshFilters();
      persistUiSettings();
    });
  });
}

function pickInitialDisplayName(family = "", fullName = "") {
  if (/\p{Script=Han}/u.test(family)) return family;
  if (/\p{Script=Han}/u.test(fullName)) return fullName;
  return family || fullName || "未命名字体";
}

const CARD_SVG_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3"/><path fill="currentColor" d="M7 8h10v2H7zm0 3h10v2H7zm0 3h7v2H7z"/></svg>`;
const CARD_DOWNLOAD_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 4v10"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M8.5 10.5 12 14l3.5-3.5"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M5 18h14"/></svg>`;

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatOutlineNumber(value) {
  return Math.round(value * 10) / 10;
}

function pathMove(x, y) { return { type: "M", args: [x, y] }; }
function pathLine(x, y) { return { type: "L", args: [x, y] }; }
function pathQuad(cx, cy, x, y) { return { type: "Q", args: [cx, cy, x, y] }; }
function pathClose() { return { type: "Z", args: [] }; }

function pathCommandToSvg(command) {
  if (command.type === "Z") return "Z";
  const nums = command.args.map(formatOutlineNumber);
  if (command.type === "M" || command.type === "L") {
    return `${command.type}${nums[0]} ${nums[1]}`;
  }
  return `Q${nums[0]} ${nums[1]} ${nums[2]} ${nums[3]}`;
}

function pathCommandsToSvgData(commands) {
  return commands.map(pathCommandToSvg).join(" ");
}

function pathCommandsSvgBoundingBox(commands) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const addPoint = (x, y) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  };
  for (const command of commands) {
    if (command.type === "Z") continue;
    if (command.type === "M" || command.type === "L") addPoint(command.args[0], command.args[1]);
    else if (command.type === "Q") {
      addPoint(command.args[0], command.args[1]);
      addPoint(command.args[2], command.args[3]);
    }
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}

function trueTypeToSvgCommands(commands) {
  return commands.map(command => {
    if (command.type === "Z") return command;
    const args = command.args.slice();
    for (let index = 1; index < args.length; index += 2) args[index] = -args[index];
    return { type: command.type, args };
  });
}

function translateSvgPathCommands(commands, dx, dy) {
  return commands.map(command => {
    if (command.type === "Z") return command;
    const args = command.args.slice();
    for (let index = 0; index < args.length; index += 2) {
      args[index] += dx;
      if (index + 1 < args.length) args[index + 1] += dy;
    }
    return { type: command.type, args };
  });
}

function translatePathCommands(commands, dx, dy) {
  return commands.map(command => {
    if (command.type === "Z") return command;
    const args = command.args.slice();
    for (let index = 0; index < args.length; index += 2) {
      args[index] += dx;
      args[index + 1] += dy;
    }
    return { type: command.type, args };
  });
}

function transformPoints(points, matrix, offsetX, offsetY) {
  return points.map(point => ({
    x: matrix.a * point.x + matrix.b * point.y + offsetX,
    y: matrix.c * point.x + matrix.d * point.y + offsetY,
    onCurve: point.onCurve
  }));
}

function mapMatrixPoint(matrix, x, y) {
  return {
    x: matrix.a * x + matrix.b * y,
    y: matrix.c * x + matrix.d * y
  };
}

function transformPathCommands(commands, matrix, offsetX, offsetY) {
  const mapPoint = (x, y) => ({
    x: matrix.a * x + matrix.b * y + offsetX,
    y: matrix.c * x + matrix.d * y + offsetY
  });
  return commands.map(command => {
    if (command.type === "Z") return command;
    const args = command.args.slice();
    for (let index = 0; index < args.length; index += 2) {
      const mapped = mapPoint(args[index], args[index + 1]);
      args[index] = mapped.x;
      args[index + 1] = mapped.y;
    }
    return { type: command.type, args };
  });
}

function outlinePreviewCharacters(text = cardPreviewText()) {
  const trimmed = String(text ?? "").trim();
  const source = trimmed || "字";
  const characters = [];
  for (let index = 0; index < source.length; ) {
    const codePoint = source.codePointAt(index);
    characters.push(String.fromCodePoint(codePoint));
    index += codePoint > 0xFFFF ? 2 : 1;
  }
  return characters.slice(0, 24);
}

let cardPreviewStyleDraft = null;
let cardPreviewStyleSelectedLayerId = null;
let cardPreviewStylePreviewFontId = null;
let cardPreviewStyleDraftPresetId = null;
let cardPreviewStylePresetEditorMode = null;
let cardPreviewStyleModalTab = "edit";
let cardPreviewStyleManagePresetId = "";
let cardPreviewStyleManageHoverPresetId = null;
let cardPreviewStyleSelectedStopIndex = 0;
let draggingGradientStopIndex = null;
let draggingGradientScope = null;
let draggingGradientDeleteIntent = false;
let draggingPreviewStyleLayerId = null;

function createPreviewStyleLayer(type, enabled = false, overrides = {}) {
  const meta = PREVIEW_EFFECT_TYPES[type];
  if (!meta) return null;
  return { id: nextPreviewStyleLayerId(), type, ...meta.defaults, enabled, ...overrides };
}

function duplicatePreviewStyleLayer(layerId) {
  if (!cardPreviewStyleDraft) return null;
  const index = cardPreviewStyleDraft.layers.findIndex(layer => layer.id === layerId);
  if (index < 0) return null;
  const source = cardPreviewStyleDraft.layers[index];
  const copy = normalizePreviewLayer({ ...source, id: nextPreviewStyleLayerId() });
  cardPreviewStyleDraft.layers.splice(index + 1, 0, copy);
  return copy.id;
}

function movePreviewStyleLayer(sourceId, targetId, before = true) {
  if (!cardPreviewStyleDraft || sourceId === targetId) return;
  const layers = cardPreviewStyleDraft.layers;
  const from = layers.findIndex(layer => layer.id === sourceId);
  const to = layers.findIndex(layer => layer.id === targetId);
  if (from < 0 || to < 0) return;
  const [item] = layers.splice(from, 1);
  let insertAt = before ? to : to + 1;
  if (from < to) insertAt--;
  layers.splice(insertAt, 0, item);
}

function resolvePreviewFillColor(style) {
  return style?.fill?.color || CARD_PREVIEW_STYLE_DEFAULTS.fill.color;
}

function buildPreviewFillValue(fill, defsParts) {
  if (fill.enabled === false) return "none";
  if (fill.mode === "gradient") {
    const stops = normalizeGradientStops(fill.stops, fill);
    const gradId = "preview-fill-gradient";
    appendLinearGradientDef(defsParts, gradId, stops, fill.angle);
    return `url(#${gradId})`;
  }
  return escapeXml(hexWithOpacity(fill.color, fill.opacity));
}

function appendLinearGradientDef(defsParts, gradId, stops, angle) {
  const angleValue = Number(angle) || 0;
  const rad = ((angleValue - 90) * Math.PI) / 180;
  const x1 = 0.5 - Math.cos(rad) * 0.5;
  const y1 = 0.5 - Math.sin(rad) * 0.5;
  const x2 = 0.5 + Math.cos(rad) * 0.5;
  const y2 = 0.5 + Math.sin(rad) * 0.5;
  const stopMarkup = stops.map(stop =>
    `<stop offset="${formatOutlineNumber(stop.offset)}%" stop-color="${escapeXml(stop.color)}" stop-opacity="${formatOutlineNumber(stop.opacity / 100)}"/>`
  ).join("");
  defsParts.push(`<linearGradient id="${gradId}" gradientUnits="objectBoundingBox" x1="${formatOutlineNumber(x1)}" y1="${formatOutlineNumber(y1)}" x2="${formatOutlineNumber(x2)}" y2="${formatOutlineNumber(y2)}">${stopMarkup}</linearGradient>`);
}

function buildPreviewStrokeValue(layer, defsParts, suffix) {
  if (layer.colorMode === "gradient") {
    const stops = normalizeGradientStops(layer.stops, layer);
    const gradId = `preview-stroke-gradient-${suffix}`;
    appendLinearGradientDef(defsParts, gradId, stops, layer.angle);
    return `url(#${gradId})`;
  }
  return escapeXml(hexWithOpacity(layer.color, layer.opacity));
}

function buildGradientCss(fill) {
  const stops = normalizeGradientStops(fill.stops, fill);
  const stopCss = stops.map(stop => `${hexWithOpacity(stop.color, stop.opacity)} ${stop.offset}%`).join(", ");
  return `linear-gradient(${Number(fill.angle) || 0}deg, ${stopCss})`;
}

function parseHexColor(hex) {
  const match = String(hex || "#000000").trim().match(/^#?([0-9a-f]{6})$/i);
  if (!match) return { r: 0, g: 0, b: 0 };
  const value = match[1];
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function sampleGradientColor(stops, context, offset) {
  const normalized = normalizeGradientStops(stops, context);
  const clamped = Math.max(0, Math.min(100, Number(offset) || 0));
  if (clamped <= normalized[0].offset) {
    return hexWithOpacity(normalized[0].color, normalized[0].opacity);
  }
  const last = normalized[normalized.length - 1];
  if (clamped >= last.offset) {
    return hexWithOpacity(last.color, last.opacity);
  }
  for (let i = 1; i < normalized.length; i++) {
    const right = normalized[i];
    const left = normalized[i - 1];
    if (clamped > right.offset) continue;
    const span = right.offset - left.offset || 1;
    const ratio = (clamped - left.offset) / span;
    const leftRgb = parseHexColor(left.color);
    const rightRgb = parseHexColor(right.color);
    const r = Math.round(leftRgb.r + (rightRgb.r - leftRgb.r) * ratio);
    const g = Math.round(leftRgb.g + (rightRgb.g - leftRgb.g) * ratio);
    const b = Math.round(leftRgb.b + (rightRgb.b - leftRgb.b) * ratio);
    const opacity = left.opacity + (right.opacity - left.opacity) * ratio;
    return `rgba(${r}, ${g}, ${b}, ${Math.round(Math.max(0, Math.min(1, opacity / 100)) * 1000) / 1000})`;
  }
  return hexWithOpacity(normalized[0].color, normalized[0].opacity);
}

function gradientColorAtDirection(stops, angle, directionDeg, context = null) {
  const gradRad = ((Number(angle) || 0) - 90) * Math.PI / 180;
  const dirRad = directionDeg * Math.PI / 180;
  const projection = Math.cos(dirRad) * Math.cos(gradRad) + Math.sin(dirRad) * Math.sin(gradRad);
  const offset = 50 + projection * 50;
  return sampleGradientColor(stops, context || { stops, angle }, offset);
}

function applyLayerOpacityToColor(color, layerOpacity = 100) {
  const opacity = Math.max(0, Math.min(100, Number(layerOpacity) || 0));
  if (opacity >= 100) return color;
  const rgbaMatch = String(color).match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
  if (rgbaMatch) {
    const alpha = Number(rgbaMatch[4]) * opacity / 100;
    return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${Math.round(alpha * 1000) / 1000})`;
  }
  const hexMatch = String(color).match(/^#?([0-9a-f]{6})$/i);
  if (hexMatch) return hexWithOpacity(`#${hexMatch[1]}`, opacity);
  return color;
}

function resolveStrokeLayerColor(layer, directionDeg = 0) {
  if (layer.colorMode === "gradient") {
    return applyLayerOpacityToColor(
      gradientColorAtDirection(layer.stops, layer.angle, directionDeg, layer),
      layer.opacity
    );
  }
  return hexWithOpacity(layer.color, layer.opacity);
}

function gradientStrokeShadows(width, layer) {
  const shadows = [];
  const radius = Math.max(1, Math.round(Number(width) || 1));
  for (let step = 1; step <= radius; step++) {
    for (let angle = 0; angle < 360; angle += 45) {
      const color = layer.colorMode === "gradient"
        ? resolveStrokeLayerColor(layer, angle)
        : hexWithOpacity(layer.color, layer.opacity);
      const rad = angle * Math.PI / 180;
      shadows.push(`${(Math.cos(rad) * step).toFixed(1)}px ${(Math.sin(rad) * step).toFixed(1)}px 0 ${color}`);
    }
  }
  return shadows;
}

function isStrokeLayer(layer) {
  return Boolean(layer && ["stroke", "outerStroke", "innerStroke"].includes(layer.type));
}

function resolveStrokePosition(layer) {
  if (layer.type === "innerStroke") return "inside";
  if (layer.type === "outerStroke") return "outside";
  if (layer.type === "stroke" && ["outside", "center", "inside"].includes(layer.position)) return layer.position;
  return "outside";
}

function strokeOutlineShadows(width, color) {
  return innerStrokeShadows(width, color);
}

function strokeLayerShadows(width, layer) {
  if (layer.colorMode === "gradient") return gradientStrokeShadows(width, layer);
  return innerStrokeShadows(width, hexWithOpacity(layer.color, layer.opacity));
}

function hexWithOpacity(hex, opacityPercent = 100) {
  const normalized = String(hex || "#000000").trim();
  const match = normalized.match(/^#?([0-9a-f]{6})$/i);
  if (!match) return normalized || "#000000";
  const value = match[1];
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const alpha = Math.max(0, Math.min(100, Number(opacityPercent) || 0)) / 100;
  if (alpha >= 0.999) return `#${value.toLowerCase()}`;
  return `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 1000) / 1000})`;
}

function innerStrokeShadows(width, color) {
  const shadows = [];
  const radius = Math.max(1, Math.round(Number(width) || 1));
  for (let step = 1; step <= radius; step++) {
    for (let angle = 0; angle < 360; angle += 45) {
      const rad = angle * Math.PI / 180;
      shadows.push(`${(Math.cos(rad) * step).toFixed(1)}px ${(Math.sin(rad) * step).toFixed(1)}px 0 ${color}`);
    }
  }
  return shadows;
}

function cardPreviewStyleToCss(style = state.cardPreviewStyle) {
  const normalized = normalizeCardPreviewStyle(style);
  const fill = normalized.fill;
  const fillEnabled = fill.enabled !== false;
  const useGradientFill = fillEnabled && fill.mode === "gradient";
  const css = {
    color: "",
    backgroundImage: "",
    backgroundClip: "",
    webkitBackgroundClip: "",
    webkitTextFillColor: "",
    webkitTextStroke: "",
    textStroke: "",
    paintOrder: "",
    textShadow: "none",
    backgroundSize: "",
    backgroundRepeat: ""
  };
  if (useGradientFill) {
    css.backgroundImage = buildGradientCss(fill);
    css.backgroundClip = "text";
    css.webkitBackgroundClip = "text";
    css.webkitTextFillColor = "transparent";
    css.color = "transparent";
    css.backgroundSize = "100% 100%";
    css.backgroundRepeat = "no-repeat";
  } else if (fillEnabled) {
    css.color = hexWithOpacity(fill.color, fill.opacity);
  } else {
    css.color = "transparent";
    css.webkitTextFillColor = "transparent";
  }
  const shadows = [];
  const strokeLayers = normalized.layers.filter(layer => layer.enabled && isStrokeLayer(layer));
  for (const layer of normalized.layers) {
    if (!layer.enabled) continue;
    if (layer.type === "dropShadow") {
      shadows.push(`${layer.offsetX}px ${layer.offsetY}px ${layer.blur}px ${hexWithOpacity(layer.color, layer.opacity)}`);
    }
  }
  let primaryWebkit = null;
  strokeLayers.forEach(layer => {
    const width = Number(layer.width) || 1;
    const position = resolveStrokePosition(layer);
    const useGradientStroke = layer.colorMode === "gradient";
    if (useGradientFill || useGradientStroke) {
      shadows.unshift(...strokeLayerShadows(width, layer));
      return;
    }
    const color = hexWithOpacity(layer.color, layer.opacity);
    if (position === "inside") {
      shadows.unshift(...innerStrokeShadows(width, color));
      return;
    }
    if (position === "center") {
      if (!primaryWebkit) {
        primaryWebkit = { width, color, paintOrder: "fill stroke" };
      } else {
        shadows.unshift(...strokeOutlineShadows(width, color));
      }
      return;
    }
    if (!primaryWebkit) {
      primaryWebkit = { width: width * 2, color, paintOrder: "stroke fill" };
    } else {
      shadows.unshift(...strokeOutlineShadows(width, color));
    }
  });
  if (primaryWebkit) {
    css.webkitTextStroke = `${primaryWebkit.width}px ${primaryWebkit.color}`;
    css.textStroke = css.webkitTextStroke;
    css.paintOrder = primaryWebkit.paintOrder;
  }
  if (shadows.length) css.textShadow = shadows.join(", ");
  return css;
}

function hasActiveCardPreviewStyle(style = state.cardPreviewStyle) {
  const normalized = normalizeCardPreviewStyle(style);
  if (normalized.fill.enabled !== false) {
    if (normalized.fill.mode === "gradient") return true;
    if (normalized.fill.color !== CARD_PREVIEW_STYLE_DEFAULTS.fill.color || normalized.fill.opacity !== 100) return true;
  }
  return normalized.layers.some(layer => layer.enabled);
}

function loadStoredCardPreviewStyle(raw) {
  if (!raw || typeof raw !== "object") return null;
  const normalized = normalizeCardPreviewStyle(raw);
  return hasActiveCardPreviewStyle(normalized) ? normalized : null;
}

function nextPreviewStylePresetId() {
  cardPreviewStylePresetCounter += 1;
  return `style-preset-${cardPreviewStylePresetCounter}`;
}

function syncCardPreviewStylePresetCounter(presets) {
  presets.forEach(item => {
    if (item.id && /^style-preset-\d+$/.test(item.id)) {
      const suffix = Number(item.id.split("-").pop());
      if (suffix > cardPreviewStylePresetCounter) cardPreviewStylePresetCounter = suffix;
    }
  });
}

function normalizeCardPreviewStylePresets(raw) {
  if (!Array.isArray(raw)) return [];
  const presets = [];
  raw.forEach(item => {
    if (!item || typeof item !== "object" || typeof item.name !== "string" || !item.name.trim()) return;
    presets.push({
      id: String(item.id || nextPreviewStylePresetId()),
      name: item.name.trim().slice(0, 48),
      style: normalizeCardPreviewStyle(item.style),
      updatedAt: Number(item.updatedAt) || Date.now()
    });
  });
  syncCardPreviewStylePresetCounter(presets);
  return presets;
}

function resolveActiveCardPreviewStylePresetId(rawId, presets) {
  if (!rawId || !presets.some(item => item.id === rawId)) return null;
  return rawId;
}

function findCardPreviewStylePreset(id) {
  return state.cardPreviewStylePresets.find(item => item.id === id) || null;
}

function cardPreviewStylesEqual(a, b) {
  return JSON.stringify(normalizeCardPreviewStyle(a)) === JSON.stringify(normalizeCardPreviewStyle(b));
}

function uniqueCardPreviewStylePresetName(base = "未命名方案", excludeId = null) {
  const trimmed = base.trim().slice(0, 48) || "未命名方案";
  const exists = name => state.cardPreviewStylePresets.some(item => item.name === name && item.id !== excludeId);
  if (!exists(trimmed)) return trimmed;
  let index = 2;
  while (exists(`${trimmed} ${index}`)) index += 1;
  return `${trimmed} ${index}`.slice(0, 48);
}

function createCardPreviewStylePreset(name, style) {
  const preset = {
    id: nextPreviewStylePresetId(),
    name: uniqueCardPreviewStylePresetName(name),
    style: cloneCardPreviewStyle(style),
    updatedAt: Date.now()
  };
  state.cardPreviewStylePresets.push(preset);
  return preset;
}

function updateCardPreviewStylePreset(id, style) {
  const preset = findCardPreviewStylePreset(id);
  if (!preset) return null;
  preset.style = cloneCardPreviewStyle(style);
  preset.updatedAt = Date.now();
  return preset;
}

function renameCardPreviewStylePreset(id, name) {
  const preset = findCardPreviewStylePreset(id);
  if (!preset) return null;
  const nextName = name.trim().slice(0, 48);
  if (!nextName) return null;
  preset.name = uniqueCardPreviewStylePresetName(nextName, id);
  preset.updatedAt = Date.now();
  return preset;
}

function deleteCardPreviewStylePreset(id) {
  const index = state.cardPreviewStylePresets.findIndex(item => item.id === id);
  if (index < 0) return false;
  state.cardPreviewStylePresets.splice(index, 1);
  if (state.activeCardPreviewStylePresetId === id) state.activeCardPreviewStylePresetId = null;
  if (cardPreviewStyleDraftPresetId === id) cardPreviewStyleDraftPresetId = null;
  return true;
}

function applyCardPreviewStyleToElement(element, style, { themeDefault = false } = {}) {
  if (!element) return;
  clearCardPreviewStyleOnElement(element);
  if (!style || !hasActiveCardPreviewStyle(style)) {
    if (themeDefault) element.style.color = "var(--ink)";
    return;
  }
  const css = cardPreviewStyleToCss(style);
  element.style.color = css.color;
  element.style.backgroundImage = css.backgroundImage || "none";
  element.style.backgroundClip = css.backgroundClip || "";
  element.style.webkitBackgroundClip = css.webkitBackgroundClip || "";
  element.style.webkitTextFillColor = css.webkitTextFillColor || "";
  element.style.webkitTextStroke = css.webkitTextStroke;
  element.style.textStroke = css.textStroke;
  element.style.paintOrder = css.paintOrder;
  element.style.textShadow = css.textShadow;
  element.style.backgroundSize = css.backgroundSize || "";
  element.style.backgroundRepeat = css.backgroundRepeat || "";
}

function applyCardPreviewStyleToSample(sample, style = state.cardPreviewStyle) {
  if (!sample) return;
  const card = sample.closest(".font-card");
  if (!style || !hasActiveCardPreviewStyle(style)) {
    clearCardPreviewStyleOnElement(sample);
    card?.classList.remove("has-preview-style");
    return;
  }
  applyCardPreviewStyleToElement(sample, style);
  card?.classList.toggle("has-preview-style", true);
}

function applyCardPreviewStyleToAllCards() {
  ui.list.querySelectorAll(".font-card.font-ready .sample").forEach(sample => applyCardPreviewStyleToSample(sample));
  renderCardPreviewStyleModalPreview();
}

function clearCardPreviewStyleOnElement(element) {
  element.style.color = "";
  element.style.backgroundImage = "";
  element.style.backgroundClip = "";
  element.style.webkitBackgroundClip = "";
  element.style.webkitTextFillColor = "";
  element.style.webkitTextStroke = "";
  element.style.textStroke = "";
  element.style.paintOrder = "";
  element.style.textShadow = "";
  element.style.backgroundSize = "";
  element.style.backgroundRepeat = "";
}

function applyCardPreviewStyleToMagnifierText(target, sampleStyle, style = state.cardPreviewStyle) {
  clearCardPreviewStyleOnElement(target);
  if (!style || !hasActiveCardPreviewStyle(style)) {
    target.style.color = sampleStyle.color;
    return;
  }
  const css = cardPreviewStyleToCss(style);
  target.style.color = css.color;
  target.style.backgroundImage = css.backgroundImage || "none";
  target.style.backgroundClip = css.backgroundClip || "";
  target.style.webkitBackgroundClip = css.webkitBackgroundClip || "";
  target.style.webkitTextFillColor = css.webkitTextFillColor || "";
  target.style.webkitTextStroke = css.webkitTextStroke;
  target.style.textStroke = css.textStroke;
  target.style.paintOrder = css.paintOrder;
  target.style.textShadow = css.textShadow;
  target.style.backgroundSize = css.backgroundSize || "";
  target.style.backgroundRepeat = css.backgroundRepeat || "";
}

function previewStyleUnitsPerPx(upm, referenceFontSize = state.cardSampleSize) {
  const fontSize = Math.max(1, Number(referenceFontSize) || 49);
  return Math.max(0.01, Number(upm) || 1000) / fontSize;
}

function scalePreviewStylePx(value, unitsPerPx) {
  return Number(value) * unitsPerPx;
}

function buildStyledOutlineSvgMarkup({ pathData, width, height, label, style = state.cardPreviewStyle, unitsPerPx = 1 }) {
  const normalized = normalizeCardPreviewStyle(style);
  const defsParts = [];
  const fillValue = buildPreviewFillValue(normalized.fill, defsParts);
  const enabledLayers = normalized.layers.filter(layer => layer.enabled);
  let filterAttr = "";
  const dropShadows = enabledLayers.filter(layer => layer.type === "dropShadow");
  if (dropShadows.length) {
    let filterBody = "";
    dropShadows.forEach(layer => {
      filterBody += `<feDropShadow dx="${formatOutlineNumber(scalePreviewStylePx(layer.offsetX, unitsPerPx))}" dy="${formatOutlineNumber(scalePreviewStylePx(layer.offsetY, unitsPerPx))}" stdDeviation="${formatOutlineNumber(scalePreviewStylePx(layer.blur / 2, unitsPerPx))}" flood-color="${escapeXml(layer.color)}" flood-opacity="${formatOutlineNumber(layer.opacity / 100)}"/>`;
    });
    defsParts.push(`<filter id="preview-shadow" x="-50%" y="-50%" width="200%" height="200%">${filterBody}</filter>`);
    filterAttr = ` filter="url(#preview-shadow)"`;
  }
  let body = "";
  const outsideStrokes = [];
  const centerStrokes = [];
  const insideStrokes = [];
  enabledLayers.forEach(layer => {
    if (!isStrokeLayer(layer)) return;
    const position = resolveStrokePosition(layer);
    if (position === "outside") outsideStrokes.push(layer);
    else if (position === "center") centerStrokes.push(layer);
    else insideStrokes.push(layer);
  });
  outsideStrokes.forEach((layer, index) => {
    const strokeWidth = scalePreviewStylePx(layer.width, unitsPerPx) * 2;
    body += `<path fill="none" stroke="${buildPreviewStrokeValue(layer, defsParts, `outside-${index}`)}" stroke-width="${formatOutlineNumber(strokeWidth)}" d="${pathData}"/>`;
  });
  body += `<path fill="${fillValue}" d="${pathData}"/>`;
  centerStrokes.forEach((layer, index) => {
    const strokeWidth = scalePreviewStylePx(layer.width, unitsPerPx);
    body += `<path fill="none" stroke="${buildPreviewStrokeValue(layer, defsParts, `center-${index}`)}" stroke-width="${formatOutlineNumber(strokeWidth)}" d="${pathData}"/>`;
  });
  let innerIndex = 0;
  insideStrokes.forEach((layer, index) => {
    const clipId = `preview-clip-${index}`;
    defsParts.push(`<clipPath id="${clipId}"><path d="${pathData}"/></clipPath>`);
    const strokeWidth = scalePreviewStylePx(layer.width, unitsPerPx) * 2;
    body += `<path clip-path="url(#${clipId})" fill="none" stroke="${buildPreviewStrokeValue(layer, defsParts, `inside-${index}`)}" stroke-width="${formatOutlineNumber(strokeWidth)}" d="${pathData}"/>`;
  });
  const defsBlock = defsParts.length ? `<defs>${defsParts.join("")}</defs>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${formatOutlineNumber(width)} ${formatOutlineNumber(height)}" role="img" aria-label="${label}">\n${defsBlock}\n  <g${filterAttr}>${body}</g>\n</svg>`;
}

function getCardPreviewStyleModalFont() {
  const font = state.fonts.find(item => item.id === cardPreviewStylePreviewFontId);
  if (font) return font;
  return state.selected || state.previewed || state.filtered[0] || state.fonts[0] || null;
}

function renderCardPreviewStyleFontOptions() {
  const select = $("#cardPreviewStyleFont");
  if (!select) return;
  const current = getCardPreviewStyleModalFont();
  cardPreviewStylePreviewFontId = current?.id ?? null;
  const options = [];
  const seen = new Set();
  [state.selected, state.previewed, ...state.filtered.slice(0, 120)].forEach(font => {
    if (!font || seen.has(font.id)) return;
    seen.add(font.id);
    options.push(font);
  });
  if (!options.length && state.fonts[0]) options.push(state.fonts[0]);
  select.innerHTML = options.map(font => `<option value="${font.id}"${font.id === cardPreviewStylePreviewFontId ? " selected" : ""}>${escapeHtml(font.displayName || font.family)} · ${escapeHtml(font.style || "Regular")}</option>`).join("");
}

function renderCardPreviewStyleModalPreview() {
  const sample = $("#cardPreviewStyleSample");
  const stage = $("#cardPreviewStyleStage");
  if (!sample || !stage) return;
  const font = getCardPreviewStyleModalFont();
  const isManageTab = cardPreviewStyleModalTab === "manage";
  const text = isManageTab ? MANAGE_PRESET_PREVIEW_CHAR : (cardPreviewText() || "字体有光");
  sample.textContent = text;
  if (font) {
    registerFont(font);
    sample.style.fontFamily = cssName(font);
    ensureFontLoaded(font, text).then(() => {
      if (getCardPreviewStyleModalFont()?.id !== font.id) return;
      sample.style.fontFamily = cssName(font);
      if (isManageTab) applyManagePresetIconStyles();
    });
  } else {
    sample.style.fontFamily = "";
  }
  const style = isManageTab
    ? resolveManagePreviewStyle()
    : (cardPreviewStyleDraft || state.cardPreviewStyle);
  applyCardPreviewStyleToElement(sample, style, { themeDefault: isManageTab || !style });
}

function getPreviewStyleLayerLabel(layer, layers) {
  const base = PREVIEW_EFFECT_TYPES[layer.type]?.label || layer.type;
  const index = layers.filter(item => item.type === layer.type).indexOf(layer);
  return index > 0 ? `${base} ${index + 1}` : base;
}

function renderStyleRangeField(field, value, attrs = "") {
  const min = Number(field.min);
  const max = Number(field.max);
  const progress = max === min ? 0 : ((Number(value) - min) / (max - min)) * 100;
  return `<label class="preview-style-field"><span>${escapeHtml(field.label)}</span><div class="preview-style-range-wrap"><input class="preview-style-range" type="range" style="--range-progress:${progress}%" ${attrs} min="${field.min}" max="${field.max}" step="${field.step}" value="${value}" /><span class="preview-style-range-value" data-range-value>${escapeHtml(String(value))}</span></div></label>`;
}

function syncStyleRangeProgress(range) {
  if (!range || range.type !== "range") return;
  const min = Number(range.min);
  const max = Number(range.max);
  const progress = max === min ? 0 : ((Number(range.value) - min) / (max - min)) * 100;
  range.style.setProperty("--range-progress", `${progress}%`);
  const valueEl = range.closest(".preview-style-range-wrap")?.querySelector("[data-range-value]");
  if (valueEl) valueEl.textContent = range.value;
}

function syncAllStyleRanges(root = document) {
  root.querySelectorAll(".preview-style-range").forEach(syncStyleRangeProgress);
}

function renderStyleSelectField(field, value, attrs = "") {
  const options = field.options.map(option =>
    `<option value="${escapeHtml(option.value)}"${option.value === value ? " selected" : ""}>${escapeHtml(option.label)}</option>`
  ).join("");
  return `<label class="preview-style-field"><span>${escapeHtml(field.label)}</span><select class="preview-style-select" ${attrs}>${options}</select></label>`;
}

function buildGradientBarPreviewCss(stops, fill) {
  const normalized = normalizeGradientStops(stops, fill);
  const stopCss = normalized.map(stop => `${hexWithOpacity(stop.color, stop.opacity)} ${stop.offset}%`).join(", ");
  return `linear-gradient(90deg, ${stopCss})`;
}

function gradientBarOffsetFromEvent(bar, clientX) {
  const rect = bar.getBoundingClientRect();
  if (!rect.width) return 0;
  return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
}

function getGradientBarWrap(scope = draggingGradientScope || getActiveGradientScope()) {
  const panel = $("#cardPreviewStyleParams");
  if (!panel) return null;
  const bars = panel.querySelectorAll(".preview-gradient-bar-wrap");
  if (bars.length === 1) return bars[0];
  const target = getGradientEditTarget(scope);
  if (!target) return bars[0] || null;
  for (const wrap of bars) {
    const bar = wrap.querySelector(".preview-gradient-bar");
    if (bar?.dataset.gradientScope === scope) return wrap;
  }
  return bars[0] || null;
}

function clearGradientStopDragFeedback(scope = draggingGradientScope) {
  draggingGradientDeleteIntent = false;
  const wrap = getGradientBarWrap(scope);
  wrap?.classList.remove("is-stop-delete-ready", "is-stop-dragging");
  wrap?.querySelector(".preview-gradient-stop-handle.dragging")?.classList.remove("is-delete-intent");
  wrap?.querySelector(".preview-gradient-delete-zone")?.setAttribute("hidden", "");
  wrap?.querySelector(".preview-gradient-position-indicator")?.setAttribute("hidden", "");
}

function updateGradientStopDragFeedback(event, scope = draggingGradientScope) {
  const wrap = getGradientBarWrap(scope);
  const target = getGradientEditTarget(scope);
  const track = wrap?.querySelector(".preview-gradient-stops-track");
  if (!wrap || !track || !target) return;
  const trackRect = track.getBoundingClientRect();
  const canDelete = target.stops.length > 2;
  draggingGradientDeleteIntent = canDelete && event.clientY > trackRect.bottom + 18;
  wrap.classList.toggle("is-stop-delete-ready", draggingGradientDeleteIntent);
  wrap.classList.toggle("is-stop-dragging", draggingGradientStopIndex !== null);
  const deleteZone = wrap.querySelector(".preview-gradient-delete-zone");
  if (deleteZone) deleteZone.hidden = !(draggingGradientStopIndex !== null && canDelete);
  wrap.querySelector(".preview-gradient-stop-handle.dragging")
    ?.classList.toggle("is-delete-intent", draggingGradientDeleteIntent);
}

function refreshGradientPositionIndicator(scope, stops) {
  const wrap = getGradientBarWrap(scope);
  const indicator = wrap?.querySelector(".preview-gradient-position-indicator");
  const tag = indicator?.querySelector(".preview-gradient-position-tag");
  if (!indicator) return;
  const show = draggingGradientStopIndex !== null && scope === draggingGradientScope;
  const stop = show ? stops?.[draggingGradientStopIndex] : null;
  if (stop) {
    indicator.hidden = false;
    indicator.style.left = `${stop.offset}%`;
    if (tag) tag.textContent = `${stop.offset}%`;
  } else {
    indicator.hidden = true;
  }
}

function interpolateGradientStopColor(stops, offset) {
  const sorted = [...stops].sort((a, b) => a.offset - b.offset);
  if (!sorted.length) return { color: "#888888", opacity: 100 };
  if (offset <= sorted[0].offset) return { color: sorted[0].color, opacity: sorted[0].opacity };
  if (offset >= sorted[sorted.length - 1].offset) {
    const last = sorted[sorted.length - 1];
    return { color: last.color, opacity: last.opacity };
  }
  for (let i = 1; i < sorted.length; i++) {
    if (offset <= sorted[i].offset) {
      const left = sorted[i - 1];
      const right = sorted[i];
      return (offset - left.offset) <= (right.offset - offset)
        ? { color: left.color, opacity: left.opacity }
        : { color: right.color, opacity: right.opacity };
    }
  }
  return { color: sorted[0].color, opacity: sorted[0].opacity };
}

function getGradientEditTarget(scope) {
  if (!cardPreviewStyleDraft) return null;
  if (scope === "fill") return cardPreviewStyleDraft.fill;
  if (scope === "layer") {
    return cardPreviewStyleDraft.layers.find(layer => layer.id === cardPreviewStyleSelectedLayerId) || null;
  }
  return null;
}

function getActiveGradientScope() {
  if (!cardPreviewStyleDraft) return null;
  if (cardPreviewStyleSelectedLayerId == null) {
    return cardPreviewStyleDraft.fill.mode === "gradient" ? "fill" : null;
  }
  const layer = cardPreviewStyleDraft.layers.find(item => item.id === cardPreviewStyleSelectedLayerId);
  if (layer && isStrokeLayer(layer) && layer.colorMode === "gradient") return "layer";
  return null;
}

function syncGradientLegacyColors(target, scope) {
  if (scope === "fill") syncFillLegacyColors(target);
  else syncStrokeLayerLegacyColors(target);
}

function refreshGradientBarVisuals(scope = draggingGradientScope || getActiveGradientScope()) {
  const target = getGradientEditTarget(scope);
  const panel = $("#cardPreviewStyleParams");
  if (!target || !scope || !panel) return;
  const stops = target.stops;
  const wrap = getGradientBarWrap(scope);
  const bar = wrap?.querySelector(".preview-gradient-bar") || panel.querySelector(".preview-gradient-bar");
  const track = wrap?.querySelector(".preview-gradient-stops-track") || panel.querySelector(".preview-gradient-stops-track");
  if (!bar || !track) return;
  bar.style.backgroundImage = buildGradientBarPreviewCss(stops, target);
  track.querySelectorAll(".preview-gradient-stop-handle").forEach((handle, index) => {
    const stop = stops[index];
    if (!stop) return;
    handle.style.left = `${stop.offset}%`;
    handle.classList.toggle("active", index === cardPreviewStyleSelectedStopIndex);
    handle.classList.toggle("dragging", index === draggingGradientStopIndex);
    handle.style.setProperty("--stop-color", hexWithOpacity(stop.color, stop.opacity));
  });
  refreshGradientPositionIndicator(scope, stops);
}

function selectGradientStop(index, scope = getActiveGradientScope()) {
  const target = getGradientEditTarget(scope);
  if (!target?.stops?.[index]) return;
  cardPreviewStyleSelectedStopIndex = index;
  renderCardPreviewStyleParams();
}

function addGradientStopAtOffset(offset, scope = getActiveGradientScope()) {
  const target = getGradientEditTarget(scope);
  if (!target) return;
  const stops = normalizeGradientStops(target.stops, target);
  if (stops.length >= 8) {
    toast("最多 8 个色标");
    return;
  }
  const clamped = Math.round(Math.max(0, Math.min(100, offset)));
  const sample = interpolateGradientStopColor(stops, clamped);
  stops.push({ color: sample.color, opacity: sample.opacity, offset: clamped });
  target.stops = normalizeGradientStops(stops, target);
  cardPreviewStyleSelectedStopIndex = target.stops.reduce((best, stop, idx, arr) =>
    Math.abs(stop.offset - clamped) < Math.abs(arr[best].offset - clamped) ? idx : best, 0);
  syncGradientLegacyColors(target, scope);
  renderCardPreviewStyleParams();
  renderCardPreviewStyleModalPreview();
}

function removeGradientStopAt(index, scope = getActiveGradientScope()) {
  const target = getGradientEditTarget(scope);
  if (!target) return;
  const stops = normalizeGradientStops(target.stops, target);
  if (stops.length <= 2 || !Number.isFinite(index) || index < 0 || index >= stops.length) return;
  stops.splice(index, 1);
  target.stops = normalizeGradientStops(stops, target);
  cardPreviewStyleSelectedStopIndex = Math.min(cardPreviewStyleSelectedStopIndex, target.stops.length - 1);
  syncGradientLegacyColors(target, scope);
  renderCardPreviewStyleParams();
  renderCardPreviewStyleModalPreview();
}

function finishGradientStopDrag(event) {
  if (draggingGradientStopIndex === null || !cardPreviewStyleDraft) return;
  const scope = draggingGradientScope || getActiveGradientScope();
  const target = getGradientEditTarget(scope);
  const wrap = getGradientBarWrap(scope);
  const handle = wrap?.querySelector(".preview-gradient-stop-handle.dragging");
  if (handle?.hasPointerCapture?.(event.pointerId)) handle.releasePointerCapture(event.pointerId);
  handle?.classList.remove("dragging", "is-delete-intent");
  if (!target) {
    clearGradientStopDragFeedback(scope);
    draggingGradientStopIndex = null;
    draggingGradientScope = null;
    return;
  }
  const draggedIndex = draggingGradientStopIndex;
  const shouldDelete = draggingGradientDeleteIntent && target.stops.length > 2;
  clearGradientStopDragFeedback(scope);
  draggingGradientStopIndex = null;
  draggingGradientScope = null;
  if (shouldDelete) {
    removeGradientStopAt(draggedIndex, scope);
    return;
  }
  const finalOffset = target.stops[draggedIndex]?.offset;
  target.stops = normalizeGradientStops(target.stops, target);
  if (finalOffset !== undefined) {
    cardPreviewStyleSelectedStopIndex = target.stops.reduce((best, stop, idx, arr) =>
      Math.abs(stop.offset - finalOffset) < Math.abs(arr[best].offset - finalOffset) ? idx : best, 0);
  }
  syncGradientLegacyColors(target, scope);
  renderCardPreviewStyleParams();
  renderCardPreviewStyleModalPreview();
}

function handleGradientStopDrag(event) {
  if (draggingGradientStopIndex === null || !cardPreviewStyleDraft) return;
  const scope = draggingGradientScope || getActiveGradientScope();
  const target = getGradientEditTarget(scope);
  const wrap = getGradientBarWrap(scope);
  const bar = wrap?.querySelector(".preview-gradient-bar");
  if (!target || !bar) return;
  updateGradientStopDragFeedback(event, scope);
  if (draggingGradientDeleteIntent) {
    refreshGradientBarVisuals(scope);
    return;
  }
  const offset = gradientBarOffsetFromEvent(bar, event.clientX);
  const stop = target.stops[draggingGradientStopIndex];
  if (!stop) return;
  stop.offset = Math.round(offset);
  refreshGradientBarVisuals(scope);
  renderCardPreviewStyleModalPreview();
}

function renderGradientStopsEditor(target, scope) {
  const stops = normalizeGradientStops(target.stops, target);
  target.stops = stops;
  if (cardPreviewStyleSelectedStopIndex >= stops.length) cardPreviewStyleSelectedStopIndex = stops.length - 1;
  if (cardPreviewStyleSelectedStopIndex < 0) cardPreviewStyleSelectedStopIndex = 0;
  const selected = stops[cardPreviewStyleSelectedStopIndex] || stops[0];
  const barCss = buildGradientBarPreviewCss(stops, target);
  const handles = stops.map((stop, index) => {
    const active = index === cardPreviewStyleSelectedStopIndex ? " active" : "";
    return `<button type="button" class="preview-gradient-stop-handle${active}" data-stop-index="${index}" data-gradient-scope="${scope}" style="left:${stop.offset}%;--stop-color:${escapeHtml(hexWithOpacity(stop.color, stop.opacity))}" aria-label="色标 ${index + 1}，${stop.offset}%">
      <span class="preview-gradient-stop-handle-arrow"></span>
    </button>`;
  }).join("");
  return `<div class="preview-gradient-editor">
    <div class="preview-gradient-bar-wrap">
      <div class="preview-gradient-bar" style="background-image:${escapeHtml(barCss)}" data-gradient-action="bar-click" data-gradient-scope="${scope}" aria-label="渐变色带，点击添加色标"></div>
      <div class="preview-gradient-position-indicator" hidden aria-hidden="true">
        <span class="preview-gradient-position-line"></span>
        <span class="preview-gradient-position-tick"></span>
        <span class="preview-gradient-position-tag"></span>
      </div>
      <div class="preview-gradient-stops-track">${handles}</div>
      <div class="preview-gradient-delete-zone" hidden>拖到此处删除色标</div>
    </div>
    <div class="preview-gradient-stop-controls">
      <label class="preview-style-field preview-gradient-stop-color"><span>色标颜色</span><input type="color" data-gradient-stop-field="color" data-gradient-scope="${scope}" data-stop-index="${cardPreviewStyleSelectedStopIndex}" value="${escapeHtml(selected.color)}" /></label>
      ${renderStyleRangeField({ label: "色标不透明度", min: 0, max: 100, step: 1 }, selected.opacity, `data-gradient-stop-field="opacity" data-gradient-scope="${scope}" data-stop-index="${cardPreviewStyleSelectedStopIndex}" aria-label="色标不透明度"`)}
    </div>
    ${renderStyleRangeField({ label: "角度", min: 0, max: 360, step: 1 }, target.angle, `data-gradient-field="angle" data-gradient-scope="${scope}" aria-label="渐变角度"`)}
    <p class="preview-gradient-hint">点击色带添加色标，左右拖动调整位置，拖到下方删除（至少保留 2 个）</p>
  </div>`;
}

function renderFillStyleParams() {
  const fill = cardPreviewStyleDraft.fill;
  syncFillLegacyColors(fill);
  const isGradient = fill.mode === "gradient";
  const gradientFields = isGradient ? renderGradientStopsEditor(fill, "fill") : "";
  const solidFields = isGradient
    ? ""
    : `${renderStyleRangeField({ label: "不透明度", min: 0, max: 100, step: 1 }, fill.opacity, 'data-fill-field="opacity" aria-label="填充不透明度"')}`;
  return `<h4 class="preview-style-params-head">填充</h4><div class="preview-style-params-grid"><label class="preview-style-field"><span>类型</span><select data-fill-field="mode" class="preview-style-select"><option value="solid"${!isGradient ? " selected" : ""}>纯色</option><option value="gradient"${isGradient ? " selected" : ""}>线性渐变</option></select></label>${isGradient ? "" : `<label class="preview-style-field"><span>颜色</span><input type="color" data-fill-field="color" value="${escapeHtml(resolvePreviewFillColor(cardPreviewStyleDraft))}" /></label>`}${solidFields}${gradientFields}</div>`;
}

function renderCardPreviewStyleLayerList() {
  const list = $("#cardPreviewStyleLayerList");
  if (!list || !cardPreviewStyleDraft) return;
  const fillActive = cardPreviewStyleSelectedLayerId == null ? " active" : "";
  const fillEnabled = cardPreviewStyleDraft.fill.enabled !== false;
  const fillDisabled = fillEnabled ? "" : " is-disabled";
  let html = `<li class="preview-style-style-item is-fill${fillActive}${fillDisabled}" data-target="fill"><input type="checkbox"${fillEnabled ? " checked" : ""} aria-label="启用填充" /><span class="style-name">填充</span></li>`;
  html += cardPreviewStyleDraft.layers.map(layer => {
    const label = getPreviewStyleLayerLabel(layer, cardPreviewStyleDraft.layers);
    const active = layer.id === cardPreviewStyleSelectedLayerId ? " active" : "";
    const disabled = layer.enabled ? "" : " is-disabled";
    return `<li class="preview-style-style-item${active}${disabled}" data-layer-id="${escapeHtml(layer.id)}" draggable="true"><span class="style-drag" aria-hidden="true">⋮⋮</span><input type="checkbox"${layer.enabled ? " checked" : ""} aria-label="启用${escapeHtml(label)}" /><span class="style-name">${escapeHtml(label)}</span><button type="button" class="layer-duplicate" title="复制图层" aria-label="复制${escapeHtml(label)}">+</button></li>`;
  }).join("");
  list.innerHTML = html;
}

function renderStrokeStyleParams(layer) {
  syncStrokeLayerLegacyColors(layer);
  const isGradient = layer.colorMode === "gradient";
  const meta = PREVIEW_EFFECT_TYPES.stroke;
  const title = getPreviewStyleLayerLabel(layer, cardPreviewStyleDraft.layers);
  const modeField = `<label class="preview-style-field"><span>类型</span><select data-layer-field="colorMode" class="preview-style-select"><option value="solid"${!isGradient ? " selected" : ""}>纯色</option><option value="gradient"${isGradient ? " selected" : ""}>线性渐变</option></select></label>`;
  const colorField = isGradient
    ? ""
    : `<label class="preview-style-field"><span>颜色</span><input type="color" data-layer-field="color" value="${escapeHtml(layer.color)}" /></label>`;
  const opacityField = isGradient
    ? ""
    : renderStyleRangeField(meta.fields.find(field => field.key === "opacity"), layer.opacity, 'data-layer-field="opacity" aria-label="轮廓不透明度"');
  const sizeFields = meta.fields.filter(field => field.key !== "color" && field.key !== "opacity").map(field => {
    const value = layer[field.key];
    if (field.type === "select") {
      return renderStyleSelectField(field, value, `data-layer-field="${field.key}" aria-label="${escapeHtml(field.label)}"`);
    }
    return renderStyleRangeField(field, value, `data-layer-field="${field.key}" aria-label="${escapeHtml(field.label)}"`);
  }).join("");
  const gradientFields = isGradient ? renderGradientStopsEditor(layer, "layer") : "";
  return `<h4 class="preview-style-params-head">${escapeHtml(title)}</h4><div class="preview-style-params-grid">${modeField}${colorField}${opacityField}${sizeFields}${gradientFields}</div>`;
}

function renderCardPreviewStyleParams() {
  const panel = $("#cardPreviewStyleParams");
  if (!panel || !cardPreviewStyleDraft) return;
  if (cardPreviewStyleSelectedLayerId == null) {
    panel.innerHTML = renderFillStyleParams();
    syncAllStyleRanges(panel);
    return;
  }
  const layer = cardPreviewStyleDraft.layers.find(item => item.id === cardPreviewStyleSelectedLayerId);
  if (!layer) {
    cardPreviewStyleSelectedLayerId = null;
    panel.innerHTML = renderFillStyleParams();
    syncAllStyleRanges(panel);
    return;
  }
  const meta = PREVIEW_EFFECT_TYPES[layer.type];
  if (layer.type === "stroke") {
    panel.innerHTML = renderStrokeStyleParams(layer);
    syncAllStyleRanges(panel);
    return;
  }
  const title = getPreviewStyleLayerLabel(layer, cardPreviewStyleDraft.layers);
  panel.innerHTML = `<h4 class="preview-style-params-head">${escapeHtml(title)}</h4><div class="preview-style-params-grid">${meta.fields.map(field => {
    const value = layer[field.key];
    if (field.type === "color") {
      return `<label class="preview-style-field"><span>${escapeHtml(field.label)}</span><input type="color" data-layer-field="${field.key}" value="${escapeHtml(value)}" /></label>`;
    }
    if (field.type === "select") {
      return renderStyleSelectField(field, value, `data-layer-field="${field.key}" aria-label="${escapeHtml(field.label)}"`);
    }
    return renderStyleRangeField(field, value, `data-layer-field="${field.key}" aria-label="${escapeHtml(field.label)}"`);
  }).join("")}</div>`;
  syncAllStyleRanges(panel);
}

function resolveManagePreviewStyle() {
  const presetId = cardPreviewStyleManageHoverPresetId !== null
    ? cardPreviewStyleManageHoverPresetId
    : cardPreviewStyleManagePresetId;
  if (!presetId) return null;
  const preset = findCardPreviewStylePreset(presetId);
  return preset ? preset.style : null;
}

function resolveManagePresetStyle(presetId) {
  if (!presetId) return null;
  const preset = findCardPreviewStylePreset(presetId);
  return preset ? preset.style : null;
}

function clearManagePresetHover() {
  if (cardPreviewStyleManageHoverPresetId === null) return;
  cardPreviewStyleManageHoverPresetId = null;
  renderCardPreviewStyleModalPreview();
}

function applyManagePresetIconStyles() {
  const list = $("#cardPreviewStylePresetList");
  if (!list) return;
  const font = getCardPreviewStyleModalFont();
  list.querySelectorAll(".preview-style-preset-card").forEach(card => {
    const glyph = card.querySelector(".preview-style-preset-glyph");
    if (!glyph) return;
    glyph.textContent = MANAGE_PRESET_PREVIEW_CHAR;
    if (font) glyph.style.fontFamily = cssName(font);
    else glyph.style.fontFamily = "";
    applyCardPreviewStyleToElement(glyph, resolveManagePresetStyle(card.dataset.presetId || ""), { themeDefault: true });
  });
  if (!font) return;
  ensureFontLoaded(font, MANAGE_PRESET_PREVIEW_CHAR).then(() => {
    if (cardPreviewStyleModalTab !== "manage" || !list.isConnected) return;
    list.querySelectorAll(".preview-style-preset-glyph").forEach(glyph => {
      glyph.style.fontFamily = cssName(font);
    });
  });
}

function renderManagePresetIconCard(presetId, name, { selected = false, current = false } = {}) {
  const active = (cardPreviewStyleManagePresetId || "") === (presetId || "");
  return `<button type="button" class="preview-style-preset-card${active ? " active" : ""}${current ? " is-current" : ""}" data-preset-id="${escapeHtml(presetId || "")}" aria-label="${escapeHtml(name)}">
    <span class="preview-style-preset-glyph" aria-hidden="true">${MANAGE_PRESET_PREVIEW_CHAR}</span>
    <span class="preview-style-preset-label">${escapeHtml(name)}</span>
    ${current ? '<span class="preview-style-preset-badge">使用中</span>' : ""}
  </button>`;
}

function syncCardPreviewStyleFooter() {
  const isEdit = cardPreviewStyleModalTab === "edit";
  const saveDraftBtn = $("#cardPreviewStyleSaveDraft");
  const confirmBtn = $("#cardPreviewStyleConfirm");
  if (saveDraftBtn) {
    saveDraftBtn.hidden = !isEdit;
    saveDraftBtn.disabled = !cardPreviewStyleDraft || !hasActiveCardPreviewStyle(cardPreviewStyleDraft);
  }
  if (confirmBtn) confirmBtn.textContent = isEdit ? "确定" : "应用";
}

function setCardPreviewStyleModalTab(tab) {
  cardPreviewStyleModalTab = tab === "manage" ? "manage" : "edit";
  cardPreviewStyleManageHoverPresetId = null;
  const isEdit = cardPreviewStyleModalTab === "edit";
  $("#cardPreviewStyleEditTab")?.classList.toggle("active", isEdit);
  $("#cardPreviewStyleManageTab")?.classList.toggle("active", !isEdit);
  $("#cardPreviewStyleEditTab")?.setAttribute("aria-selected", String(isEdit));
  $("#cardPreviewStyleManageTab")?.setAttribute("aria-selected", String(!isEdit));
  const editPanel = $("#cardPreviewStyleEditPanel");
  const managePanel = $("#cardPreviewStyleManagePanel");
  if (editPanel) editPanel.hidden = !isEdit;
  if (managePanel) managePanel.hidden = isEdit;
  hideCardPreviewStylePresetEditor();
  if (isEdit) {
    renderCardPreviewStyleLayerList();
    renderCardPreviewStyleParams();
  } else {
    renderCardPreviewStyleManagePanel();
  }
  syncCardPreviewStyleFooter();
  renderCardPreviewStyleModalPreview();
}

function renderCardPreviewStyleManagePanel() {
  const list = $("#cardPreviewStylePresetList");
  if (!list) return;
  let html = renderManagePresetIconCard("", "默认", { current: !state.activeCardPreviewStylePresetId });
  html += state.cardPreviewStylePresets.map(preset =>
    renderManagePresetIconCard(preset.id, preset.name, { current: preset.id === state.activeCardPreviewStylePresetId })
  ).join("");
  list.innerHTML = html;
  applyManagePresetIconStyles();
  const hasPreset = Boolean(cardPreviewStyleManagePresetId);
  const renameBtn = $("#cardPreviewStyleManageRename");
  const deleteBtn = $("#cardPreviewStyleManageDelete");
  if (renameBtn) renameBtn.disabled = !hasPreset;
  if (deleteBtn) deleteBtn.disabled = !hasPreset;
}

function applyManageSelectedPreset() {
  applyCardPreviewStylePresetById(cardPreviewStyleManagePresetId || null);
}

function applyCardPreviewStylePresetById(presetId, { showToast = true } = {}) {
  if (!presetId) {
    state.cardPreviewStyle = null;
    state.activeCardPreviewStylePresetId = null;
    applyCardPreviewStyleToAllCards();
    persistUiSettings();
    renderCardPreviewStyleQuickMenu();
    if (cardPreviewStyleModalTab === "manage") renderCardPreviewStyleManagePanel();
    if (showToast) toast("已恢复默认预览");
    return true;
  }
  const preset = findCardPreviewStylePreset(presetId);
  if (!preset) {
    if (showToast) toast("方案不存在");
    return false;
  }
  state.cardPreviewStyle = hasActiveCardPreviewStyle(preset.style)
    ? cloneCardPreviewStyle(preset.style)
    : null;
  state.activeCardPreviewStylePresetId = preset.id;
  applyCardPreviewStyleToAllCards();
  persistUiSettings();
  renderCardPreviewStyleQuickMenu();
  if (cardPreviewStyleModalTab === "manage") {
    cardPreviewStyleManagePresetId = preset.id;
    renderCardPreviewStyleManagePanel();
  }
  if (showToast) toast(`已应用「${preset.name}」`);
  return true;
}

function resolveQuickPresetStyle(presetId) {
  if (!presetId) return null;
  const preset = findCardPreviewStylePreset(presetId);
  return preset ? preset.style : null;
}

function getQuickMenuPreviewFont() {
  return state.selected || state.previewed || state.filtered[0] || state.fonts[0] || null;
}

function getQuickMenuPreviewChar() {
  const text = cardPreviewText().trim();
  return [...text][0] || MANAGE_PRESET_PREVIEW_CHAR;
}

function renderQuickPresetMenuItem(presetId, { active = false, ariaLabel = "默认" } = {}) {
  return `<button type="button" class="card-preview-style-preset-item card-preview-style-preset-preview${active ? " active is-current" : ""}" role="menuitem" data-preset-id="${escapeHtml(presetId || "")}" aria-label="${escapeHtml(ariaLabel)}">
    <span class="preview-style-preset-glyph" aria-hidden="true">${escapeHtml(getQuickMenuPreviewChar())}</span>
  </button>`;
}

function applyQuickPresetMenuStyles() {
  const menu = $("#cardPreviewStylePresetMenu");
  if (!menu) return;
  const font = getQuickMenuPreviewFont();
  const previewChar = getQuickMenuPreviewChar();
  menu.querySelectorAll(".card-preview-style-preset-preview").forEach(item => {
    const glyph = item.querySelector(".preview-style-preset-glyph");
    if (!glyph) return;
    glyph.textContent = previewChar;
    if (font) {
      registerFont(font);
      glyph.style.fontFamily = cssName(font);
    } else {
      glyph.style.fontFamily = "";
    }
    applyCardPreviewStyleToElement(glyph, resolveQuickPresetStyle(item.dataset.presetId || ""), { themeDefault: true });
  });
  if (!font) return;
  ensureFontLoaded(font, previewChar).then(() => {
    if (!menu.isConnected) return;
    menu.querySelectorAll(".card-preview-style-preset-preview .preview-style-preset-glyph").forEach(glyph => {
      glyph.style.fontFamily = cssName(font);
    });
  });
}

function syncCardPreviewStyleButtonLabel() {
  const button = $("#cardPreviewStyleButton");
  if (!button) return;
  const preset = state.activeCardPreviewStylePresetId
    ? findCardPreviewStylePreset(state.activeCardPreviewStylePresetId)
    : null;
  const label = preset ? `卡片预览样式：${preset.name}` : "卡片预览样式";
  button.title = label;
  button.setAttribute("aria-label", label);
}

function renderCardPreviewStyleQuickMenu() {
  const menu = $("#cardPreviewStylePresetMenu");
  const toggle = $("#cardPreviewStyleMenuToggle");
  if (!menu) return;
  const activeId = state.activeCardPreviewStylePresetId || "";
  let html = `<div class="card-preview-style-preset-grid" role="presentation">`;
  html += renderQuickPresetMenuItem("", { active: !activeId, ariaLabel: "默认样式" });
  html += state.cardPreviewStylePresets.map(preset =>
    renderQuickPresetMenuItem(preset.id, { active: preset.id === activeId, ariaLabel: preset.name })
  ).join("");
  html += `</div><div class="card-preview-style-preset-divider" aria-hidden="true"></div>
    <button type="button" class="card-preview-style-preset-item card-preview-style-preset-action" role="menuitem" data-preset-action="manage">管理方案…</button>`;
  menu.innerHTML = html;
  applyQuickPresetMenuStyles();
  syncCardPreviewStyleButtonLabel();
  if (toggle) toggle.disabled = false;
}

function setCardPreviewStyleQuickMenuOpen(open) {
  const wrap = $("#cardPreviewStyleMenuWrap");
  const toggle = $("#cardPreviewStyleMenuToggle");
  if (!wrap || !toggle) return;
  wrap.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
}

function wireCardPreviewStyleQuickMenu() {
  const wrap = $("#cardPreviewStyleMenuWrap");
  const menu = $("#cardPreviewStylePresetMenu");
  const toggle = $("#cardPreviewStyleMenuToggle");
  if (!wrap || !menu || !toggle) return;
  renderCardPreviewStyleQuickMenu();
  wrap.addEventListener("mouseenter", () => applyQuickPresetMenuStyles());
  toggle.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    const opening = !wrap.classList.contains("is-open");
    setCardPreviewStyleQuickMenuOpen(opening);
    if (opening) applyQuickPresetMenuStyles();
  });
  menu.addEventListener("click", event => {
    const actionBtn = event.target.closest("[data-preset-action]");
    if (actionBtn?.dataset.presetAction === "manage") {
      setCardPreviewStyleQuickMenuOpen(false);
      openCardPreviewStyleModal();
      setCardPreviewStyleModalTab("manage");
      return;
    }
    const item = event.target.closest("[data-preset-id]");
    if (!item) return;
    applyCardPreviewStylePresetById(item.dataset.presetId || null);
    setCardPreviewStyleQuickMenuOpen(false);
  });
  document.addEventListener("click", event => {
    if (!wrap.contains(event.target)) setCardPreviewStyleQuickMenuOpen(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setCardPreviewStyleQuickMenuOpen(false);
  });
}

function loadManagePresetToEdit() {
  loadCardPreviewStylePresetDraft(cardPreviewStyleManagePresetId || null);
  setCardPreviewStyleModalTab("edit");
}

function hideCardPreviewStylePresetEditor() {
  cardPreviewStylePresetEditorMode = null;
  const wrap = $("#cardPreviewStylePresetRenameWrap");
  const input = $("#cardPreviewStylePresetRenameInput");
  if (wrap) wrap.hidden = true;
  if (input) input.value = "";
}

function showCardPreviewStylePresetEditor(mode, initialValue = "") {
  cardPreviewStylePresetEditorMode = mode;
  const wrap = $("#cardPreviewStylePresetRenameWrap");
  const input = $("#cardPreviewStylePresetRenameInput");
  if (!wrap || !input) return;
  wrap.hidden = false;
  input.value = initialValue;
  input.placeholder = mode === "rename" ? "输入新名称" : "输入方案名称";
  input.focus();
  input.select();
}

function applyCardPreviewStylePresetEditor() {
  const input = $("#cardPreviewStylePresetRenameInput");
  const name = input?.value.trim();
  if (cardPreviewStylePresetEditorMode === "rename") {
    const presetId = cardPreviewStyleModalTab === "manage"
      ? cardPreviewStyleManagePresetId
      : cardPreviewStyleDraftPresetId;
    if (!name || !presetId) {
      toast("请输入方案名称");
      return;
    }
    renameCardPreviewStylePreset(presetId, name);
    persistUiSettings();
    hideCardPreviewStylePresetEditor();
    if (cardPreviewStyleModalTab === "manage") renderCardPreviewStyleManagePanel();
    renderCardPreviewStyleQuickMenu();
    toast("已重命名方案");
    return;
  }
  if (!name || !cardPreviewStyleDraft || !hasActiveCardPreviewStyle(cardPreviewStyleDraft)) {
    toast("请输入方案名称");
    return;
  }
  const preset = createCardPreviewStylePreset(name, cardPreviewStyleDraft);
  cardPreviewStyleDraftPresetId = preset.id;
  cardPreviewStyleManagePresetId = preset.id;
  persistUiSettings();
  hideCardPreviewStylePresetEditor();
  if (cardPreviewStyleModalTab === "manage") renderCardPreviewStyleManagePanel();
  renderCardPreviewStyleQuickMenu();
  toast(`已保存方案「${preset.name}」`);
}

function saveCardPreviewStylePresetDraft() {
  if (!cardPreviewStyleDraft || !hasActiveCardPreviewStyle(cardPreviewStyleDraft)) {
    toast("当前没有可保存的样式");
    return;
  }
  if (cardPreviewStyleDraftPresetId) {
    const preset = updateCardPreviewStylePreset(cardPreviewStyleDraftPresetId, cardPreviewStyleDraft);
    if (!preset) {
      toast("方案不存在");
      return;
    }
    cardPreviewStyleManagePresetId = preset.id;
    persistUiSettings();
    renderCardPreviewStyleQuickMenu();
    toast(`已更新「${preset.name}」`);
    return;
  }
  showCardPreviewStylePresetEditor("save-as", uniqueCardPreviewStylePresetName("未命名方案"));
}

function loadCardPreviewStylePresetDraft(presetId) {
  cardPreviewStyleDraftPresetId = presetId || null;
  cardPreviewStyleDraft = presetId
    ? cloneCardPreviewStyle(findCardPreviewStylePreset(presetId)?.style || CARD_PREVIEW_STYLE_DEFAULTS)
    : normalizeCardPreviewStyle(null);
  cardPreviewStyleSelectedLayerId = null;
  cardPreviewStyleDraft.layers.forEach(layer => {
    if (layer.id && /^preview-layer-\d+$/.test(layer.id)) {
      const suffix = Number(layer.id.split("-").pop());
      if (suffix > cardPreviewStyleLayerCounter) cardPreviewStyleLayerCounter = suffix;
    }
  });
  hideCardPreviewStylePresetEditor();
  renderCardPreviewStyleModal();
}

function exportCardPreviewStylePresets() {
  const data = {
    type: "webfonts-card-preview-styles",
    version: 1,
    exportedAt: new Date().toISOString(),
    presets: state.cardPreviewStylePresets
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `card-preview-styles-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`已导出 ${state.cardPreviewStylePresets.length} 个方案`);
}

async function importCardPreviewStylePresets(file) {
  try {
    const data = JSON.parse(await file.text());
    const items = Array.isArray(data?.presets) ? data.presets : Array.isArray(data) ? data : null;
    if (!items?.length) throw new Error("JSON 中没有 presets 数组");
    let imported = 0;
    items.forEach(item => {
      if (!item || typeof item !== "object" || typeof item.name !== "string" || !item.name.trim()) return;
      if (!hasActiveCardPreviewStyle(normalizeCardPreviewStyle(item.style))) return;
      createCardPreviewStylePreset(item.name, item.style);
      imported += 1;
    });
    if (!imported) throw new Error("没有有效的样式方案");
    persistUiSettings();
    renderCardPreviewStyleManagePanel();
    renderCardPreviewStyleQuickMenu();
    toast(`已导入 ${imported} 个方案`);
  } catch (error) {
    toast(error.message || "导入失败");
  }
}

function renderCardPreviewStyleModal() {
  if (!cardPreviewStyleDraft) return;
  renderCardPreviewStyleFontOptions();
  if (cardPreviewStyleModalTab === "manage") {
    renderCardPreviewStyleManagePanel();
  } else {
    renderCardPreviewStyleLayerList();
    renderCardPreviewStyleParams();
  }
  syncCardPreviewStyleFooter();
  renderCardPreviewStyleModalPreview();
}

function openCardPreviewStyleModal() {
  if (!state.fonts.length) return toast("请先加载字体");
  cardPreviewStyleDraftPresetId = state.activeCardPreviewStylePresetId;
  if (cardPreviewStyleDraftPresetId && findCardPreviewStylePreset(cardPreviewStyleDraftPresetId)) {
    cardPreviewStyleDraft = normalizeCardPreviewStyle(findCardPreviewStylePreset(cardPreviewStyleDraftPresetId).style);
  } else {
    cardPreviewStyleDraftPresetId = null;
    cardPreviewStyleDraft = normalizeCardPreviewStyle(state.cardPreviewStyle);
  }
  cardPreviewStyleSelectedLayerId = null;
  cardPreviewStyleModalTab = "edit";
  cardPreviewStyleManagePresetId = state.activeCardPreviewStylePresetId || "";
  hideCardPreviewStylePresetEditor();
  cardPreviewStylePreviewFontId = state.selected?.id || state.previewed?.id || state.filtered[0]?.id || state.fonts[0]?.id || null;
  cardPreviewStyleDraft.layers.forEach(layer => {
    if (layer.id && /^preview-layer-\d+$/.test(layer.id)) {
      const suffix = Number(layer.id.split("-").pop());
      if (suffix > cardPreviewStyleLayerCounter) cardPreviewStyleLayerCounter = suffix;
    }
  });
  renderCardPreviewStyleModal();
  $("#cardPreviewStyleEditTab")?.classList.add("active");
  $("#cardPreviewStyleManageTab")?.classList.remove("active");
  $("#cardPreviewStyleEditTab")?.setAttribute("aria-selected", "true");
  $("#cardPreviewStyleManageTab")?.setAttribute("aria-selected", "false");
  $("#cardPreviewStyleEditPanel")?.removeAttribute("hidden");
  $("#cardPreviewStyleManagePanel")?.setAttribute("hidden", "");
  $("#cardPreviewStyleModal").hidden = false;
}

function closeCardPreviewStyleModal(apply = false) {
  if (apply) {
    if (cardPreviewStyleModalTab === "manage") {
      applyManageSelectedPreset();
    } else if (cardPreviewStyleDraft) {
      state.cardPreviewStyle = hasActiveCardPreviewStyle(cardPreviewStyleDraft)
        ? cloneCardPreviewStyle(cardPreviewStyleDraft)
        : null;
      const preset = cardPreviewStyleDraftPresetId ? findCardPreviewStylePreset(cardPreviewStyleDraftPresetId) : null;
      state.activeCardPreviewStylePresetId = preset && cardPreviewStylesEqual(cardPreviewStyleDraft, preset.style)
        ? cardPreviewStyleDraftPresetId
        : null;
      applyCardPreviewStyleToAllCards();
      persistUiSettings();
      if (state.activeCardPreviewStylePresetId) {
        toast(`已应用「${findCardPreviewStylePreset(state.activeCardPreviewStylePresetId)?.name || "方案"}」`);
      } else {
        toast(state.cardPreviewStyle ? "已应用卡片预览样式" : "已恢复默认预览");
      }
    }
  }
  cardPreviewStyleDraft = null;
  cardPreviewStyleDraftPresetId = null;
  cardPreviewStyleSelectedLayerId = null;
  cardPreviewStyleModalTab = "edit";
  cardPreviewStyleManagePresetId = "";
  cardPreviewStyleManageHoverPresetId = null;
  draggingPreviewStyleLayerId = null;
  hideCardPreviewStylePresetEditor();
  $("#cardPreviewStyleModal").hidden = true;
  if (apply) renderCardPreviewStyleQuickMenu();
}

function handlePreviewStyleWheel(event) {
  const modal = $("#cardPreviewStyleModal");
  if (modal?.hidden) return;
  const target = event.target;
  const range = target instanceof HTMLInputElement && target.classList.contains("preview-style-range")
    ? target
    : target.closest?.(".preview-style-range-wrap")?.querySelector("input.preview-style-range");
  if (!range || !modal.contains(range)) return;
  event.preventDefault();
  event.stopPropagation();
  adjustRangeInput(range, event.deltaY < 0 ? 1 : -1);
}

function wireCardPreviewStyleModal() {
  const modal = $("#cardPreviewStyleModal");
  if (!modal) return;
  modal.querySelector(".preview-style-modal")?.addEventListener("wheel", handlePreviewStyleWheel, { passive: false });
  $("#cardPreviewStyleButton")?.addEventListener("click", openCardPreviewStyleModal);
  $("#cardPreviewStyleClose")?.addEventListener("click", () => closeCardPreviewStyleModal(false));
  $("#cardPreviewStyleCancel")?.addEventListener("click", () => closeCardPreviewStyleModal(false));
  $("#cardPreviewStyleConfirm")?.addEventListener("click", () => closeCardPreviewStyleModal(true));
  modal.addEventListener("click", event => {
    if (event.target === modal) closeCardPreviewStyleModal(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) closeCardPreviewStyleModal(false);
  });
  $("#cardPreviewStyleFont")?.addEventListener("change", event => {
    cardPreviewStylePreviewFontId = Number(event.target.value);
    renderCardPreviewStyleModalPreview();
    if (cardPreviewStyleModalTab === "manage") applyManagePresetIconStyles();
  });
  $("#cardPreviewStyleEditTab")?.addEventListener("click", () => setCardPreviewStyleModalTab("edit"));
  $("#cardPreviewStyleManageTab")?.addEventListener("click", () => setCardPreviewStyleModalTab("manage"));
  $("#cardPreviewStyleSaveDraft")?.addEventListener("click", saveCardPreviewStylePresetDraft);
  const presetList = $("#cardPreviewStylePresetList");
  presetList?.addEventListener("click", event => {
    const item = event.target.closest(".preview-style-preset-card");
    if (!item) return;
    cardPreviewStyleManagePresetId = item.dataset.presetId || "";
    cardPreviewStyleManageHoverPresetId = null;
    renderCardPreviewStyleManagePanel();
    renderCardPreviewStyleModalPreview();
  });
  presetList?.addEventListener("mouseover", event => {
    const item = event.target.closest(".preview-style-preset-card");
    if (!item || !presetList.contains(item)) return;
    const presetId = item.dataset.presetId || "";
    if (cardPreviewStyleManageHoverPresetId === presetId) return;
    cardPreviewStyleManageHoverPresetId = presetId;
    renderCardPreviewStyleModalPreview();
  });
  presetList?.addEventListener("mouseleave", event => {
    if (event.relatedTarget && presetList.contains(event.relatedTarget)) return;
    clearManagePresetHover();
  });
  $("#cardPreviewStyleManageEdit")?.addEventListener("click", loadManagePresetToEdit);
  $("#cardPreviewStyleManageRename")?.addEventListener("click", () => {
    if (!cardPreviewStyleManagePresetId) return;
    showCardPreviewStylePresetEditor("rename", findCardPreviewStylePreset(cardPreviewStyleManagePresetId)?.name || "");
  });
  $("#cardPreviewStyleManageDelete")?.addEventListener("click", () => {
    if (!cardPreviewStyleManagePresetId) return;
    const preset = findCardPreviewStylePreset(cardPreviewStyleManagePresetId);
    if (!preset) return;
    if (!window.confirm(`删除方案「${preset.name}」？`)) return;
    deleteCardPreviewStylePreset(cardPreviewStyleManagePresetId);
    cardPreviewStyleManagePresetId = "";
    persistUiSettings();
    renderCardPreviewStyleManagePanel();
    renderCardPreviewStyleQuickMenu();
    renderCardPreviewStyleModalPreview();
    toast("已删除方案");
  });
  $("#cardPreviewStylePresetRenameConfirm")?.addEventListener("click", applyCardPreviewStylePresetEditor);
  $("#cardPreviewStylePresetRenameCancel")?.addEventListener("click", hideCardPreviewStylePresetEditor);
  $("#cardPreviewStylePresetRenameInput")?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyCardPreviewStylePresetEditor();
    } else if (event.key === "Escape") {
      event.preventDefault();
      hideCardPreviewStylePresetEditor();
    }
  });
  $("#cardPreviewStylePresetExport")?.addEventListener("click", exportCardPreviewStylePresets);
  $("#cardPreviewStylePresetImport")?.addEventListener("click", () => $("#cardPreviewStylePresetFile")?.click());
  $("#cardPreviewStylePresetFile")?.addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (file) importCardPreviewStylePresets(file);
    event.target.value = "";
  });
  const layerList = $("#cardPreviewStyleLayerList");
  layerList?.addEventListener("dragstart", event => {
    const row = event.target.closest("[data-layer-id]");
    if (!row) return;
    draggingPreviewStyleLayerId = row.dataset.layerId;
    row.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggingPreviewStyleLayerId);
  });
  layerList?.addEventListener("dragover", event => {
    const row = event.target.closest("[data-layer-id]");
    if (!row || !draggingPreviewStyleLayerId || row.dataset.layerId === draggingPreviewStyleLayerId) return;
    event.preventDefault();
    const rect = row.getBoundingClientRect();
    row.dataset.dropPos = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    layerList.querySelectorAll(".drop-before, .drop-after").forEach(item => item.classList.remove("drop-before", "drop-after"));
    row.classList.add(row.dataset.dropPos === "before" ? "drop-before" : "drop-after");
  });
  layerList?.addEventListener("dragleave", event => {
    const row = event.target.closest("[data-layer-id]");
    row?.classList.remove("drop-before", "drop-after");
  });
  layerList?.addEventListener("drop", event => {
    const row = event.target.closest("[data-layer-id]");
    if (!row || !draggingPreviewStyleLayerId) return;
    event.preventDefault();
    movePreviewStyleLayer(draggingPreviewStyleLayerId, row.dataset.layerId, row.dataset.dropPos !== "after");
    draggingPreviewStyleLayerId = null;
    layerList.querySelectorAll(".dragging, .drop-before, .drop-after").forEach(item => item.classList.remove("dragging", "drop-before", "drop-after"));
    renderCardPreviewStyleLayerList();
    renderCardPreviewStyleModalPreview();
  });
  layerList?.addEventListener("dragend", () => {
    draggingPreviewStyleLayerId = null;
    layerList.querySelectorAll(".dragging, .drop-before, .drop-after").forEach(item => item.classList.remove("dragging", "drop-before", "drop-after"));
  });
  layerList?.addEventListener("click", event => {
    if (!cardPreviewStyleDraft) return;
    if (event.target.closest(".layer-duplicate")) {
      event.stopPropagation();
      const layerId = event.target.closest("[data-layer-id]")?.dataset.layerId;
      if (!layerId) return;
      const newId = duplicatePreviewStyleLayer(layerId);
      if (newId) cardPreviewStyleSelectedLayerId = newId;
      renderCardPreviewStyleModal();
      return;
    }
    if (event.target.closest('[data-target="fill"]')) {
      cardPreviewStyleSelectedLayerId = null;
      cardPreviewStyleSelectedStopIndex = 0;
      renderCardPreviewStyleLayerList();
      renderCardPreviewStyleParams();
      return;
    }
    const item = event.target.closest("[data-layer-id]");
    if (!item || event.target.matches('input[type="checkbox"]') || event.target.closest(".layer-duplicate")) return;
    cardPreviewStyleSelectedLayerId = item.dataset.layerId;
    cardPreviewStyleSelectedStopIndex = 0;
    renderCardPreviewStyleLayerList();
    renderCardPreviewStyleParams();
  });
  layerList?.addEventListener("change", event => {
    if (!cardPreviewStyleDraft || !event.target.matches('input[type="checkbox"]')) return;
    const fillItem = event.target.closest('[data-target="fill"]');
    if (fillItem) {
      cardPreviewStyleDraft.fill.enabled = event.target.checked;
      renderCardPreviewStyleLayerList();
      renderCardPreviewStyleModalPreview();
      return;
    }
    const item = event.target.closest("[data-layer-id]");
    const layer = cardPreviewStyleDraft.layers.find(entry => entry.id === item?.dataset.layerId);
    if (!layer) return;
    layer.enabled = event.target.checked;
    renderCardPreviewStyleLayerList();
    renderCardPreviewStyleModalPreview();
  });
  $("#cardPreviewStyleParams")?.addEventListener("change", event => {
    if (!cardPreviewStyleDraft) return;
    const fillField = event.target.dataset.fillField;
    if (fillField === "mode") {
      cardPreviewStyleDraft.fill.mode = event.target.value === "gradient" ? "gradient" : "solid";
      if (cardPreviewStyleDraft.fill.mode === "gradient") cardPreviewStyleDraft.fill.enabled = true;
      syncFillLegacyColors(cardPreviewStyleDraft.fill);
      if (cardPreviewStyleDraft.fill.mode === "gradient") cardPreviewStyleSelectedStopIndex = 0;
      renderCardPreviewStyleParams();
      renderCardPreviewStyleModalPreview();
      return;
    }
    const layer = cardPreviewStyleDraft.layers.find(entry => entry.id === cardPreviewStyleSelectedLayerId);
    const field = event.target.dataset.layerField;
    if (layer && field === "colorMode" && event.target.tagName === "SELECT") {
      layer.colorMode = event.target.value === "gradient" ? "gradient" : "solid";
      syncStrokeLayerLegacyColors(layer);
      if (layer.colorMode === "gradient") cardPreviewStyleSelectedStopIndex = 0;
      renderCardPreviewStyleParams();
      renderCardPreviewStyleModalPreview();
      return;
    }
    if (layer && field && event.target.tagName === "SELECT") {
      layer[field] = event.target.value;
      renderCardPreviewStyleModalPreview();
    }
  });
  $("#cardPreviewStyleParams")?.addEventListener("click", event => {
    if (!cardPreviewStyleDraft) return;
    const handle = event.target.closest(".preview-gradient-stop-handle");
    if (handle) {
      selectGradientStop(Number(handle.dataset.stopIndex), handle.dataset.gradientScope);
      return;
    }
    const bar = event.target.closest(".preview-gradient-bar[data-gradient-action='bar-click']");
    if (bar) {
      addGradientStopAtOffset(gradientBarOffsetFromEvent(bar, event.clientX), bar.dataset.gradientScope);
    }
  });
  $("#cardPreviewStyleParams")?.addEventListener("pointerdown", event => {
    const handle = event.target.closest(".preview-gradient-stop-handle");
    if (!handle || !cardPreviewStyleDraft) return;
    event.preventDefault();
    draggingGradientStopIndex = Number(handle.dataset.stopIndex);
    draggingGradientScope = handle.dataset.gradientScope || getActiveGradientScope();
    draggingGradientDeleteIntent = false;
    cardPreviewStyleSelectedStopIndex = draggingGradientStopIndex;
    handle.classList.add("dragging");
    handle.setPointerCapture(event.pointerId);
    const wrap = getGradientBarWrap(draggingGradientScope);
    wrap?.classList.add("is-stop-dragging");
    const deleteZone = wrap?.querySelector(".preview-gradient-delete-zone");
    const target = getGradientEditTarget(draggingGradientScope);
    if (deleteZone) deleteZone.hidden = !(target && target.stops.length > 2);
    refreshGradientBarVisuals(draggingGradientScope);
  });
  $("#cardPreviewStyleParams")?.addEventListener("pointermove", event => {
    if (draggingGradientStopIndex === null) return;
    handleGradientStopDrag(event);
  });
  $("#cardPreviewStyleParams")?.addEventListener("pointerup", event => {
    if (draggingGradientStopIndex === null) return;
    finishGradientStopDrag(event);
  });
  $("#cardPreviewStyleParams")?.addEventListener("pointercancel", event => {
    if (draggingGradientStopIndex === null) return;
    finishGradientStopDrag(event);
  });
  $("#cardPreviewStyleParams")?.addEventListener("input", event => {
    if (!cardPreviewStyleDraft) return;
    const gradientScope = event.target.dataset.gradientScope;
    const gradientStopField = event.target.dataset.gradientStopField;
    const gradientField = event.target.dataset.gradientField;
    const stopIndex = Number(event.target.dataset.stopIndex);
    if (gradientStopField && gradientScope && Number.isFinite(stopIndex)) {
      const target = getGradientEditTarget(gradientScope);
      if (!target) return;
      const stops = normalizeGradientStops(target.stops, target);
      const stop = stops[stopIndex];
      if (!stop) return;
      stop[gradientStopField] = gradientStopField === "color" ? event.target.value : Number(event.target.value);
      target.stops = normalizeGradientStops(stops, target);
      syncGradientLegacyColors(target, gradientScope);
      if (gradientStopField !== "color") syncStyleRangeProgress(event.target);
      refreshGradientBarVisuals(gradientScope);
      renderCardPreviewStyleModalPreview();
      return;
    }
    if (gradientField === "angle" && gradientScope) {
      const target = getGradientEditTarget(gradientScope);
      if (!target) return;
      target.angle = Number(event.target.value);
      syncStyleRangeProgress(event.target);
      renderCardPreviewStyleModalPreview();
      return;
    }
    const fillField = event.target.dataset.fillField;
    if (fillField) {
      if (fillField === "mode") return;
      cardPreviewStyleDraft.fill[fillField] = fillField === "color" || fillField === "color2"
        ? event.target.value
        : Number(event.target.value);
      syncFillLegacyColors(cardPreviewStyleDraft.fill);
      if (fillField !== "color" && fillField !== "color2") syncStyleRangeProgress(event.target);
      renderCardPreviewStyleModalPreview();
      return;
    }
    const layer = cardPreviewStyleDraft.layers.find(entry => entry.id === cardPreviewStyleSelectedLayerId);
    const field = event.target.dataset.layerField;
    if (!layer || !field) return;
    layer[field] = event.target.type === "range" ? Number(event.target.value) : event.target.value;
    if (event.target.type === "range") syncStyleRangeProgress(event.target);
    syncCardPreviewStyleFooter();
    renderCardPreviewStyleModalPreview();
  });
}

function panelOutput(input) {
  return input?.closest(".preview-style-range-wrap")?.querySelector("[data-range-value]");
}

async function copySvgValue(svg) {
  if (!svg) throw new Error("SVG 内容为空");
  try {
    await navigator.clipboard.writeText(svg);
  } catch {
    const input = document.createElement("textarea");
    input.value = svg;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }
  toast("已复制 SVG 轮廓");
}

function cmapGetGlyphIndex(cmap, codepoint) {
  if (!cmap || cmap.byteLength < 4) return 0;
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
    return (formatB === 12 ? 2 : formatB === 4 ? 1 : formatB === 0 ? 0 : -1) - (formatA === 12 ? 2 : formatA === 4 ? 1 : formatA === 0 ? 0 : -1);
  });
  for (const offset of offsets) {
    if (offset + 2 > cmap.byteLength) continue;
    const format = cmap.getUint16(offset);
    if (format === 0 && codepoint >= 0 && codepoint <= 255) return cmap.getUint8(offset + 6 + codepoint);
    if (format === 12 && offset + 16 <= cmap.byteLength) {
      const groups = cmap.getUint32(offset + 12);
      let low = 0, high = groups - 1;
      while (low <= high) {
        const middle = (low + high) >> 1;
        const p = offset + 16 + middle * 12;
        if (p + 12 > cmap.byteLength) break;
        const start = cmap.getUint32(p);
        const end = cmap.getUint32(p + 4);
        const startGlyphId = cmap.getUint32(p + 8);
        if (codepoint < start) high = middle - 1;
        else if (codepoint > end) low = middle + 1;
        else return startGlyphId + (codepoint - start);
      }
    }
    if (format === 4 && codepoint <= 0xFFFF && offset + 14 <= cmap.byteLength) {
      const segCount = cmap.getUint16(offset + 6) / 2;
      const endCodes = offset + 14;
      const startCodes = endCodes + segCount * 2 + 2;
      const idDeltas = startCodes + segCount * 2;
      const idRangeOffsets = idDeltas + segCount * 2;
      for (let i = 0; i < segCount; i++) {
        const end = cmap.getUint16(endCodes + i * 2);
        const start = cmap.getUint16(startCodes + i * 2);
        if (codepoint < start || codepoint > end) continue;
        const idDelta = cmap.getInt16(idDeltas + i * 2);
        const idRangeOffset = cmap.getUint16(idRangeOffsets + i * 2);
        if (idRangeOffset === 0) return (codepoint + idDelta) & 0xFFFF;
        const glyphOffset = idRangeOffsets + i * 2 + idRangeOffset + (codepoint - start) * 2;
        if (glyphOffset + 2 > cmap.byteLength) return 0;
        return cmap.getUint16(glyphOffset);
      }
    }
  }
  return 0;
}

function getLocaOffset(loca, glyphIndex, indexToLocFormat) {
  if (!loca) return null;
  if (indexToLocFormat === 0) {
    const pos = glyphIndex * 2;
    if (pos + 4 > loca.byteLength) return null;
    return loca.getUint16(pos) * 2;
  }
  const pos = glyphIndex * 4;
  if (pos + 8 > loca.byteLength) return null;
  return loca.getUint32(pos);
}

function getGlyphMetrics(hmtx, glyphIndex, numOfLongHorMetrics) {
  if (!hmtx || numOfLongHorMetrics <= 0) return { advance: 0, lsb: 0 };
  if (glyphIndex < numOfLongHorMetrics) {
    const pos = glyphIndex * 4;
    if (pos + 4 > hmtx.byteLength) return { advance: 0, lsb: 0 };
    return { advance: hmtx.getUint16(pos), lsb: hmtx.getInt16(pos + 2) };
  }
  const lastPos = (numOfLongHorMetrics - 1) * 4;
  const lsbPos = numOfLongHorMetrics * 4 + (glyphIndex - numOfLongHorMetrics) * 2;
  if (lastPos + 2 > hmtx.byteLength || lsbPos + 2 > hmtx.byteLength) return { advance: 0, lsb: 0 };
  return { advance: hmtx.getUint16(lastPos), lsb: hmtx.getInt16(lsbPos) };
}

function readGlyphFlags(view, start, numPoints) {
  const flags = new Array(numPoints);
  let index = 0, pos = start;
  while (index < numPoints && pos < view.byteLength) {
    const flag = view.getUint8(pos++);
    flags[index++] = flag;
    if (flag & 0x8) {
      const repeat = view.getUint8(pos++);
      for (let i = 0; i < repeat && index < numPoints; i++) flags[index++] = flag;
    }
  }
  return { flags, pos };
}

function readGlyphCoords(view, flags, startPos, numPoints, shortFlag, sameFlag) {
  const values = new Array(numPoints);
  let pos = startPos, value = 0;
  for (let i = 0; i < numPoints; i++) {
    const flag = flags[i];
    if (flag & shortFlag) value += (flag & sameFlag) ? view.getUint8(pos++) : -view.getUint8(pos++);
    else if (!(flag & sameFlag)) value += view.getInt16(pos), pos += 2;
    values[i] = value;
  }
  return { values, pos };
}

function contourToPathCommands(contour) {
  if (!contour.length) return [];
  let start = contour[0];
  if (!start.onCurve) {
    const last = contour[contour.length - 1];
    start = last.onCurve
      ? last
      : { x: (contour[0].x + last.x) / 2, y: (contour[0].y + last.y) / 2, onCurve: true };
  }
  const commands = [pathMove(start.x, start.y)];
  for (let index = 0; index < contour.length; index++) {
    const pt = contour[index];
    const next = contour[(index + 1) % contour.length];
    if (pt.onCurve && next.onCurve) {
      commands.push(pathLine(next.x, next.y));
    } else if (pt.onCurve && !next.onCurve) {
      const next2 = contour[(index + 2) % contour.length];
      if (next2.onCurve) {
        commands.push(pathQuad(next.x, next.y, next2.x, next2.y));
        index++;
      } else {
        commands.push(pathQuad(next.x, next.y, (next.x + next2.x) / 2, (next.y + next2.y) / 2));
      }
    } else if (!pt.onCurve && next.onCurve) {
      commands.push(pathQuad(pt.x, pt.y, next.x, next.y));
    } else {
      commands.push(pathQuad(pt.x, pt.y, (pt.x + next.x) / 2, (pt.y + next.y) / 2));
    }
  }
  commands.push(pathClose());
  return commands;
}

function contoursToPathCommands(endPts, points) {
  const commands = [];
  let start = 0;
  for (const end of endPts) {
    if (end < start) continue;
    commands.push(...contourToPathCommands(points.slice(start, end + 1)));
    start = end + 1;
  }
  return commands;
}

const GLYPH_HEADER_SIZE = 10;

function sanitizeSimpleEndPts(endPts, numContours, glyphSize) {
  const valid = [];
  for (let index = 0; index < endPts.length; index++) {
    const endPt = endPts[index];
    if (index > 0 && endPt <= valid[index - 1]) break;
    if (endPt >= 0xF000) break;
    const numPoints = endPt + 1;
    if (numPoints < 1 || numPoints > 8192) break;
    const minBytes = GLYPH_HEADER_SIZE + numContours * 2 + 2 + numPoints;
    if (minBytes > glyphSize) break;
    valid.push(endPt);
  }
  return valid.length === endPts.length ? valid : valid.length ? valid : null;
}

function parseSimpleGlyph(view, offset, numContours, glyphSize) {
  if (numContours <= 0 || glyphSize < GLYPH_HEADER_SIZE) return { commands: [], points: [] };
  const endPts = [];
  for (let index = 0; index < numContours; index++) endPts.push(view.getUint16(offset + GLYPH_HEADER_SIZE + index * 2));
  const validEndPts = sanitizeSimpleEndPts(endPts, numContours, glyphSize);
  if (!validEndPts) return { commands: [], points: [] };
  let instructionLength = view.getUint16(offset + GLYPH_HEADER_SIZE + numContours * 2);
  let pos = offset + GLYPH_HEADER_SIZE + numContours * 2 + 2;
  if (pos + instructionLength > offset + glyphSize) instructionLength = 0;
  pos = offset + GLYPH_HEADER_SIZE + numContours * 2 + 2 + instructionLength;
  const numPoints = validEndPts[validEndPts.length - 1] + 1;
  if (pos >= offset + glyphSize) return { commands: [], points: [] };
  const flagRead = readGlyphFlags(view, pos, numPoints);
  const xRead = readGlyphCoords(view, flagRead.flags, flagRead.pos, numPoints, 0x02, 0x10);
  const yRead = readGlyphCoords(view, flagRead.flags, xRead.pos, numPoints, 0x04, 0x20);
  if (yRead.pos > offset + glyphSize) return { commands: [], points: [] };
  const points = [];
  for (let index = 0; index < numPoints; index++) {
    points.push({
      x: xRead.values[index],
      y: yRead.values[index],
      onCurve: Boolean(flagRead.flags[index] & 0x01)
    });
  }
  return { commands: contoursToPathCommands(validEndPts, points), points };
}

function parseCompositeGlyphBody(view, bodyOffset, glyphEnd, getGlyphData, depth = 0) {
  if (depth > 8 || bodyOffset + 4 > glyphEnd) return { commands: [], points: [] };
  let pos = bodyOffset;
  const result = { commands: [], points: [] };
  let more = true;
  while (more && pos + 4 <= glyphEnd) {
    const flags = view.getUint16(pos);
    const glyphIndex = view.getUint16(pos + 2);
    pos += 4;
    let arg1, arg2;
    if (flags & 0x0001) {
      if (pos + 4 > glyphEnd) break;
      arg1 = view.getInt16(pos); arg2 = view.getInt16(pos + 2); pos += 4;
    } else {
      if (pos + 2 > glyphEnd) break;
      arg1 = view.getUint8(pos); arg2 = view.getUint8(pos + 1); pos += 2;
    }
    let matrix = { a: 1, b: 0, c: 0, d: 1 };
    let offsetX = 0, offsetY = 0;
    if (flags & 0x0080) {
      if (pos + 12 > glyphEnd) break;
      matrix.a = view.getInt16(pos) / 16384; matrix.b = view.getInt16(pos + 2) / 16384;
      matrix.c = view.getInt16(pos + 4) / 16384; matrix.d = view.getInt16(pos + 6) / 16384;
      offsetX = view.getInt16(pos + 8); offsetY = view.getInt16(pos + 10); pos += 12;
    } else {
      if (flags & 0x0008) {
        if (pos + 2 > glyphEnd) break;
        const scale = view.getInt16(pos) / 16384; pos += 2;
        matrix = { a: scale, b: 0, c: 0, d: scale };
      } else if (flags & 0x0040) {
        if (pos + 8 > glyphEnd) break;
        matrix.a = view.getInt16(pos) / 16384; matrix.b = view.getInt16(pos + 2) / 16384;
        matrix.c = view.getInt16(pos + 4) / 16384; matrix.d = view.getInt16(pos + 6) / 16384;
        pos += 8;
      }
      if (flags & 0x0002) {
        offsetX = arg1;
        offsetY = arg2;
      }
    }
    const child = getGlyphData(glyphIndex, depth + 1);
    if (!(flags & 0x0080) && !(flags & 0x0002)) {
      const parentPoint = result.points[arg1] || result.points[result.points.length - 1];
      const childPoint = child.points[arg2] || child.points[0];
      if (parentPoint && childPoint) {
        const mappedChild = mapMatrixPoint(matrix, childPoint.x, childPoint.y);
        offsetX = parentPoint.x - mappedChild.x;
        offsetY = parentPoint.y - mappedChild.y;
      }
    }
    result.commands.push(...transformPathCommands(child.commands, matrix, offsetX, offsetY));
    result.points.push(...transformPoints(child.points, matrix, offsetX, offsetY));
    if (flags & 0x0100) {
      if (pos + 2 > glyphEnd) break;
      pos += 2 + view.getUint16(pos);
    }
    more = Boolean(flags & 0x0020);
  }
  return result;
}

function parseCompositeGlyph(view, offset, getGlyphData, depth = 0, glyphEnd = view.byteLength) {
  if (depth > 8) return { commands: [], points: [] };
  return parseCompositeGlyphBody(view, offset + GLYPH_HEADER_SIZE, glyphEnd, getGlyphData, depth);
}

function getGlyphPathData(glyf, loca, glyphIndex, indexToLocFormat, getGlyphData, depth = 0) {
  const start = getLocaOffset(loca, glyphIndex, indexToLocFormat);
  const end = getLocaOffset(loca, glyphIndex + 1, indexToLocFormat);
  if (start == null || end == null || start === end || start + GLYPH_HEADER_SIZE > glyf.byteLength) return { commands: [], points: [] };
  const glyphSize = end - start;
  const numberOfContours = glyf.getInt16(start);
  if (numberOfContours > 0) return parseSimpleGlyph(glyf, start, numberOfContours, glyphSize);
  if (numberOfContours < 0) return parseCompositeGlyph(glyf, start, getGlyphData, depth, end);
  return { commands: [], points: [] };
}

async function buildFontOutlineSvg(font, text = cardPreviewText()) {
  const ctx = await getFontContext(font);
  if (ctx.unsupported) throw new Error("暂不支持 WOFF/WOFF2/TTC 轮廓导出");
  const hasCff = ctx.tables.includes("CFF ") || ctx.tables.includes("CFF2");
  if (hasCff && !ctx.tables.includes("glyf")) throw new Error("该字体使用 CFF 轮廓，暂不支持导出 SVG");
  if (!ctx.tables.includes("glyf") || !ctx.tables.includes("loca") || !ctx.tables.includes("cmap")) {
    throw new Error("该字体不含 TrueType 轮廓数据");
  }
  const [head, maxp, hhea, cmap, loca, glyf, hmtx] = await Promise.all([
    ctx.readTable("head"), ctx.readTable("maxp"), ctx.readTable("hhea"), ctx.readTable("cmap"),
    ctx.readTable("loca"), ctx.readTable("glyf"), ctx.readTable("hmtx")
  ]);
  if (!head || !maxp || !cmap || !loca || !glyf) throw new Error("字体表读取失败");
  const upm = head.byteLength >= 20 ? head.getUint16(18) : 1000;
  const indexToLocFormat = head.byteLength >= 52 ? head.getInt16(50) : 0;
  const numGlyphs = maxp.byteLength >= 6 ? maxp.getUint16(4) : 0;
  const numOfLongHorMetrics = hhea?.byteLength >= 36 ? hhea.getUint16(34) : 0;
  const getGlyphData = (glyphIndex, depth = 0) => getGlyphPathData(glyf, loca, glyphIndex, indexToLocFormat, getGlyphData, depth);
  const characters = outlinePreviewCharacters(text);
  const allCommands = [];
  let cursorX = 0;
  for (const char of characters) {
    const glyphIndex = cmapGetGlyphIndex(cmap, char.codePointAt(0));
    if (glyphIndex <= 0 || glyphIndex >= numGlyphs) {
      cursorX += Math.round(upm * 0.5);
      continue;
    }
    const metrics = getGlyphMetrics(hmtx, glyphIndex, numOfLongHorMetrics);
    const glyphData = getGlyphData(glyphIndex);
    if (glyphData.commands.length) {
      allCommands.push(...translatePathCommands(glyphData.commands, cursorX - metrics.lsb, 0));
    }
    cursorX += metrics.advance || Math.round(upm * 0.5);
  }
  if (!allCommands.length) throw new Error("未能解析预览文字轮廓");
  const svgCommands = trueTypeToSvgCommands(allCommands);
  const bbox = pathCommandsSvgBoundingBox(svgCommands);
  const padding = Math.round(upm * 0.08);
  const originX = bbox.minX - padding;
  const originY = bbox.minY - padding;
  const width = Math.max(1, bbox.maxX - bbox.minX + padding * 2);
  const height = Math.max(1, bbox.maxY - bbox.minY + padding * 2);
  const normalizedCommands = translateSvgPathCommands(svgCommands, -originX, -originY);
  const pathData = pathCommandsToSvgData(normalizedCommands);
  const label = escapeXml(font.displayName || font.family || "font");
  if (!state.cardPreviewStyle || !hasActiveCardPreviewStyle(state.cardPreviewStyle)) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${formatOutlineNumber(width)} ${formatOutlineNumber(height)}" role="img" aria-label="${label}">\n  <path fill="#181816" d="${pathData}"/>\n</svg>`;
  }
  const unitsPerPx = previewStyleUnitsPerPx(upm);
  return buildStyledOutlineSvgMarkup({ pathData, width, height, label, style: state.cardPreviewStyle, unitsPerPx });
}

async function copyFontSvg(font) {
  try {
    toast("正在生成 SVG 轮廓…");
    const svg = await buildFontOutlineSvg(font);
    await copySvgValue(svg);
  } catch (error) {
    toast(error.message || "无法导出 SVG 轮廓");
  }
}

function outlineSvgFilename(font) {
  const base = (font.postscriptName || font.displayName || font.family || "font")
    .replace(/[^\w\u4e00-\u9fff-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "font";
  const preview = outlinePreviewCharacters().join("").slice(0, 8)
    .replace(/[^\w\u4e00-\u9fff-]+/g, "") || "preview";
  return `${base}-${preview}.svg`;
}

async function downloadFontSvg(font) {
  try {
    toast("正在生成 SVG 轮廓…");
    const svg = await buildFontOutlineSvg(font);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = outlineSvgFilename(font);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast("已开始下载 SVG 轮廓");
  } catch (error) {
    toast(error.message || "无法下载 SVG 轮廓");
  }
}

function renderCardTitle(font, displayName) {
  const members = getFamilyMembers(font);
  if (state.view === "single" || members.length <= 1) {
    return `<strong>${escapeHtml(displayName)}</strong>`;
  }
  const options = members.map(member => {
    const label = member.style || member.weightLabel || "Regular";
    const active = member.id === font.id ? " active" : "";
    return `<button type="button" class="card-family-option${active}" data-font-id="${member.id}" role="menuitem">${escapeHtml(label)}</button>`;
  }).join("");
  return `<div class="card-family-switch"><span class="card-family-name">${escapeHtml(displayName)}</span><span class="card-family-caret" aria-hidden="true">▾</span><div class="card-family-menu" role="menu">${options}</div></div>`;
}

function createFontCard(font) {
  const readyForRender = font.previewState === "ready";
  const card = document.createElement("div");
  card.draggable = true;
  card.className = `font-card${state.selected === font ? " active" : ""}${readyForRender ? " font-ready" : " font-pending"}${font.previewState === "loading" ? " font-loading" : ""}${font.previewState === "failed" ? " font-failed" : ""}`;
  card.dataset.id = font.id;
  const ratioText = Number.isFinite(font.aspectRatio) ? ` · ${font.aspectRatio.toFixed(2)}:1` : "";
  const displayName = font.displayName || font.family;
  card.title = `${displayName} · ${font.style || "Regular"}${ratioText}`;
  card.innerHTML = `${renderCardTitle(font, displayName)}<span class="sample">${escapeHtml(cardPreviewText())}</span><small>${escapeHtml(font.style || "Regular")}${font.variable ? " · Variable" : ""}${ratioText}</small><button class="star" type="button" title="${state.favorites.has(font.postscriptName) ? "取消收藏" : "收藏字体"}" aria-label="${state.favorites.has(font.postscriptName) ? "取消收藏" : "收藏"} ${escapeHtml(displayName)}">${state.favorites.has(font.postscriptName) ? "★" : "☆"}</button><div class="card-actions"><button class="card-download-svg" type="button" title="下载 SVG 轮廓" aria-label="下载 ${escapeHtml(displayName)} 的 SVG 轮廓">${CARD_DOWNLOAD_ICON}</button><button class="card-copy-svg" type="button" title="复制 SVG 轮廓" aria-label="复制 ${escapeHtml(displayName)} 的 SVG 轮廓">${CARD_SVG_ICON}</button><button class="card-copy" type="button" title="复制字体名称" aria-label="复制 ${escapeHtml(displayName)} 的字体名称">⧉</button></div>`;
  card.querySelector(".sample").style.fontSize = `${cardBaseFontSize()}px`;
  applyCardPreviewStyleToSample(card.querySelector(".sample"));
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
  card.querySelector(".card-download-svg").addEventListener("click", event => {
    event.stopPropagation();
    downloadFontSvg(font);
  });
  card.querySelector(".card-copy-svg").addEventListener("click", event => {
    event.stopPropagation();
    copyFontSvg(font);
  });
  card.querySelector(".star").addEventListener("click", event => {
    event.stopPropagation();
    toggleFavoriteFor(font);
  });
  card.querySelector(".card-family-menu")?.addEventListener("click", event => event.stopPropagation());
  const familySwitch = card.querySelector(".card-family-switch");
  if (familySwitch) {
    const menu = familySwitch.querySelector(".card-family-menu");
    familySwitch._familyMenu = menu;
    menu._floatHost = familySwitch;
    let closeTimer;
    const openFamilyMenu = () => {
      clearTimeout(closeTimer);
      familySwitch.classList.add("is-open");
      mountFloatingPopover(menu, familySwitch, { minWidth: 148, gap: 2 });
    };
    const restoreFamilyPreview = () => {
      if (state.selected) previewFont(state.selected, false);
      else previewFont(font, true, { immediate: true });
      state.hovered = font;
    };
    const closeFamilyMenu = () => {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        familySwitch.classList.remove("is-open");
        resetFloatingPopover(menu, familySwitch);
        menu?.querySelectorAll(".card-family-option.is-hover").forEach(button => button.classList.remove("is-hover"));
        restoreFamilyPreview();
      }, 120);
    };
    const stayInFamilyMenu = event => isWithinFloatingMenu(event?.relatedTarget, familySwitch, menu);
    familySwitch.addEventListener("mouseenter", openFamilyMenu);
    menu.addEventListener("mouseenter", () => clearTimeout(closeTimer));
    familySwitch.addEventListener("mouseleave", event => {
      if (stayInFamilyMenu(event)) return;
      closeFamilyMenu();
    });
    menu.addEventListener("mouseleave", event => {
      if (stayInFamilyMenu(event)) return;
      closeFamilyMenu();
    });
    familySwitch.addEventListener("focusin", openFamilyMenu);
    familySwitch.addEventListener("focusout", event => {
      if (stayInFamilyMenu(event)) return;
      closeFamilyMenu();
    });
  }
  card.querySelectorAll(".card-family-option").forEach(button => {
    button.addEventListener("mouseenter", () => {
      const target = state.fonts.find(item => item.id === Number(button.dataset.fontId));
      if (!target) return;
      button.closest(".card-family-menu")?.querySelectorAll(".card-family-option.is-hover")
        .forEach(item => item.classList.remove("is-hover"));
      button.classList.add("is-hover");
      state.hovered = target;
      previewFont(target, true, { immediate: true });
    });
    button.addEventListener("click", event => {
      event.stopPropagation();
      const target = state.fonts.find(item => item.id === Number(button.dataset.fontId));
      if (!target) return;
      navigateToFont(target);
      familySwitch?.classList.remove("is-open");
      resetFloatingPopover(familySwitch?._familyMenu, familySwitch);
      familySwitch?._familyMenu
        ?.querySelectorAll(".card-family-option.is-hover")
        .forEach(item => item.classList.remove("is-hover"));
    });
  });
  card.addEventListener("click", () => selectFont(font));
  return card;
}

function renderFontList({ deferFonts = false, remeasure = true } = {}) {
  closeAllFamilyMenus();
  const renderToken = ++state.renderVersion;
  fontObserver?.disconnect();
  state.prefetchCards.clear();
  state.pageSize = calculatePageSize();
  state.totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
  state.page = Math.max(0, Math.min(state.page, state.totalPages - 1));
  const start = state.page * state.pageSize;
  const pageFonts = state.filtered.slice(start, start + state.pageSize);
  const fragment = document.createDocumentFragment();
  for (const font of pageFonts) fragment.appendChild(createFontCard(font));
  ui.list.replaceChildren(fragment);
  ui.list.classList.toggle("list-view", state.view === "list");
  ui.list.classList.toggle("single-view", state.view === "single");
  ui.list.classList.toggle("focus-view", state.view === "focus");
  syncCardGridLayoutVars();
  ui.list.style.gridTemplateColumns = ["grid", "focus"].includes(state.view)
    ? `repeat(${getCardGridLayout().columns}, minmax(0, 1fr))`
    : "";
  ui.list.style.setProperty("--single-card-size", `${state.singleCardSize}px`);
  ui.count.textContent = `${state.filtered.length} 款字体`;
  ui.empty.hidden = state.filtered.length > 0;
  ui.pagination.hidden = state.filtered.length === 0;
  ui.pageInfo.innerHTML = `第 <span class="page-current">${state.page + 1}</span> / ${state.totalPages} 页`;
  ui.previousPage.disabled = state.page === 0;
  ui.nextPage.disabled = state.page >= state.totalPages - 1;
  const viewName = ({ grid: "网格视图", list: "列表视图", single: "单字视图", focus: "无干扰视图" })[state.view] || "字体视图";
  ui.viewStatus.textContent = `${viewName} · 本页 ${pageFonts.length} / ${state.filtered.length} 款`;
  const hydratePage = () => {
    if (renderToken !== state.renderVersion) return;
    setupLazyFontLoading();
    preloadAdjacentPages();
    if (state.pendingSelectionId != null) {
      const pendingId = state.pendingSelectionId;
      state.pendingSelectionId = null;
      const pendingFont = state.fonts.find(item => item.id === pendingId);
      if (pendingFont) selectFont(pendingFont);
    }
  };
  const finishRender = () => {
    if (renderToken !== state.renderVersion) return;
    if (remeasure && ["grid", "focus"].includes(state.view)) {
      const nextPageSize = calculatePageSize();
      if (nextPageSize !== state.pageSize) {
        renderFontList({ deferFonts, remeasure: false });
        return;
      }
    }
    hydratePage();
  };
  if (deferFonts) requestAnimationFrame(() => requestAnimationFrame(finishRender));
  else requestAnimationFrame(finishRender);
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
  const layout = getCardGridLayout();
  if (state.view === "single") {
    const columns = Math.max(1, Math.floor(layout.width / state.singleCardSize));
    const rows = Math.max(1, Math.floor(layout.height / state.singleCardSize));
    return columns * rows;
  }
  if (state.view === "list") return Math.max(1, Math.floor(layout.height / 102));
  return layout.columns * layout.rows;
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
    applyCardPreviewStyleToSample(sample);
    requestAnimationFrame(() => fitCardSample(sample));
    return;
  }
  card.classList.add("font-loading");
  const finish = success => {
    if (!card.isConnected) return;
    card.classList.remove("font-pending", "font-loading", "font-ready", "font-failed");
    card.classList.add(success ? "font-ready" : "font-failed");
    if (success) {
      applyCardPreviewStyleToSample(sample);
      fitCardSample(sample);
    }
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
  return state.cardSampleSize;
}

function updateCardSampleSizeControl() {
  const disabled = state.view === "single";
  ui.cardSampleSize.disabled = disabled;
  $("#cardSampleSizeDecrease").disabled = disabled;
  $("#cardSampleSizeIncrease").disabled = disabled;
  ui.cardSampleSize.value = state.cardSampleSize;
  ui.cardSampleSizeOutput.textContent = state.cardSampleSize;
}

function stepCardSampleSize(direction) {
  if (ui.cardSampleSize.disabled) return;
  const min = Number(ui.cardSampleSize.min);
  const max = Number(ui.cardSampleSize.max);
  const step = Number(ui.cardSampleSize.step) || 1;
  const next = Math.max(min, Math.min(max, Number(ui.cardSampleSize.value) + direction * step));
  if (next === Number(ui.cardSampleSize.value)) return;
  ui.cardSampleSize.value = String(next);
  applyCardSampleSize();
  persistCardSampleSize();
}

function applyCardSampleSize({ fit = false } = {}) {
  state.cardSampleSize = Number(ui.cardSampleSize.value);
  ui.cardSampleSizeOutput.textContent = state.cardSampleSize;
  syncCardGridLayoutVars();
  ui.list.querySelectorAll(".font-card.font-ready .sample").forEach(sample => {
    sample.style.fontSize = `${state.cardSampleSize}px`;
    applyCardPreviewStyleToSample(sample);
  });
  if (fit) scheduleCardSampleFit();
}

function refreshCardGridPageIfNeeded() {
  if (!["grid", "focus"].includes(state.view)) return;
  const nextPageSize = calculatePageSize();
  if (nextPageSize === state.pageSize) return;
  state.page = 0;
  renderFontList({ remeasure: false });
}

function scheduleCardSampleFit() {
  cancelAnimationFrame(scheduleCardSampleFit.frame);
  scheduleCardSampleFit.frame = requestAnimationFrame(() => {
    ui.list.querySelectorAll(".font-card.font-ready .sample").forEach(sample => fitCardSample(sample));
  });
}

function persistCardSampleSize() {
  persistUiSettings();
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
  syncCollapsedRepresentative(font);
}

function previewFont(font, temporary = true, { immediate = false } = {}) {
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
  ui.magnifiedText.textContent = ui.previewText.textContent;
  applyDetailMagnifierStyles();
  ui.axisStatus.textContent = font.axes ? `${font.axes.length} 个可变轴` : (temporary ? "悬停预览" : "正在检测可变轴…");
  ui.axes.replaceChildren();
  if (font.axes) renderAxes(font.axes);
  if (font.details) renderFontDetails(font, font.details);
  else renderFontDetails(font);
  const delay = temporary && !immediate ? 220 : 0;
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
  }, delay);
}

function clearPreview() {
  clearTimeout(previewFont.timer);
  state.previewed = null;
  $("#detailPanel").classList.add("empty-preview");
  state.selectionVersion++;
  ui.selectedName.textContent = "将鼠标移到字体卡片";
  ui.selectedStyle.textContent = "未选择字体";
  ui.previewText.style.fontFamily = "";
  ui.magnifiedText.style.fontFamily = "";
  syncToolbarPreview(null);
  ui.axisStatus.textContent = "暂无字体参数";
  ui.axes.replaceChildren();
  ui.favorite.textContent = "☆";
  updateFontStatus(null);
  [ui.infoFamily, ui.infoPostscript, ...INFO_BASIC_FIELDS, ...INFO_EXTENDED_FIELDS].forEach(item => setInfoPlain(item, "—"));
}

function restorePinnedPreview() {
  state.hovered = null;
  if (state.selected) previewFont(state.selected, false);
  else clearPreview();
}

async function detectVariableFonts(token = state.filterVersion) {
  state.scanningVariables = true;
  let completed = state.fonts.filter(item => item.variable !== null).length;
  const total = state.fonts.length;
  ui.scanProgress.hidden = total === 0 || completed >= total;
  const updateScanProgress = () => {
    if (token !== state.filterVersion) return;
    const percent = total ? completed / total * 100 : 100;
    ui.scanBar.style.width = `${percent}%`;
    ui.scanText.textContent = `正在识别可变字体 ${completed} / ${total}`;
  };
  updateScanProgress();
  const workers = Array.from({ length: 1 }, async () => {
    while (true) {
      if (token !== state.filterVersion) break;
      const font = state.fonts.find(item => item.variable === null && !item.detecting);
      if (!font) break;
      font.detecting = true;
      try {
        if (token !== state.filterVersion) break;
        font.variable = (await getVariationAxes(font)).length > 0;
      } catch { font.variable = false; }
      finally { font.detecting = false; }
      completed++;
      if (completed % 3 === 0 || completed === total) {
        updateScanProgress();
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  });
  await Promise.all(workers);
  state.scanningVariables = false;
  if (token !== state.filterVersion) {
    ui.scanProgress.hidden = true;
    return false;
  }
  ui.scanProgress.hidden = true;
  ui.scanText.textContent = "可变字体识别完成";
  return true;
}

async function scanFontCapabilities(token = state.filterVersion) {
  state.scanningCapabilities = true;
  let completed = state.fonts.filter(font => font.details).length;
  const total = state.fonts.length;
  ui.scanProgress.hidden = total === 0 || completed >= total;
  const update = () => {
    if (token !== state.filterVersion) return;
    ui.scanBar.style.width = `${total ? completed / total * 100 : 100}%`;
    ui.scanText.textContent = `正在读取字符与字重信息 ${completed} / ${total}`;
  };
  update();
  for (const font of state.fonts) {
    if (token !== state.filterVersion) break;
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
  if (token !== state.filterVersion) {
    ui.scanProgress.hidden = true;
    return false;
  }
  ui.scanProgress.hidden = true;
  return true;
}

async function scanFontShapes(token = state.filterVersion) {
  state.scanningShapes = true;
  let completed = state.fonts.filter(font => font.aspectRatio !== undefined).length;
  const total = state.fonts.length;
  ui.scanProgress.hidden = total === 0 || completed >= total;
  const update = () => {
    if (token !== state.filterVersion) return;
    ui.scanBar.style.width = `${total ? completed / total * 100 : 100}%`;
    ui.scanText.textContent = `正在测量首字宽高比 ${completed} / ${total}`;
  };
  update();
  for (const font of state.fonts) {
    if (token !== state.filterVersion) break;
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
  if (token !== state.filterVersion) {
    ui.scanProgress.hidden = true;
    return false;
  }
  ui.scanProgress.hidden = true;
  return true;
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

function renderFontDetails(font, details = null) {
  setInfoText(ui.infoFamily, font.displayName || font.family);
  setInfoText(ui.infoPostscript, font.postscriptName);
  const extended = font.extendedDetails;
  const extendedPending = details !== false && state.previewed === font && !extended;
  if (details === null) {
    INFO_BASIC_FIELDS.forEach(item => setInfoPlain(item, "读取中…"));
    INFO_EXTENDED_FIELDS.forEach(item => setInfoPlain(item, "读取中…"));
    return;
  }
  if (details === false) {
    INFO_BASIC_FIELDS.forEach(item => setInfoPlain(item, "不可用"));
    INFO_EXTENDED_FIELDS.forEach(item => setInfoPlain(item, "不可用"));
    return;
  }
  setInfoText(ui.infoFormat, details.format);
  setInfoText(ui.infoSize, formatFileSize(details.size));
  setInfoText(ui.infoGlyphs, details.glyphs?.toLocaleString() || "—");
  setInfoText(ui.infoUpm, details.upm || "—");
  setInfoText(ui.infoWeight, details.weight || "—");
  setInfoText(ui.infoWidth, details.width || "—");
  setInfoText(ui.infoLanguage, [details.supportsChinese ? "中文" : "", details.supportsLatin ? "英文" : ""].filter(Boolean).join(" / ") || "其他");
  setInfoText(ui.infoAspect, Number.isFinite(font.aspectRatio) ? `${font.aspectRatio.toFixed(3)} : 1` : "—");
  setInfoText(ui.infoTables, details.tables.length ? details.tables.join(" · ") : "—");
  if (extendedPending) {
    INFO_EXTENDED_FIELDS.forEach(item => setInfoPlain(item, "读取中…"));
    return;
  }
  if (!extended) {
    INFO_EXTENDED_FIELDS.forEach(item => setInfoPlain(item, "—"));
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
  if (state.previewed) {
    ui.previewInput.style.fontVariationSettings = value;
    ui.selectedName.style.fontVariationSettings = value;
    ui.selectedStyle.style.fontVariationSettings = value;
  }
}

function updatePreview() {
  const text = ui.previewInput.value || "在这里输入预览文字";
  const firstCharacter = [...text.trim()][0] || "字";
  if (firstCharacter !== state.aspectCharacter) {
    state.aspectCharacter = firstCharacter;
    state.fonts.forEach(font => { delete font.aspectRatio; delete font.aspectPromise; });
    if (["square", "narrow", "wide"].includes(state.sort)) {
      clearTimeout(updatePreview.shapeTimer);
      updatePreview.shapeTimer = setTimeout(refreshFilters, 260);
    }
  }
  ui.cardMagnifiedText.textContent = cardPreviewText();
  if (!$("#cardPreviewStyleModal")?.hidden) renderCardPreviewStyleModalPreview();
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
  ui.magnifier.style.backgroundColor = resolveMagnifierBackground(ui.bg.value, "--stage");
  const mark = $(".stage-color-mark");
  if (mark) mark.style.color = colorSwatchMarkColor(ui.color.value);
  persistUiSettings();
}

function colorSwatchMarkColor(hex) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return "#fff";
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#181816" : "#fbf9f4";
}

function adjustRangeInput(input, direction) {
  if (!input || input.disabled || input.type !== "range") return false;
  const step = Number(input.step) || 1;
  const min = Number(input.min);
  const max = Number(input.max);
  const next = Math.max(min, Math.min(max, Number(input.value) + direction * step));
  if (next === Number(input.value)) return false;
  input.value = String(next);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}

function handlePreviewControlWheel(event) {
  const label = event.target.closest("label, .axis-control");
  const range = label?.querySelector('input[type="range"]');
  if (!range) return;
  event.preventDefault();
  event.stopPropagation();
  adjustRangeInput(range, event.deltaY < 0 ? 1 : -1);
}

function handlePreviewStageWheel(event) {
  if (isDetailPreviewEditing() || !state.previewed) return;
  event.preventDefault();
  event.stopPropagation();
  const direction = event.deltaY < 0 ? 1 : -1;
  if (event.shiftKey) adjustRangeInput(ui.spacing, direction);
  else if (event.altKey) adjustRangeInput(ui.lineHeight, direction);
  else adjustRangeInput(ui.size, direction);
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
    persistUiSettings();
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
  ui.size.value = UI_SETTINGS_DEFAULTS.previewFontSize;
  ui.spacing.value = UI_SETTINGS_DEFAULTS.previewLetterSpacing;
  ui.lineHeight.value = UI_SETTINGS_DEFAULTS.previewLineHeight;
  ui.bg.value = UI_SETTINGS_DEFAULTS.previewBackground;
  ui.color.value = UI_SETTINGS_DEFAULTS.previewTextColor;
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
ui.cardSampleSize.addEventListener("input", () => {
  applyCardSampleSize();
  persistUiSettings();
});
ui.cardSampleSize.addEventListener("change", () => {
  applyCardSampleSize({ fit: true });
  persistCardSampleSize();
  refreshCardGridPageIfNeeded();
});
$("#cardSampleSizeDecrease").addEventListener("click", () => stepCardSampleSize(-1));
$("#cardSampleSizeIncrease").addEventListener("click", () => stepCardSampleSize(1));
ui.previewText.addEventListener("input", syncDetailPreviewStage);
ui.previewText.addEventListener("dblclick", () => {
  setDetailPreviewEditing(true);
  ui.previewText.focus();
});
ui.previewText.addEventListener("mousedown", event => {
  if (!isDetailPreviewEditing()) event.preventDefault();
});
ui.previewText.addEventListener("focus", () => {
  setDetailPreviewEditing(true);
  hideMagnifier(ui.magnifier);
});
ui.previewText.addEventListener("blur", () => {
  setDetailPreviewEditing(false);
  syncDetailPreviewStage();
});
ui.stage.addEventListener("mousemove", updateDetailMagnifier);
ui.stage.addEventListener("mouseleave", () => hideMagnifier(ui.magnifier));
ui.stage.addEventListener("wheel", handlePreviewStageWheel, { passive: false });
$(".preview-controls")?.addEventListener("wheel", handlePreviewControlWheel, { passive: false });
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
$("#infoTabPanel").addEventListener("click", event => {
  const toggle = event.target.closest(".info-collapsible-toggle");
  if (!toggle) return;
  event.preventDefault();
  event.stopPropagation();
  const field = toggle.closest("dd");
  const expanded = field.classList.toggle("is-expanded");
  toggle.textContent = expanded ? "收起" : "展开";
});
INFO_COPY_TARGETS.forEach(([element, label]) => {
  element.addEventListener("click", event => {
    if (event.target.closest(".info-collapsible-toggle")) return;
    copyDetailValue(element, label);
  });
  element.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      copyDetailValue(element, label);
    }
  });
});
ui.magnifierButton.addEventListener("click", () => {
  state.magnifier = !state.magnifier;
  syncMagnifierControl();
  if (!state.magnifier) { hideMagnifier(ui.magnifier); hideMagnifier(ui.cardMagnifier); }
  persistUiSettings();
});
document.querySelectorAll(".chip").forEach(button => button.addEventListener("click", () => {
  const filter = button.dataset.filter;
  if (filter === "all") {
    state.filters.clear(); state.languageFilters.clear(); state.weightFilters.clear(); state.favoriteCategoryView = "all";
    document.querySelectorAll("[data-language], [data-weight-label], [data-capability]").forEach(input => input.checked = false);
    document.querySelector('[data-language="all"]').checked = true;
    updateFilterControls();
    persistUiSettings();
    return refreshFilters();
  }
  state.filters.has(filter) ? state.filters.delete(filter) : state.filters.add(filter);
  updateFilterControls();
  refreshFilters();
  persistUiSettings();
}));
$("#gridViewButton").addEventListener("click", () => setView("grid"));
$("#listViewButton").addEventListener("click", () => setView("list"));
$("#singleViewButton").addEventListener("click", () => setView("single"));
$("#focusViewToggle")?.addEventListener("change", event => {
  setView(event.target.checked ? "focus" : "grid");
});
$("#cardColumns")?.addEventListener("input", event => {
  state.cardColumns = clampCardColumns(event.target.value);
  syncCardColumnsControl();
  if (["grid", "focus"].includes(state.view)) {
    state.page = 0;
    renderFontList();
  }
  persistUiSettings();
});
document.querySelectorAll("[data-sort]").forEach(input => input.addEventListener("change", () => {
  if (!input.checked) return;
  state.sort = input.dataset.sort;
  updateFilterControls();
  refreshFilters();
  persistUiSettings();
}));
document.querySelectorAll("[data-language]").forEach(input => input.addEventListener("change", () => {
  if (!input.checked) return;
  state.languageFilters.clear();
  if (input.dataset.language !== "all") state.languageFilters.add(input.dataset.language);
  updateFilterControls();
  refreshFilters();
  persistUiSettings();
}));
document.querySelectorAll("[data-capability]").forEach(input => input.addEventListener("change", () => {
  const capability = input.dataset.capability;
  input.checked ? state.filters.add(capability) : state.filters.delete(capability);
  updateFilterControls();
  refreshFilters();
  persistUiSettings();
}));
setupFilterMenus();
$("#collapseFamilyFonts")?.addEventListener("change", event => {
  state.collapseFamilyFonts = event.target.checked;
  updateFilterControls();
  refreshFilters();
  persistUiSettings();
});
function updateFilterControls() {
  document.querySelector('[data-filter="all"]').classList.toggle("active", state.filters.size === 0 && state.languageFilters.size === 0 && state.weightFilters.size === 0);
  document.querySelectorAll('[data-filter]:not([data-filter="all"])').forEach(button => button.classList.toggle("active", state.filters.has(button.dataset.filter)));
  document.querySelectorAll("[data-capability]").forEach(input => input.checked = state.filters.has(input.dataset.capability));
  document.querySelectorAll("[data-language]").forEach(input => input.checked = input.dataset.language === (state.languageFilters.values().next().value || "all"));
  const collapseFamilyFonts = $("#collapseFamilyFonts");
  const focusViewToggle = $("#focusViewToggle");
  if (collapseFamilyFonts) collapseFamilyFonts.checked = state.collapseFamilyFonts;
  if (focusViewToggle) focusViewToggle.checked = state.view === "focus";
  $("#viewOptionsMenu")?.classList.toggle("is-active", state.collapseFamilyFonts || state.view === "focus");
  const supportCount = state.languageFilters.size + Number(state.filters.has("variable"));
  $("#languageBadge").textContent = supportCount ? `${supportCount} 项` : "全部";
  $("#weightBadge").textContent = state.weightFilters.size
    ? [...state.weightFilters].sort((a, b) => weightLabelOrder(a) - weightLabelOrder(b)).join(" · ")
    : "全部";
  $("#sortBadge").textContent = sortLabel(state.sort);
  document.querySelectorAll("[data-sort]").forEach(input => { input.checked = input.dataset.sort === state.sort; });
}
function setView(view) {
  state.view = view;
  $("#gridViewButton").classList.toggle("active", view === "grid");
  $("#listViewButton").classList.toggle("active", view === "list");
  $("#singleViewButton").classList.toggle("active", view === "single");
  const focusViewToggle = $("#focusViewToggle");
  if (focusViewToggle) focusViewToggle.checked = view === "focus";
  $("#viewOptionsMenu")?.classList.toggle("is-active", state.collapseFamilyFonts || view === "focus");
  syncCardColumnsControl();
  updateCardSampleSizeControl();
  renderFontList();
  persistUiSettings();
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
    persistUiSettings();
  } else {
    state.cardColumns = clampCardColumns(state.cardColumns + direction);
    syncCardColumnsControl();
    state.page = 0;
    renderFontList();
    toast(`每行 ${state.cardColumns} 个`);
    persistUiSettings();
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
ui.list.addEventListener("wheel", handleFontListWheel, { passive: false });
ui.list.addEventListener("scroll", closeAllFamilyMenus, { passive: true });
$("#themeButton").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  applyCardPreviewStyleToAllCards();
  persistUiSettings();
});
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
  syncDetailPanelToggle(collapsed);
  persistUiSettings();
});
$("#cardAreaToggle").addEventListener("click", () => {
  const area = $(".card-area");
  const collapsed = area.classList.toggle("collapsed");
  syncCardAreaToggle(collapsed);
  persistUiSettings();
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
  persistUiSettings();
});
document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); ui.search.focus(); }
});
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
  if (event.target.closest(".card-family-option")) return;
  if (event.target.closest(".card-family-switch")) {
    if (state.hovered !== font) {
      state.hovered = font;
      previewFont(font, true);
    }
    hideMagnifier(ui.cardMagnifier);
    return;
  }
  if (state.hovered !== font) {
    state.hovered = font;
    previewFont(font, true);
  }
  const skipMagnifier = Boolean(event.target.closest(".card-family-switch, .card-actions, .star")) ||
    card.querySelector(".card-family-switch.is-open");
  if (!state.magnifier || skipMagnifier) {
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
  ui.cardMagnifier.style.backgroundColor = resolveMagnifierBackground(cardStyle.backgroundColor, "--panel");
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
  applyCardPreviewStyleToMagnifierText(enlarged, sampleStyle);
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
if ("ResizeObserver" in window) {
  const viewShell = ui.list?.closest(".font-view-shell");
  const pageArea = ui.list?.closest(".font-page-area");
  const handleGridViewportResize = () => {
    scheduleCardFit();
    clearTimeout(ui.list.pageResizeTimer);
    ui.list.pageResizeTimer = setTimeout(() => {
      if (calculatePageSize() !== state.pageSize) renderFontList();
    }, 120);
  };
  const gridResizeObserver = new ResizeObserver(handleGridViewportResize);
  if (viewShell) gridResizeObserver.observe(viewShell);
  else if (pageArea) gridResizeObserver.observe(pageArea);
  else gridResizeObserver.observe(ui.list);
}

renderCategoryUI();
renderSearchSuggestions();
applyStoredUiSettings(uiSettings);
updateVisualSettings();
updatePreview();
syncDetailPreviewStage();
updateCardSampleSizeControl();
syncCardGridLayoutVars();
wireCardPreviewStyleModal();
wireCardPreviewStyleQuickMenu();
if (!("queryLocalFonts" in window)) ui.support.textContent = "当前浏览器可能不支持系统字体读取，请使用最新版 Chrome 或 Edge。";
