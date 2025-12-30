export interface ProgressData {
  label: string;
  value: number;
  color: string;
  key: string;
  icon: string;
}

export interface ContentData {
  title: string;
  content: string;
  subContent?: string;
  source: string;
  icon?: string;
}

export interface ContentCache {
  items: ContentData[];
  currentIndex: number;
}

export interface QuoteCache extends ContentCache {}

export interface HistoryCache {
  date: string; // YYYY-MM-DD
  items: ContentData[];
  currentIndex: number;
}

export interface AlmanacCache {
  date: string;
  item: ContentData;
}

export type SourceCache = QuoteCache | HistoryCache | AlmanacCache;

export interface ConfigOptions {
  lifeExpectancy: number;
  smallWidgetDisplay: string;
  birthday: Date | null;
}

export interface CachedItem<T> {
  data: T;
  timestamp: number;
}

export interface WidgetDisplayOption {
  label: string;
  value: string;
}

export interface UserSettings {
  birthday?: string;
  smallWidgetDisplay?: string;
  lifeExpectancy?: number;
  useCustomWidgetBg?: boolean;
  widgetBgLight?: string;
  widgetBgDark?: string;
}

export interface WidgetBgConfig {
  useCustom: boolean;
  light: string;
  dark: string;
}

export interface ProgressResult {
  day: number;
  week: number;
  month: number;
  year: number;
  life: number;
}