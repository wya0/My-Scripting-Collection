export const STORAGE_KEYS = {
  BIRTHDAY: "user_birthday",
  SMALL_WIDGET_DISPLAY: "small_widget_display", 
  LIFE_EXPECTANCY: "user_life_expectancy",
  PROGRESS_CACHE: "progress_cache",
  QUOTE_CACHE: "quote_cache",
  CONTENT_SOURCE: "content_source",
  WIDGET_BG_CUSTOM: "widget_bg_custom",
  WIDGET_BG_TRANSPARENT: "widget_bg_transparent",
  WIDGET_BG_LIGHT: "widget_bg_light",
  WIDGET_BG_DARK: "widget_bg_dark"
} as const;

export const API = {
  QUOTE_URL: "https://v1.hitokoto.cn/?c=i&c=d&c=k",
  HISTORY_URL: "https://v2.xxapi.cn/api/history",
  ALMANAC_URL: "https://api.tiax.cn/almanac/",
  TIMEOUT: 10000,
  CACHE_DURATION: 86400000,
  RETRY_COUNT: 3,
  POOL_SIZE: 10,
  REFRESH_THROTTLE: 600000
} as const;

export const CONTENT_SOURCES = {
  QUOTE: "quote",
  HISTORY: "history",
  ALMANAC: "almanac"
} as const;

export const DEFAULT_CONFIG = {
  LIFE_EXPECTANCY: 90,
  SMALL_WIDGET_DISPLAY: "year",
  CONTENT_SOURCE: CONTENT_SOURCES.QUOTE,
  MILLISECONDS_PER_DAY: 86400000,
  MILLISECONDS_PER_WEEK: 604800000,
  WIDGET_BG_LIGHT_DEFAULT: "#FFFFFF",
  WIDGET_BG_DARK_DEFAULT: "#1C1C1E"
} as const;

export const COLORS = {
  DAY: "#FF9500",
  WEEK: "#34C759", 
  MONTH: "#007AFF",
  YEAR: "#5856D6",
  LIFE: "#FF2D55"
} as const;

export const ICONS = {
  SUN: "sun.max.fill",
  CALENDAR_BADGE_CLOCK: "calendar.badge.clock",
  CALENDAR: "calendar",
  FLAG: "flag.fill",
  HEART: "heart.fill",
  QUOTE: "quote.bubble.fill", 
  HISTORY: "clock.arrow.circlepath",
  ALMANAC: "book.fill"
} as const;

export const PROGRESS_LABELS = {
  DAY: "今日",
  WEEK: "本周",
  MONTH: "本月", 
  YEAR: "今年",
  LIFE: "人生"
} as const;

export const PROGRESS_KEYS = {
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  YEAR: "year", 
  LIFE: "life"
} as const;

export const WIDGET_FAMILIES = {
  SMALL: "systemSmall",
  MEDIUM: "systemMedium",
  LARGE: "systemLarge"
} as const;

export const ERROR_MESSAGES = {
  NETWORK_TIMEOUT: "网络请求超时",
  NETWORK_ERROR: "网络连接失败", 
  INVALID_DATE: "日期格式无效",
  CACHE_EXPIRED: "缓存已过期",
  LOAD_FAILED: "加载失败"
} as const;

export const REFRESH_INTERVALS = {
  [PROGRESS_KEYS.DAY]: 1800,
  [PROGRESS_KEYS.WEEK]: 7200,
  [PROGRESS_KEYS.MONTH]: 21600,
  [PROGRESS_KEYS.YEAR]: 43200,
  [PROGRESS_KEYS.LIFE]: 86400,
  DEFAULT: 3600
} as const;
