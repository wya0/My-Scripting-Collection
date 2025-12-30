import { fetch } from "scripting";
import { ProgressData, ProgressResult, CachedItem, WidgetBgConfig, ContentData, QuoteCache, HistoryCache, AlmanacCache } from "./types";
import { STORAGE_KEYS, API, DEFAULT_CONFIG, COLORS, ICONS, PROGRESS_LABELS, PROGRESS_KEYS, ERROR_MESSAGES, REFRESH_INTERVALS, CONTENT_SOURCES } from "./constants";

const fillingSources = new Set<string>();

export const StorageService = {
  get<T>(key: string, shared: boolean = false): T | null {
    try {
      // @ts-ignore
      return Storage.get<T>(key, { shared });
    } catch (error) {
      console.error(`[StorageService] 获取键值 ${key} 失败:`, error);
      return null;
    }
  },

  set<T>(key: string, value: T, shared: boolean = false): boolean {
    try {
      // @ts-ignore
      return Storage.set(key, value, { shared });
    } catch (error) {
      console.error(`[StorageService] 设置键值 ${key} 失败:`, error);
      return false;
    }
  },

  remove(key: string, shared: boolean = false): boolean {
    try {
      // @ts-ignore
      return Storage.remove(key, { shared });
    } catch (error) {
      console.error(`[StorageService] 删除键值 ${key} 失败:`, error);
      return false;
    }
  }
};

export function getProgressResult(birthday: Date | null, lifeExpectancy: number = getStoredLifeExpectancy()): ProgressResult {
  const cached = StorageService.get<CachedItem<ProgressResult>>(STORAGE_KEYS.PROGRESS_CACHE);
  const now = new Date();
  const nowTs = now.getTime();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  
  const startOfDayTs = new Date(y, m, d).getTime();
  const dayProgress = (nowTs - startOfDayTs) / DEFAULT_CONFIG.MILLISECONDS_PER_DAY;

  const dayOfWeek = now.getDay();
  const diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
  const startOfWeekTs = new Date(y, m, d - diffToMonday).getTime();
  const weekProgress = (nowTs - startOfWeekTs) / DEFAULT_CONFIG.MILLISECONDS_PER_WEEK;
  
  if (cached) {
    const cachedDate = new Date(cached.timestamp);
    const isSameDay = cachedDate.getDate() === d && 
                     cachedDate.getMonth() === m && 
                     cachedDate.getFullYear() === y;
    
    if (isSameDay) {
      return {
        ...cached.data,
        day: Math.min(Math.max(dayProgress, 0), 1),
        week: Math.min(Math.max(weekProgress, 0), 1)
      };
    }
  }

  const startOfMonthTs = new Date(y, m, 1).getTime();
  const startOfNextMonthTs = new Date(y, m + 1, 1).getTime();
  const monthProgress = (nowTs - startOfMonthTs) / (startOfNextMonthTs - startOfMonthTs);

  const startOfYearTs = new Date(y, 0, 1).getTime();
  const startOfNextYearTs = new Date(y + 1, 0, 1).getTime();
  const yearProgress = (nowTs - startOfYearTs) / (startOfNextYearTs - startOfYearTs);

  let lifeProgress = 0;
  if (birthday) {
    const bTs = birthday.getTime();
    const eTs = new Date(birthday.getFullYear() + lifeExpectancy, birthday.getMonth(), birthday.getDate()).getTime();
    lifeProgress = (nowTs - bTs) / (eTs - bTs);
  }

  const result: ProgressResult = {
    day: Math.min(Math.max(dayProgress, 0), 1),
    week: Math.min(Math.max(weekProgress, 0), 1),
    month: Math.min(Math.max(monthProgress, 0), 1),
    year: Math.min(Math.max(yearProgress, 0), 1),
    life: Math.min(Math.max(lifeProgress, 0), 1)
  };

  StorageService.set(STORAGE_KEYS.PROGRESS_CACHE, {
    data: result,
    timestamp: nowTs
  });

  return result;
}

export function getProgressData(birthday: Date | null = getStoredBirthday(), lifeExpectancy: number = getStoredLifeExpectancy()): ProgressData[] {
  const progress = getProgressResult(birthday, lifeExpectancy);
  return [
    { 
      label: PROGRESS_LABELS.DAY, 
      value: progress.day, 
      color: COLORS.DAY, 
      key: PROGRESS_KEYS.DAY,
      icon: ICONS.SUN
    },
    { 
      label: PROGRESS_LABELS.WEEK, 
      value: progress.week, 
      color: COLORS.WEEK, 
      key: PROGRESS_KEYS.WEEK,
      icon: ICONS.CALENDAR_BADGE_CLOCK
    },
    { 
      label: PROGRESS_LABELS.MONTH, 
      value: progress.month, 
      color: COLORS.MONTH, 
      key: PROGRESS_KEYS.MONTH,
      icon: ICONS.CALENDAR
    },
    { 
      label: PROGRESS_LABELS.YEAR, 
      value: progress.year, 
      color: COLORS.YEAR, 
      key: PROGRESS_KEYS.YEAR,
      icon: ICONS.FLAG
    },
    { 
      label: PROGRESS_LABELS.LIFE, 
      value: progress.life, 
      color: COLORS.LIFE, 
      key: PROGRESS_KEYS.LIFE,
      icon: ICONS.HEART
    }
  ];
}

export function getStoredBirthday(): Date | null {
  const stored = StorageService.get<string>(STORAGE_KEYS.BIRTHDAY);
  return stored ? new Date(stored) : null;
}

export function setStoredBirthday(birthday: Date): boolean {
  return StorageService.set(STORAGE_KEYS.BIRTHDAY, birthday.toISOString());
}

export function getStoredLifeExpectancy(): number {
  return StorageService.get<number>(STORAGE_KEYS.LIFE_EXPECTANCY) || DEFAULT_CONFIG.LIFE_EXPECTANCY;
}

export function setStoredLifeExpectancy(value: number): boolean {
  return StorageService.set(STORAGE_KEYS.LIFE_EXPECTANCY, value);
}

export function getStoredSmallWidgetDisplay(): string {
  return StorageService.get<string>(STORAGE_KEYS.SMALL_WIDGET_DISPLAY) || DEFAULT_CONFIG.SMALL_WIDGET_DISPLAY;
}

export function setStoredSmallWidgetDisplay(value: string): boolean {
  return StorageService.set(STORAGE_KEYS.SMALL_WIDGET_DISPLAY, value);
}

export function getStoredContentSource(): string {
  return StorageService.get<string>(STORAGE_KEYS.CONTENT_SOURCE) || DEFAULT_CONFIG.CONTENT_SOURCE;
}

export function setStoredContentSource(value: string): boolean {
  return StorageService.set(STORAGE_KEYS.CONTENT_SOURCE, value);
}

export function getWidgetBgConfig(): WidgetBgConfig {
  const useCustom = StorageService.get<boolean>(STORAGE_KEYS.WIDGET_BG_CUSTOM) || false;
  const light = StorageService.get<string>(STORAGE_KEYS.WIDGET_BG_LIGHT) || DEFAULT_CONFIG.WIDGET_BG_LIGHT_DEFAULT;
  const dark = StorageService.get<string>(STORAGE_KEYS.WIDGET_BG_DARK) || DEFAULT_CONFIG.WIDGET_BG_DARK_DEFAULT;
  
  return { useCustom, light, dark };
}

export function setWidgetBgConfig(config: Partial<WidgetBgConfig>): void {
  if (config.useCustom !== undefined) {
    StorageService.set(STORAGE_KEYS.WIDGET_BG_CUSTOM, config.useCustom);
  }
  if (config.light !== undefined) {
    StorageService.set(STORAGE_KEYS.WIDGET_BG_LIGHT, config.light);
  }
  if (config.dark !== undefined) {
    StorageService.set(STORAGE_KEYS.WIDGET_BG_DARK, config.dark);
  }
}

export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#FFFFFF';
}
export async function getDynamicContent(forceRefresh: boolean = false): Promise<ContentData> {
  const source = getStoredContentSource();
  const cacheKey = `${STORAGE_KEYS.QUOTE_CACHE}_${source}`;
  const now = Date.now();
  const today = getTodayDateStr();

  let result: ContentData;
  switch (source) {
    case CONTENT_SOURCES.ALMANAC:
      result = await handleAlmanacSource(cacheKey, today);
      break;
    case CONTENT_SOURCES.HISTORY:
      result = await handleHistorySource(cacheKey, today, forceRefresh);
      break;
    default:
      result = await handleQuoteSource(cacheKey, forceRefresh);
  }

  if (!result.icon) {
    switch (source) {
      case CONTENT_SOURCES.HISTORY: result.icon = "clock.arrow.circlepath"; break;
      case CONTENT_SOURCES.ALMANAC: result.icon = "calendar.circle.fill"; break;
      default: result.icon = "quote.bubble.fill"; break;
    }
  }

  return result;
}

async function handleAlmanacSource(cacheKey: string, today: string): Promise<ContentData> {
  const cached = StorageService.get<CachedItem<AlmanacCache>>(cacheKey);
  
  if (cached && cached.data && cached.data.date === today) {
    return cached.data.item;
  }

  try {
    const item = await fetchContentFromSource(CONTENT_SOURCES.ALMANAC);
    const cacheData: AlmanacCache = { date: today, item };
    StorageService.set(cacheKey, { data: cacheData, timestamp: Date.now() });
    return item;
  } catch (error) {
    if (cached && cached.data && cached.data.item) return cached.data.item;
    return getFallbackContent(CONTENT_SOURCES.ALMANAC);
  }
}

async function handleHistorySource(cacheKey: string, today: string, forceRefresh: boolean = false): Promise<ContentData> {
  const cached = StorageService.get<CachedItem<HistoryCache>>(cacheKey);

  if (cached && cached.data && cached.data.date === today && Array.isArray(cached.data.items) && cached.data.items.length > 0) {
    const { items, currentIndex } = cached.data;
    const item = items[currentIndex % items.length];
    
    if (!forceRefresh) {
      StorageService.set(cacheKey, {
        data: { ...cached.data, currentIndex: (currentIndex + 1) % items.length },
        timestamp: cached.timestamp
      });
    }
    
    return item;
  }

  try {
    const items = await fetchHistoryList();
    if (items.length === 0) throw new Error("无历史数据");

    const cacheData: HistoryCache = { date: today, items, currentIndex: 1 % items.length };
    StorageService.set(cacheKey, { data: cacheData, timestamp: Date.now() });
    return items[0];
  } catch (error) {
    if (cached && cached.data && Array.isArray(cached.data.items) && cached.data.items.length > 0) {
      const items = cached.data.items;
      return items[Math.floor(Math.random() * items.length)];
    }
    return getFallbackContent(CONTENT_SOURCES.HISTORY);
  }
}

async function handleQuoteSource(cacheKey: string, forceRefresh: boolean = false): Promise<ContentData> {
  const cached = StorageService.get<CachedItem<QuoteCache>>(cacheKey);
  const now = Date.now();

  if (forceRefresh && cached && cached.data) {
    const isThrottled = now - cached.timestamp < API.REFRESH_THROTTLE;
    
    if (!isThrottled) {
      try {
        const newItem = await fetchContentFromSource(CONTENT_SOURCES.QUOTE);
        const { items } = cached.data;
        
        if (!items.some(it => it.content === newItem.content)) {
          const updatedItems = [newItem, ...items].slice(0, API.POOL_SIZE);
          StorageService.set(cacheKey, {
            data: { items: updatedItems, currentIndex: 0 }, // 设置为 0，让随后的小组件重载显示此项并切到 1
            timestamp: now
          });
          fillContentPool(CONTENT_SOURCES.QUOTE).catch(() => {});
          return newItem;
        }
      } catch (err) {
        console.error("[handleQuoteSource] 强制刷新失败，回退至常规逻辑:", err);
      }
    }
  }

  if (cached && cached.data && Array.isArray(cached.data.items) && cached.data.items.length > 0) {
    const { items, currentIndex } = cached.data;
    const isExpired = now - cached.timestamp > API.CACHE_DURATION;
    const item = items[currentIndex % items.length];

    if (!forceRefresh) {
      StorageService.set(cacheKey, {
        data: { items, currentIndex: (currentIndex + 1) % items.length },
        timestamp: isExpired ? now : cached.timestamp // 如果过期则更新时间戳
      });
    }

    if (items.length < API.POOL_SIZE || isExpired) {
      fillContentPool(CONTENT_SOURCES.QUOTE).catch(() => {});
    }
    
    return item;
  }

  try {
    const firstItem = await fetchContentFromSource(CONTENT_SOURCES.QUOTE);
    const initialPool: QuoteCache = { items: [firstItem], currentIndex: 0 };
    StorageService.set(cacheKey, { data: initialPool, timestamp: now });
    fillContentPool(CONTENT_SOURCES.QUOTE).catch(() => {});
    return firstItem;
  } catch (error) {
    return getFallbackContent(CONTENT_SOURCES.QUOTE);
  }
}

async function fetchHistoryList(): Promise<ContentData[]> {
  try {
    const response = await fetch(API.HISTORY_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    if (data.code === 200 && Array.isArray(data.data)) {
      return data.data.map((item: any) => {
        if (typeof item === 'string') {
          const match = item.match(/^(\d+年\d+月\d+日)\s+(.+)$/);
          if (match) {
            return {
              title: match[1],
              content: match[2],
              source: "历史百科"
            };
          }
          return {
            title: "历史上的今天",
            content: item,
            source: "历史百科"
          };
        } else if (typeof item === 'object' && item !== null) {
          return {
            title: item.title || item.year || "历史上的今天",
            content: item.content || item.event || (item.ls ? String(item.ls) : JSON.stringify(item)),
            source: item.source || "历史百科"
          };
        }
        return null;
      }).filter((i: any): i is ContentData => i !== null);
    }
    return [];
  } catch (error) {
    console.error("[fetchHistoryList] 失败:", error);
    return [];
  }
}

function getTodayDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

async function fillContentPool(source: string): Promise<void> {
  // 1. 检查锁，防止并发补全
  if (fillingSources.has(source)) return;
  fillingSources.add(source);

  try {
    const cacheKey = `${STORAGE_KEYS.QUOTE_CACHE}_${source}`;
    
    while (true) {
      const cached = StorageService.get<CachedItem<QuoteCache>>(cacheKey);
      if (!cached || !cached.data) break;
      
      const { items, currentIndex } = cached.data;
      if (items.length >= API.POOL_SIZE) break;

      try {
        const newItem = await fetchContentFromSource(source);
        if (!items.some(it => it.content === newItem.content)) {
          const updatedItems = [...items, newItem];
          StorageService.set(cacheKey, {
            data: { items: updatedItems, currentIndex },
            timestamp: Date.now() 
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`[fillContentPool] 获取内容失败:`, err);
        break;
      }
    }
  } finally {
    fillingSources.delete(source);
  }
}

async function fetchContentFromSource(source: string, retryCount: number = API.RETRY_COUNT): Promise<ContentData> {
  const timeout = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error(ERROR_MESSAGES.NETWORK_TIMEOUT)), API.TIMEOUT)
  );

  const attemptRequest = async (attempt: number): Promise<ContentData> => {
    try {
      let url = "";
      switch (source) {
        case CONTENT_SOURCES.ALMANAC: 
          url = API.ALMANAC_URL; 
          break;
        default: 
          url = API.QUOTE_URL;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (source === CONTENT_SOURCES.ALMANAC) {
        if (data["农历日期"]) {
          return {
            title: data["农历日期"],
            content: `宜：${data["宜"]}\n忌：${data["忌"]}`,
            subContent: `${data["干支日期"]} · ${data["值日星神"]}`,
            source: "老黄历"
          };
        }
      } else {
        return {
          title: "每日一言",
          content: data.hitokoto || "时间不等人。",
          source: data.from || "Life Progress"
        };
      }
      throw new Error("API 响应格式错误");
    } catch (err) {
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        return attemptRequest(attempt + 1);
      }
      throw err;
    }
  };

  return await Promise.race([attemptRequest(0), timeout]);
}

function getFallbackContent(source: string): ContentData {
  switch (source) {
    case CONTENT_SOURCES.HISTORY:
      return { title: "历史上的今天", content: "探索历史，启迪未来。", source: "Life Progress" };
    case CONTENT_SOURCES.ALMANAC:
      return { title: "老黄历", content: "顺应时节，从容生活。", source: "Life Progress" };
    default:
      return { title: "每日一言", content: "时间不等人，珍惜当下。", source: "Life Progress" };
  }
}

export function getRefreshInterval(displayKey: string): number {
  return REFRESH_INTERVALS[displayKey as keyof typeof REFRESH_INTERVALS] || REFRESH_INTERVALS.DEFAULT;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  const formatted = parseFloat((value * 100).toFixed(decimals));
  return `${formatted}%`;
}

export function getWidgetDisplayOptions() {
  return [
    { label: PROGRESS_LABELS.DAY, value: PROGRESS_KEYS.DAY },
    { label: PROGRESS_LABELS.WEEK, value: PROGRESS_KEYS.WEEK },
    { label: PROGRESS_LABELS.MONTH, value: PROGRESS_KEYS.MONTH },
    { label: PROGRESS_LABELS.YEAR, value: PROGRESS_KEYS.YEAR },
    { label: PROGRESS_LABELS.LIFE, value: PROGRESS_KEYS.LIFE },
  ];
}

export function getProgressItemByKey(key: string, birthday: Date | null = getStoredBirthday()): ProgressData | null {
  const items = getProgressData(birthday);
  return items.find(item => item.key === key) || items[3] || null;
}

export function getDateInfo() {
  const now = new Date();
  const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  return {
    fullDate: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`,
    shortDate: `${now.getMonth() + 1}/${now.getDate()}`,
    weekDay: weekDays[now.getDay()],
    dayOfYear: dayOfYear
  };
}