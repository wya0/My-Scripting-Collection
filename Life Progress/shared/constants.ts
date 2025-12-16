// 存储键名常量
export const STORAGE_KEYS = {
  BIRTHDAY: "user_birthday",
  SMALL_WIDGET_DISPLAY: "small_widget_display", 
  LIFE_EXPECTANCY: "user_life_expectancy",
  PROGRESS_CACHE: "progress_cache",
  QUOTE_CACHE: "quote_cache"
} as const;

// API 相关常量
export const API = {
  QUOTE_URL: "https://v1.hitokoto.cn/?c=i&c=d&c=k",
  TIMEOUT: 3000,
  CACHE_DURATION: 86400000, // 24小时缓存
  RETRY_COUNT: 2
} as const;

// 默认配置常量
export const DEFAULT_CONFIG = {
  LIFE_EXPECTANCY: 90,
  SMALL_WIDGET_DISPLAY: "year",
  MILLISECONDS_PER_DAY: 86400000,
  MILLISECONDS_PER_WEEK: 604800000
} as const;

// 颜色常量
export const COLORS = {
  DAY: "#FF9500",
  WEEK: "#34C759", 
  MONTH: "#007AFF",
  YEAR: "#5856D6",
  LIFE: "#FF2D55"
} as const;

// 图标常量
export const ICONS = {
  SUN: "sun.max.fill",
  CALENDAR_BADGE_CLOCK: "calendar.badge.clock",
  CALENDAR: "calendar",
  FLAG: "flag.fill",
  HEART: "heart.fill"
} as const;

// 进度类型标签常量
export const PROGRESS_LABELS = {
  DAY: "今日",
  WEEK: "本周",
  MONTH: "本月", 
  YEAR: "今年",
  LIFE: "人生"
} as const;

// 进度类型键值常量
export const PROGRESS_KEYS = {
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  YEAR: "year", 
  LIFE: "life"
} as const;

// 小组件尺寸常量
export const WIDGET_FAMILIES = {
  SMALL: "systemSmall",
  MEDIUM: "systemMedium",
  LARGE: "systemLarge"
} as const;

// 错误消息常量
export const ERROR_MESSAGES = {
  NETWORK_TIMEOUT: "网络请求超时",
  NETWORK_ERROR: "网络连接失败", 
  INVALID_DATE: "日期格式无效",
  CACHE_EXPIRED: "缓存已过期",
  LOAD_FAILED: "加载失败"
} as const;