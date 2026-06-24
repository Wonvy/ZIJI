const $ = (selector) => document.querySelector(selector);
const DEFAULT_DETAIL_PREVIEW = `天地玄黄 宇宙洪荒
ABCDEFGHIJKLMNOPQRSTUVWXYZ
abcdefghijklmnopqrstuvwxyz
0123456789
，。！？；：“”「」`;
const PREVIEW_TEXT_HISTORY_KEY = "font-preview-text-history";
const PREVIEW_TEXT_HISTORY_LIMIT = 10;
const COMMON_SEARCH_TERMS = ["黑", "宋", "楷", "圆", "仿宋", "等线", "手写", "书法", "像素"];
const DEFAULT_CHINESE_BRANDS = ["思源", "方正", "汉仪", "华文", "仓耳", "阿里巴巴", "站酷", "霞鹜", "鸿蒙", "小米", "文泉驿"];
const SEARCH_BRANDS_CACHE_KEY = "font-search-brands-v3";
const MIN_CHINESE_BRAND_LENGTH = 2;
const MAX_CHINESE_BRAND_LENGTH = 4;
const MIN_CHINESE_BRAND_OCCURRENCES = 2;
function loadCachedSearchBrands() {
  try {
    const value = JSON.parse(localStorage.getItem(SEARCH_BRANDS_CACHE_KEY) || "[]");
    return Array.isArray(value) ? normalizeChineseBrandList(value) : [];
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
    const collapsedCategoryIds = Array.isArray(data.collapsedCategoryIds) ? data.collapsedCategoryIds : [];
    return { categories, assignments, recentCategories, collapsedCategoryIds };
  } catch {
    return { categories: [], assignments: new Map(), recentCategories: [], collapsedCategoryIds: [] };
  }
}
const cachedFavoriteData = loadFavoriteData();
const UI_SETTINGS_KEY = "webfonts-ui-settings";
const UI_SETTINGS_VERSION = 1;
const SORT_I18N_KEYS = {
  name: "sort.name",
  favorite: "sort.favorite",
  "chinese-first": "sort.chineseFirst",
  "latin-first": "sort.latinFirst",
  square: "sort.square",
  narrow: "sort.narrow",
  wide: "sort.wide"
};
const CARD_GRID_GAP = 14;
const CARD_GRID_PADDING_BLOCK = 24;
const CARD_GRID_META_HEIGHT = 39;
const CARD_MIN_WIDTH = 140;
const CARD_COLUMNS_MIN = 1;
const CARD_COLUMNS_MAX = 12;
const CARD_COLUMNS_DEFAULT = 7;
const CARD_ROWS_MIN = 1;
const CARD_ROWS_MAX = 12;
const CARD_ROWS_DEFAULT = 4;

function normalizeView(view) {
  return view === "list" ? "grid" : view;
}

function clampCardColumns(value, max = CARD_COLUMNS_MAX) {
  return Math.max(CARD_COLUMNS_MIN, Math.min(max, Math.round(Number(value) || CARD_COLUMNS_DEFAULT)));
}

function clampCardRows(value, max = CARD_ROWS_MAX) {
  return Math.max(CARD_ROWS_MIN, Math.min(max, Math.round(Number(value) || CARD_ROWS_DEFAULT)));
}

function clampSingleCardSize(value) {
  return Math.max(48, Math.min(180, Math.round(Number(value) || UI_SETTINGS_DEFAULTS.singleCardSize)));
}

function clampTopbarHeight(value) {
  return Math.max(58, Math.min(160, Math.round(Number(value) || UI_SETTINGS_DEFAULTS.topbarHeight)));
}

function deriveCardColumnsFromWidth(cardWidth, containerWidth = 1100) {
  return clampCardColumns(Math.floor((containerWidth + CARD_GRID_GAP) / (Number(cardWidth) + CARD_GRID_GAP)));
}

function resolveCardColumns(settings = {}, max = CARD_COLUMNS_MAX) {
  if (Number.isFinite(Number(settings.cardColumns))) return clampCardColumns(settings.cardColumns, max);
  if (Number.isFinite(Number(settings.cardWidth))) return deriveCardColumnsFromWidth(settings.cardWidth);
  return clampCardColumns(CARD_COLUMNS_DEFAULT, max);
}

function resolveCardRows(settings = {}, max = CARD_ROWS_MAX) {
  if (Number.isFinite(Number(settings.cardRows))) return clampCardRows(settings.cardRows, max);
  return clampCardRows(Math.min(CARD_ROWS_DEFAULT, max), max);
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

function getCardGridRowCountOnPage() {
  const layout = getCardGridLayout();
  const pageSize = state.pageSize || layout.columns * layout.rows;
  const itemsOnPage = Math.min(pageSize, Math.max(0, state.filtered.length - state.page * pageSize));
  if (!itemsOnPage) return layout.rows;
  return Math.max(1, Math.ceil(itemsOnPage / layout.columns));
}

function getCardGridMaxHeight(rowCount = getCardGridRowCountOnPage()) {
  const min = getCardGridCardHeight();
  const { height } = getFontGridViewportSize();
  const rows = Math.max(1, rowCount);
  if (!height) return min;
  return Math.max(min, Math.floor((height - Math.max(0, rows - 1) * CARD_GRID_GAP) / rows));
}

function syncCardGridLayoutVars() {
  if (!ui.list) return;
  const sampleHeight = getCardGridSampleHeight();
  const cardHeight = getCardGridCardHeight();
  const rowPitch = getCardGridRowPitch();
  ui.list.style.setProperty("--card-grid-sample-height", `${sampleHeight}px`);
  ui.list.style.setProperty("--card-grid-min-height", `${cardHeight}px`);
  ui.list.style.setProperty("--card-grid-row-pitch", `${rowPitch}px`);
  if (["grid", "focus"].includes(state.view)) {
    ui.list.style.setProperty("--card-grid-max-height", `${getCardGridMaxHeight()}px`);
  } else {
    ui.list.style.removeProperty("--card-grid-max-height");
  }
}

function getFontGridViewportSize() {
  const pageArea = ui.list?.closest(".font-page-area");
  const listStyles = ui.list ? getComputedStyle(ui.list) : null;
  const padX = listStyles ? parseFloat(listStyles.paddingLeft) + parseFloat(listStyles.paddingRight) : 72;
  const padY = listStyles ? parseFloat(listStyles.paddingTop) + parseFloat(listStyles.paddingBottom) : 64;
  let viewportWidth = ui.list?.clientWidth || pageArea?.clientWidth || 800;
  let viewportHeight = pageArea?.clientHeight || ui.list?.parentElement?.clientHeight || 500;
  if (!viewportHeight) {
    const measureEl = ui.list?.closest(".font-view-shell");
    if (measureEl) {
      const rect = measureEl.getBoundingClientRect();
      if (rect.height > 0) viewportHeight = rect.height;
    }
  }
  return {
    width: Math.max(320, viewportWidth - padX),
    height: Math.max(getCardGridCardHeight(), viewportHeight - padY)
  };
}

function getCardGridCapacity() {
  const { width, height } = getFontGridViewportSize();
  const rowPitch = getCardGridRowPitch();
  const maxColumns = Math.max(CARD_COLUMNS_MIN, Math.floor((width + CARD_GRID_GAP) / (CARD_MIN_WIDTH + CARD_GRID_GAP)));
  const maxRows = Math.max(CARD_ROWS_MIN, Math.floor((height + CARD_GRID_GAP) / rowPitch));
  return { width, height, maxColumns, maxRows, rowPitch };
}

function getCardGridLayout() {
  const capacity = getCardGridCapacity();
  const columns = clampCardColumns(state.cardColumns, capacity.maxColumns);
  const rows = clampCardRows(state.cardRows, capacity.maxRows);
  const cardWidth = Math.max(CARD_MIN_WIDTH, Math.floor((capacity.width - (columns - 1) * CARD_GRID_GAP) / columns));
  return { ...capacity, columns, rows, cardWidth };
}

function getSingleViewGridLayout() {
  const { width, height } = getFontGridViewportSize();
  const size = clampSingleCardSize(state.singleCardSize);
  const columns = Math.max(1, Math.floor(width / size));
  const rows = Math.max(1, Math.floor(height / size));
  return { width, height, size, columns, rows };
}

function syncCardGridControls() {
  const capacity = getCardGridCapacity();
  const isSingle = state.view === "single";
  state.cardColumns = clampCardColumns(state.cardColumns, capacity.maxColumns);
  state.cardRows = clampCardRows(state.cardRows, capacity.maxRows);
  state.singleCardSize = clampSingleCardSize(state.singleCardSize);
  const colInput = $("#cardColumns");
  const rowInput = $("#cardRows");
  const colOutput = $("#cardColumnsOutput");
  const rowOutput = $("#cardRowsOutput");
  const colControl = colInput?.closest(".grid-layout-control");
  const rowControl = rowInput?.closest(".grid-layout-control");
  const singleControl = $("#singleCardSizeControl");
  const singleInput = $("#singleCardSize");
  const singleOutput = $("#singleCardSizeOutput");
  if (colControl) colControl.hidden = isSingle;
  if (rowControl) rowControl.hidden = isSingle;
  if (singleControl) singleControl.hidden = !isSingle;
  if (colInput) {
    colInput.disabled = isSingle;
    colInput.min = String(CARD_COLUMNS_MIN);
    colInput.max = String(capacity.maxColumns);
    colInput.value = String(state.cardColumns);
  }
  if (rowInput) {
    rowInput.disabled = isSingle;
    rowInput.min = String(CARD_ROWS_MIN);
    rowInput.max = String(capacity.maxRows);
    rowInput.value = String(state.cardRows);
  }
  if (singleInput) {
    singleInput.disabled = !isSingle;
    singleInput.value = String(state.singleCardSize);
  }
  if (colOutput) colOutput.textContent = String(state.cardColumns);
  if (rowOutput) rowOutput.textContent = String(state.cardRows);
  if (singleOutput) singleOutput.textContent = String(state.singleCardSize);
  if (!isSingle) syncSingleCardSizeBubble(false);
}

function sortLabel(sort) {
  return t(SORT_I18N_KEYS[sort] || "sort.name");
}

function defaultCardPreviewText() {
  return t("defaults.cardPreviewText");
}

function updateDynamicTranslations() {
  applyStaticTranslations();
  syncMagnifierControl();
  syncDetailPanelToggle($("#detailPanel")?.classList.contains("collapsed"));
  syncCardAreaToggle($("#cardArea")?.classList.contains("collapsed"));
  if (ui.load) ui.load.textContent = t("welcome.loadFonts");
  if (!("queryLocalFonts" in window) && ui.support && !ui.support.dataset.errorMessage) {
    ui.support.textContent = t("welcome.supportNoApi");
  }
  updateFilterControls();
  updateFontStatus(state.previewed || null);
  renderCardPreviewStyleQuickMenu();
  if (!ui.workspace.hidden && state.filtered.length >= 0) {
    const start = state.page * state.pageSize;
    const pageFonts = state.filtered.slice(start, start + state.pageSize);
    renderPaginationSummary(pageFonts.length, start);
  }
}
const UI_SETTINGS_DEFAULTS = {
  theme: "light",
  view: "grid",
  cardColumns: 7,
  cardRows: 4,
  singleCardSize: 82,
  topbarHeight: 88,
  cardSampleSize: 49,
  sort: "name",
  magnifier: true,
  filters: [],
  languageFilter: "all",
  weightFilters: [],
  previewFontSize: 28,
  previewLetterSpacing: 0,
  previewLineHeight: 1.2,
  previewBackground: "#eee8dc",
  previewTextColor: "#181816",
  previewColorsCustomized: false,
  detailTab: "preview",
  detailPanelCollapsed: false,
  cardAreaCollapsed: false,
  detailPanelWidth: null,
  favoriteSidebarWidth: null,
  favoriteCategoryView: "all",
  collapseFamilyFonts: false,
  cardPreviewStyle: null,
  cardPreviewStylePresets: [],
  activeCardPreviewStylePresetId: null,
  builtInCardPreviewStylePresetVersion: 0
};

const LEGACY_LIGHT_PREVIEW_BG = "#f3efe7";
const LEGACY_LIGHT_PREVIEW_TEXT = "#171714";

function getThemePreviewColors() {
  const isDark = document.body.classList.contains("dark");
  return isDark
    ? { background: "#1a1917", text: "#f4efe6" }
    : { background: "#eee8dc", text: "#181816" };
}

function resolvePreviewColorsCustomized(settings = {}) {
  if (typeof settings.previewColorsCustomized === "boolean") return settings.previewColorsCustomized;
  const bg = settings.previewBackground || UI_SETTINGS_DEFAULTS.previewBackground;
  const color = settings.previewTextColor || UI_SETTINGS_DEFAULTS.previewTextColor;
  return !(
    (bg === LEGACY_LIGHT_PREVIEW_BG || bg === UI_SETTINGS_DEFAULTS.previewBackground)
    && (color === LEGACY_LIGHT_PREVIEW_TEXT || color === UI_SETTINGS_DEFAULTS.previewTextColor)
  );
}

function applyThemePreviewColorsIfDefault() {
  if (state.previewColorsCustomized) return;
  const colors = getThemePreviewColors();
  ui.bg.value = colors.background;
  ui.color.value = colors.text;
}

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
const COLOR_MODE_OPTIONS = [
  { value: "solid", label: "纯色" },
  { value: "gradient", label: "线性渐变" }
];
const DEFAULT_LINEAR_GRADIENT_STOPS = [
  { color: "#000000", opacity: 100, offset: 0 },
  { color: "#ffffff", opacity: 100, offset: 100 }
];
const PREVIEW_STYLE_FILL_LAYER_ID = "__fill__";
const MANAGE_PRESET_PREVIEW_CHAR = "永";
const BUILT_IN_CARD_PREVIEW_STYLE_PRESET_VERSION = 1;
const PREVIEW_EFFECT_TYPES = {
  dropShadow: {
    label: "投影",
    fields: [
      { key: "color", type: "color", label: "颜色" },
      { key: "opacity", type: "range", label: "不透明度", min: 0, max: 100, step: 1 },
      { key: "angle", type: "range", label: "角度", min: 0, max: 360, step: 1 },
      { key: "distance", type: "range", label: "距离", min: 0, max: 80, step: 1 },
      { key: "blur", type: "range", label: "模糊", min: 0, max: 40, step: 1 }
    ],
    defaults: { color: "#000000", opacity: 35, angle: 56, distance: 4, blur: 4 }
  },
  stroke: {
    label: "轮廓",
    fields: [
      { key: "color", type: "color", label: "颜色" },
      { key: "opacity", type: "range", label: "不透明度", min: 0, max: 100, step: 1 },
      { key: "width", type: "range", label: "粗细", min: 1, max: 16, step: 1 },
      { key: "blur", type: "range", label: "模糊", min: 0, max: 40, step: 1 },
      { key: "offsetAngle", type: "range", label: "偏移角度", min: 0, max: 360, step: 1 },
      { key: "offsetDistance", type: "range", label: "偏移距离", min: 0, max: 80, step: 1 },
      { key: "position", type: "select", label: "位置", options: STROKE_POSITION_OPTIONS }
    ],
    defaults: {
      color: "#000000",
      color2: "#e85832",
      opacity: 100,
      width: 2,
      blur: 0,
      position: "outside",
      offsetAngle: 0,
      offsetDistance: 0,
      colorMode: "solid",
      angle: 90,
      stops: [
        { color: "#000000", opacity: 100, offset: 0 },
        { color: "#e85832", opacity: 100, offset: 100 }
      ]
    }
  }
};
const BUILT_IN_CARD_PREVIEW_STYLE_PRESETS = [
  {
    id: "built-in-douyin",
    name: "抖音字",
    style: {
      fill: { enabled: true, mode: "solid", color: "#ffffff", opacity: 100 },
      layers: [
        { id: "built-in-douyin-cyan", type: "dropShadow", enabled: true, color: "#00f5ff", opacity: 95, angle: 225, distance: 3, blur: 0 },
        { id: "built-in-douyin-red", type: "dropShadow", enabled: true, color: "#ff2d55", opacity: 95, angle: 45, distance: 3, blur: 0 },
        { id: "built-in-douyin-stroke", type: "stroke", enabled: true, color: "#101014", opacity: 100, width: 2, blur: 0, position: "outside" }
      ],
      layerOrder: [PREVIEW_STYLE_FILL_LAYER_ID, "built-in-douyin-red", "built-in-douyin-cyan", "built-in-douyin-stroke"]
    }
  },
  {
    id: "built-in-hollow",
    name: "空心字",
    style: {
      fill: { enabled: false, mode: "solid", color: "#ffffff", opacity: 0 },
      layers: [
        { id: "built-in-hollow-stroke", type: "stroke", enabled: true, color: "#e85832", opacity: 100, width: 3, blur: 0, position: "center" }
      ],
      layerOrder: ["built-in-hollow-stroke", PREVIEW_STYLE_FILL_LAYER_ID]
    }
  },
  {
    id: "built-in-neon",
    name: "霓虹描边",
    style: {
      fill: { enabled: true, mode: "solid", color: "#101014", opacity: 100 },
      layers: [
        { id: "built-in-neon-stroke", type: "stroke", enabled: true, color: "#7c3cff", opacity: 100, width: 2, blur: 0, position: "outside" },
        { id: "built-in-neon-glow", type: "dropShadow", enabled: true, color: "#00d8ff", opacity: 80, angle: 90, distance: 0, blur: 12 }
      ],
      layerOrder: [PREVIEW_STYLE_FILL_LAYER_ID, "built-in-neon-stroke", "built-in-neon-glow"]
    }
  },
  {
    id: "built-in-metal",
    name: "金属渐变",
    style: {
      fill: {
        enabled: true,
        mode: "gradient",
        angle: 90,
        opacity: 100,
        stops: [
          { color: "#2a2c31", opacity: 100, offset: 0 },
          { color: "#ffffff", opacity: 100, offset: 42 },
          { color: "#7b7f88", opacity: 100, offset: 100 }
        ]
      },
      layers: [
        { id: "built-in-metal-shadow", type: "dropShadow", enabled: true, color: "#000000", opacity: 28, angle: 60, distance: 4, blur: 5 }
      ],
      layerOrder: [PREVIEW_STYLE_FILL_LAYER_ID, "built-in-metal-shadow"]
    }
  },
  {
    id: "built-in-soft-shadow",
    name: "柔和投影",
    style: {
      fill: { enabled: true, mode: "solid", color: "#e85832", opacity: 100 },
      layers: [
        { id: "built-in-soft-shadow-layer", type: "dropShadow", enabled: true, color: "#000000", opacity: 24, angle: 56, distance: 8, blur: 12 }
      ],
      layerOrder: [PREVIEW_STYLE_FILL_LAYER_ID, "built-in-soft-shadow-layer"]
    }
  },
  {
    id: "built-in-candy",
    name: "糖果渐变",
    style: {
      fill: {
        enabled: true,
        mode: "gradient",
        angle: 35,
        opacity: 100,
        stops: [
          { color: "#ff4fd8", opacity: 100, offset: 0 },
          { color: "#ffe66d", opacity: 100, offset: 52 },
          { color: "#32d6ff", opacity: 100, offset: 100 }
        ]
      },
      layers: [
        { id: "built-in-candy-stroke", type: "stroke", enabled: true, color: "#ffffff", opacity: 100, width: 2, blur: 0, position: "outside" },
        { id: "built-in-candy-shadow", type: "dropShadow", enabled: true, color: "#000000", opacity: 20, angle: 60, distance: 3, blur: 4 }
      ],
      layerOrder: [PREVIEW_STYLE_FILL_LAYER_ID, "built-in-candy-stroke", "built-in-candy-shadow"]
    }
  }
];
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
  if (type === "dropShadow" && !Number.isFinite(Number(layer.angle)) && !Number.isFinite(Number(layer.distance))) {
    const migrated = shadowAngleDistanceFromOffset(layer.offsetX, layer.offsetY);
    normalized.angle = migrated.angle;
    normalized.distance = migrated.distance;
  }
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

function applyInitialLinearGradientStops(target) {
  target.stops = DEFAULT_LINEAR_GRADIENT_STOPS.map(stop => ({ ...stop }));
  target.color = target.stops[0].color;
  target.color2 = target.stops[target.stops.length - 1].color;
  if (!Number.isFinite(Number(target.angle))) target.angle = 90;
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
  const seenIds = new Set();
  normalized.forEach(layer => {
    if (!layer.id || seenIds.has(layer.id)) layer.id = nextPreviewStyleLayerId();
    seenIds.add(layer.id);
  });
  for (const type of PREVIEW_EFFECT_TYPE_ORDER) {
    if (!normalized.some(layer => layer.type === type)) normalized.push(createPreviewStyleLayer(type, false));
  }
  return normalized;
}

function normalizeCardPreviewStyle(raw) {
  const style = cloneCardPreviewStyle(CARD_PREVIEW_STYLE_DEFAULTS);
  if (!raw || typeof raw !== "object") {
    style.layers = ensureDefaultPreviewLayers([]);
    style.layerOrder = resolveStyleLayerOrder(style);
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
  style.layerOrder = resolveStyleLayerOrder(style, raw.layerOrder);
  return style;
}

function resolveStyleLayerOrder(style, rawOrder) {
  const layerIds = (style.layers || []).map(layer => layer.id);
  let order = Array.isArray(rawOrder) ? rawOrder.map(String) : [PREVIEW_STYLE_FILL_LAYER_ID, ...layerIds];
  order = order.filter(key => key === PREVIEW_STYLE_FILL_LAYER_ID || layerIds.includes(key));
  order = [...new Set(order)];
  layerIds.forEach(id => {
    if (!order.includes(id)) order.push(id);
  });
  if (!order.includes(PREVIEW_STYLE_FILL_LAYER_ID)) order.unshift(PREVIEW_STYLE_FILL_LAYER_ID);
  return order;
}

function syncStyleLayerOrder(draft = cardPreviewStyleDraft) {
  if (!draft) return;
  draft.layerOrder = resolveStyleLayerOrder(draft, draft.layerOrder);
  const layerIds = draft.layerOrder.filter(key => key !== PREVIEW_STYLE_FILL_LAYER_ID);
  draft.layers = layerIds.map(id => draft.layers.find(layer => layer.id === id)).filter(Boolean);
}

function getMaxDetailPanelWidth() {
  return Math.max(320, Math.min(520, Math.floor(window.innerWidth * 0.48)));
}

function getMaxFavoriteSidebarWidth() {
  return Math.max(240, Math.min(360, Math.floor(window.innerWidth * 0.32)));
}

function clampFavoriteSidebarWidth(width) {
  return Math.max(190, Math.min(Number(width) || 210, getMaxFavoriteSidebarWidth()));
}

function normalizeLayoutSettings(settings) {
  const normalized = { ...settings };
  if (normalized.detailPanelWidth) {
    normalized.detailPanelWidth = Math.max(320, Math.min(normalized.detailPanelWidth, getMaxDetailPanelWidth()));
  }
  if (normalized.favoriteSidebarWidth) {
    normalized.favoriteSidebarWidth = clampFavoriteSidebarWidth(normalized.favoriteSidebarWidth);
  }
  normalized.topbarHeight = clampTopbarHeight(normalized.topbarHeight);
  normalized.cardAreaCollapsed = false;
  return normalized;
}

function applyTopbarHeight(height) {
  document.documentElement.style.setProperty("--topbar-height", `${clampTopbarHeight(height)}px`);
}

function loadUiSettings() {
  try {
    const raw = localStorage.getItem(UI_SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const settings = normalizeLayoutSettings({ ...UI_SETTINGS_DEFAULTS, ...parsed });
    if ((Number(parsed.builtInCardPreviewStylePresetVersion) || 0) < BUILT_IN_CARD_PREVIEW_STYLE_PRESET_VERSION) {
      const existingPresets = Array.isArray(settings.cardPreviewStylePresets) ? settings.cardPreviewStylePresets : [];
      const existingIds = new Set(existingPresets.map(preset => String(preset?.id || "")));
      settings.cardPreviewStylePresets = [
        ...existingPresets,
        ...cloneBuiltInCardPreviewStylePresets().filter(preset => !existingIds.has(preset.id))
      ];
      settings.builtInCardPreviewStylePresetVersion = BUILT_IN_CARD_PREVIEW_STYLE_PRESET_VERSION;
    }
    if (!raw) {
      const legacyCardSize = localStorage.getItem("card-sample-size");
      if (legacyCardSize !== null) settings.cardSampleSize = Number(legacyCardSize) || settings.cardSampleSize;
    }
    return settings;
  } catch {
    return {
      ...UI_SETTINGS_DEFAULTS,
      cardPreviewStylePresets: cloneBuiltInCardPreviewStylePresets(),
      builtInCardPreviewStylePresetVersion: BUILT_IN_CARD_PREVIEW_STYLE_PRESET_VERSION
    };
  }
}

function cloneBuiltInCardPreviewStylePresets() {
  return BUILT_IN_CARD_PREVIEW_STYLE_PRESETS.map(preset => ({
    id: preset.id,
    name: preset.name,
    style: cloneCardPreviewStyle(preset.style),
    updatedAt: 0
  }));
}
function collectUiSettings() {
  const detailPanel = $("#detailPanel");
  return {
    version: UI_SETTINGS_VERSION,
    uiLocale: getLocale(),
    theme: document.body.classList.contains("dark") ? "dark" : "light",
    view: state.view,
    cardColumns: state.cardColumns,
    cardRows: state.cardRows,
    singleCardSize: state.singleCardSize,
    topbarHeight: clampTopbarHeight(parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topbar-height"))),
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
    previewColorsCustomized: state.previewColorsCustomized,
    detailTab: $("#infoTabPanel").classList.contains("active") ? "info" : "preview",
    detailPanelCollapsed: detailPanel?.classList.contains("collapsed") ?? false,
    cardAreaCollapsed: false,
    detailPanelWidth: detailPanel?.dataset.openWidth ? Number(detailPanel.dataset.openWidth) : null,
    favoriteSidebarWidth: ui.favoriteSidebar?.dataset.openWidth ? Number(ui.favoriteSidebar.dataset.openWidth) : null,
    favoriteCategoryView: state.favoriteCategoryView,
    collapseFamilyFonts: state.collapseFamilyFonts,
    cardPreviewStyle: state.cardPreviewStyle,
    cardPreviewStylePresets: state.cardPreviewStylePresets,
    activeCardPreviewStylePresetId: state.activeCardPreviewStylePresetId,
    builtInCardPreviewStylePresetVersion: BUILT_IN_CARD_PREVIEW_STYLE_PRESET_VERSION
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
  const labelKey = state.magnifier ? "header.magnifierOff" : "header.magnifierOn";
  ui.magnifierButton.title = t(labelKey);
  ui.magnifierButton.setAttribute("aria-label", t(labelKey));
  ui.magnifierButton.setAttribute("aria-pressed", String(state.magnifier));
}
function syncDetailPanelToggle(collapsed) {
  const key = collapsed ? "panel.expandDetail" : "panel.collapseDetail";
  $("#detailToggle").title = t(key);
  $("#detailToggle").setAttribute("aria-label", t(key));
}
function syncCardAreaToggle(collapsed) {
  const key = collapsed ? "panel.expandLibrary" : "panel.collapseLibrary";
  $("#cardAreaToggle").title = t(key);
  $("#cardAreaToggle").setAttribute("aria-label", t(key));
}
function applyStoredUiSettings(settings) {
  document.body.classList.toggle("dark", settings.theme === "dark");
  applyTopbarHeight(settings.topbarHeight);
  ui.size.value = settings.previewFontSize;
  ui.spacing.value = settings.previewLetterSpacing;
  ui.lineHeight.value = settings.previewLineHeight;
  state.previewColorsCustomized = resolvePreviewColorsCustomized(settings);
  if (state.previewColorsCustomized) {
    ui.bg.value = settings.previewBackground;
    ui.color.value = settings.previewTextColor;
  } else {
    applyThemePreviewColorsIfDefault();
  }
  state.cardColumns = resolveCardColumns(settings);
  state.cardRows = resolveCardRows(settings);
  syncCardGridControls();
  syncMagnifierControl();
  const detailPanel = $("#detailPanel");
  const cardArea = $(".card-area");
  const maxDetailWidth = getMaxDetailPanelWidth();
  if (settings.detailPanelCollapsed) {
    detailPanel.classList.add("collapsed");
    detailPanel.style.width = "";
    detailPanel.style.minWidth = "";
    detailPanel.style.maxWidth = "";
  } else if (settings.detailPanelWidth) {
    const width = Math.max(320, Math.min(settings.detailPanelWidth, maxDetailWidth));
    detailPanel.dataset.openWidth = String(width);
    detailPanel.style.width = `${width}px`;
    detailPanel.style.minWidth = `${width}px`;
    detailPanel.style.maxWidth = `${width}px`;
  } else {
    detailPanel.style.maxWidth = "";
  }
  if (settings.favoriteSidebarWidth) {
    const width = clampFavoriteSidebarWidth(settings.favoriteSidebarWidth);
    ui.favoriteSidebar.dataset.openWidth = String(width);
    ui.favoriteSidebar.style.width = `${width}px`;
    ui.favoriteSidebar.style.minWidth = `${width}px`;
    ui.favoriteSidebar.style.flexBasis = `${width}px`;
  }
  cardArea.classList.remove("collapsed");
  syncDetailPanelToggle(settings.detailPanelCollapsed);
  syncCardAreaToggle(false);
  setDetailTab(settings.detailTab);
  updateFilterControls();
  setView(normalizeView(settings.view));
}
const uiSettings = loadUiSettings();
document.body.classList.toggle("dark", uiSettings.theme === "dark");
const loadedCardPreviewStylePresets = normalizeCardPreviewStylePresets(uiSettings.cardPreviewStylePresets);
const state = {
  fonts: [], filtered: [], selected: null, previewed: null, hovered: null, categoryTarget: null, contextFont: null, editingCategoryId: null, draggingCategoryId: null, draggingFontId: null, favoriteCategoryView: uiSettings.favoriteCategoryView, pointerInFontView: false, brandScanRunning: false, prefetchCards: new Set(), filters: new Set(uiSettings.filters), languageFilters: uiSettings.languageFilter === "all" ? new Set() : new Set([uiSettings.languageFilter]), weightFilters: new Set(uiSettings.weightFilters), weightOptions: [], searchBrands: new Set([...DEFAULT_CHINESE_BRANDS, ...loadCachedSearchBrands()]), searchBrandCounts: new Map(), magnifier: uiSettings.magnifier,
  view: normalizeView(uiSettings.view), sort: uiSettings.sort, cardColumns: resolveCardColumns(uiSettings), cardRows: resolveCardRows(uiSettings), cardSampleSize: uiSettings.cardSampleSize, singleCardSize: uiSettings.singleCardSize, page: 0, pageSize: 1, totalPages: 1, preloadVersion: 0, renderVersion: 0, filterVersion: 0, aspectCharacter: "字", selectionVersion: 0, scanningVariables: false, scanningCapabilities: false, scanningShapes: false,
  familyIndex: new Map(), pendingSelectionId: null, collapseFamilyFonts: uiSettings.collapseFamilyFonts,
  cardPreviewStyle: loadStoredCardPreviewStyle(uiSettings.cardPreviewStyle),
  cardPreviewStylePresets: loadedCardPreviewStylePresets,
  activeCardPreviewStylePresetId: resolveActiveCardPreviewStylePresetId(uiSettings.activeCardPreviewStylePresetId, loadedCardPreviewStylePresets),
  previewColorsCustomized: resolvePreviewColorsCustomized(uiSettings),
  favorites: cachedFavorites, categories: cachedFavoriteData.categories, categoryAssignments: cachedFavoriteData.assignments, recentCategories: cachedFavoriteData.recentCategories, collapsedCategoryIds: new Set(cachedFavoriteData.collapsedCategoryIds || []),
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
  support: $("#supportNote"), search: $("#searchInput"), searchClear: $("#searchClearButton"), list: $("#fontList"), count: $("#fontCount"),
  pagination: $("#paginationBar"), previousPage: $("#previousPage"), nextPage: $("#nextPage"), pageInfo: $("#pageInfo"), fontStatus: $("#fontStatus"), viewStatus: $("#viewStatus"), cardSampleSize: $("#cardSampleSize"), cardSampleSizeBubble: $("#cardSampleSizeBubble"),
  empty: $("#emptyState"), previewInput: $("#previewInput"), previewInputHistory: $("#previewInputHistory"), previewText: $("#previewText"),
  selectedName: $("#selectedName"), selectedStyle: $("#selectedStyle"), size: $("#fontSize"), sizeOut: $("#fontSizeOutput"),
  stage: $("#previewStage"), magnifier: $("#magnifier"), magnifiedText: $("#magnifiedText"), magnifierButton: $("#magnifierButton"),
  cardMagnifier: $("#cardMagnifier"), cardMagnifiedText: $("#cardMagnifiedText"),
  hoverPreviewOverlay: $("#hoverPreviewOverlay"), hoverPreviewSample: $("#hoverPreviewSample"), hoverPreviewSubsamples: $("#hoverPreviewSubsamples"), hoverPreviewName: $("#hoverPreviewName"), hoverPreviewStyle: $("#hoverPreviewStyle"),
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
  toast(t("toast.copied", {
    label,
    value: `${value.replace(/\s+/g, " ").trim().slice(0, 40)}${value.replace(/\s+/g, " ").trim().length > 40 ? "…" : ""}`
  }));
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
  suppressSearchSuggestions = true;
  hideSearchSuggestions();
  syncSearchClearVisibility();
  ui.search.focus();
}

function syncSearchClearVisibility() {
  if (!ui.searchClear) return;
  ui.searchClear.hidden = !ui.search.value.length;
}

function renderSearchSuggestions() {
  const current = ui.search.value.trim();
  const renderTags = terms => terms.map(term => `<button type="button" class="suggestion-tag${current === term ? " active" : ""}" data-search-term="${escapeHtml(term)}">${escapeHtml(term)}</button>`).join("");
  const renderBrandTags = brands => brands.map(brand => {
    const count = state.searchBrandCounts.get(brand) || 0;
    const countHtml = count > 0 ? `<span class="suggestion-tag-count">${count}</span>` : "";
    return `<button type="button" class="suggestion-tag brand-suggestion-tag${current === brand ? " active" : ""}" data-search-term="${escapeHtml(brand)}"><span>${escapeHtml(brand)}</span>${countHtml}</button>`;
  }).join("");
  ui.commonSearchTags.innerHTML = renderTags(COMMON_SEARCH_TERMS);
  const brands = normalizeChineseBrandList(state.searchBrands).sort((a, b) => a.localeCompare(b, "zh-CN"));
  ui.brandSearchTags.innerHTML = brands.length ? renderBrandTags(brands) : `<span class="suggestion-empty">正在扫描中文字体品牌…</span>`;
  ui.searchSuggestions.querySelectorAll("[data-search-term]").forEach(button => {
    button.addEventListener("mousedown", event => event.preventDefault());
    button.addEventListener("click", () => setSearchTerm(button.dataset.searchTerm));
  });
}

function isValidChineseBrandCandidate(value) {
  const length = [...String(value || "")].length;
  return length >= MIN_CHINESE_BRAND_LENGTH && length <= MAX_CHINESE_BRAND_LENGTH && /^\p{Script=Han}+$/u.test(value);
}

function normalizeChineseBrandList(brands) {
  const validBrands = [...new Set([...brands].map(brand => String(brand || "").trim()).filter(isValidChineseBrandCandidate))];
  const defaultBrands = new Set(DEFAULT_CHINESE_BRANDS);
  return validBrands.filter(brand =>
    defaultBrands.has(brand)
    || !DEFAULT_CHINESE_BRANDS.some(defaultBrand => brand !== defaultBrand && brand.startsWith(defaultBrand))
      && !validBrands.some(other => other !== brand && other.startsWith(brand) && [...other].length > [...brand].length)
  );
}

function normalizeChineseFontName(name) {
  return String(name || "").replace(/[\s·・_-]/g, "");
}

function countChineseBrands(names, brands) {
  const counts = new Map();
  const normalizedBrands = normalizeChineseBrandList(brands);
  for (const rawName of names) {
    const name = normalizeChineseFontName(rawName);
    normalizedBrands.forEach(brand => {
      if (name.startsWith(brand)) counts.set(brand, (counts.get(brand) || 0) + 1);
    });
  }
  return counts;
}

function inferChineseBrands(names) {
  const brandCounts = new Map();
  const typePattern = /^(.{2,4}?)(?:黑体|宋体|楷体|圆体|仿宋|等线|明朝体|书体|隶书|行书|草书|魏碑)/;
  const ignored = new Set(["中文", "简体", "繁体", "字体", "新字", "常用"]);
  const addCandidate = (candidates, candidate) => {
    if (!isValidChineseBrandCandidate(candidate) || ignored.has(candidate)) return;
    candidates.add(candidate);
  };
  for (const rawName of names) {
    const name = normalizeChineseFontName(rawName);
    const candidates = new Set();
    const matched = name.match(typePattern);
    if (matched) addCandidate(candidates, matched[1]);
    for (let length = MIN_CHINESE_BRAND_LENGTH; length <= Math.min(MAX_CHINESE_BRAND_LENGTH, [...name].length); length++) {
      const prefix = [...name].slice(0, length).join("");
      addCandidate(candidates, prefix);
    }
    candidates.forEach(candidate => {
      brandCounts.set(candidate, (brandCounts.get(candidate) || 0) + 1);
    });
  }
  const repeatedBrands = [...brandCounts]
    .filter(([, count]) => count >= MIN_CHINESE_BRAND_OCCURRENCES)
    .map(([brand]) => brand)
    .sort((a, b) => [...b].length - [...a].length || a.localeCompare(b, "zh-CN"));
  const inferred = [];
  for (const brand of repeatedBrands) {
    if (!inferred.some(existing => existing.startsWith(brand))) inferred.push(brand);
  }
  return new Set(inferred);
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
      state.searchBrands = new Set(normalizeChineseBrandList(state.searchBrands));
      state.searchBrandCounts = countChineseBrands(chineseNames, state.searchBrands);
      renderSearchSuggestions();
    }
    await new Promise(resolve => setTimeout(resolve, 12));
  }
  inferChineseBrands(chineseNames).forEach(brand => state.searchBrands.add(brand));
  state.searchBrands = new Set(normalizeChineseBrandList(state.searchBrands));
  state.searchBrandCounts = countChineseBrands(chineseNames, state.searchBrands);
  localStorage.setItem(SEARCH_BRANDS_CACHE_KEY, JSON.stringify([...state.searchBrands]));
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

function shouldHeaderCardPreviewBrowsing() {
  return ["grid", "focus", "single"].includes(state.view) && state.pointerInFontView;
}

function shouldHeaderCardPreviewFocus() {
  return shouldHeaderCardPreviewBrowsing() && Boolean(state.hovered);
}

function updateHeaderCardPreviewFocus() {
  document.body.classList.toggle("header-card-preview-browsing", shouldHeaderCardPreviewBrowsing());
  document.body.classList.toggle("header-card-preview-focus", shouldHeaderCardPreviewFocus());
  syncHeaderPreviewFocusDisplay();
}

function syncHeaderPreviewFocusDisplay() {
  const display = $("#headerPreviewFocusDisplay");
  if (!display) return;
  if (!shouldHeaderCardPreviewFocus() || !state.previewed) {
    display.hidden = true;
    display.replaceChildren();
    clearCardPreviewStyleOnElement(display);
    display.style.fontFamily = "";
    display.style.fontVariationSettings = "";
    display.style.color = "";
    return;
  }
  const font = state.previewed;
  const text = fullCardPreviewText();
  display.hidden = false;
  display.textContent = text;
  registerFont(font);
  display.style.fontFamily = cssName(font);
  display.style.fontVariationSettings = toolbarVariationSettings();
  if (state.cardPreviewStyle && hasActiveCardPreviewStyle(state.cardPreviewStyle)) {
    applyCardPreviewStyleToElement(display, state.cardPreviewStyle, { themeDefault: true, text });
  } else {
    clearCardPreviewStyleOnElement(display);
    display.textContent = text;
    display.style.fontFamily = cssName(font);
    display.style.fontVariationSettings = toolbarVariationSettings();
    display.style.color = "var(--ink)";
  }
  ensureFontLoaded(font, text).then(() => {
    if (!display.isConnected || !shouldHeaderCardPreviewFocus()) return;
    display.style.fontFamily = cssName(font);
  });
}

function hideHoverPreviewOverlay() {
  if (!ui.hoverPreviewOverlay) return;
  ui.hoverPreviewOverlay.hidden = true;
  clearCardPreviewStyleOnElement(ui.hoverPreviewSample);
}

function showHoverPreviewOverlay(font = state.hovered) {
  if (!font || !ui.hoverPreviewOverlay || !ui.hoverPreviewSample) return;
  const text = fullCardPreviewText() || "字体有光";
  const displayName = font.displayName || font.family || "";
  const styleName = font.style || "Regular";
  const fullName = font.fullName || [displayName, styleName].filter(Boolean).join(" ");
  registerFont(font);
  ui.hoverPreviewSample.textContent = text;
  ui.hoverPreviewSample.style.fontFamily = cssName(font);
  ui.hoverPreviewSample.style.fontVariationSettings = toolbarVariationSettings();
  if (ui.hoverPreviewSubsamples) {
    ui.hoverPreviewSubsamples.style.fontFamily = cssName(font);
    ui.hoverPreviewSubsamples.style.fontVariationSettings = toolbarVariationSettings();
  }
  if (state.cardPreviewStyle && hasActiveCardPreviewStyle(state.cardPreviewStyle)) {
    applyCardPreviewStyleToElement(ui.hoverPreviewSample, state.cardPreviewStyle, { themeDefault: true, text });
  } else {
    clearCardPreviewStyleOnElement(ui.hoverPreviewSample);
    ui.hoverPreviewSample.textContent = text;
    ui.hoverPreviewSample.style.fontFamily = cssName(font);
    ui.hoverPreviewSample.style.fontVariationSettings = toolbarVariationSettings();
    ui.hoverPreviewSample.style.color = "var(--ink)";
  }
  if (ui.hoverPreviewName) {
    ui.hoverPreviewName.textContent = displayName;
    ui.hoverPreviewName.dataset.copyValue = displayName;
    ui.hoverPreviewName.title = "点击复制字体名称";
  }
  if (ui.hoverPreviewStyle) {
    ui.hoverPreviewStyle.textContent = styleName;
    ui.hoverPreviewStyle.dataset.copyValue = fullName;
    ui.hoverPreviewStyle.title = "点击复制完整字体名称";
  }
  ui.hoverPreviewOverlay.hidden = false;
  ensureFontLoaded(font, text).then(() => {
    if (ui.hoverPreviewOverlay?.hidden) return;
    ui.hoverPreviewSample.style.fontFamily = cssName(font);
    if (ui.hoverPreviewSubsamples) ui.hoverPreviewSubsamples.style.fontFamily = cssName(font);
  });
}

function copyHoverPreviewMeta(target) {
  if (!target?.dataset?.copyValue) return;
  copyValue(target.dataset.copyValue.trim(), target === ui.hoverPreviewStyle ? "完整字体名称" : "字体名称");
}

function toggleHoverPreviewOverlay() {
  if (!ui.hoverPreviewOverlay) return;
  if (!ui.hoverPreviewOverlay.hidden) hideHoverPreviewOverlay();
  else showHoverPreviewOverlay(state.hovered);
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
    ui.support.textContent = t("welcome.supportBlocked");
    toast(t("toast.noLocalFontApi"));
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
    const message = error?.name === "NotAllowedError" ? t("welcome.supportDenied") : t("welcome.supportFailed", { message: error.message });
    ui.support.textContent = message;
    ui.support.dataset.errorMessage = "1";
    setLoadProgress(message, 0);
    toast(message);
  } finally {
    ui.load.disabled = false;
    ui.load.textContent = t("welcome.loadFonts");
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
    if (menu.id === "cardPreviewStylePresetDropdown") return;
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
    const openMenu = () => {
      clearTimeout(menu.closeTimer);
      if (!menu.open) menu.setAttribute("open", "");
    };
    summary.addEventListener("click", event => event.preventDefault());
    menu.addEventListener("toggle", syncPopover);
    menu.addEventListener("mouseenter", openMenu);
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
const CARD_STAR_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m12 3.8 2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 16.04l-4.8 2.52.92-5.34-3.88-3.78 5.36-.78L12 3.8Z"/></svg>`;

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
let managePresetInlineRenamePresetId = null;
const PREVIEW_STYLE_ICON_PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 5v14M5 12h14"/></svg>';
const PREVIEW_STYLE_ICON_TRASH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M9 7V5h6v2M6 7l1 12h10l1-12"/><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M10 11v6M14 11v6"/></svg>';
const PREVIEW_STYLE_ICON_EDIT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M12 20h9M15.5 5.5l3 3L8 19l-4 1 1-4 10.5-10.5z"/></svg>';
let cardPreviewStyleSelectedStopIndex = 0;
let cardPreviewStyleHoverStopIndex = null;
let draggingGradientStopIndex = null;
const PREVIEW_STYLE_GRADIENT_STATUS_HINT = "点击色带添加色标，左右拖动调整位置，向上拖出色带删除（至少保留 2 个）";
const PREVIEW_STYLE_STATUS_HINTS = {
  gradientBar: PREVIEW_STYLE_GRADIENT_STATUS_HINT,
  gradientStop: "单击选中色标，双击修改颜色，左右拖动调整位置",
  gradientStopDelete: "松开鼠标删除该色标（至少保留 2 个）",
  gradientAngle: "拖拽调整渐变角度，按 Shift 吸附 45°，滚轮 1° 微调",
  shadowAngle: "拖拽调整投影角度，按 Shift 吸附 45°，滚轮 1° 微调",
  strokeOffsetAngle: "拖拽调整轮廓偏移角度，按 Shift 吸附 45°，滚轮 1° 微调",
  gradientColor: "调整当前色标颜色",
  gradientOpacity: "调整当前色标不透明度",
  layerList: "拖动调整图层顺序，列表越靠上越在前，勾选启用或禁用",
  layerDuplicate: "复制图层",
  layerMoveUp: "上移选中图层",
  layerMoveDown: "下移选中图层",
  layerDelete: "删除选中图层",
  strokePosition: "选择轮廓相对文字的位置",
  previewFont: "切换预览字体，悬停时滚轮可快速切换",
  previewStage: "实时预览当前样式效果",
  managePreset: "悬停预览效果，点击选中样式",
  manageEdit: "编辑当前选中的样式",
  manageRename: "重命名样式",
  manageDelete: "删除样式",
  manageExport: "导出样式 JSON",
  manageImport: "导入样式 JSON",
  saveDraft: "保存样式到样式库，不关闭窗口也不应用到卡片",
  cancel: "放弃更改并关闭"
};
let draggingGradientScope = null;
let draggingGradientDeleteIntent = false;
let draggingGradientAngleScope = null;
let draggingShadowAngleLayerId = null;
let draggingStrokeOffsetAngleLayerId = null;
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
  syncStyleLayerOrder(cardPreviewStyleDraft);
  const order = cardPreviewStyleDraft.layerOrder;
  const sourceKey = order.indexOf(layerId);
  if (sourceKey >= 0) order.splice(sourceKey + 1, 0, copy.id);
  else order.push(copy.id);
  syncStyleLayerOrder(cardPreviewStyleDraft);
  return copy.id;
}

function removePreviewStyleLayer(layerId) {
  if (!cardPreviewStyleDraft || !layerId) return false;
  const index = cardPreviewStyleDraft.layers.findIndex(layer => layer.id === layerId);
  if (index < 0) return false;
  cardPreviewStyleDraft.layers.splice(index, 1);
  cardPreviewStyleDraft.layerOrder = cardPreviewStyleDraft.layerOrder.filter(key => key !== layerId);
  if (cardPreviewStyleSelectedLayerId === layerId) cardPreviewStyleSelectedLayerId = null;
  syncStyleLayerOrder(cardPreviewStyleDraft);
  return true;
}

function movePreviewStyleLayer(sourceKey, targetKey, before = true) {
  if (!cardPreviewStyleDraft || sourceKey === targetKey) return;
  syncStyleLayerOrder(cardPreviewStyleDraft);
  const order = cardPreviewStyleDraft.layerOrder;
  const from = order.indexOf(sourceKey);
  const to = order.indexOf(targetKey);
  if (from < 0 || to < 0) return;
  const [item] = order.splice(from, 1);
  let insertAt = before ? to : to + 1;
  if (from < to) insertAt--;
  order.splice(insertAt, 0, item);
  syncStyleLayerOrder(cardPreviewStyleDraft);
}

function moveSelectedPreviewStyleLayer(direction) {
  if (!cardPreviewStyleDraft || !cardPreviewStyleSelectedLayerId) return;
  syncStyleLayerOrder(cardPreviewStyleDraft);
  const order = cardPreviewStyleDraft.layerOrder;
  const key = cardPreviewStyleSelectedLayerId;
  const index = order.indexOf(key);
  if (index < 0) return;
  const targetIndex = direction < 0 ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= order.length) return;
  if (order[targetIndex] === PREVIEW_STYLE_FILL_LAYER_ID) return;
  movePreviewStyleLayer(key, order[targetIndex], direction < 0);
}

function syncLayerToolbarState() {
  const upBtn = $("#cardPreviewStyleLayerMoveUp");
  const downBtn = $("#cardPreviewStyleLayerMoveDown");
  const deleteBtn = $("#cardPreviewStyleLayerDelete");
  if (!upBtn || !downBtn || !deleteBtn) return;
  const layerId = cardPreviewStyleSelectedLayerId;
  if (!layerId || !cardPreviewStyleDraft) {
    upBtn.disabled = downBtn.disabled = deleteBtn.disabled = true;
    return;
  }
  syncStyleLayerOrder(cardPreviewStyleDraft);
  const order = cardPreviewStyleDraft.layerOrder;
  const index = order.indexOf(layerId);
  deleteBtn.disabled = index < 0;
  upBtn.disabled = index <= 0 || order[index - 1] === PREVIEW_STYLE_FILL_LAYER_ID;
  downBtn.disabled = index < 0 || index >= order.length - 1;
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

function linearGradientVector(angle) {
  const angleValue = Number(angle) || 0;
  const rad = ((angleValue - 90) * Math.PI) / 180;
  return {
    x: Math.cos(rad),
    y: Math.sin(rad)
  };
}

function linearGradientLineForBounds(bounds, angle) {
  const vector = linearGradientVector(angle);
  const halfWidth = Math.max(0, Number(bounds?.width) || 0) / 2;
  const halfHeight = Math.max(0, Number(bounds?.height) || 0) / 2;
  const centerX = Number(bounds?.x) + halfWidth;
  const centerY = Number(bounds?.y) + halfHeight;
  const radius = Math.max(0.001, Math.abs(vector.x) * halfWidth + Math.abs(vector.y) * halfHeight);
  return {
    x1: centerX - vector.x * radius,
    y1: centerY - vector.y * radius,
    x2: centerX + vector.x * radius,
    y2: centerY + vector.y * radius
  };
}

function appendLinearGradientDef(defsParts, gradId, stops, angle) {
  const line = linearGradientLineForBounds({ x: 0, y: 0, width: 1, height: 1 }, angle);
  const stopMarkup = stops.map(stop =>
    `<stop offset="${formatOutlineNumber(stop.offset)}%" stop-color="${escapeXml(stop.color)}" stop-opacity="${formatOutlineNumber(stop.opacity / 100)}"/>`
  ).join("");
  defsParts.push(`<linearGradient id="${gradId}" gradientUnits="objectBoundingBox" x1="${formatOutlineNumber(line.x1)}" y1="${formatOutlineNumber(line.y1)}" x2="${formatOutlineNumber(line.x2)}" y2="${formatOutlineNumber(line.y2)}">${stopMarkup}</linearGradient>`);
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

function shadowAngleDistanceFromOffset(offsetX, offsetY) {
  const x = Number(offsetX) || 0;
  const y = Number(offsetY) || 0;
  const distance = Math.round(Math.sqrt(x * x + y * y));
  const angle = distance ? (Math.round(Math.atan2(x, -y) * 180 / Math.PI + 360) % 360) : PREVIEW_EFFECT_TYPES.dropShadow.defaults.angle;
  return { angle, distance };
}

function previewShadowOffset(layer, unitsPerPx = 1) {
  const distance = scalePreviewStylePx(Number(layer.distance) || 0, unitsPerPx);
  const angle = Number(layer.angle) || 0;
  const rad = angle * Math.PI / 180;
  return {
    x: Math.sin(rad) * distance,
    y: -Math.cos(rad) * distance
  };
}

function previewStrokeOffset(layer, unitsPerPx = 1) {
  const distance = scalePreviewStylePx(Number(layer.offsetDistance) || 0, unitsPerPx);
  const angle = Number(layer.offsetAngle) || 0;
  const rad = angle * Math.PI / 180;
  return {
    x: Math.cos(rad) * distance,
    y: Math.sin(rad) * distance
  };
}

function strokeOutlineShadows(width, color) {
  return innerStrokeShadows(width, color);
}

function outerStrokeShadows(width, color) {
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

function getEnabledStyleLayerOrder(style) {
  if (!style) return [];
  const normalized = normalizeCardPreviewStyle(style);
  return resolveStyleLayerOrder(normalized, normalized.layerOrder).filter(key => {
    if (key === PREVIEW_STYLE_FILL_LAYER_ID) return normalized.fill.enabled !== false;
    return normalized.layers.find(layer => layer.id === key)?.enabled;
  });
}

function cardPreviewStyleNeedsLayerStack(style) {
  return getEnabledStyleLayerOrder(style).length > 1;
}

function styleNeedsSvgTextPreview(style) {
  if (!style) return false;
  const normalized = normalizeCardPreviewStyle(style);
  return normalized.layers.some(layer => {
    if (!layer.enabled) return false;
    if (layer.type === "dropShadow") return Number(layer.blur) <= 0;
    return isStrokeLayer(layer);
  });
}

const PREVIEW_SVG_NS = "http://www.w3.org/2000/svg";

function createPreviewSvgElement(tag) {
  return document.createElementNS(PREVIEW_SVG_NS, tag);
}

function setPreviewSvgAttrs(element, attrs) {
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null || value === "") return;
    element.setAttribute(key, String(value));
  });
}

function appendPreviewSvgLinearGradient(defs, id, stops, angle, bounds = null) {
  const gradient = createPreviewSvgElement("linearGradient");
  if (bounds) {
    const line = linearGradientLineForBounds(bounds, angle);
    setPreviewSvgAttrs(gradient, {
      id,
      gradientUnits: "userSpaceOnUse",
      x1: formatOutlineNumber(line.x1),
      y1: formatOutlineNumber(line.y1),
      x2: formatOutlineNumber(line.x2),
      y2: formatOutlineNumber(line.y2)
    });
  } else {
    const line = linearGradientLineForBounds({ x: 0, y: 0, width: 1, height: 1 }, angle);
    setPreviewSvgAttrs(gradient, {
      id,
      gradientUnits: "objectBoundingBox",
      x1: formatOutlineNumber(line.x1),
      y1: formatOutlineNumber(line.y1),
      x2: formatOutlineNumber(line.x2),
      y2: formatOutlineNumber(line.y2)
    });
  }
  normalizeGradientStops(stops).forEach(stop => {
    const stopEl = createPreviewSvgElement("stop");
    setPreviewSvgAttrs(stopEl, {
      offset: `${formatOutlineNumber(stop.offset)}%`,
      "stop-color": stop.color,
      "stop-opacity": formatOutlineNumber(stop.opacity / 100)
    });
    gradient.appendChild(stopEl);
  });
  defs.appendChild(gradient);
}

function previewSvgFillValue(fill, defs, suffix, bounds) {
  if (fill.enabled === false) return "none";
  if (fill.mode === "gradient") {
    const id = `preview-svg-fill-gradient-${suffix}`;
    appendPreviewSvgLinearGradient(defs, id, fill.stops, fill.angle, bounds);
    return `url(#${id})`;
  }
  return hexWithOpacity(fill.color, fill.opacity);
}

function previewSvgStrokeValue(layer, defs, suffix, bounds) {
  if (layer.colorMode === "gradient") {
    const id = `preview-svg-stroke-gradient-${suffix}`;
    appendPreviewSvgLinearGradient(defs, id, layer.stops, layer.angle, bounds);
    return `url(#${id})`;
  }
  return hexWithOpacity(layer.color, layer.opacity);
}

function createPreviewSvgUse(sourceId) {
  const use = createPreviewSvgElement("use");
  use.setAttribute("href", `#${sourceId}`);
  use.setAttribute("stroke-linejoin", "round");
  use.setAttribute("stroke-linecap", "round");
  return use;
}

function buildPreviewSvgTextStack(root, host, style) {
  const normalized = normalizeCardPreviewStyle(style);
  const text = root.dataset.previewText || "";
  const sizeEl = root.querySelector(".preview-style-svg-size");
  const computed = getComputedStyle(host || root);
  const fontSize = parseFloat(computed.fontSize) || 49;
  const lineHeightValue = parseFloat(computed.lineHeight);
  const lineHeight = Number.isFinite(lineHeightValue) ? lineHeightValue : fontSize * 1.2;
  const bleed = Math.max(2, computePreviewStyleVisualBleed(normalized, 1) + 2);
  const measuredWidth = Math.ceil(sizeEl?.getBoundingClientRect().width || sizeEl?.offsetWidth || Math.max(1, text.length) * fontSize * 0.6);
  const measuredHeight = Math.ceil(sizeEl?.getBoundingClientRect().height || sizeEl?.offsetHeight || lineHeight);
  const width = Math.max(1, measuredWidth + bleed * 2);
  const height = Math.max(1, measuredHeight + bleed * 2);
  const baseline = bleed + Math.max(fontSize, (measuredHeight + fontSize) / 2 - fontSize * 0.08);
  const svg = createPreviewSvgElement("svg");
  svg.classList.add("preview-style-svg");
  setPreviewSvgAttrs(svg, {
    viewBox: `0 0 ${formatOutlineNumber(width)} ${formatOutlineNumber(height)}`,
    width: formatOutlineNumber(width),
    height: formatOutlineNumber(height),
    "aria-hidden": "true",
    focusable: "false"
  });
  svg.style.fontFamily = computed.fontFamily;
  svg.style.fontSize = computed.fontSize;
  svg.style.fontWeight = computed.fontWeight;
  svg.style.fontStyle = computed.fontStyle;
  svg.style.letterSpacing = computed.letterSpacing;
  svg.style.fontVariationSettings = computed.fontVariationSettings;
  const defs = createPreviewSvgElement("defs");
  const sourceId = `preview-svg-text-${Math.random().toString(36).slice(2)}`;
  const sourceText = createPreviewSvgElement("text");
  sourceText.classList.add("preview-style-svg-source");
  sourceText.textContent = text;
  setPreviewSvgAttrs(sourceText, {
    id: sourceId,
    x: bleed,
    y: baseline,
    "dominant-baseline": "alphabetic"
  });
  defs.appendChild(sourceText);
  svg.appendChild(defs);
  const body = createPreviewSvgElement("g");
  const gradientBounds = {
    x: bleed,
    y: bleed,
    width: measuredWidth,
    height: measuredHeight
  };
  const orderedSvgLayers = getEnabledStyleLayerOrder(normalized).map(key => ({
    key,
    layer: key === PREVIEW_STYLE_FILL_LAYER_ID ? null : normalized.layers.find(item => item.id === key)
  }));
  const fillLayerIndex = orderedSvgLayers.findIndex(item => item.key === PREVIEW_STYLE_FILL_LAYER_ID);
  const svgDrawLayers = [...orderedSvgLayers].reverse();
  svgDrawLayers.forEach(({ key, layer }, index) => {
    if (key === PREVIEW_STYLE_FILL_LAYER_ID) {
      const fillUse = createPreviewSvgUse(sourceId);
      setPreviewSvgAttrs(fillUse, { fill: previewSvgFillValue(normalized.fill, defs, sourceId, gradientBounds), stroke: "none" });
      body.appendChild(fillUse);
      return;
    }
    if (!layer?.enabled) return;
    if (layer.type === "dropShadow") {
      const shadowUse = createPreviewSvgUse(sourceId);
      const shadowOffset = previewShadowOffset(layer);
      setPreviewSvgAttrs(shadowUse, {
        fill: hexWithOpacity(layer.color, layer.opacity),
        stroke: "none",
        transform: `translate(${formatOutlineNumber(shadowOffset.x)} ${formatOutlineNumber(shadowOffset.y)})`
      });
      if (Number(layer.blur) > 0) {
        const filterId = `preview-svg-shadow-${index}`;
        const filter = createPreviewSvgElement("filter");
        setPreviewSvgAttrs(filter, {
          id: filterId,
          x: -bleed,
          y: -bleed,
          width: width + bleed * 2,
          height: height + bleed * 2,
          filterUnits: "userSpaceOnUse",
          "color-interpolation-filters": "sRGB"
        });
        const blur = createPreviewSvgElement("feGaussianBlur");
        setPreviewSvgAttrs(blur, { stdDeviation: Math.max(0, Number(layer.blur) || 0) / 2 });
        filter.appendChild(blur);
        defs.appendChild(filter);
        shadowUse.setAttribute("filter", `url(#${filterId})`);
      }
      body.appendChild(shadowUse);
      return;
    }
    if (!isStrokeLayer(layer)) return;
    const position = resolveStrokePosition(layer);
    const strokeWidth = (Number(layer.width) || 1) * (position === "center" ? 1 : 2);
    const strokeUse = createPreviewSvgUse(sourceId);
    const strokeOffset = previewStrokeOffset(layer);
    const strokeValue = previewSvgStrokeValue(layer, defs, `${sourceId}-${index}`, gradientBounds);
    const layerIndex = orderedSvgLayers.findIndex(item => item.key === key);
    const coversFill = fillLayerIndex >= 0 && layerIndex >= 0 && layerIndex < fillLayerIndex;
    setPreviewSvgAttrs(strokeUse, {
      fill: coversFill ? strokeValue : "none",
      stroke: strokeValue,
      "stroke-width": strokeWidth,
      transform: `translate(${formatOutlineNumber(strokeOffset.x)} ${formatOutlineNumber(strokeOffset.y)})`
    });
    if (position === "inside") {
      const clipId = `preview-svg-clip-${index}`;
      const clipPath = createPreviewSvgElement("clipPath");
      clipPath.setAttribute("id", clipId);
      clipPath.appendChild(createPreviewSvgUse(sourceId));
      defs.appendChild(clipPath);
      strokeUse.setAttribute("clip-path", `url(#${clipId})`);
    }
    if (Number(layer.blur) > 0) {
      const filterId = `preview-svg-stroke-blur-${index}`;
      const filter = createPreviewSvgElement("filter");
      setPreviewSvgAttrs(filter, {
        id: filterId,
        x: -bleed,
        y: -bleed,
        width: width + bleed * 2,
        height: height + bleed * 2,
        filterUnits: "userSpaceOnUse",
        "color-interpolation-filters": "sRGB"
      });
      const blur = createPreviewSvgElement("feGaussianBlur");
      setPreviewSvgAttrs(blur, { stdDeviation: Math.max(0, Number(layer.blur) || 0) / 2 });
      filter.appendChild(blur);
      defs.appendChild(filter);
      strokeUse.setAttribute("filter", `url(#${filterId})`);
    }
    body.appendChild(strokeUse);
  });
  svg.appendChild(body);
  root.querySelector(".preview-style-svg")?.remove();
  root.appendChild(svg);
}

function cardPreviewStyleToEffectCssForLayer(layerId, style = state.cardPreviewStyle) {
  const normalized = normalizeCardPreviewStyle(style);
  const layer = normalized.layers.find(item => item.id === layerId);
  const isolated = cloneCardPreviewStyle(normalized);
  isolated.fill = { ...isolated.fill, enabled: false };
  isolated.layers = isolated.layers.map(item => ({
    ...item,
    enabled: item.id === layerId && item.enabled
  }));
  const css = cardPreviewStyleToEffectCss(isolated, { isolatedStackLayer: true });
  if (layer?.type === "dropShadow") {
    css.color = "transparent";
    css.webkitTextFillColor = "transparent";
  }
  return css;
}

function cardPreviewStyleToFillCss(style = state.cardPreviewStyle) {
  const normalized = normalizeCardPreviewStyle(style);
  const fill = normalized.fill;
  const fillEnabled = fill.enabled !== false;
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
  if (fillEnabled && fill.mode === "gradient") {
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
  return css;
}

function cardPreviewStyleToEffectCss(style = state.cardPreviewStyle, { isolatedStackLayer = false } = {}) {
  const normalized = normalizeCardPreviewStyle(style);
  const css = {
    color: "transparent",
    backgroundImage: "",
    backgroundClip: "",
    webkitBackgroundClip: "",
    webkitTextFillColor: "transparent",
    webkitTextStroke: "",
    textStroke: "",
    paintOrder: "",
    textShadow: "none",
    backgroundSize: "",
    backgroundRepeat: ""
  };
  const shadows = [];
  const strokeLayers = normalized.layers.filter(layer => layer.enabled && isStrokeLayer(layer));
  for (const layer of normalized.layers) {
    if (!layer.enabled) continue;
    if (layer.type === "dropShadow") {
      const offset = previewShadowOffset(layer);
      shadows.push(`${formatOutlineNumber(offset.x)}px ${formatOutlineNumber(offset.y)}px ${layer.blur}px ${hexWithOpacity(layer.color, layer.opacity)}`);
    }
  }
  let primaryWebkit = null;
  strokeLayers.forEach(layer => {
    const width = Number(layer.width) || 1;
    const position = resolveStrokePosition(layer);
    const useGradientStroke = layer.colorMode === "gradient";
    if (useGradientStroke) {
      shadows.unshift(...strokeLayerShadows(width, layer));
      return;
    }
    const color = hexWithOpacity(layer.color, layer.opacity);
    if (position === "inside") {
      shadows.unshift(...innerStrokeShadows(width, color));
      return;
    }
    if (isolatedStackLayer) {
      if (position === "center") {
        primaryWebkit = { width, color, paintOrder: "fill stroke" };
      } else {
        primaryWebkit = { width: width * 2, color, paintOrder: "stroke fill" };
      }
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
      const offset = previewShadowOffset(layer);
      shadows.push(`${formatOutlineNumber(offset.x)}px ${formatOutlineNumber(offset.y)}px ${layer.blur}px ${hexWithOpacity(layer.color, layer.opacity)}`);
    }
  }
  let primaryWebkit = null;
  strokeLayers.forEach(layer => {
    const width = Number(layer.width) || 1;
    const position = resolveStrokePosition(layer);
    const useGradientStroke = layer.colorMode === "gradient";
    if (useGradientStroke) {
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

function uniqueCardPreviewStylePresetName(base = "未命名样式", excludeId = null) {
  const trimmed = base.trim().slice(0, 48) || "未命名样式";
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

function getPreviewStyleStackText(element) {
  if (!element) return "";
  const svgStack = element.classList?.contains("preview-style-svg-stack")
    ? element
    : element.querySelector?.(":scope > .preview-style-svg-stack");
  if (svgStack) return svgStack.dataset.previewText || svgStack.querySelector(".preview-style-svg-size")?.textContent || "";
  return element.querySelector(".preview-style-text-size, .preview-style-text-layer, .preview-style-text-fill")?.textContent ?? element.textContent;
}

function getPreviewSampleText(sample) {
  return getPreviewStyleStackText(sample);
}

function setPreviewSampleText(sample, text) {
  if (!sample) return;
  const svgStack = sample.classList?.contains("preview-style-svg-stack")
    ? sample
    : sample.querySelector?.(":scope > .preview-style-svg-stack");
  if (svgStack) {
    svgStack.dataset.previewText = text;
    svgStack.querySelectorAll(".preview-style-svg-size, .preview-style-svg-source").forEach(layer => { layer.textContent = text; });
    syncPreviewStyleSvgStackTypography(svgStack, sample);
    return;
  }
  const layers = sample.querySelectorAll(".preview-style-text-size, .preview-style-text-layer, .preview-style-text-fill, .preview-style-text-stroke");
  if (layers.length) {
    layers.forEach(layer => { layer.textContent = text; });
    return;
  }
  sample.textContent = text;
}

function resolvePreviewStyleStackRoot(element) {
  if (!element) return null;
  if (element.classList.contains("preview-style-text-stack")) return element;
  if (element.classList.contains("preview-style-svg-stack")) return element;
  return element.querySelector(":scope > .preview-style-text-stack, :scope > .preview-style-svg-stack");
}

function flattenPreviewStyleStackHost(element, text) {
  const inner = resolvePreviewStyleStackRoot(element);
  const resolvedText = text ?? (inner && inner !== element ? getPreviewStyleStackText(inner) : element.textContent);
  element.classList.remove("preview-style-text-stack", "preview-style-svg-stack", "is-gradient-fill");
  element.textContent = resolvedText;
  return { root: element, layers: [element], host: element };
}

function syncPreviewStyleTextStackTypography(stackRoot, host = stackRoot) {
  if (stackRoot?.classList.contains("preview-style-svg-stack")) {
    syncPreviewStyleSvgStackTypography(stackRoot, host);
    return;
  }
  if (!stackRoot?.classList.contains("preview-style-text-stack")) return;
  const sizeEl = stackRoot.querySelector(".preview-style-text-size");
  const layers = stackRoot.querySelectorAll(".preview-style-text-layer, .preview-style-text-fill, .preview-style-text-stroke");
  if (!sizeEl && !layers.length) return;
  const source = host || stackRoot;
  const computed = getComputedStyle(source);
  const props = ["fontFamily", "fontSize", "fontWeight", "fontStyle", "fontVariationSettings", "letterSpacing", "lineHeight"];
  props.forEach(prop => {
    const value = source.style[prop] || computed[prop];
    if (!value) return;
    if (sizeEl) sizeEl.style[prop] = value;
  });
  const anchor = sizeEl || source;
  const anchorComputed = sizeEl ? getComputedStyle(sizeEl) : computed;
  layers.forEach(layer => {
    props.forEach(prop => {
      const value = anchor.style[prop] || anchorComputed[prop] || source.style[prop] || computed[prop];
      if (value) layer.style[prop] = value;
    });
  });
}

function syncPreviewStyleSvgStackTypography(stackRoot, host = stackRoot) {
  if (!stackRoot?.classList.contains("preview-style-svg-stack")) return;
  const source = host || stackRoot;
  const computed = getComputedStyle(source);
  const sizeEl = stackRoot.querySelector(".preview-style-svg-size");
  const props = ["fontFamily", "fontSize", "fontWeight", "fontStyle", "fontVariationSettings", "letterSpacing", "lineHeight"];
  props.forEach(prop => {
    const value = source.style[prop] || computed[prop];
    if (value && sizeEl) sizeEl.style[prop] = value;
  });
  if (stackRoot._previewSvgStyle) buildPreviewSvgTextStack(stackRoot, source, stackRoot._previewSvgStyle);
}

function ensurePreviewStyleSvgStack(element, text, style) {
  if (!element) return { root: element, host: element };
  const resolvedText = text ?? getPreviewStyleStackText(element);
  element.classList.remove("preview-style-text-stack", "is-gradient-fill");
  let stackRoot = element.querySelector(":scope > .preview-style-svg-stack");
  if (!stackRoot) {
    element.replaceChildren();
    stackRoot = document.createElement("span");
    stackRoot.className = "preview-style-svg-stack";
    element.appendChild(stackRoot);
  } else {
    stackRoot.replaceChildren();
  }
  stackRoot.dataset.previewText = resolvedText;
  stackRoot._previewSvgStyle = cloneCardPreviewStyle(style);
  const sizeEl = document.createElement("span");
  sizeEl.className = "preview-style-svg-size";
  sizeEl.textContent = resolvedText;
  sizeEl.setAttribute("aria-hidden", "true");
  stackRoot.appendChild(sizeEl);
  syncPreviewStyleSvgStackTypography(stackRoot, element);
  return { root: stackRoot, host: element };
}

function ensurePreviewStyleLayerStack(element, text, order) {
  if (!element) return { root: element, layers: [], host: element };
  const count = Array.isArray(order) ? order.length : 0;
  const resolvedText = text ?? getPreviewStyleStackText(element);
  if (count <= 1) {
    if (resolvePreviewStyleStackRoot(element)) return flattenPreviewStyleStackHost(element, resolvedText);
    if (text != null) element.textContent = resolvedText;
    return { root: element, layers: [element], host: element };
  }
  element.classList.remove("preview-style-text-stack", "preview-style-svg-stack", "is-gradient-fill");
  let stackRoot = element.querySelector(":scope > .preview-style-text-stack");
  if (!stackRoot) {
    element.replaceChildren();
    stackRoot = document.createElement("span");
    stackRoot.className = "preview-style-text-stack";
    element.appendChild(stackRoot);
  } else {
    stackRoot.replaceChildren();
  }
  const sizeEl = document.createElement("span");
  sizeEl.className = "preview-style-text-size";
  sizeEl.textContent = resolvedText;
  sizeEl.setAttribute("aria-hidden", "true");
  stackRoot.appendChild(sizeEl);
  const layerEls = [];
  for (let index = 0; index < count; index++) {
    const layerEl = document.createElement("span");
    layerEl.className = "preview-style-text-layer";
    if (order[index] === PREVIEW_STYLE_FILL_LAYER_ID) layerEl.classList.add("preview-style-text-fill");
    layerEl.textContent = resolvedText;
    if (index === 0) layerEl.removeAttribute("aria-hidden");
    else layerEl.setAttribute("aria-hidden", "true");
    stackRoot.appendChild(layerEl);
    layerEls.push(layerEl);
  }
  return { root: stackRoot, layers: layerEls, sizeEl, host: element };
}

function applyPreviewStyleCssToElement(element, css) {
  if (!element || !css) return;
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
  element.classList.toggle("is-gradient-fill", Boolean(css.backgroundImage && css.webkitBackgroundClip === "text"));
}

function applyCardPreviewStyleToElement(element, style, { themeDefault = false, text = null } = {}) {
  if (!element) return;
  clearCardPreviewStyleOnElement(element);
  const canPreview = style && hasActiveCardPreviewStyle(style);
  if (!canPreview) {
    element.style.removeProperty("--preview-style-bleed");
    const inner = resolvePreviewStyleStackRoot(element);
    if (inner && inner !== element) {
      element.textContent = getPreviewStyleStackText(inner);
    } else if (element.classList.contains("preview-style-text-stack")) {
      const baseLayer = element.querySelector(".preview-style-text-layer, .preview-style-text-fill");
      element.classList.remove("preview-style-text-stack", "is-gradient-fill");
      element.textContent = baseLayer?.textContent ?? element.textContent;
    } else {
      element.classList.remove("is-gradient-fill");
    }
    if (themeDefault) element.style.color = "var(--ink)";
    return;
  }
  const order = getEnabledStyleLayerOrder(style);
  if (styleNeedsSvgTextPreview(style)) {
    ensurePreviewStyleSvgStack(element, text, style);
    return;
  }
  if (text != null && order.length <= 1 && !resolvePreviewStyleStackRoot(element)) {
    element.textContent = text;
  }
  const stack = ensurePreviewStyleLayerStack(element, text, order);
  if (order.length === 1) {
    const key = order[0];
    const css = key === PREVIEW_STYLE_FILL_LAYER_ID
      ? cardPreviewStyleToFillCss(style)
      : cardPreviewStyleToEffectCssForLayer(key, style);
    applyPreviewStyleCssToElement(stack.layers[0], css);
    return;
  }
  order.forEach((key, index) => {
    const layerEl = stack.layers[index];
    if (!layerEl) return;
    // 图层面板越靠上越在前：首项 z-index 最高
    layerEl.style.zIndex = String(order.length - index);
    if (key === PREVIEW_STYLE_FILL_LAYER_ID) {
      applyPreviewStyleCssToElement(layerEl, cardPreviewStyleToFillCss(style));
    } else {
      applyPreviewStyleCssToElement(layerEl, cardPreviewStyleToEffectCssForLayer(key, style));
    }
  });
  syncPreviewStyleTextStackTypography(stack.root, stack.host);
}

function applyCardPreviewStyleToSample(sample, style = state.cardPreviewStyle) {
  if (!sample) return;
  const card = sample.closest(".font-card");
  if (!style || !hasActiveCardPreviewStyle(style)) {
    const text = getPreviewSampleText(sample) || cardPreviewText();
    clearCardPreviewStyleOnElement(sample);
    flattenPreviewStyleStackHost(sample, text);
    card?.classList.remove("has-preview-style");
    return;
  }
  applyCardPreviewStyleToElement(sample, style);
  card?.classList.toggle("has-preview-style", true);
}

function applyCardPreviewStyleToAllCards() {
  ui.list.querySelectorAll(".font-card .sample").forEach(sample => applyCardPreviewStyleToSample(sample));
  scheduleCardSampleFit();
  renderCardPreviewStyleModalPreview();
  syncHeaderPreviewFocusDisplay();
  if (ui.hoverPreviewOverlay && !ui.hoverPreviewOverlay.hidden) showHoverPreviewOverlay(state.hovered || state.previewed);
}

function clearCardPreviewStyleOnElement(element) {
  const targets = [element, ...element.querySelectorAll(".preview-style-text-size, .preview-style-text-layer, .preview-style-text-stroke, .preview-style-text-fill")];
  targets.forEach(target => {
    target.style.color = "";
    target.style.backgroundImage = "";
    target.style.backgroundClip = "";
    target.style.webkitBackgroundClip = "";
    target.style.webkitTextFillColor = "";
    target.style.webkitTextStroke = "";
    target.style.textStroke = "";
    target.style.paintOrder = "";
    target.style.textShadow = "";
    target.style.backgroundSize = "";
    target.style.backgroundRepeat = "";
    target.classList.remove("is-gradient-fill");
  });
  element.style.removeProperty("--preview-style-bleed");
  element.classList.remove("is-gradient-fill");
}

function applyCardPreviewStyleToMagnifierText(target, sample, sampleStyle, style = state.cardPreviewStyle) {
  clearCardPreviewStyleOnElement(target);
  const text = getPreviewSampleText(sample);
  if (!style || !hasActiveCardPreviewStyle(style)) {
    target.textContent = text;
    target.style.color = sampleStyle.color;
    return;
  }
  const stackRoot = resolvePreviewStyleStackRoot(sample);
  if (stackRoot?.classList.contains("preview-style-text-stack")) {
    target.replaceChildren(stackRoot.cloneNode(true));
    const magnifierStack = resolvePreviewStyleStackRoot(target);
    if (magnifierStack) syncPreviewStyleTextStackTypography(magnifierStack, sample);
    return;
  }
  if (stackRoot?.classList.contains("preview-style-svg-stack") || styleNeedsSvgTextPreview(style)) {
    applyCardPreviewStyleToElement(target, style, { text });
    const magnifierStack = resolvePreviewStyleStackRoot(target);
    if (magnifierStack) syncPreviewStyleSvgStackTypography(magnifierStack, sample);
    return;
  }
  target.textContent = text;
  applyCardPreviewStyleToElement(target, style);
}

function getCardMagnifierContentRect(sample) {
  const stackRoot = resolvePreviewStyleStackRoot(sample);
  if (stackRoot) {
    const stackRect = stackRoot.getBoundingClientRect();
    if (stackRect.width > 0 && stackRect.height > 0) return stackRect;
  }
  const range = document.createRange();
  range.selectNodeContents(sample);
  const textRect = range.getBoundingClientRect();
  if (textRect.width > 0 && textRect.height > 0) return textRect;
  return sample.getBoundingClientRect();
}

function updateCardMagnifierPreview(enlarged, sample, sampleStyle, event, lens, zoom) {
  const contentRect = getCardMagnifierContentRect(sample);
  const styled = state.cardPreviewStyle && hasActiveCardPreviewStyle(state.cardPreviewStyle);
  const stackRoot = resolvePreviewStyleStackRoot(sample);
  applyCardPreviewStyleToMagnifierText(enlarged, sample, sampleStyle);
  if (!styled || !stackRoot) {
    enlarged.style.fontFamily = sampleStyle.fontFamily;
    enlarged.style.fontSize = sampleStyle.fontSize;
    enlarged.style.fontWeight = sampleStyle.fontWeight;
    enlarged.style.lineHeight = sampleStyle.lineHeight;
    enlarged.style.letterSpacing = sampleStyle.letterSpacing;
    enlarged.style.fontVariationSettings = sampleStyle.fontVariationSettings;
    if (!styled) enlarged.style.color = sampleStyle.color;
  }
  enlarged.style.display = "block";
  enlarged.style.boxSizing = "border-box";
  enlarged.style.padding = "0";
  enlarged.style.margin = "0";
  enlarged.style.textAlign = sampleStyle.textAlign;
  enlarged.style.whiteSpace = sampleStyle.whiteSpace;
  enlarged.style.transformOrigin = "0 0";
  enlarged.style.left = `${lens / 2 - (event.clientX - contentRect.left) * zoom}px`;
  enlarged.style.top = `${lens / 2 - (event.clientY - contentRect.top) * zoom}px`;
  enlarged.style.width = `${contentRect.width}px`;
  enlarged.style.height = `${contentRect.height}px`;
  enlarged.style.transform = `scale(${zoom})`;
}

function previewStyleUnitsPerPx(upm, referenceFontSize = state.cardSampleSize) {
  const fontSize = Math.max(1, Number(referenceFontSize) || 49);
  return Math.max(0.01, Number(upm) || 1000) / fontSize;
}

function scalePreviewStylePx(value, unitsPerPx) {
  return Number(value) * unitsPerPx;
}

function computePreviewStyleVisualBleed(style, unitsPerPx = 1) {
  if (!style) return 0;
  const normalized = normalizeCardPreviewStyle(style);
  const fill = normalized.fill;
  const fillEnabled = fill.enabled !== false;
  const useGradientFill = fillEnabled && fill.mode === "gradient";
  let bleed = 0;
  for (const layer of normalized.layers) {
    if (!layer.enabled) continue;
    if (layer.type === "dropShadow") {
      const blur = scalePreviewStylePx(Number(layer.blur) || 0, unitsPerPx);
      const stdDev = blur / 2;
      const offset = previewShadowOffset(layer, unitsPerPx);
      bleed = Math.max(bleed, 3 * stdDev + Math.abs(offset.x), 3 * stdDev + Math.abs(offset.y));
      continue;
    }
    if (!isStrokeLayer(layer)) continue;
    const width = scalePreviewStylePx(Number(layer.width) || 1, unitsPerPx);
    const blur = scalePreviewStylePx(Number(layer.blur) || 0, unitsPerPx);
    const blurBleed = 3 * (blur / 2);
    const offset = previewStrokeOffset(layer, unitsPerPx);
    const position = resolveStrokePosition(layer);
    if (useGradientFill || layer.colorMode === "gradient") {
      bleed = Math.max(bleed, width * 2 + blurBleed + Math.abs(offset.x), width * 2 + blurBleed + Math.abs(offset.y));
      continue;
    }
    if (position === "outside") bleed = Math.max(bleed, width * 2 + blurBleed + Math.abs(offset.x), width * 2 + blurBleed + Math.abs(offset.y));
    else if (position === "center") bleed = Math.max(bleed, width + blurBleed + Math.abs(offset.x), width + blurBleed + Math.abs(offset.y));
    else bleed = Math.max(bleed, width + blurBleed + Math.abs(offset.x), width + blurBleed + Math.abs(offset.y));
  }
  return Math.ceil(bleed);
}

function buildStyledOutlineSvgMarkup({ pathData, width, height, label, style = state.cardPreviewStyle, unitsPerPx = 1, bleed = 0 }) {
  const normalized = normalizeCardPreviewStyle(style);
  const pathId = "preview-path";
  const defsParts = [`<path id="${pathId}" d="${pathData}"/>`];
  const usePath = extra => `<use href="#${pathId}"${extra}/>`;
  const fillValue = buildPreviewFillValue(normalized.fill, defsParts);
  let body = "";
  const orderedSvgLayers = getEnabledStyleLayerOrder(normalized).map(key => ({
    key,
    layer: key === PREVIEW_STYLE_FILL_LAYER_ID ? null : normalized.layers.find(item => item.id === key)
  }));
  const fillLayerIndex = orderedSvgLayers.findIndex(item => item.key === PREVIEW_STYLE_FILL_LAYER_ID);
  const svgDrawLayers = [...orderedSvgLayers].reverse();
  svgDrawLayers.forEach(({ key, layer }, index) => {
    if (key === PREVIEW_STYLE_FILL_LAYER_ID) {
      body += usePath(` fill="${fillValue}"`);
      return;
    }
    if (!layer?.enabled) return;
    if (layer.type === "dropShadow") {
      const blur = scalePreviewStylePx(Number(layer.blur) || 0, unitsPerPx);
      const offset = previewShadowOffset(layer, unitsPerPx);
      let filterAttr = "";
      if (blur > 0) {
        const filterId = `preview-shadow-${index}`;
        const filterPad = Math.max(bleed, 1);
        defsParts.push(`<filter id="${filterId}" x="${formatOutlineNumber(-filterPad)}" y="${formatOutlineNumber(-filterPad)}" width="${formatOutlineNumber(width + filterPad * 2)}" height="${formatOutlineNumber(height + filterPad * 2)}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${formatOutlineNumber(blur / 2)}"/></filter>`);
        filterAttr = ` filter="url(#${filterId})"`;
      }
      body += usePath(` fill="${escapeXml(hexWithOpacity(layer.color, layer.opacity))}" transform="translate(${formatOutlineNumber(offset.x)} ${formatOutlineNumber(offset.y)})"${filterAttr}`);
      return;
    }
    if (!isStrokeLayer(layer)) return;
    const position = resolveStrokePosition(layer);
    const strokeWidth = scalePreviewStylePx(layer.width, unitsPerPx) * (position === "center" ? 1 : 2);
    const offset = previewStrokeOffset(layer, unitsPerPx);
    const strokeValue = buildPreviewStrokeValue(layer, defsParts, `${position}-${index}`);
    const layerIndex = orderedSvgLayers.findIndex(item => item.key === key);
    const coversFill = fillLayerIndex >= 0 && layerIndex >= 0 && layerIndex < fillLayerIndex;
    let clipAttr = "";
    let filterAttr = "";
    if (position === "inside") {
      const clipId = `preview-clip-${index}`;
      defsParts.push(`<clipPath id="${clipId}"><use href="#${pathId}"/></clipPath>`);
      clipAttr = ` clip-path="url(#${clipId})"`;
    }
    const blur = scalePreviewStylePx(Number(layer.blur) || 0, unitsPerPx);
    if (blur > 0) {
      const filterId = `preview-stroke-blur-${index}`;
      const filterPad = Math.max(bleed, 1);
      defsParts.push(`<filter id="${filterId}" x="${formatOutlineNumber(-filterPad)}" y="${formatOutlineNumber(-filterPad)}" width="${formatOutlineNumber(width + filterPad * 2)}" height="${formatOutlineNumber(height + filterPad * 2)}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${formatOutlineNumber(blur / 2)}"/></filter>`);
      filterAttr = ` filter="url(#${filterId})"`;
    }
    body += usePath(`${clipAttr}${filterAttr} fill="${coversFill ? strokeValue : "none"}" stroke="${strokeValue}" stroke-width="${formatOutlineNumber(strokeWidth)}" stroke-linejoin="round" stroke-linecap="round" transform="translate(${formatOutlineNumber(offset.x)} ${formatOutlineNumber(offset.y)})"`);
  });
  const defsBlock = defsParts.length ? `<defs>${defsParts.join("")}</defs>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${formatOutlineNumber(width)} ${formatOutlineNumber(height)}" overflow="visible" role="img" aria-label="${label}">\n${defsBlock}\n  <g>${body}</g>\n</svg>`;
}

function getCardPreviewStyleModalFont() {
  const font = state.fonts.find(item => item.id === cardPreviewStylePreviewFontId);
  if (font) return font;
  return state.selected || state.previewed || state.filtered[0] || state.fonts[0] || null;
}

function stepCardPreviewStyleFont(direction) {
  const select = $("#cardPreviewStyleFont");
  if (!select || select.options.length <= 1) return;
  let index = select.selectedIndex;
  if (direction > 0) index = Math.min(index + 1, select.options.length - 1);
  else index = Math.max(index - 1, 0);
  if (index === select.selectedIndex) return;
  select.selectedIndex = index;
  cardPreviewStylePreviewFontId = Number(select.value);
  renderCardPreviewStyleModalPreview();
  if (cardPreviewStyleModalTab === "manage") applyManagePresetIconStyles();
}

function renderAngleDialSvg(tip) {
  return `<svg viewBox="0 0 40 40" aria-hidden="true" class="preview-gradient-angle-dial-svg"><line x1="20" y1="20" x2="${tip.x.toFixed(2)}" y2="${tip.y.toFixed(2)}" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/></svg>`;
}

function refreshAngleDialLine(dial, tip) {
  if (!dial) return;
  const line = dial.querySelector("line");
  if (line) {
    line.setAttribute("x2", tip.x.toFixed(2));
    line.setAttribute("y2", tip.y.toFixed(2));
  }
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
  const style = isManageTab
    ? resolveManagePreviewStyle()
    : (cardPreviewStyleDraft || state.cardPreviewStyle);
  if (font) {
    registerFont(font);
    sample.style.fontFamily = cssName(font);
    ensureFontLoaded(font, text).then(() => {
      if (getCardPreviewStyleModalFont()?.id !== font.id) return;
      sample.style.fontFamily = cssName(font);
      syncPreviewStyleTextStackTypography(resolvePreviewStyleStackRoot(sample) || sample, sample);
      if (isManageTab) applyManagePresetIconStyles();
    });
  } else {
    sample.style.fontFamily = "";
  }
  applyCardPreviewStyleToElement(sample, style, {
    themeDefault: isManageTab || !style,
    text
  });
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

function renderPreviewStyleParamRow(...fields) {
  return `<div class="preview-style-param-row">${fields.filter(Boolean).join("")}</div>`;
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
  const current = String(value);
  const buttons = field.options.map(option => {
    const active = option.value === current ? " active" : "";
    return `<button type="button" class="preview-style-radio-btn${active}" ${attrs} data-radio-value="${escapeHtml(option.value)}" aria-pressed="${option.value === current ? "true" : "false"}">${escapeHtml(option.label)}</button>`;
  }).join("");
  return `<div class="preview-style-field preview-style-radio-field"><span>${escapeHtml(field.label)}</span><div class="preview-style-radio-group" role="group" aria-label="${escapeHtml(field.label)}">${buttons}</div></div>`;
}

function renderColorModeField(value, fieldAttr, fieldKey) {
  const current = value === "gradient" ? "gradient" : "solid";
  const options = COLOR_MODE_OPTIONS.map(option => {
    const active = option.value === current ? " active" : "";
    return `<button type="button" class="preview-color-mode-btn${active}" ${fieldAttr}="${escapeHtml(fieldKey)}" data-mode-value="${escapeHtml(option.value)}" aria-pressed="${option.value === current ? "true" : "false"}">${escapeHtml(option.label)}</button>`;
  }).join("");
  return `<div class="preview-style-field preview-color-mode-field" data-preview-status-hint="选择纯色或线性渐变"><span>类型</span><div class="preview-color-mode-group" role="group" aria-label="颜色类型">${options}</div></div>`;
}

function applyPreviewColorModeChange(trigger) {
  if (!cardPreviewStyleDraft || !trigger) return false;
  const modeValue = trigger.dataset.modeValue === "gradient" ? "gradient" : "solid";
  if (trigger.dataset.fillField === "mode") {
    if (cardPreviewStyleDraft.fill.mode === modeValue) return true;
    const wasSolid = cardPreviewStyleDraft.fill.mode !== "gradient";
    cardPreviewStyleDraft.fill.mode = modeValue;
    if (modeValue === "gradient") {
      cardPreviewStyleDraft.fill.enabled = true;
      if (wasSolid) applyInitialLinearGradientStops(cardPreviewStyleDraft.fill);
      else syncFillLegacyColors(cardPreviewStyleDraft.fill);
    } else {
      syncFillLegacyColors(cardPreviewStyleDraft.fill);
    }
    if (modeValue === "gradient") cardPreviewStyleSelectedStopIndex = 0;
    renderCardPreviewStyleParams();
    renderCardPreviewStyleModalPreview();
    return true;
  }
  const layer = cardPreviewStyleDraft.layers.find(entry => entry.id === cardPreviewStyleSelectedLayerId);
  if (layer && trigger.dataset.layerField === "colorMode") {
    if (layer.colorMode === modeValue) return true;
    const wasSolid = layer.colorMode !== "gradient";
    layer.colorMode = modeValue;
    if (modeValue === "gradient") {
      if (wasSolid) applyInitialLinearGradientStops(layer);
      else syncStrokeLayerLegacyColors(layer);
    } else {
      syncStrokeLayerLegacyColors(layer);
    }
    if (modeValue === "gradient") cardPreviewStyleSelectedStopIndex = 0;
    renderCardPreviewStyleParams();
    renderCardPreviewStyleModalPreview();
    return true;
  }
  return false;
}

function renderStrokePositionField(value) {
  const icons = {
    outside: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="4.5" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="7.5" y="7.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".35"/></svg>`,
    center: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>`,
    inside: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7.5" y="7.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="4.5" y="4.5" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".35"/></svg>`
  };
  const buttons = STROKE_POSITION_OPTIONS.map(option => {
    const active = option.value === value ? " active" : "";
    return `<button type="button" class="preview-stroke-position-btn${active}" data-layer-field="position" data-position-value="${option.value}" aria-label="${escapeHtml(option.label)}" aria-pressed="${option.value === value ? "true" : "false"}" title="${escapeHtml(option.label)}">${icons[option.value] || ""}</button>`;
  }).join("");
  return `<div class="preview-style-field preview-stroke-position-field" data-preview-status-hint="${escapeHtml(PREVIEW_STYLE_STATUS_HINTS.strokePosition)}"><span>位置</span><div class="preview-stroke-position-group" role="group" aria-label="轮廓位置">${buttons}</div></div>`;
}

function gradientStopsHaveTransparency(stops) {
  return (stops || []).some(stop => Number(stop.opacity) < 100);
}

function gradientAngleDialPoint(angle, radius = 14, center = 20) {
  const rad = (Number(angle) || 0) * Math.PI / 180;
  return {
    x: center + radius * Math.sin(rad),
    y: center - radius * Math.cos(rad)
  };
}

function gradientAngleFromPointer(dial, clientX, clientY) {
  const rect = dial.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  let angle = Math.round(Math.atan2(dx, -dy) * 180 / Math.PI);
  if (angle < 0) angle += 360;
  return angle;
}

function normalizePreviewAngle(angle) {
  return ((Math.round(Number(angle) || 0) % 360) + 360) % 360;
}

function snapPreviewAngle(angle, enabled = false) {
  if (!enabled) return normalizePreviewAngle(angle);
  return normalizePreviewAngle(Math.round((Number(angle) || 0) / 45) * 45);
}

function previewAngleWheelDelta(event) {
  return event.deltaY > 0 ? 1 : -1;
}

function renderGradientAngleDial(angle, scope) {
  const value = normalizePreviewAngle(angle);
  const tip = gradientAngleDialPoint(value);
  return `<div class="preview-gradient-angle-field preview-style-field">
    <span>渐变角度</span>
    <div class="preview-gradient-angle-control">
      <button type="button" class="preview-gradient-angle-dial" data-gradient-field="angle" data-gradient-scope="${scope}" data-preview-status-hint="${escapeHtml(PREVIEW_STYLE_STATUS_HINTS.gradientAngle)}" aria-label="渐变角度" aria-valuemin="0" aria-valuemax="360" aria-valuenow="${value}">
        ${renderAngleDialSvg(tip)}
      </button>
      <span class="preview-gradient-angle-value" data-gradient-angle-value="${scope}">${value}°</span>
    </div>
  </div>`;
}

function refreshGradientAngleDial(scope, angle) {
  const panel = $("#cardPreviewStyleParams");
  const dial = panel?.querySelector(`.preview-gradient-angle-dial[data-gradient-scope="${scope}"]`);
  if (!dial) return;
  const value = normalizePreviewAngle(angle);
  const tip = gradientAngleDialPoint(value);
  dial.setAttribute("aria-valuenow", String(value));
  refreshAngleDialLine(dial, tip);
  panel.querySelector(`[data-gradient-angle-value="${scope}"]`)?.replaceChildren(document.createTextNode(`${value}°`));
}

function applyGradientAngleChange(scope, angle) {
  const target = getGradientEditTarget(scope);
  if (!target) return;
  target.angle = normalizePreviewAngle(angle);
  refreshGradientBarVisuals(scope);
  refreshGradientAngleDial(scope, target.angle);
  renderCardPreviewStyleModalPreview();
}

function shadowAngleDialPoint(angle, radius = 14, center = 20) {
  const rad = (Number(angle) || 0) * Math.PI / 180;
  return {
    x: center + radius * Math.sin(rad),
    y: center - radius * Math.cos(rad)
  };
}

function shadowAngleFromPointer(dial, clientX, clientY) {
  const rect = dial.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  let angle = Math.round(Math.atan2(dx, -dy) * 180 / Math.PI);
  if (angle < 0) angle += 360;
  return angle;
}

function strokeOffsetAngleDialPoint(angle, radius = 14, center = 20) {
  const rad = (Number(angle) || 0) * Math.PI / 180;
  return {
    x: center + radius * Math.cos(rad),
    y: center + radius * Math.sin(rad)
  };
}

function strokeOffsetAngleFromPointer(dial, clientX, clientY) {
  const rect = dial.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  let angle = Math.round(Math.atan2(dy, dx) * 180 / Math.PI);
  if (angle < 0) angle += 360;
  return angle;
}

function renderShadowAngleDial(angle, layerId) {
  const value = normalizePreviewAngle(angle);
  const tip = shadowAngleDialPoint(value);
  return `<div class="preview-gradient-angle-field preview-style-field">
    <span>投影角度</span>
    <div class="preview-gradient-angle-control">
      <button type="button" class="preview-gradient-angle-dial preview-shadow-angle-dial" data-shadow-field="angle" data-layer-id="${escapeHtml(layerId)}" data-preview-status-hint="${escapeHtml(PREVIEW_STYLE_STATUS_HINTS.shadowAngle)}" aria-label="投影角度" aria-valuemin="0" aria-valuemax="360" aria-valuenow="${value}">
        ${renderAngleDialSvg(tip)}
      </button>
      <span class="preview-gradient-angle-value" data-shadow-angle-value="${escapeHtml(layerId)}">${value}°</span>
    </div>
  </div>`;
}

function refreshShadowAngleDial(layerId, angle) {
  const panel = $("#cardPreviewStyleParams");
  const dial = panel?.querySelector(`.preview-shadow-angle-dial[data-layer-id="${CSS.escape(layerId)}"]`);
  if (!dial) return;
  const value = normalizePreviewAngle(angle);
  const tip = shadowAngleDialPoint(value);
  dial.setAttribute("aria-valuenow", String(value));
  refreshAngleDialLine(dial, tip);
  panel.querySelector(`[data-shadow-angle-value="${CSS.escape(layerId)}"]`)?.replaceChildren(document.createTextNode(`${value}°`));
}

function applyShadowAngleChange(layerId, angle) {
  const layer = cardPreviewStyleDraft?.layers.find(entry => entry.id === layerId);
  if (!layer || layer.type !== "dropShadow") return;
  layer.angle = normalizePreviewAngle(angle);
  refreshShadowAngleDial(layer.id, layer.angle);
  syncCardPreviewStyleFooter();
  renderCardPreviewStyleModalPreview();
}

function renderStrokeOffsetAngleDial(angle, layerId) {
  const value = normalizePreviewAngle(angle);
  const tip = strokeOffsetAngleDialPoint(value);
  return `<div class="preview-gradient-angle-field preview-style-field">
    <span>偏移角度</span>
    <div class="preview-gradient-angle-control">
      <button type="button" class="preview-gradient-angle-dial preview-stroke-offset-angle-dial" data-stroke-offset-field="offsetAngle" data-layer-id="${escapeHtml(layerId)}" data-preview-status-hint="${escapeHtml(PREVIEW_STYLE_STATUS_HINTS.strokeOffsetAngle)}" aria-label="轮廓偏移角度" aria-valuemin="0" aria-valuemax="360" aria-valuenow="${value}">
        ${renderAngleDialSvg(tip)}
      </button>
      <span class="preview-gradient-angle-value" data-stroke-offset-angle-value="${escapeHtml(layerId)}">${value}°</span>
    </div>
  </div>`;
}

function refreshStrokeOffsetAngleDial(layerId, angle) {
  const panel = $("#cardPreviewStyleParams");
  const dial = panel?.querySelector(`.preview-stroke-offset-angle-dial[data-layer-id="${CSS.escape(layerId)}"]`);
  if (!dial) return;
  const value = normalizePreviewAngle(angle);
  const tip = strokeOffsetAngleDialPoint(value);
  dial.setAttribute("aria-valuenow", String(value));
  refreshAngleDialLine(dial, tip);
  panel.querySelector(`[data-stroke-offset-angle-value="${CSS.escape(layerId)}"]`)?.replaceChildren(document.createTextNode(`${value}°`));
}

function applyStrokeOffsetAngleChange(layerId, angle) {
  const layer = cardPreviewStyleDraft?.layers.find(entry => entry.id === layerId);
  if (!layer || !isStrokeLayer(layer)) return;
  layer.offsetAngle = normalizePreviewAngle(angle);
  refreshStrokeOffsetAngleDial(layer.id, layer.offsetAngle);
  syncCardPreviewStyleFooter();
  renderCardPreviewStyleModalPreview();
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
  wrap?.querySelector(".preview-gradient-position-indicator")?.setAttribute("hidden", "");
}

function updateGradientStopDragFeedback(event, scope = draggingGradientScope) {
  const wrap = getGradientBarWrap(scope);
  const target = getGradientEditTarget(scope);
  const bar = wrap?.querySelector(".preview-gradient-bar");
  if (!wrap || !bar || !target) return;
  const barRect = bar.getBoundingClientRect();
  const canDelete = target.stops.length > 2;
  draggingGradientDeleteIntent = canDelete && event.clientY < barRect.top;
  wrap.classList.toggle("is-stop-delete-ready", draggingGradientDeleteIntent);
  wrap.classList.toggle("is-stop-dragging", draggingGradientStopIndex !== null);
  if (draggingGradientDeleteIntent) {
    setPreviewStyleStatusHint(PREVIEW_STYLE_STATUS_HINTS.gradientStopDelete);
  }
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

function updateGradientStopControls(scope, index) {
  const target = getGradientEditTarget(scope);
  const stop = target?.stops?.[index];
  const panel = $("#cardPreviewStyleParams");
  if (!stop || !panel) return;
  const colorInput = panel.querySelector(`input[data-gradient-stop-field="color"][data-gradient-scope="${scope}"]`);
  const opacityInput = panel.querySelector(`input[data-gradient-stop-field="opacity"][data-gradient-scope="${scope}"]`);
  if (colorInput) {
    colorInput.value = stop.color;
    colorInput.dataset.stopIndex = String(index);
  }
  if (opacityInput) {
    opacityInput.value = stop.opacity;
    opacityInput.dataset.stopIndex = String(index);
    syncStyleRangeProgress(opacityInput);
  }
}

function setPreviewStyleStatusHint(text) {
  const bar = $("#cardPreviewStyleStatusBar");
  const textEl = bar?.querySelector(".preview-style-statusbar-text");
  if (textEl) textEl.textContent = text || "";
  else if (bar) bar.textContent = text || "";
}

function updatePreviewStyleStatusBar() {
  setPreviewStyleStatusHint("");
}

function bindPreviewStyleStatusHints() {
  const modal = $("#cardPreviewStyleModal");
  if (!modal || modal.dataset.statusHintsBound) return;
  modal.dataset.statusHintsBound = "1";
  modal.addEventListener("pointerover", event => {
    const hintEl = event.target.closest("[data-preview-status-hint]");
    if (!hintEl || !modal.contains(hintEl)) return;
    setPreviewStyleStatusHint(hintEl.dataset.previewStatusHint || "");
  });
  modal.addEventListener("pointerout", event => {
    if (!event.target.closest("[data-preview-status-hint]")) return;
    const related = event.relatedTarget;
    if (related && modal.contains(related) && related.closest("[data-preview-status-hint]")) return;
    setPreviewStyleStatusHint("");
  });
}

function syncGradientLegacyColors(target, scope) {
  if (scope === "fill") syncFillLegacyColors(target);
  else syncStrokeLayerLegacyColors(target);
}

function getEffectiveGradientStopIndex(scope = getActiveGradientScope()) {
  if (cardPreviewStyleHoverStopIndex !== null && getGradientEditTarget(scope)?.stops?.[cardPreviewStyleHoverStopIndex]) {
    return cardPreviewStyleHoverStopIndex;
  }
  return cardPreviewStyleSelectedStopIndex;
}

function ensureGradientEditTargetEnabled(scope) {
  if (!cardPreviewStyleDraft) return false;
  if (scope === "fill") {
    if (cardPreviewStyleDraft.fill.enabled === false) {
      cardPreviewStyleDraft.fill.enabled = true;
      renderCardPreviewStyleLayerList();
      return true;
    }
    return false;
  }
  const layer = getGradientEditTarget(scope);
  if (layer && layer.enabled === false) {
    layer.enabled = true;
    renderCardPreviewStyleLayerList();
    return true;
  }
  return false;
}

function applyGradientStopFieldChange(input) {
  if (!cardPreviewStyleDraft || !input?.dataset) return false;
  const gradientScope = input.dataset.gradientScope;
  const gradientStopField = input.dataset.gradientStopField;
  const stopIndex = Number(input.dataset.stopIndex);
  if (!gradientStopField || !gradientScope || !Number.isFinite(stopIndex)) return false;
  const target = getGradientEditTarget(gradientScope);
  if (!target) return false;
  ensureGradientEditTargetEnabled(gradientScope);
  const stops = normalizeGradientStops(target.stops, target);
  const stop = stops[stopIndex];
  if (!stop) return false;
  stop[gradientStopField] = gradientStopField === "color" ? input.value : Number(input.value);
  target.stops = normalizeGradientStops(stops, target);
  syncGradientLegacyColors(target, gradientScope);
  if (gradientStopField !== "color") syncStyleRangeProgress(input);
  refreshGradientBarVisuals(gradientScope);
  renderCardPreviewStyleModalPreview();
  return true;
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
  const barCss = buildGradientBarPreviewCss(stops, target);
  const hasAlpha = gradientStopsHaveTransparency(stops);
  bar.classList.toggle("has-alpha", hasAlpha);
  const gradientLayer = bar.querySelector(".preview-gradient-bar-gradient");
  if (gradientLayer) gradientLayer.style.backgroundImage = barCss;
  else bar.style.backgroundImage = barCss;
  track.querySelectorAll(".preview-gradient-stop-handle").forEach((handle, index) => {
    const stop = stops[index];
    if (!stop) return;
    handle.style.left = `${stop.offset}%`;
    handle.classList.toggle("active", index === cardPreviewStyleSelectedStopIndex);
    handle.classList.toggle("is-hover", index === cardPreviewStyleHoverStopIndex && index !== cardPreviewStyleSelectedStopIndex);
    handle.classList.toggle("dragging", index === draggingGradientStopIndex);
    handle.style.setProperty("--stop-color", hexWithOpacity(stop.color, stop.opacity));
  });
  refreshGradientPositionIndicator(scope, stops);
}

function selectGradientStop(index, scope = getActiveGradientScope()) {
  const target = getGradientEditTarget(scope);
  if (!target?.stops?.[index]) return;
  cardPreviewStyleSelectedStopIndex = index;
  cardPreviewStyleHoverStopIndex = null;
  updateGradientStopControls(scope, index);
  refreshGradientBarVisuals(scope);
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
  ensureGradientEditTargetEnabled(scope);
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
  ensureGradientEditTargetEnabled(scope);
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
  const hasAlpha = gradientStopsHaveTransparency(stops);
  const handles = stops.map((stop, index) => {
    const active = index === cardPreviewStyleSelectedStopIndex ? " active" : "";
    const hover = index === cardPreviewStyleHoverStopIndex && index !== cardPreviewStyleSelectedStopIndex ? " is-hover" : "";
    return `<button type="button" class="preview-gradient-stop-handle${active}${hover}" data-stop-index="${index}" data-gradient-scope="${scope}" data-preview-status-hint="${escapeHtml(PREVIEW_STYLE_STATUS_HINTS.gradientStop)}" style="left:${stop.offset}%;--stop-color:${escapeHtml(hexWithOpacity(stop.color, stop.opacity))}" aria-label="色标 ${index + 1}，${stop.offset}%">
      <span class="preview-gradient-stop-handle-arrow"></span>
    </button>`;
  }).join("");
  const controlIndex = getEffectiveGradientStopIndex(scope);
  const controlStop = stops[controlIndex] || selected;
  return `<div class="preview-gradient-editor">
    <div class="preview-gradient-bar-wrap" data-preview-status-hint="${escapeHtml(PREVIEW_STYLE_STATUS_HINTS.gradientBar)}">
      <div class="preview-gradient-bar${hasAlpha ? " has-alpha" : ""}" data-gradient-action="bar-click" data-gradient-scope="${scope}" aria-label="渐变色带，点击添加色标">
        <span class="preview-gradient-bar-gradient" style="background-image:${escapeHtml(barCss)}"></span>
      </div>
      <div class="preview-gradient-position-indicator" hidden aria-hidden="true">
        <span class="preview-gradient-position-line"></span>
        <span class="preview-gradient-position-tick"></span>
        <span class="preview-gradient-position-tag"></span>
      </div>
      <div class="preview-gradient-stops-track">${handles}</div>
    </div>
    <div class="preview-gradient-stop-row">
      <div class="preview-gradient-stop-controls preview-gradient-stop-controls-inline">
        <label class="preview-gradient-stop-color-inline" data-preview-status-hint="${escapeHtml(PREVIEW_STYLE_STATUS_HINTS.gradientColor)}"><input type="color" data-gradient-stop-field="color" data-gradient-scope="${scope}" data-stop-index="${controlIndex}" value="${escapeHtml(controlStop.color)}" aria-label="色标颜色" /></label>
        ${renderStyleRangeField({ label: "不透明度", min: 0, max: 100, step: 1 }, controlStop.opacity, `data-gradient-stop-field="opacity" data-gradient-scope="${scope}" data-stop-index="${controlIndex}" data-preview-status-hint="${escapeHtml(PREVIEW_STYLE_STATUS_HINTS.gradientOpacity)}" aria-label="不透明度"`)}
      </div>
    </div>
    <div class="preview-gradient-angle-row">
      ${renderGradientAngleDial(target.angle, scope)}
    </div>
  </div>`;
}

function renderFillStyleParams() {
  const fill = cardPreviewStyleDraft.fill;
  syncFillLegacyColors(fill);
  if (fill.enabled === false) {
    return `<h4 class="preview-style-params-head">填充</h4><div class="preview-style-params-grid"><div class="preview-style-transparent-fill-note"><strong>透明填充</strong><span>填充层已关闭，文字本体不绘制颜色，仅保留其他图层效果。</span></div></div>`;
  }
  const isGradient = fill.mode === "gradient";
  const gradientFields = isGradient ? renderGradientStopsEditor(fill, "fill") : "";
  const opacityField = isGradient
    ? ""
    : renderStyleRangeField({ label: "不透明度", min: 0, max: 100, step: 1 }, fill.opacity, 'data-fill-field="opacity" aria-label="填充不透明度"');
  const colorField = isGradient
    ? ""
    : `<label class="preview-style-field"><span>颜色</span><input type="color" data-fill-field="color" value="${escapeHtml(resolvePreviewFillColor(cardPreviewStyleDraft))}" /></label>`;
  const colorOpacityRow = isGradient ? "" : renderPreviewStyleParamRow(colorField, opacityField);
  return `<h4 class="preview-style-params-head">填充</h4><div class="preview-style-params-grid">${renderColorModeField(fill.mode, "data-fill-field", "mode")}${colorOpacityRow}${gradientFields}</div>`;
}

function renderCardPreviewStyleLayerList() {
  const list = $("#cardPreviewStyleLayerList");
  if (!list || !cardPreviewStyleDraft) return;
  syncStyleLayerOrder(cardPreviewStyleDraft);
  const fillEnabled = cardPreviewStyleDraft.fill.enabled !== false;
  const html = cardPreviewStyleDraft.layerOrder.map(key => {
    if (key === PREVIEW_STYLE_FILL_LAYER_ID) {
      const fillActive = cardPreviewStyleSelectedLayerId == null ? " active" : "";
      const fillDisabled = fillEnabled ? "" : " is-disabled";
      return `<li class="preview-style-style-item${fillActive}${fillDisabled}" data-layer-key="${PREVIEW_STYLE_FILL_LAYER_ID}" draggable="true" data-preview-status-hint="${escapeHtml(PREVIEW_STYLE_STATUS_HINTS.layerList)}"><span class="style-drag" aria-hidden="true">⋮⋮</span><input type="checkbox"${fillEnabled ? " checked" : ""} aria-label="启用填充" /><span class="style-name">${fillEnabled ? "填充" : "填充（透明）"}</span><span class="layer-spacer" aria-hidden="true"></span></li>`;
    }
    const layer = cardPreviewStyleDraft.layers.find(item => item.id === key);
    if (!layer) return "";
    const label = getPreviewStyleLayerLabel(layer, cardPreviewStyleDraft.layers);
    const active = layer.id === cardPreviewStyleSelectedLayerId ? " active" : "";
    const disabled = layer.enabled ? "" : " is-disabled";
    return `<li class="preview-style-style-item${active}${disabled}" data-layer-key="${escapeHtml(layer.id)}" data-layer-id="${escapeHtml(layer.id)}" draggable="true" data-preview-status-hint="${escapeHtml(PREVIEW_STYLE_STATUS_HINTS.layerList)}"><span class="style-drag" aria-hidden="true">⋮⋮</span><input type="checkbox"${layer.enabled ? " checked" : ""} aria-label="启用${escapeHtml(label)}" /><span class="style-name">${escapeHtml(label)}</span><span class="layer-actions"><button type="button" class="layer-duplicate" title="复制图层" aria-label="复制${escapeHtml(label)}" data-preview-status-hint="${escapeHtml(PREVIEW_STYLE_STATUS_HINTS.layerDuplicate)}">+</button></span></li>`;
  }).join("");
  list.innerHTML = html;
  syncLayerToolbarState();
}

function renderStrokeStyleParams(layer) {
  syncStrokeLayerLegacyColors(layer);
  const isGradient = layer.colorMode === "gradient";
  const meta = PREVIEW_EFFECT_TYPES.stroke;
  const title = getPreviewStyleLayerLabel(layer, cardPreviewStyleDraft.layers);
  const modeField = renderColorModeField(layer.colorMode, "data-layer-field", "colorMode");
  const colorField = isGradient
    ? ""
    : `<label class="preview-style-field"><span>颜色</span><input type="color" data-layer-field="color" value="${escapeHtml(layer.color)}" /></label>`;
  const opacityField = isGradient
    ? ""
    : renderStyleRangeField(meta.fields.find(field => field.key === "opacity"), layer.opacity, 'data-layer-field="opacity" aria-label="轮廓不透明度"');
  const colorOpacityRow = isGradient ? "" : renderPreviewStyleParamRow(colorField, opacityField);
  const widthField = renderStyleRangeField(meta.fields.find(field => field.key === "width"), layer.width, 'data-layer-field="width" aria-label="轮廓粗细"');
  const blurField = renderStyleRangeField(meta.fields.find(field => field.key === "blur"), layer.blur, 'data-layer-field="blur" aria-label="轮廓模糊"');
  const offsetDistanceField = renderStyleRangeField(meta.fields.find(field => field.key === "offsetDistance"), layer.offsetDistance, 'data-layer-field="offsetDistance" aria-label="轮廓偏移距离"');
  const offsetRow = renderPreviewStyleParamRow(renderStrokeOffsetAngleDial(layer.offsetAngle, layer.id), offsetDistanceField);
  const positionField = renderStrokePositionField(layer.position);
  const widthPositionRow = `<div class="preview-style-param-row preview-style-stroke-layout-row">${positionField}${widthField}</div>`;
  const gradientFields = isGradient ? renderGradientStopsEditor(layer, "layer") : "";
  return `<h4 class="preview-style-params-head">${escapeHtml(title)}</h4><div class="preview-style-params-grid">${widthPositionRow}${modeField}${gradientFields}${colorOpacityRow}${blurField}${offsetRow}</div>`;
}

function renderDropShadowStyleParams(layer) {
  const meta = PREVIEW_EFFECT_TYPES.dropShadow;
  const title = getPreviewStyleLayerLabel(layer, cardPreviewStyleDraft.layers);
  const colorField = `<label class="preview-style-field"><span>颜色</span><input type="color" data-layer-field="color" value="${escapeHtml(layer.color)}" /></label>`;
  const opacityField = renderStyleRangeField(meta.fields.find(field => field.key === "opacity"), layer.opacity, 'data-layer-field="opacity" aria-label="投影不透明度"');
  const colorOpacityRow = renderPreviewStyleParamRow(colorField, opacityField);
  const distanceField = renderStyleRangeField(meta.fields.find(field => field.key === "distance"), layer.distance, 'data-layer-field="distance" aria-label="投影距离"');
  const angleDistanceRow = renderPreviewStyleParamRow(renderShadowAngleDial(layer.angle, layer.id), distanceField);
  const blurField = renderStyleRangeField(meta.fields.find(field => field.key === "blur"), layer.blur, 'data-layer-field="blur" aria-label="投影模糊"');
  const fields = `${colorOpacityRow}${angleDistanceRow}${blurField}`;
  return `<h4 class="preview-style-params-head">${escapeHtml(title)}</h4><div class="preview-style-params-grid">${fields}</div>`;
}

function renderCardPreviewStyleParams() {
  const panel = $("#cardPreviewStyleParams");
  if (!panel || !cardPreviewStyleDraft) return;
  cardPreviewStyleHoverStopIndex = null;
  if (cardPreviewStyleSelectedLayerId == null) {
    panel.innerHTML = renderFillStyleParams();
    syncAllStyleRanges(panel);
    updatePreviewStyleStatusBar();
    return;
  }
  const layer = cardPreviewStyleDraft.layers.find(item => item.id === cardPreviewStyleSelectedLayerId);
  if (!layer) {
    cardPreviewStyleSelectedLayerId = null;
    panel.innerHTML = renderFillStyleParams();
    syncAllStyleRanges(panel);
    updatePreviewStyleStatusBar();
    return;
  }
  const meta = PREVIEW_EFFECT_TYPES[layer.type];
  if (layer.type === "stroke") {
    panel.innerHTML = renderStrokeStyleParams(layer);
    syncAllStyleRanges(panel);
    updatePreviewStyleStatusBar();
    return;
  }
  if (layer.type === "dropShadow") {
    panel.innerHTML = renderDropShadowStyleParams(layer);
    syncAllStyleRanges(panel);
    updatePreviewStyleStatusBar();
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
  updatePreviewStyleStatusBar();
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
  const canEdit = Boolean(presetId);
  const isRenaming = managePresetInlineRenamePresetId === presetId && canEdit;
  const labelHtml = isRenaming
    ? `<input class="preview-style-preset-rename-input" type="text" maxlength="48" value="${escapeHtml(name)}" aria-label="样式名称" />`
    : `<span class="preview-style-preset-label"${canEdit ? ' data-renamable="true"' : ""}>${escapeHtml(name)}</span>`;
  return `<div class="preview-style-preset-card${active ? " active" : ""}${current ? " is-current" : ""}" role="button" tabindex="0" data-preset-id="${escapeHtml(presetId || "")}" aria-label="${escapeHtml(name)}">
    ${canEdit ? `<button type="button" class="preview-style-preset-edit" aria-label="编辑样式" title="编辑样式">${PREVIEW_STYLE_ICON_EDIT}</button>` : ""}
    <span class="preview-style-preset-glyph" aria-hidden="true">${MANAGE_PRESET_PREVIEW_CHAR}</span>
    ${labelHtml}
    ${current ? '<span class="preview-style-preset-badge">使用中</span>' : ""}
  </div>`;
}

function focusManagePresetInlineRenameInput() {
  const input = $("#cardPreviewStylePresetList")?.querySelector(".preview-style-preset-rename-input");
  if (!input) return;
  input.focus();
  input.select();
}

function startManagePresetInlineRename(presetId) {
  if (!presetId || !findCardPreviewStylePreset(presetId)) return;
  managePresetInlineRenamePresetId = presetId;
  cardPreviewStyleManagePresetId = presetId;
  renderCardPreviewStyleManagePanel();
  focusManagePresetInlineRenameInput();
}

function commitManagePresetInlineRename() {
  const presetId = managePresetInlineRenamePresetId;
  const input = $("#cardPreviewStylePresetList")?.querySelector(".preview-style-preset-rename-input");
  if (!presetId || !input) {
    managePresetInlineRenamePresetId = null;
    return;
  }
  const name = input.value.trim();
  if (!name) {
    toast("请输入样式名称");
    input.focus();
    return;
  }
  const preset = renameCardPreviewStylePreset(presetId, name);
  if (!preset) {
    toast("重命名失败");
    return;
  }
  managePresetInlineRenamePresetId = null;
  persistUiSettings();
  renderCardPreviewStyleManagePanel();
  renderCardPreviewStyleQuickMenu();
  toast(`已重命名为「${preset.name}」`);
}

function cancelManagePresetInlineRename() {
  if (!managePresetInlineRenamePresetId) return;
  managePresetInlineRenamePresetId = null;
  renderCardPreviewStyleManagePanel();
}

function deleteManagePresetById(presetId) {
  if (!presetId) return;
  const preset = findCardPreviewStylePreset(presetId);
  if (!preset) return;
  if (!window.confirm(`删除样式「${preset.name}」？`)) return;
  deleteCardPreviewStylePreset(presetId);
  if (cardPreviewStyleManagePresetId === presetId) cardPreviewStyleManagePresetId = "";
  if (managePresetInlineRenamePresetId === presetId) managePresetInlineRenamePresetId = null;
  persistUiSettings();
  renderCardPreviewStyleManagePanel();
  renderCardPreviewStyleQuickMenu();
  renderCardPreviewStyleModalPreview();
  toast("已删除样式");
}

function hideManagePresetContextMenu() {
  const menu = $("#cardPreviewStylePresetContextMenu");
  if (!menu) return;
  menu.classList.remove("visible");
  setTimeout(() => {
    if (!menu.classList.contains("visible")) menu.hidden = true;
  }, 130);
}

function showManagePresetContextMenu(presetId, x, y) {
  const menu = $("#cardPreviewStylePresetContextMenu");
  if (!menu) return;
  const preset = presetId ? findCardPreviewStylePreset(presetId) : null;
  const title = presetId ? (preset?.name || "样式") : "默认";
  let html = `<div class="context-menu-header">${escapeHtml(title)}</div>`;
  if (presetId) {
    html += `<button class="context-menu-item" type="button" data-manage-preset-action="edit"><span>编辑</span></button>`;
    html += `<button class="context-menu-item" type="button" data-manage-preset-action="rename"><span>重命名</span></button>`;
    html += `<div class="context-menu-divider"></div>`;
    html += `<button class="context-menu-item danger" type="button" data-manage-preset-action="delete"><span>删除</span></button>`;
  } else {
    html += `<button class="context-menu-item" type="button" data-manage-preset-action="apply"><span>应用默认</span></button>`;
  }
  menu.innerHTML = html;
  menu.dataset.presetId = presetId || "";
  menu.hidden = false;
  menu.classList.toggle("open-left", x + 220 > window.innerWidth);
  menu.style.left = `${Math.min(x, window.innerWidth - 230)}px`;
  menu.style.top = `${Math.min(y, window.innerHeight - 180)}px`;
  requestAnimationFrame(() => menu.classList.add("visible"));
  menu.querySelectorAll("[data-manage-preset-action]").forEach(button => {
    button.addEventListener("click", () => {
      const action = button.dataset.managePresetAction;
      const id = menu.dataset.presetId || "";
      hideManagePresetContextMenu();
      cardPreviewStyleManagePresetId = id;
      if (action === "edit") loadManagePresetToEdit();
      else if (action === "rename") startManagePresetInlineRename(id);
      else if (action === "delete") deleteManagePresetById(id);
      else if (action === "apply") {
        applyCardPreviewStylePresetById(null);
        renderCardPreviewStyleManagePanel();
        renderCardPreviewStyleModalPreview();
      }
    });
  });
}

function handleManagePresetCardActivate(card) {
  if (!card) return;
  cardPreviewStyleManagePresetId = card.dataset.presetId || "";
  cardPreviewStyleManageHoverPresetId = null;
  renderCardPreviewStyleManagePanel();
  renderCardPreviewStyleModalPreview();
}

function syncCardPreviewStyleFooter() {
  const isEdit = cardPreviewStyleModalTab === "edit";
  const bottom = $(".preview-style-bottom");
  const editFooter = $("#cardPreviewStyleFooterEdit");
  const manageFooter = $("#cardPreviewStyleFooterManage");
  const saveDraftBtn = $("#cardPreviewStyleSaveDraft");
  if (bottom) bottom.dataset.tab = isEdit ? "edit" : "manage";
  if (editFooter) editFooter.hidden = !isEdit;
  if (manageFooter) manageFooter.hidden = isEdit;
  if (saveDraftBtn) {
    saveDraftBtn.disabled = !cardPreviewStyleDraft;
  }
  syncCardPreviewStylePresetEditorVisibility();
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
    managePresetInlineRenamePresetId = null;
    hideManagePresetContextMenu();
    renderCardPreviewStyleLayerList();
    renderCardPreviewStyleParams();
  } else {
    renderCardPreviewStyleManagePanel();
    updatePreviewStyleStatusBar();
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
  if (managePresetInlineRenamePresetId) focusManagePresetInlineRenameInput();
  const deleteBtn = $("#cardPreviewStyleManageDelete");
  if (deleteBtn) deleteBtn.disabled = !Boolean(cardPreviewStyleManagePresetId);
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
    if (showToast) toast(t("toast.styleRestored"));
    return true;
  }
  const preset = findCardPreviewStylePreset(presetId);
  if (!preset) {
    if (showToast) toast(t("toast.styleNotFound"));
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
  if (showToast) toast(t("toast.styleApplied", { name: preset.name }));
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

function renderQuickPresetMenuItem(presetId, { active = false, name = "默认" } = {}) {
  return `<button type="button" class="card-preview-style-preset-option${active ? " active is-current" : ""}" data-preset-id="${escapeHtml(presetId || "")}" aria-label="${escapeHtml(name)}">
    <span class="preview-style-preset-glyph" aria-hidden="true">${escapeHtml(getQuickMenuPreviewChar())}</span>
    <span class="card-preview-style-preset-name">${escapeHtml(name)}</span>
  </button>`;
}

function applyQuickPresetMenuStyles() {
  const menu = $("#cardPreviewStylePresetMenu");
  if (!menu) return;
  const font = getQuickMenuPreviewFont();
  const previewChar = getQuickMenuPreviewChar();
  menu.querySelectorAll(".card-preview-style-preset-option").forEach(item => {
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
    menu.querySelectorAll(".card-preview-style-preset-option .preview-style-preset-glyph").forEach(glyph => {
      glyph.style.fontFamily = cssName(font);
    });
  });
}

function syncCardPreviewStyleMenuLabel() {
  const summary = $("#cardPreviewStylePresetDropdown")?.querySelector("summary");
  const badge = $("#cardPreviewStyleBadge");
  if (!summary) return;
  const preset = state.activeCardPreviewStylePresetId
    ? findCardPreviewStylePreset(state.activeCardPreviewStylePresetId)
    : null;
  const name = preset?.name || t("filter.styleDefault");
  const label = preset ? t("filter.styleMenuNamed", { name }) : t("filter.styleMenu");
  if (badge) badge.textContent = name;
  summary.title = label;
  summary.setAttribute("aria-label", label);
}

function renderCardPreviewStyleQuickMenu() {
  const menu = $("#cardPreviewStylePresetMenu");
  if (!menu) return;
  const activeId = state.activeCardPreviewStylePresetId || "";
  let html = `<div class="card-preview-style-preset-list">`;
  html += renderQuickPresetMenuItem("", { active: !activeId, name: t("filter.styleDefault") });
  html += state.cardPreviewStylePresets.map(preset =>
    renderQuickPresetMenuItem(preset.id, { active: preset.id === activeId, name: preset.name })
  ).join("");
  html += `</div><span class="popover-divider"></span>
    <div class="card-preview-style-preset-footer">
      <button type="button" class="card-preview-style-preset-action card-preview-style-preset-action-new" data-preset-action="new" aria-label="${escapeHtml(t("previewStyle.newStyle"))}" title="${escapeHtml(t("previewStyle.newStyle"))}"><span class="card-preview-style-preset-action-icon" aria-hidden="true">+</span></button>
      <button type="button" class="card-preview-style-preset-action" data-preset-action="manage">${escapeHtml(t("previewStyle.manageStyles"))}</button>
    </div>`;
  menu.innerHTML = html;
  applyQuickPresetMenuStyles();
  syncCardPreviewStyleMenuLabel();
}

function handleGridLayoutControlWheel(event) {
  const label = event.target.closest(".grid-layout-control");
  const range = label?.querySelector('input[type="range"]');
  if (!range || range.disabled) return;
  event.preventDefault();
  event.stopPropagation();
  adjustRangeInput(range, event.deltaY > 0 ? 1 : -1);
}

function closeCardPreviewStyleQuickMenu() {
  $("#cardPreviewStylePresetDropdown")?._closeQuickMenu?.();
}

function wireCardPreviewStyleQuickMenu() {
  const menuWrap = $(".card-preview-style-menu");
  const dropdown = $("#cardPreviewStylePresetDropdown");
  const menu = $("#cardPreviewStylePresetMenu");
  const summary = dropdown?.querySelector("summary");
  if (!menuWrap || !dropdown || !menu || !summary) return;
  renderCardPreviewStyleQuickMenu();
  const presetPopoverOptions = { align: "left", minWidth: 320 };
  let closeTimer = null;
  let suppressOpenUntil = 0;
  const closeMenu = () => {
    clearTimeout(closeTimer);
    closeTimer = null;
    suppressOpenUntil = Date.now() + 500;
    dropdown.removeAttribute("open");
    menu.hidden = true;
    resetFloatingPopover(menu, dropdown);
  };
  const syncPopover = () => {
    if (dropdown.open) {
      menu.hidden = false;
      document.querySelectorAll(".filter-menu[open]").forEach(other => {
        if (other === dropdown) return;
        other.removeAttribute("open");
        resetFloatingPopover(other.querySelector(".filter-popover"), other);
      });
      mountFloatingPopover(menu, summary, presetPopoverOptions);
      applyQuickPresetMenuStyles();
    } else {
      resetFloatingPopover(menu, dropdown);
      menu.hidden = true;
    }
  };
  const openMenu = () => {
    if (Date.now() < suppressOpenUntil) return;
    clearTimeout(closeTimer);
    closeTimer = null;
    menu.hidden = false;
    if (!dropdown.open) dropdown.setAttribute("open", "");
    else applyQuickPresetMenuStyles();
  };
  const scheduleClose = event => {
    if (isWithinFloatingMenu(event?.relatedTarget, dropdown, menu)) return;
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closeMenu, 320);
  };
  summary.addEventListener("click", event => event.preventDefault());
  dropdown.addEventListener("toggle", syncPopover);
  menuWrap.addEventListener("mouseenter", openMenu);
  menuWrap.addEventListener("mouseleave", scheduleClose);
  menu.addEventListener("mouseenter", () => clearTimeout(closeTimer));
  menu.addEventListener("mouseleave", scheduleClose);
  window.addEventListener("resize", () => {
    if (dropdown.open) mountFloatingPopover(menu, summary, presetPopoverOptions);
  });
  menu.addEventListener("click", event => {
    const actionBtn = event.target.closest("[data-preset-action]");
    if (actionBtn?.dataset.presetAction === "new" || actionBtn?.dataset.presetAction === "manage") {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
      if (actionBtn.dataset.presetAction === "new") {
        openCardPreviewStyleModal();
        createNewCardPreviewStyleDraft();
      } else {
        openCardPreviewStyleModal();
        setCardPreviewStyleModalTab("manage");
      }
      return;
    }
    const item = event.target.closest("[data-preset-id]");
    if (!item) return;
    applyCardPreviewStylePresetById(item.dataset.presetId || null);
    closeMenu();
  });
  dropdown._closeQuickMenu = closeMenu;
}

function loadManagePresetToEdit() {
  if (!cardPreviewStyleManagePresetId) {
    toast("默认样式不可编辑，请新建样式");
    return;
  }
  loadCardPreviewStylePresetDraft(cardPreviewStyleManagePresetId || null);
  setCardPreviewStyleModalTab("edit");
}

function createNewCardPreviewStyleDraft() {
  cardPreviewStyleManagePresetId = "";
  cardPreviewStyleManageHoverPresetId = null;
  managePresetInlineRenamePresetId = null;
  hideManagePresetContextMenu();
  loadCardPreviewStylePresetDraft(null);
  setCardPreviewStyleModalTab("edit");
}

function syncCardPreviewStylePresetEditorVisibility() {
  const wrap = $("#cardPreviewStylePresetRenameWrap");
  const editFooter = $("#cardPreviewStyleFooterEdit");
  const showing = wrap && !wrap.hidden;
  if (editFooter && cardPreviewStyleModalTab === "edit") {
    editFooter.hidden = showing;
  }
}

function hideCardPreviewStylePresetEditor() {
  cardPreviewStylePresetEditorMode = null;
  const wrap = $("#cardPreviewStylePresetRenameWrap");
  const input = $("#cardPreviewStylePresetRenameInput");
  if (wrap) wrap.hidden = true;
  if (input) input.value = "";
  syncCardPreviewStylePresetEditorVisibility();
}

function showCardPreviewStylePresetEditor(mode, initialValue = "") {
  cardPreviewStylePresetEditorMode = mode;
  const wrap = $("#cardPreviewStylePresetRenameWrap");
  const input = $("#cardPreviewStylePresetRenameInput");
  if (!wrap || !input) return;
  wrap.hidden = false;
  input.value = initialValue;
  input.placeholder = mode === "rename" ? "输入新名称" : "输入样式名称";
  syncCardPreviewStylePresetEditorVisibility();
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
      toast("请输入样式名称");
      return;
    }
    renameCardPreviewStylePreset(presetId, name);
    persistUiSettings();
    hideCardPreviewStylePresetEditor();
    if (cardPreviewStyleModalTab === "manage") renderCardPreviewStyleManagePanel();
    renderCardPreviewStyleQuickMenu();
    toast("已重命名样式");
    return;
  }
  if (!name) {
    toast("请输入样式名称");
    return;
  }
  if (!cardPreviewStyleDraft) {
    toast("当前没有可保存的样式");
    return;
  }
  const preset = createCardPreviewStylePreset(name, cardPreviewStyleDraft);
  cardPreviewStyleDraftPresetId = preset.id;
  cardPreviewStyleManagePresetId = preset.id;
  persistUiSettings();
  hideCardPreviewStylePresetEditor();
  renderCardPreviewStyleQuickMenu();
  syncCardPreviewStyleFooter();
  toast(`已保存「${preset.name}」`);
  return;
}

function saveCardPreviewStylePresetDraft() {
  if (!cardPreviewStyleDraft) {
    toast("当前没有可保存的样式");
    return;
  }
  if (cardPreviewStyleDraftPresetId && findCardPreviewStylePreset(cardPreviewStyleDraftPresetId)) {
    const preset = updateCardPreviewStylePreset(cardPreviewStyleDraftPresetId, cardPreviewStyleDraft);
    persistUiSettings();
    renderCardPreviewStyleQuickMenu();
    syncCardPreviewStyleFooter();
    toast(`已保存「${preset?.name || "样式"}」`);
    return;
  }
  showCardPreviewStylePresetEditor("save-as", uniqueCardPreviewStylePresetName("未命名样式"));
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
  toast(`已导出 ${state.cardPreviewStylePresets.length} 个样式`);
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
    if (!imported) throw new Error("没有有效的样式");
    persistUiSettings();
    renderCardPreviewStyleManagePanel();
    renderCardPreviewStyleQuickMenu();
    toast(`已导入 ${imported} 个样式`);
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
  closeCardPreviewStyleQuickMenu();
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
  setCardPreviewStyleModalTab("edit");
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
        toast(`已应用「${findCardPreviewStylePreset(state.activeCardPreviewStylePresetId)?.name || "样式"}」`);
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
  managePresetInlineRenamePresetId = null;
  hideManagePresetContextMenu();
  draggingPreviewStyleLayerId = null;
  hideCardPreviewStylePresetEditor();
  $("#cardPreviewStyleModal").hidden = true;
  if (apply) renderCardPreviewStyleQuickMenu();
}

function handlePreviewStyleWheel(event) {
  const modal = $("#cardPreviewStyleModal");
  if (modal?.hidden) return;
  const target = event.target;
  const fontField = target.closest?.(".preview-style-font-field");
  if (fontField && modal.contains(fontField)) {
    event.preventDefault();
    event.stopPropagation();
    stepCardPreviewStyleFont(event.deltaY > 0 ? 1 : -1);
    return;
  }
  const range = target instanceof HTMLInputElement && target.classList.contains("preview-style-range")
    ? target
    : target.closest?.(".preview-style-range-wrap")?.querySelector("input.preview-style-range");
  if (!range || !modal.contains(range)) return;
  event.preventDefault();
  event.stopPropagation();
  adjustRangeInput(range, event.deltaY > 0 ? 1 : -1);
}

function wireCardPreviewStyleModal() {
  const modal = $("#cardPreviewStyleModal");
  if (!modal) return;
  bindPreviewStyleStatusHints();
  modal.querySelector(".preview-style-modal")?.addEventListener("wheel", handlePreviewStyleWheel, { passive: false });
  $("#cardPreviewStyleClose")?.addEventListener("click", () => closeCardPreviewStyleModal(false));
  $("#cardPreviewStyleCancel")?.addEventListener("click", () => closeCardPreviewStyleModal(false));
  modal.addEventListener("click", event => {
    if (event.target === modal) closeCardPreviewStyleModal(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    const menu = $("#cardPreviewStylePresetContextMenu");
    if (menu && !menu.hidden) {
      hideManagePresetContextMenu();
      return;
    }
    if (managePresetInlineRenamePresetId) {
      cancelManagePresetInlineRename();
      return;
    }
    if (!modal.hidden) closeCardPreviewStyleModal(false);
  });
  document.addEventListener("pointerdown", event => {
    const menu = $("#cardPreviewStylePresetContextMenu");
    if (!menu || menu.hidden) return;
    if (!menu.contains(event.target)) hideManagePresetContextMenu();
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
    if (event.target.closest(".preview-style-preset-edit")) {
      event.stopPropagation();
      const card = event.target.closest(".preview-style-preset-card");
      if (!card?.dataset.presetId) return;
      cardPreviewStyleManagePresetId = card.dataset.presetId;
      loadManagePresetToEdit();
      return;
    }
    if (event.target.closest(".preview-style-preset-rename-input")) return;
    const item = event.target.closest(".preview-style-preset-card");
    if (!item) return;
    handleManagePresetCardActivate(item);
  });
  presetList?.addEventListener("dblclick", event => {
    const label = event.target.closest(".preview-style-preset-label[data-renamable='true']");
    if (!label) return;
    event.preventDefault();
    const card = label.closest(".preview-style-preset-card");
    if (!card?.dataset.presetId) return;
    startManagePresetInlineRename(card.dataset.presetId);
  });
  presetList?.addEventListener("keydown", event => {
    const card = event.target.closest(".preview-style-preset-card");
    if (!card || card.querySelector(".preview-style-preset-rename-input")) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleManagePresetCardActivate(card);
    } else if (event.key === "F2" && card.dataset.presetId) {
      event.preventDefault();
      startManagePresetInlineRename(card.dataset.presetId);
    }
  });
  presetList?.addEventListener("focusout", event => {
    const input = event.target.closest(".preview-style-preset-rename-input");
    if (!input || !presetList.contains(input)) return;
    setTimeout(() => {
      const active = document.activeElement;
      if (active?.closest(".preview-style-preset-rename-input")) return;
      commitManagePresetInlineRename();
    }, 0);
  });
  presetList?.addEventListener("keydown", event => {
    const input = event.target.closest(".preview-style-preset-rename-input");
    if (!input) return;
    if (event.key === "Enter") {
      event.preventDefault();
      commitManagePresetInlineRename();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelManagePresetInlineRename();
    }
  });
  presetList?.addEventListener("contextmenu", event => {
    const card = event.target.closest(".preview-style-preset-card");
    if (!card || !presetList.contains(card)) return;
    event.preventDefault();
    cardPreviewStyleManagePresetId = card.dataset.presetId || "";
    renderCardPreviewStyleManagePanel();
    showManagePresetContextMenu(card.dataset.presetId || "", event.clientX, event.clientY);
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
  $("#cardPreviewStyleManageNew")?.addEventListener("click", createNewCardPreviewStyleDraft);
  $("#cardPreviewStyleManageDelete")?.addEventListener("click", () => {
    if (!cardPreviewStyleManagePresetId) return;
    deleteManagePresetById(cardPreviewStyleManagePresetId);
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
    const row = event.target.closest("[data-layer-key]");
    if (!row) return;
    draggingPreviewStyleLayerId = row.dataset.layerKey;
    row.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggingPreviewStyleLayerId);
  });
  layerList?.addEventListener("dragover", event => {
    const row = event.target.closest("[data-layer-key]");
    if (!row || !draggingPreviewStyleLayerId || row.dataset.layerKey === draggingPreviewStyleLayerId) return;
    event.preventDefault();
    const rect = row.getBoundingClientRect();
    row.dataset.dropPos = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    layerList.querySelectorAll(".drop-before, .drop-after").forEach(item => item.classList.remove("drop-before", "drop-after"));
    row.classList.add(row.dataset.dropPos === "before" ? "drop-before" : "drop-after");
  });
  layerList?.addEventListener("dragleave", event => {
    const row = event.target.closest("[data-layer-key]");
    row?.classList.remove("drop-before", "drop-after");
  });
  layerList?.addEventListener("drop", event => {
    const row = event.target.closest("[data-layer-key]");
    if (!row || !draggingPreviewStyleLayerId) return;
    event.preventDefault();
    movePreviewStyleLayer(draggingPreviewStyleLayerId, row.dataset.layerKey, row.dataset.dropPos !== "after");
    draggingPreviewStyleLayerId = null;
    layerList.querySelectorAll(".dragging, .drop-before, .drop-after").forEach(item => item.classList.remove("dragging", "drop-before", "drop-after"));
    renderCardPreviewStyleLayerList();
    renderCardPreviewStyleModalPreview();
  });
  layerList?.addEventListener("dragend", () => {
    draggingPreviewStyleLayerId = null;
    layerList.querySelectorAll(".dragging, .drop-before, .drop-after").forEach(item => item.classList.remove("dragging", "drop-before", "drop-after"));
  });
  $("#cardPreviewStyleLayerMoveUp")?.addEventListener("click", () => {
    moveSelectedPreviewStyleLayer(-1);
    renderCardPreviewStyleLayerList();
    renderCardPreviewStyleModalPreview();
  });
  $("#cardPreviewStyleLayerMoveDown")?.addEventListener("click", () => {
    moveSelectedPreviewStyleLayer(1);
    renderCardPreviewStyleLayerList();
    renderCardPreviewStyleModalPreview();
  });
  $("#cardPreviewStyleLayerDelete")?.addEventListener("click", () => {
    if (!cardPreviewStyleSelectedLayerId || !removePreviewStyleLayer(cardPreviewStyleSelectedLayerId)) return;
    renderCardPreviewStyleModal();
    renderCardPreviewStyleModalPreview();
  });
  layerList?.addEventListener("click", event => {
    if (!cardPreviewStyleDraft) return;
    if (event.target.matches('input[type="checkbox"]')) return;
    if (event.target.closest(".layer-duplicate")) {
      event.stopPropagation();
      const layerId = event.target.closest("[data-layer-id]")?.dataset.layerId;
      if (!layerId) return;
      const newId = duplicatePreviewStyleLayer(layerId);
      if (newId) cardPreviewStyleSelectedLayerId = newId;
      renderCardPreviewStyleModal();
      return;
    }
    if (event.target.closest(`[data-layer-key="${PREVIEW_STYLE_FILL_LAYER_ID}"]`) && !event.target.closest(".layer-duplicate")) {
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
    const fillItem = event.target.closest(`[data-layer-key="${PREVIEW_STYLE_FILL_LAYER_ID}"]`);
    if (fillItem) {
      cardPreviewStyleDraft.fill.enabled = event.target.checked;
      renderCardPreviewStyleLayerList();
      if (cardPreviewStyleSelectedLayerId == null) renderCardPreviewStyleParams();
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
    applyGradientStopFieldChange(event.target);
  });
  $("#cardPreviewStyleParams")?.addEventListener("click", event => {
    if (!cardPreviewStyleDraft) return;
    const colorModeBtn = event.target.closest(".preview-color-mode-btn");
    if (colorModeBtn?.dataset.modeValue) {
      applyPreviewColorModeChange(colorModeBtn);
      return;
    }
    const radioBtn = event.target.closest(".preview-style-radio-btn");
    if (radioBtn?.dataset.layerField && radioBtn.dataset.radioValue) {
      const layer = cardPreviewStyleDraft.layers.find(entry => entry.id === cardPreviewStyleSelectedLayerId);
      if (layer) {
        layer[radioBtn.dataset.layerField] = radioBtn.dataset.radioValue;
        renderCardPreviewStyleParams();
        renderCardPreviewStyleModalPreview();
      }
      return;
    }
    const positionBtn = event.target.closest(".preview-stroke-position-btn");
    if (positionBtn) {
      const layer = cardPreviewStyleDraft.layers.find(entry => entry.id === cardPreviewStyleSelectedLayerId);
      if (!layer || !isStrokeLayer(layer)) return;
      layer.position = positionBtn.dataset.positionValue;
      renderCardPreviewStyleParams();
      renderCardPreviewStyleModalPreview();
      return;
    }
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
  $("#cardPreviewStyleParams")?.addEventListener("dblclick", event => {
    const handle = event.target.closest(".preview-gradient-stop-handle");
    if (!handle || !cardPreviewStyleDraft) return;
    const scope = handle.dataset.gradientScope;
    selectGradientStop(Number(handle.dataset.stopIndex), scope);
    const colorInput = $("#cardPreviewStyleParams")?.querySelector(`input[data-gradient-stop-field="color"][data-gradient-scope="${scope}"]`);
    if (colorInput?.showPicker) colorInput.showPicker();
    else colorInput?.click();
  });
  $("#cardPreviewStyleParams")?.addEventListener("pointerover", event => {
    if (draggingGradientStopIndex !== null) return;
    const handle = event.target.closest(".preview-gradient-stop-handle");
    if (!handle) return;
    const index = Number(handle.dataset.stopIndex);
    const scope = handle.dataset.gradientScope;
    if (!Number.isFinite(index) || index === cardPreviewStyleHoverStopIndex) return;
    cardPreviewStyleHoverStopIndex = index;
    updateGradientStopControls(scope, index);
    refreshGradientBarVisuals(scope);
  });
  $("#cardPreviewStyleParams")?.addEventListener("pointerout", event => {
    const handle = event.target.closest(".preview-gradient-stop-handle");
    if (!handle || cardPreviewStyleHoverStopIndex === null) return;
    const related = event.relatedTarget;
    if (related?.closest?.(".preview-gradient-stop-handle")) return;
    const scope = handle.dataset.gradientScope;
    cardPreviewStyleHoverStopIndex = null;
    updateGradientStopControls(scope, cardPreviewStyleSelectedStopIndex);
    refreshGradientBarVisuals(scope);
  });
  $("#cardPreviewStyleParams")?.addEventListener("pointerdown", event => {
    const shadowDial = event.target.closest(".preview-shadow-angle-dial");
    if (shadowDial && cardPreviewStyleDraft) {
      event.preventDefault();
      draggingShadowAngleLayerId = shadowDial.dataset.layerId || cardPreviewStyleSelectedLayerId;
      shadowDial.classList.add("is-dragging");
      shadowDial.setPointerCapture(event.pointerId);
      applyShadowAngleChange(draggingShadowAngleLayerId, snapPreviewAngle(shadowAngleFromPointer(shadowDial, event.clientX, event.clientY), event.shiftKey));
      return;
    }
    const strokeOffsetDial = event.target.closest(".preview-stroke-offset-angle-dial");
    if (strokeOffsetDial && cardPreviewStyleDraft) {
      event.preventDefault();
      draggingStrokeOffsetAngleLayerId = strokeOffsetDial.dataset.layerId || cardPreviewStyleSelectedLayerId;
      strokeOffsetDial.classList.add("is-dragging");
      strokeOffsetDial.setPointerCapture(event.pointerId);
      applyStrokeOffsetAngleChange(draggingStrokeOffsetAngleLayerId, snapPreviewAngle(strokeOffsetAngleFromPointer(strokeOffsetDial, event.clientX, event.clientY), event.shiftKey));
      return;
    }
    const dial = event.target.closest(".preview-gradient-angle-dial");
    if (dial && cardPreviewStyleDraft) {
      event.preventDefault();
      draggingGradientAngleScope = dial.dataset.gradientScope || getActiveGradientScope();
      dial.classList.add("is-dragging");
      dial.setPointerCapture(event.pointerId);
      applyGradientAngleChange(draggingGradientAngleScope, snapPreviewAngle(gradientAngleFromPointer(dial, event.clientX, event.clientY), event.shiftKey));
      return;
    }
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
    refreshGradientBarVisuals(draggingGradientScope);
  });
  $("#cardPreviewStyleParams")?.addEventListener("pointermove", event => {
    if (draggingShadowAngleLayerId) {
      const dial = $("#cardPreviewStyleParams")?.querySelector(`.preview-shadow-angle-dial[data-layer-id="${CSS.escape(draggingShadowAngleLayerId)}"]`);
      if (dial) applyShadowAngleChange(draggingShadowAngleLayerId, snapPreviewAngle(shadowAngleFromPointer(dial, event.clientX, event.clientY), event.shiftKey));
      return;
    }
    if (draggingStrokeOffsetAngleLayerId) {
      const dial = $("#cardPreviewStyleParams")?.querySelector(`.preview-stroke-offset-angle-dial[data-layer-id="${CSS.escape(draggingStrokeOffsetAngleLayerId)}"]`);
      if (dial) applyStrokeOffsetAngleChange(draggingStrokeOffsetAngleLayerId, snapPreviewAngle(strokeOffsetAngleFromPointer(dial, event.clientX, event.clientY), event.shiftKey));
      return;
    }
    if (draggingGradientAngleScope) {
      const dial = $("#cardPreviewStyleParams")?.querySelector(`.preview-gradient-angle-dial[data-gradient-scope="${draggingGradientAngleScope}"]`);
      if (dial) applyGradientAngleChange(draggingGradientAngleScope, snapPreviewAngle(gradientAngleFromPointer(dial, event.clientX, event.clientY), event.shiftKey));
      return;
    }
    if (draggingGradientStopIndex === null) return;
    handleGradientStopDrag(event);
  });
  $("#cardPreviewStyleParams")?.addEventListener("pointerup", event => {
    if (draggingShadowAngleLayerId) {
      const dial = $("#cardPreviewStyleParams")?.querySelector(`.preview-shadow-angle-dial[data-layer-id="${CSS.escape(draggingShadowAngleLayerId)}"]`);
      if (dial?.hasPointerCapture?.(event.pointerId)) dial.releasePointerCapture(event.pointerId);
      dial?.classList.remove("is-dragging");
      draggingShadowAngleLayerId = null;
      return;
    }
    if (draggingStrokeOffsetAngleLayerId) {
      const dial = $("#cardPreviewStyleParams")?.querySelector(`.preview-stroke-offset-angle-dial[data-layer-id="${CSS.escape(draggingStrokeOffsetAngleLayerId)}"]`);
      if (dial?.hasPointerCapture?.(event.pointerId)) dial.releasePointerCapture(event.pointerId);
      dial?.classList.remove("is-dragging");
      draggingStrokeOffsetAngleLayerId = null;
      return;
    }
    if (draggingGradientAngleScope) {
      const dial = $("#cardPreviewStyleParams")?.querySelector(`.preview-gradient-angle-dial[data-gradient-scope="${draggingGradientAngleScope}"]`);
      if (dial?.hasPointerCapture?.(event.pointerId)) dial.releasePointerCapture(event.pointerId);
      dial?.classList.remove("is-dragging");
      draggingGradientAngleScope = null;
      return;
    }
    if (draggingGradientStopIndex === null) return;
    finishGradientStopDrag(event);
  });
  $("#cardPreviewStyleParams")?.addEventListener("pointercancel", event => {
    if (draggingShadowAngleLayerId) {
      const dial = $("#cardPreviewStyleParams")?.querySelector(`.preview-shadow-angle-dial[data-layer-id="${CSS.escape(draggingShadowAngleLayerId)}"]`);
      if (dial?.hasPointerCapture?.(event.pointerId)) dial.releasePointerCapture(event.pointerId);
      dial?.classList.remove("is-dragging");
      draggingShadowAngleLayerId = null;
      return;
    }
    if (draggingStrokeOffsetAngleLayerId) {
      const dial = $("#cardPreviewStyleParams")?.querySelector(`.preview-stroke-offset-angle-dial[data-layer-id="${CSS.escape(draggingStrokeOffsetAngleLayerId)}"]`);
      if (dial?.hasPointerCapture?.(event.pointerId)) dial.releasePointerCapture(event.pointerId);
      dial?.classList.remove("is-dragging");
      draggingStrokeOffsetAngleLayerId = null;
      return;
    }
    if (draggingGradientAngleScope) {
      const dial = $("#cardPreviewStyleParams")?.querySelector(`.preview-gradient-angle-dial[data-gradient-scope="${draggingGradientAngleScope}"]`);
      if (dial?.hasPointerCapture?.(event.pointerId)) dial.releasePointerCapture(event.pointerId);
      dial?.classList.remove("is-dragging");
      draggingGradientAngleScope = null;
      return;
    }
    if (draggingGradientStopIndex === null) return;
    finishGradientStopDrag(event);
  });
  $("#cardPreviewStyleParams")?.addEventListener("wheel", event => {
    if (!cardPreviewStyleDraft) return;
    const dial = event.target.closest(".preview-gradient-angle-dial");
    if (!dial) return;
    event.preventDefault();
    event.stopPropagation();
    const current = Number(dial.getAttribute("aria-valuenow")) || 0;
    const next = normalizePreviewAngle(current + previewAngleWheelDelta(event));
    if (dial.classList.contains("preview-shadow-angle-dial")) {
      applyShadowAngleChange(dial.dataset.layerId || cardPreviewStyleSelectedLayerId, next);
      return;
    }
    if (dial.classList.contains("preview-stroke-offset-angle-dial")) {
      applyStrokeOffsetAngleChange(dial.dataset.layerId || cardPreviewStyleSelectedLayerId, next);
      return;
    }
    applyGradientAngleChange(dial.dataset.gradientScope || getActiveGradientScope(), next);
  }, { passive: false });
  $("#cardPreviewStyleParams")?.addEventListener("input", event => {
    if (!cardPreviewStyleDraft) return;
    if (applyGradientStopFieldChange(event.target)) return;
    const gradientField = event.target.dataset.gradientField;
    const gradientScope = event.target.dataset.gradientScope;
    if (gradientField === "angle" && gradientScope) {
      const target = getGradientEditTarget(gradientScope);
      if (!target) return;
      applyGradientAngleChange(gradientScope, event.target.value);
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
  const unitsPerPx = previewStyleUnitsPerPx(upm);
  const styled = state.cardPreviewStyle && hasActiveCardPreviewStyle(state.cardPreviewStyle);
  const effectBleed = styled ? computePreviewStyleVisualBleed(state.cardPreviewStyle, unitsPerPx) : 0;
  const padding = Math.round(upm * 0.08) + effectBleed;
  const originX = bbox.minX - padding;
  const originY = bbox.minY - padding;
  const width = Math.max(1, bbox.maxX - bbox.minX + padding * 2);
  const height = Math.max(1, bbox.maxY - bbox.minY + padding * 2);
  const normalizedCommands = translateSvgPathCommands(svgCommands, -originX, -originY);
  const pathData = pathCommandsToSvgData(normalizedCommands);
  const label = escapeXml(font.displayName || font.family || "font");
  if (!styled) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${formatOutlineNumber(width)} ${formatOutlineNumber(height)}" overflow="visible" role="img" aria-label="${label}">\n  <path fill="#181816" d="${pathData}"/>\n</svg>`;
  }
  return buildStyledOutlineSvgMarkup({ pathData, width, height, label, style: state.cardPreviewStyle, unitsPerPx, bleed: effectBleed });
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

function syncCardFavoriteButton(button, font, displayName = font.displayName || font.family) {
  if (!button || !font) return;
  const favorited = state.favorites.has(font.postscriptName);
  button.classList.toggle("favorited", favorited);
  button.title = favorited ? "取消收藏" : "收藏字体";
  button.setAttribute("aria-label", `${favorited ? "取消收藏" : "收藏"} ${displayName}`);
  button.innerHTML = CARD_STAR_ICON;
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
  card.innerHTML = `${renderCardTitle(font, displayName)}<span class="sample">${escapeHtml(cardPreviewText())}</span><small>${escapeHtml(font.style || "Regular")}${font.variable ? " · Variable" : ""}${ratioText}</small><button class="star" type="button"></button><div class="card-actions"><button class="card-download-svg" type="button" title="下载 SVG 轮廓" aria-label="下载 ${escapeHtml(displayName)} 的 SVG 轮廓">${CARD_DOWNLOAD_ICON}</button><button class="card-copy-svg" type="button" title="复制 SVG 轮廓" aria-label="复制 ${escapeHtml(displayName)} 的 SVG 轮廓">${CARD_SVG_ICON}</button><button class="card-copy" type="button" title="复制字体名称" aria-label="复制 ${escapeHtml(displayName)} 的字体名称">⧉</button></div>`;
  syncCardFavoriteButton(card.querySelector(".star"), font, displayName);
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
  state.singleCardSize = clampSingleCardSize(state.singleCardSize);
  ui.list.classList.toggle("single-view", state.view === "single");
  ui.list.classList.toggle("focus-view", state.view === "focus");
  ui.list.style.setProperty("--single-card-size", `${state.singleCardSize}px`);
  state.pageSize = calculatePageSize();
  state.totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
  state.page = Math.max(0, Math.min(state.page, state.totalPages - 1));
  const start = state.page * state.pageSize;
  const pageFonts = state.filtered.slice(start, start + state.pageSize);
  const fragment = document.createDocumentFragment();
  for (const font of pageFonts) fragment.appendChild(createFontCard(font));
  ui.list.replaceChildren(fragment);
  syncCardGridLayoutVars();
  syncCardGridControls();
  if (state.view === "single") {
    const singleLayout = getSingleViewGridLayout();
    ui.list.style.gridTemplateColumns = `repeat(${singleLayout.columns}, var(--single-card-size))`;
  } else {
    ui.list.style.gridTemplateColumns = `repeat(${getCardGridLayout().columns}, minmax(0, 1fr))`;
  }
  ui.count.innerHTML = `<span class="font-count-value">${state.filtered.length}</span><span class="font-count-suffix">${t("toolbar.fontCountSuffix")}</span>`;
  ui.empty.hidden = state.filtered.length > 0;
  ui.pagination.hidden = state.filtered.length === 0;
  renderPaginationSummary(pageFonts.length, start);
  ui.previousPage.disabled = state.page === 0;
  ui.nextPage.disabled = state.page >= state.totalPages - 1;
  const hydratePage = () => {
    if (renderToken !== state.renderVersion) return;
    setupLazyFontLoading();
    void waitForCurrentPageReady(renderToken).then(() => {
      if (renderToken !== state.renderVersion) return;
      preloadAdjacentPages();
      if (state.pendingSelectionId != null) {
        const pendingId = state.pendingSelectionId;
        state.pendingSelectionId = null;
        const pendingFont = state.fonts.find(item => item.id === pendingId);
        if (pendingFont) selectFont(pendingFont);
      }
    });
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
    scheduleCardSampleFit();
    hydratePage();
  };
  if (deferFonts) requestAnimationFrame(() => requestAnimationFrame(finishRender));
  else requestAnimationFrame(finishRender);
}

function renderPaginationSummary(pageCount, startIndex = 0) {
  if (!ui.pageInfo || !ui.viewStatus) return;
  ui.pageInfo.innerHTML = t("status.page", {
    current: `<span class="page-current">${state.page + 1}</span>`,
    total: state.totalPages
  });
  ui.viewStatus.innerHTML = t("status.pageCount", {
    shown: `<span class="view-status-count">${pageCount ? startIndex + pageCount : startIndex}</span>`,
    total: state.filtered.length
  });
}

function updateFontStatus(font) {
  if (!font) {
    ui.fontStatus.textContent = t("status.hoverHint");
    return;
  }
  const details = font.details;
  const weight = details?.weight || font.weightClass || 400;
  const parts = [
    font.style || t("fontStyle.regular"),
    `W${weight}`,
    font.variable === true ? t("detail.variableFont") : font.variable === false ? t("detail.standardFont") : t("detail.pendingDetect"),
    details?.format || "OpenType",
    Number.isFinite(font.aspectRatio) ? `${font.aspectRatio.toFixed(2)}:1` : null
  ].filter(Boolean);
  ui.fontStatus.innerHTML = `<strong>${escapeHtml(font.displayName || font.family)}</strong>${parts.map(item => `<span>${escapeHtml(String(item))}</span>`).join("")}${state.favorites.has(font.postscriptName) ? `<span class="favorite-status">${escapeHtml(t("status.favorited"))}</span>` : ""}`;
}

function calculatePageSize() {
  if (state.view === "single") {
    const { columns, rows } = getSingleViewGridLayout();
    return columns * rows;
  }
  const layout = getCardGridLayout();
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

const PRELOAD_AHEAD_PAGES = 2;

async function waitForCurrentPageReady(renderToken) {
  const start = state.page * state.pageSize;
  const pageFonts = state.filtered.slice(start, start + state.pageSize);
  if (!pageFonts.length) return;
  const previewText = cardPreviewText();
  for (let index = 0; index < pageFonts.length; index += 6) {
    if (renderToken !== state.renderVersion) return;
    const batch = pageFonts.slice(index, index + 6);
    await Promise.all(batch.map(font => ensureFontLoaded(font, previewText)));
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  if (renderToken !== state.renderVersion) return;
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function preloadAdjacentPages() {
  const token = ++state.preloadVersion;
  const basePage = state.page;
  const scheduledPages = Array.from({ length: PRELOAD_AHEAD_PAGES }, (_, index) => basePage + index + 1)
    .filter(page => page < state.totalPages);
  preloadLog(`预加载任务 #${token} 已排队`, { currentPage: basePage + 1, scheduledPages, pageSize: state.pageSize });
  const run = async () => {
    for (let offset = 1; offset <= PRELOAD_AHEAD_PAGES; offset++) {
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

function fullCardPreviewText() {
  return ui.previewInput.value || "字";
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
  ensureFontLoaded(font, getPreviewSampleText(sample)).then(finish);
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
        if (getPreviewSampleText(sample) !== cardPreviewText()) setPreviewSampleText(sample, cardPreviewText());
        loadCardFont(entry.target);
      } else {
        state.prefetchCards.delete(entry.target);
      }
    }
  }, { root: ui.list, rootMargin: `${Math.max(800, ui.list.clientHeight * 2)}px 0px` });
  ui.list.querySelectorAll(".font-card").forEach(card => fontObserver.observe(card));
}

function syncCardPreviewStyleStackTypography(sample) {
  const stackRoot = resolvePreviewStyleStackRoot(sample);
  if (stackRoot) syncPreviewStyleTextStackTypography(stackRoot, sample);
}

function fitCardSample(sample) {
  if (!sample || state.view === "single") return;
  const measureTarget = resolvePreviewStyleStackRoot(sample) || sample;
  const maximum = cardBaseFontSize();
  sample.style.fontSize = `${maximum}px`;
  syncCardPreviewStyleStackTypography(sample);
  const styles = getComputedStyle(sample);
  const horizontalPadding = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
  const availableWidth = sample.clientWidth - horizontalPadding;
  if (!availableWidth || measureTarget.scrollWidth <= availableWidth) return;
  let low = 10, high = maximum;
  for (let i = 0; i < 7; i++) {
    const middle = (low + high) / 2;
    sample.style.fontSize = `${middle}px`;
    syncCardPreviewStyleStackTypography(sample);
    if (measureTarget.scrollWidth <= availableWidth) low = middle;
    else high = middle;
  }
  sample.style.fontSize = `${Math.max(10, low - .5)}px`;
  syncCardPreviewStyleStackTypography(sample);
}

function cardBaseFontSize() {
  return state.cardSampleSize;
}

function syncCardSampleSizeBubble(show = false) {
  const bubble = ui.cardSampleSizeBubble;
  const input = ui.cardSampleSize;
  if (!bubble || !input) return;
  const value = Number(input.value);
  bubble.textContent = String(value);
  if (!show) {
    bubble.hidden = true;
    return;
  }
  bubble.hidden = false;
  const min = Number(input.min);
  const max = Number(input.max);
  const percent = max === min ? 0 : (value - min) / (max - min);
  const trackWidth = input.offsetWidth || input.clientWidth;
  const thumb = 14;
  const x = percent * Math.max(trackWidth - thumb, 0) + thumb / 2;
  bubble.style.left = `${x}px`;
  bubble.style.transform = "translateX(-50%)";
}

let cardSampleSizeBubbleHideTimer = null;

function showCardSampleSizeBubble() {
  clearTimeout(cardSampleSizeBubbleHideTimer);
  syncCardSampleSizeBubble(true);
}

function hideCardSampleSizeBubble(delay = 0) {
  clearTimeout(cardSampleSizeBubbleHideTimer);
  cardSampleSizeBubbleHideTimer = setTimeout(() => {
    if (ui.cardSampleSizeBubble) ui.cardSampleSizeBubble.hidden = true;
  }, delay);
}

function syncSingleCardSizeBubble(show = false) {
  const bubble = $("#singleCardSizeBubble");
  const input = $("#singleCardSize");
  if (!bubble || !input) return;
  const value = Number(input.value);
  bubble.textContent = String(value);
  if (!show) {
    bubble.hidden = true;
    return;
  }
  bubble.hidden = false;
  const min = Number(input.min);
  const max = Number(input.max);
  const percent = max === min ? 0 : (value - min) / (max - min);
  const trackWidth = input.offsetWidth || input.clientWidth;
  const thumb = 14;
  const x = percent * Math.max(trackWidth - thumb, 0) + thumb / 2;
  bubble.style.left = `${x}px`;
  bubble.style.transform = "translateX(-50%)";
}

let singleCardSizeBubbleHideTimer = null;

function showSingleCardSizeBubble() {
  clearTimeout(singleCardSizeBubbleHideTimer);
  syncSingleCardSizeBubble(true);
}

function hideSingleCardSizeBubble(delay = 0) {
  clearTimeout(singleCardSizeBubbleHideTimer);
  singleCardSizeBubbleHideTimer = setTimeout(() => {
    const bubble = $("#singleCardSizeBubble");
    if (bubble) bubble.hidden = true;
  }, delay);
}

function updateCardSampleSizeControl() {
  const disabled = state.view === "single";
  ui.cardSampleSize.disabled = disabled;
  $("#cardSampleSizeDecrease").disabled = disabled;
  $("#cardSampleSizeIncrease").disabled = disabled;
  ui.cardSampleSize.value = state.cardSampleSize;
  syncCardSampleSizeBubble(false);
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
  showCardSampleSizeBubble();
  hideCardSampleSizeBubble(800);
  persistCardSampleSize();
}

function applyCardSampleSize({ fit = false } = {}) {
  state.cardSampleSize = Number(ui.cardSampleSize.value);
  if (ui.cardSampleSizeBubble && !ui.cardSampleSizeBubble.hidden) syncCardSampleSizeBubble(true);
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
  if (temporary) updateHeaderCardPreviewFocus();
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
  updateHeaderCardPreviewFocus();
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
    if (document.body.classList.contains("header-card-preview-focus")) syncHeaderPreviewFocusDisplay();
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
  if (document.body.classList.contains("header-card-preview-focus")) syncHeaderPreviewFocusDisplay();
  if (ui.hoverPreviewOverlay && !ui.hoverPreviewOverlay.hidden) showHoverPreviewOverlay(state.hovered || state.previewed);
  if (!$("#cardPreviewStyleModal")?.hidden) renderCardPreviewStyleModalPreview();
  scheduleLazyCardTextUpdate();
  if ($("#cardPreviewStylePresetDropdown")?.open || $(".card-preview-style-menu")?.matches(":hover")) applyQuickPresetMenuStyles();
}

function scheduleLazyCardTextUpdate() {
  cancelAnimationFrame(scheduleLazyCardTextUpdate.frame);
  scheduleLazyCardTextUpdate.frame = requestAnimationFrame(() => {
    const cardText = cardPreviewText();
    state.prefetchCards.forEach(card => {
      const sample = card.querySelector(".sample");
      if (sample && getPreviewSampleText(sample) !== cardText) setPreviewSampleText(sample, cardText);
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
  if ($("#previewTabPanel")) $("#previewTabPanel").style.backgroundColor = ui.bg.value;
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
  adjustRangeInput(range, event.deltaY > 0 ? 1 : -1);
}

function handlePreviewStageWheel(event) {
  if (isDetailPreviewEditing() || !state.previewed) return;
  event.preventDefault();
  event.stopPropagation();
  const direction = event.deltaY > 0 ? 1 : -1;
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
  ui.list.querySelectorAll(`[data-id="${font.id}"] .star`).forEach(button => {
    syncCardFavoriteButton(button, font);
  });
  if (state.previewed === font || state.selected === font) updateFontStatus(font);
  applyFilter();
}

function persistFavorites() {
  localStorage.setItem("font-favorites", JSON.stringify([...state.favorites]));
  const assignments = Object.fromEntries([...state.categoryAssignments].map(([font, ids]) => [font, [...ids]]));
  localStorage.setItem("font-favorite-data", JSON.stringify({
    version: 2,
    categories: state.categories,
    assignments,
    recentCategories: state.recentCategories,
    collapsedCategoryIds: [...state.collapsedCategoryIds]
  }));
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
  ui.list.querySelectorAll(`[data-id="${font.id}"] .star`).forEach(button => {
    syncCardFavoriteButton(button, font);
  });
  if (state.previewed === font || state.selected === font) updateFontStatus(font);
  persistFavorites();
}

function categoryHasChildren(categoryId) {
  return state.categories.some(item => item.parentId === categoryId);
}

function isCategoryCollapsed(categoryId) {
  return state.collapsedCategoryIds.has(categoryId);
}

function toggleCategoryCollapsed(categoryId) {
  if (state.collapsedCategoryIds.has(categoryId)) state.collapsedCategoryIds.delete(categoryId);
  else state.collapsedCategoryIds.add(categoryId);
  persistFavorites();
  renderFavoriteSidebar();
}

function visibleCategories() {
  const items = [];
  state.categories.filter(item => !item.parentId).forEach(root => {
    items.push(root);
    if (!isCategoryCollapsed(root.id)) {
      state.categories.filter(item => item.parentId === root.id).forEach(child => items.push(child));
    }
  });
  return items;
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
    { id: "all", name: "全部", parentId: null },
    { id: "uncategorized", name: "未分类", parentId: null },
    ...visibleCategories()
  ];
  ui.favoriteCategoryList.innerHTML = items.map(item => {
    if (state.editingCategoryId === item.id) return `<div class="favorite-category-row" data-category-id="${escapeHtml(item.id)}"><input class="category-inline-input" value="${escapeHtml(item.name)}" maxlength="30" aria-label="分类名称"></div>`;
    const hasChildren = !item.parentId && categoryHasChildren(item.id);
    const collapsed = hasChildren && isCategoryCollapsed(item.id);
    const toggle = hasChildren
      ? `<button type="button" class="favorite-category-toggle${collapsed ? " collapsed" : ""}" data-category-toggle="${escapeHtml(item.id)}" aria-expanded="${collapsed ? "false" : "true"}" aria-label="${collapsed ? "展开子分类" : "折叠子分类"}" title="${collapsed ? "展开子分类" : "折叠子分类"}"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M8 10l4 4 4-4"/></svg></button>`
      : "";
    const button = `<button type="button" class="favorite-category-item${item.parentId ? " child" : ""}${state.favoriteCategoryView === item.id ? " active" : ""}" data-favorite-category="${escapeHtml(item.id)}"><span>${escapeHtml(item.name)}</span><b>${countFor(item.id)}</b></button>`;
    if (item.id === "all") return button;
    if (item.id === "uncategorized") return `${button}<div class="favorite-category-divider" aria-hidden="true"></div>`;
    return `<div class="favorite-category-row${hasChildren ? " has-children" : ""}${item.parentId ? " is-child" : ""}${state.favoriteCategoryView === item.id ? " active" : ""}" draggable="true" data-category-id="${escapeHtml(item.id)}">${toggle}${button}</div>`;
  }).join("");
  ui.favoriteCategoryList.querySelectorAll("[data-favorite-category]").forEach(button => button.addEventListener("click", () => {
    state.favoriteCategoryView = button.dataset.favoriteCategory;
    applyFilter();
    persistUiSettings();
  }));
  ui.favoriteCategoryList.querySelectorAll(".favorite-category-row [data-favorite-category]").forEach(button => button.addEventListener("dblclick", event => {
    event.preventDefault();
    const id = button.closest("[data-category-id]")?.dataset.categoryId;
    if (id) renameCategory(id);
  }));
  ui.favoriteCategoryList.querySelectorAll("[data-category-toggle]").forEach(button => button.addEventListener("click", event => {
    event.stopPropagation();
    toggleCategoryCollapsed(button.dataset.categoryToggle);
  }));
  syncFavoriteCategoryToolbar();
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

function getSelectedEditableCategory() {
  return state.categories.find(item => item.id === state.favoriteCategoryView) || null;
}

function getSiblingCategories(category) {
  if (!category) return [];
  return state.categories.filter(item => (item.parentId || null) === (category.parentId || null));
}

function syncFavoriteCategoryToolbar() {
  const selected = getSelectedEditableCategory();
  const siblings = getSiblingCategories(selected);
  const index = selected ? siblings.findIndex(item => item.id === selected.id) : -1;
  const canEdit = Boolean(selected);
  $("#renameCategoryButton").disabled = !canEdit;
  $("#moveCategoryUpButton").disabled = !canEdit || index <= 0;
  $("#moveCategoryDownButton").disabled = !canEdit || index < 0 || index >= siblings.length - 1;
  $("#deleteCategoryButton").disabled = !canEdit;
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
  if (parentId && state.collapsedCategoryIds.has(parentId)) state.collapsedCategoryIds.delete(parentId);
  state.favoriteCategoryView = category.id;
  state.editingCategoryId = category.id;
  persistFavorites();
  applyFilter();
}

function moveSelectedFavoriteCategory(direction) {
  const selected = getSelectedEditableCategory();
  if (!selected) return;
  const siblings = getSiblingCategories(selected);
  const siblingIndex = siblings.findIndex(item => item.id === selected.id);
  const targetSibling = siblings[siblingIndex + direction];
  if (!targetSibling) return;
  const from = state.categories.indexOf(selected);
  const to = state.categories.indexOf(targetSibling);
  state.categories.splice(from, 1);
  const insertAt = direction < 0 ? to : to;
  state.categories.splice(Math.max(0, insertAt), 0, selected);
  persistFavorites();
  renderFavoriteSidebar();
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
    if (event.target.closest("input, .favorite-category-toggle")) return event.preventDefault();
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
  state.previewColorsCustomized = false;
  applyThemePreviewColorsIfDefault();
  updateVisualSettings();
  if (state.selected?.axes) renderAxes(state.selected.axes);
}

function loadPreviewTextHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(PREVIEW_TEXT_HISTORY_KEY) || "[]");
    return Array.isArray(value)
      ? value.filter(item => typeof item === "string" && item.trim()).slice(0, PREVIEW_TEXT_HISTORY_LIMIT)
      : [];
  } catch {
    return [];
  }
}

function savePreviewTextHistory(history) {
  localStorage.setItem(PREVIEW_TEXT_HISTORY_KEY, JSON.stringify(history.slice(0, PREVIEW_TEXT_HISTORY_LIMIT)));
}

function pushPreviewTextHistory(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return;
  const history = loadPreviewTextHistory().filter(item => item !== trimmed);
  history.unshift(trimmed);
  savePreviewTextHistory(history);
}

function renderPreviewInputHistory() {
  const panel = ui.previewInputHistory;
  if (!panel) return;
  const history = loadPreviewTextHistory();
  if (!history.length) {
    panel.hidden = true;
    panel.innerHTML = "";
    return;
  }
  panel.innerHTML = history.map(text =>
    `<button type="button" class="preview-history-item">${escapeHtml(text)}</button>`
  ).join("");
  panel.hidden = false;
}

function hidePreviewInputHistory() {
  if (ui.previewInputHistory) ui.previewInputHistory.hidden = true;
  $("#previewInputHistoryToggle")?.setAttribute("aria-expanded", "false");
}

function showPreviewInputHistoryPanel() {
  renderPreviewInputHistory();
  if (ui.previewInputHistory?.hidden) return;
  $("#previewInputHistoryToggle")?.setAttribute("aria-expanded", "true");
}

let previewInputHistoryCloseTimer = null;

function scheduleHidePreviewInputHistory() {
  clearTimeout(previewInputHistoryCloseTimer);
  previewInputHistoryCloseTimer = setTimeout(() => {
    const toggle = $("#previewInputHistoryToggle");
    if (toggle?.matches(":hover") || ui.previewInputHistory?.matches(":hover")) return;
    hidePreviewInputHistory();
  }, 120);
}

function setCardPreviewInputValue(text, { save = true, recordHistory = false } = {}) {
  ui.previewInput.value = text;
  if (save) localStorage.setItem("font-preview-text", text);
  if (recordHistory) pushPreviewTextHistory(text);
  updatePreview();
}

function commitPreviewInputHistory() {
  pushPreviewTextHistory(ui.previewInput.value);
  renderPreviewInputHistory();
}

function escapeHtml(value = "") {
  const el = document.createElement("span"); el.textContent = value; return el.innerHTML;
}

const searchControl = ui.search.closest(".search-control");
let suppressSearchSuggestions = false;

function showSearchSuggestions() {
  if (suppressSearchSuggestions) return;
  renderSearchSuggestions();
  ui.searchSuggestions.hidden = false;
}

function hideSearchSuggestions() {
  ui.searchSuggestions.hidden = true;
}

ui.load.addEventListener("click", loadFonts);
ui.reload.addEventListener("click", loadFonts);
ui.search.addEventListener("input", () => {
  suppressSearchSuggestions = false;
  syncSearchClearVisibility();
  applyFilter();
  renderSearchSuggestions();
});
ui.searchClear?.addEventListener("mousedown", event => event.preventDefault());
ui.searchClear?.addEventListener("click", () => {
  ui.search.value = "";
  suppressSearchSuggestions = false;
  syncSearchClearVisibility();
  applyFilter();
  renderSearchSuggestions();
  ui.search.focus();
});
searchControl?.addEventListener("mouseenter", () => {
  suppressSearchSuggestions = false;
  showSearchSuggestions();
});
searchControl?.addEventListener("mouseleave", hideSearchSuggestions);
ui.search.addEventListener("focus", showSearchSuggestions);
searchControl?.querySelector(".search-box")?.addEventListener("click", event => {
  if (event.target.closest("#searchSuggestions, #searchClearButton")) return;
  suppressSearchSuggestions = true;
  hideSearchSuggestions();
});
ui.search.addEventListener("blur", () => {
  requestAnimationFrame(() => {
    if (searchControl?.matches(":hover")) return;
    hideSearchSuggestions();
  });
});
document.addEventListener("pointerdown", event => {
  if (!event.target.closest(".search-control")) {
    suppressSearchSuggestions = false;
    hideSearchSuggestions();
  }
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !ui.searchSuggestions.hidden) {
    suppressSearchSuggestions = false;
    hideSearchSuggestions();
  }
  if (event.key === "Escape" && ui.hoverPreviewOverlay && !ui.hoverPreviewOverlay.hidden) hideHoverPreviewOverlay();
});
document.addEventListener("keydown", event => {
  if (event.key !== " " && event.code !== "Space") return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target.matches("input, textarea, select, button, [contenteditable='true']")) return;
  if (ui.hoverPreviewOverlay && !ui.hoverPreviewOverlay.hidden) {
    event.preventDefault();
    hideHoverPreviewOverlay();
    return;
  }
  if (!state.hovered) return;
  event.preventDefault();
  showHoverPreviewOverlay(state.hovered);
});
ui.hoverPreviewOverlay?.addEventListener("click", event => {
  if (event.target === ui.hoverPreviewOverlay) hideHoverPreviewOverlay();
});
ui.hoverPreviewName?.addEventListener("click", event => {
  event.stopPropagation();
  copyHoverPreviewMeta(ui.hoverPreviewName);
});
ui.hoverPreviewStyle?.addEventListener("click", event => {
  event.stopPropagation();
  copyHoverPreviewMeta(ui.hoverPreviewStyle);
});
[ui.hoverPreviewName, ui.hoverPreviewStyle].forEach(element => {
  element?.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    copyHoverPreviewMeta(element);
  });
});
$("#hoverPreviewClose")?.addEventListener("click", hideHoverPreviewOverlay);
ui.previewInput.addEventListener("input", () => {
  localStorage.setItem("font-preview-text", ui.previewInput.value);
  updatePreview();
});
ui.previewInput.addEventListener("blur", () => {
  commitPreviewInputHistory();
});
ui.previewInput.addEventListener("keydown", event => {
  if (event.key === "Enter") commitPreviewInputHistory();
  if (event.key === "Escape") hidePreviewInputHistory();
});
ui.previewInput.addEventListener("dblclick", event => {
  event.preventDefault();
  setCardPreviewInputValue("", { recordHistory: false });
  hidePreviewInputHistory();
});
const previewInputHistoryToggle = $("#previewInputHistoryToggle");
previewInputHistoryToggle?.addEventListener("mouseenter", () => {
  clearTimeout(previewInputHistoryCloseTimer);
  showPreviewInputHistoryPanel();
});
previewInputHistoryToggle?.addEventListener("mouseleave", scheduleHidePreviewInputHistory);
ui.previewInputHistory?.addEventListener("mouseenter", () => clearTimeout(previewInputHistoryCloseTimer));
ui.previewInputHistory?.addEventListener("mouseleave", scheduleHidePreviewInputHistory);
ui.previewInputHistory?.addEventListener("mousedown", event => event.preventDefault());
ui.previewInputHistory?.addEventListener("click", event => {
  const item = event.target.closest(".preview-history-item");
  if (!item) return;
  setCardPreviewInputValue(item.textContent, { recordHistory: false });
  hidePreviewInputHistory();
});
document.addEventListener("pointerdown", event => {
  if (!event.target.closest(".header-preview-input-wrap")) hidePreviewInputHistory();
});
ui.cardSampleSize.addEventListener("pointerdown", showCardSampleSizeBubble);
ui.cardSampleSize.addEventListener("input", () => {
  applyCardSampleSize();
  showCardSampleSizeBubble();
  persistUiSettings();
});
ui.cardSampleSize.addEventListener("change", () => {
  applyCardSampleSize({ fit: true });
  persistCardSampleSize();
  refreshCardGridPageIfNeeded();
  hideCardSampleSizeBubble(500);
});
ui.cardSampleSize.addEventListener("pointerup", () => hideCardSampleSizeBubble(500));
ui.cardSampleSize.addEventListener("pointercancel", () => hideCardSampleSizeBubble(500));
ui.cardSampleSize.addEventListener("pointerleave", () => hideCardSampleSizeBubble(500));
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
[ui.size, ui.spacing, ui.lineHeight].forEach(input => input.addEventListener("input", updateVisualSettings));
ui.bg.addEventListener("input", () => {
  state.previewColorsCustomized = true;
  updateVisualSettings();
});
ui.color.addEventListener("input", () => {
  state.previewColorsCustomized = true;
  updateVisualSettings();
});
ui.favorite.addEventListener("click", toggleFavorite);
ui.categoryButton.addEventListener("click", () => {
  const font = state.selected || state.previewed;
  if (!font) return toast("请先选择一个字体");
  const rect = ui.categoryButton.getBoundingClientRect();
  showContextMenu(font, rect.left, rect.bottom + 5);
});
ui.reset.addEventListener("click", resetSettings);
$("#addCategoryButton").addEventListener("click", addCategory);
$("#renameCategoryButton").addEventListener("click", () => {
  const selected = getSelectedEditableCategory();
  if (selected) renameCategory(selected.id);
});
$("#moveCategoryUpButton").addEventListener("click", () => moveSelectedFavoriteCategory(-1));
$("#moveCategoryDownButton").addEventListener("click", () => moveSelectedFavoriteCategory(1));
$("#deleteCategoryButton").addEventListener("click", () => {
  const selected = getSelectedEditableCategory();
  if (selected) deleteCategory(selected.id);
});
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
$("#singleViewButton").addEventListener("click", () => setView("single"));
$("#focusViewToggle")?.addEventListener("change", event => {
  setView(event.target.checked ? "focus" : "grid");
});
$("#cardColumns")?.addEventListener("input", event => {
  state.cardColumns = clampCardColumns(event.target.value, getCardGridCapacity().maxColumns);
  syncCardGridControls();
  if (["grid", "focus"].includes(state.view)) {
    state.page = 0;
    renderFontList();
  }
  persistUiSettings();
});
$("#cardRows")?.addEventListener("input", event => {
  state.cardRows = clampCardRows(event.target.value, getCardGridCapacity().maxRows);
  syncCardGridControls();
  if (["grid", "focus"].includes(state.view)) {
    state.page = 0;
    renderFontList();
  }
  persistUiSettings();
});
$("#singleCardSize")?.addEventListener("input", event => {
  state.singleCardSize = clampSingleCardSize(event.target.value);
  syncCardGridControls();
  showSingleCardSizeBubble();
  if (state.view === "single") {
    state.page = 0;
    renderFontList();
  }
  persistUiSettings();
});
$("#singleCardSize")?.addEventListener("pointerdown", showSingleCardSizeBubble);
$("#singleCardSize")?.addEventListener("pointerup", () => hideSingleCardSizeBubble(500));
$("#singleCardSize")?.addEventListener("pointercancel", () => hideSingleCardSizeBubble(500));
$("#singleCardSize")?.addEventListener("mouseenter", showSingleCardSizeBubble);
$("#singleCardSize")?.addEventListener("mouseleave", () => hideSingleCardSizeBubble(300));
document.querySelectorAll(".grid-layout-control").forEach(label => {
  label.addEventListener("wheel", handleGridLayoutControlWheel, { passive: false });
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
  $("#languageBadge").textContent = supportCount ? t("filter.badgeItems", { count: supportCount }) : t("filter.badgeAll");
  $("#weightBadge").textContent = state.weightFilters.size
    ? [...state.weightFilters].sort((a, b) => weightLabelOrder(a) - weightLabelOrder(b)).join(" · ")
    : t("filter.badgeAll");
  $("#sortBadge").textContent = sortLabel(state.sort);
  document.querySelectorAll("[data-sort]").forEach(input => { input.checked = input.dataset.sort === state.sort; });
}
function setView(view) {
  view = normalizeView(view);
  state.view = view;
  updateHeaderCardPreviewFocus();
  $("#gridViewButton").classList.toggle("active", view === "grid");
  $("#singleViewButton").classList.toggle("active", view === "single");
  const focusViewToggle = $("#focusViewToggle");
  if (focusViewToggle) focusViewToggle.checked = view === "focus";
  $("#viewOptionsMenu")?.classList.toggle("is-active", state.collapseFamilyFonts || view === "focus");
  syncCardGridControls();
  updateCardSampleSizeControl();
  renderFontList();
  persistUiSettings();
}
ui.list.addEventListener("wheel", event => {
  if (!event.ctrlKey) return;
  event.preventDefault();
  const direction = event.deltaY > 0 ? 1 : -1;
  if (state.view === "single") {
    state.singleCardSize = clampSingleCardSize(state.singleCardSize + direction * 6);
    syncCardGridControls();
    state.page = 0;
    renderFontList();
    toast(t("toast.singleCardSize", { size: state.singleCardSize }));
    persistUiSettings();
  } else {
    const capacity = getCardGridCapacity();
    state.cardColumns = clampCardColumns(state.cardColumns + direction, capacity.maxColumns);
    syncCardGridControls();
    state.page = 0;
    renderFontList();
    toast(t("toast.gridLayout", { rows: state.cardRows, columns: state.cardColumns }));
    persistUiSettings();
  }
}, { passive: false });
ui.previousPage.addEventListener("click", () => goToPage(state.page - 1));
ui.nextPage.addEventListener("click", () => goToPage(state.page + 1));
ui.list.addEventListener("pointerenter", () => {
  if (!["grid", "focus", "single"].includes(state.view)) return;
  state.pointerInFontView = true;
  updateHeaderCardPreviewFocus();
});
ui.list.addEventListener("pointerleave", () => {
  if (!state.pointerInFontView) return;
  state.pointerInFontView = false;
  hideMagnifier(ui.cardMagnifier);
  restorePinnedPreview();
  updateHeaderCardPreviewFocus();
});
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
function toggleTheme() {
  document.body.classList.toggle("dark");
  applyThemePreviewColorsIfDefault();
  updateVisualSettings();
  applyCardPreviewStyleToAllCards();
  persistUiSettings();
}
$("#themeButton")?.addEventListener("click", toggleTheme);
$("#welcomeThemeButton")?.addEventListener("click", toggleTheme);
$("#previewTabButton").addEventListener("click", () => setDetailTab("preview"));
$("#infoTabButton").addEventListener("click", () => setDetailTab("info"));
$("#detailToggle").addEventListener("click", () => {
  const panel = $("#detailPanel");
  if (!panel.classList.contains("collapsed")) panel.dataset.openWidth = `${panel.getBoundingClientRect().width}`;
  const collapsed = panel.classList.toggle("collapsed");
  if (collapsed) {
    panel.style.width = "";
    panel.style.minWidth = "";
    panel.style.maxWidth = "";
  } else if (panel.dataset.openWidth) {
    const width = Math.max(320, Math.min(Number(panel.dataset.openWidth) || 420, getMaxDetailPanelWidth()));
    panel.dataset.openWidth = String(width);
    panel.style.width = `${width}px`;
    panel.style.minWidth = `${width}px`;
    panel.style.maxWidth = `${width}px`;
  }
  syncDetailPanelToggle(collapsed);
  persistUiSettings();
});
$("#cardAreaToggle").addEventListener("click", () => {
  const area = $(".card-area");
  area.classList.remove("collapsed");
  syncCardAreaToggle(false);
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
  const cardArea = $(".card-area");
  const cardWidth = cardArea?.classList.contains("collapsed") ? 40 : Math.max(cardArea?.getBoundingClientRect().width || 360, 360);
  const maximum = Math.min(getMaxDetailPanelWidth(), bounds.width - cardWidth);
  const width = Math.max(320, Math.min(maximum, bounds.right - event.clientX));
  panel.style.width = `${width}px`;
  panel.style.minWidth = `${width}px`;
  panel.style.maxWidth = `${width}px`;
  panel.dataset.openWidth = `${width}`;
});
resizeHandle.addEventListener("pointerup", event => {
  if (resizeHandle.hasPointerCapture(event.pointerId)) resizeHandle.releasePointerCapture(event.pointerId);
  $("#detailPanel").classList.remove("resizing");
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
  persistUiSettings();
});
const favoriteSidebarResizeHandle = $("#favoriteSidebarResizeHandle");
favoriteSidebarResizeHandle?.addEventListener("pointerdown", event => {
  if (ui.favoriteSidebar.hidden) return;
  event.preventDefault();
  favoriteSidebarResizeHandle.setPointerCapture(event.pointerId);
  ui.favoriteSidebar.classList.add("resizing");
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
});
favoriteSidebarResizeHandle?.addEventListener("pointermove", event => {
  if (!favoriteSidebarResizeHandle.hasPointerCapture(event.pointerId)) return;
  const bounds = $(".font-view-shell").getBoundingClientRect();
  const width = clampFavoriteSidebarWidth(event.clientX - bounds.left);
  ui.favoriteSidebar.style.width = `${width}px`;
  ui.favoriteSidebar.style.minWidth = `${width}px`;
  ui.favoriteSidebar.style.flexBasis = `${width}px`;
  ui.favoriteSidebar.dataset.openWidth = `${width}`;
});
function stopFavoriteSidebarResize(event) {
  if (favoriteSidebarResizeHandle?.hasPointerCapture(event.pointerId)) favoriteSidebarResizeHandle.releasePointerCapture(event.pointerId);
  ui.favoriteSidebar.classList.remove("resizing");
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
  persistUiSettings();
}
favoriteSidebarResizeHandle?.addEventListener("pointerup", stopFavoriteSidebarResize);
favoriteSidebarResizeHandle?.addEventListener("pointercancel", stopFavoriteSidebarResize);
const topbarResizeHandle = $("#topbarResizeHandle");
let topbarResizeStartY = 0;
let topbarResizeStartHeight = 0;
topbarResizeHandle?.addEventListener("pointerdown", event => {
  event.preventDefault();
  topbarResizeHandle.setPointerCapture(event.pointerId);
  topbarResizeStartY = event.clientY;
  topbarResizeStartHeight = clampTopbarHeight(parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topbar-height")));
  $(".topbar")?.classList.add("resizing");
  document.body.style.cursor = "ns-resize";
  document.body.style.userSelect = "none";
});
topbarResizeHandle?.addEventListener("pointermove", event => {
  if (!topbarResizeHandle.hasPointerCapture(event.pointerId)) return;
  applyTopbarHeight(topbarResizeStartHeight + event.clientY - topbarResizeStartY);
});
topbarResizeHandle?.addEventListener("pointerup", event => {
  if (topbarResizeHandle.hasPointerCapture(event.pointerId)) topbarResizeHandle.releasePointerCapture(event.pointerId);
  $(".topbar")?.classList.remove("resizing");
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
  persistUiSettings();
});
topbarResizeHandle?.addEventListener("pointercancel", event => {
  if (topbarResizeHandle.hasPointerCapture(event.pointerId)) topbarResizeHandle.releasePointerCapture(event.pointerId);
  $(".topbar")?.classList.remove("resizing");
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
});
document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); ui.search.focus(); }
});
ui.list.addEventListener("pointermove", event => {
  const card = event.target.closest(".font-card");
  if (!card) {
    if (state.hovered) {
      state.hovered = null;
      updateHeaderCardPreviewFocus();
    }
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
  if (!overGlyph || !getPreviewSampleText(sample).trim()) {
    hideMagnifier(ui.cardMagnifier);
    return;
  }
  if (card.dataset.fontLoaded !== "true") loadCardFont(card);
  const lens = 210, zoom = 3;
  const sampleStyle = getComputedStyle(sample);
  const cardStyle = getComputedStyle(card);
  const left = Math.max(8, Math.min(window.innerWidth - lens - 8, event.clientX - lens / 2));
  const top = Math.max(8, Math.min(window.innerHeight - lens - 8, event.clientY - lens / 2));
  showMagnifier(ui.cardMagnifier);
  ui.cardMagnifier.style.left = `${left}px`;
  ui.cardMagnifier.style.top = `${top}px`;
  ui.cardMagnifier.style.backgroundColor = resolveMagnifierBackground(cardStyle.backgroundColor, "--panel");
  updateCardMagnifierPreview(ui.cardMagnifiedText, sample, sampleStyle, event, lens, zoom);
});
ui.list.addEventListener("contextmenu", event => {
  const card = event.target.closest(".font-card");
  if (!card) return hideContextMenu();
  const font = state.fonts.find(item => item.id === Number(card.dataset.id));
  if (font) showContextMenu(font, event.clientX, event.clientY);
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
    syncCardGridLayoutVars();
    scheduleCardSampleFit();
    scheduleCardFit();
    clearTimeout(ui.list.pageResizeTimer);
    ui.list.pageResizeTimer = setTimeout(() => {
      if (["grid", "focus"].includes(state.view)) syncCardGridControls();
      if (calculatePageSize() !== state.pageSize) renderFontList();
    }, 120);
  };
  const gridResizeObserver = new ResizeObserver(handleGridViewportResize);
  if (viewShell) gridResizeObserver.observe(viewShell);
  else if (pageArea) gridResizeObserver.observe(pageArea);
  else gridResizeObserver.observe(ui.list);
}

initLocaleFromSettings(uiSettings);
applyStaticTranslations();
wireLocaleMenu();
renderCategoryUI();
renderSearchSuggestions();
syncSearchClearVisibility();
applyStoredUiSettings(uiSettings);
updateDynamicTranslations();
updateVisualSettings();
updatePreview();
syncDetailPreviewStage();
updateCardSampleSizeControl();
syncCardGridLayoutVars();
wireCardPreviewStyleModal();
wireCardPreviewStyleQuickMenu();
if (!("queryLocalFonts" in window)) {
  ui.support.textContent = t("welcome.supportNoApi");
}
