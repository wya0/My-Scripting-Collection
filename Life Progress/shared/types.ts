// 进度数据接口
export interface ProgressData {
  label: string;
  value: number;
  color: string;
  key: string;
  icon: string;
}

// 引言数据接口
export interface QuoteData {
  text: string;
  from: string;
}

// 配置选项接口
export interface ConfigOptions {
  lifeExpectancy: number;
  smallWidgetDisplay: string;
  birthday: Date | null;
}

// 缓存数据接口
export interface CacheData {
  progress: ProgressData[];
  timestamp: number;
  quote: QuoteData | null;
}

// 小组件显示选项接口
export interface WidgetDisplayOption {
  label: string;
  value: string;
}

// 用户设置接口
export interface UserSettings {
  birthday?: string;
  smallWidgetDisplay?: string;
  lifeExpectancy?: number;
}

// API 响应接口（用于一言API）
export interface QuoteApiResponse {
  hitokoto: string;
  from: string;
  type: string;
}

// 计算结果接口
export interface ProgressResult {
  day: number;
  week: number;
  month: number;
  year: number;
  life: number;
}