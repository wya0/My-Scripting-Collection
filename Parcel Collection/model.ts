export interface Parcel {
  id: string;
  code: string;
  address: string;
  courier: string;
  timestamp: number;
  status: "pending" | "collected" | "archived";
}

export const STORAGE_KEY = "parcels_data";
export const CONFIG_KEY = "parcels_config";
export const SHARED_STORAGE = { shared: true };

export const PARCEL_REGEX = {
  BRAND_SIGN: /【([^】]+)】/,
  CODE: /(?:取件码|凭码|提取码|验证码|密码|码为|码是|凭|取件码是|取件码为|码)\s*(?:为|：|:)?\s*([0-9A-Z]{1,4}(?:[- ]?[0-9A-Z]{1,5})+|[0-9A-Z]{3,10})/i,
  CODE_PURE: /(?<!\d)([0-9A-Z]{1,4}(?:[- ][0-9A-Z]{1,5})+|[0-9A-Z]{3,10})(?!\d)/gi,
  CODE_BACKUP: /([0-9]{1,2}-[0-9]{1,2}-[0-9]{4,5})/,
  ADDRESS_LEAD: /(?:地址|存至|存放至|存放于|投递至|放置在|放置于|送至|派送至|放在|到站|送达|位于|已到达|在|到)\s*(?:为|：|:)?\s*([^，。！请\n\r]{4,})/,
  ADDRESS_REVERSE: /到\s*([^，。！请\n\r]{4,})\s*取件/,
  FINGERPRINT_CLEAN: /[^a-zA-Z0-9\u4e00-\u9fa5]/g
};

export interface AppConfig {
  strategy: "regex_first" | "ai_first";
  autoCleanup: boolean;
  cleanupDays: number;
  liveActivityEnabled: boolean;
  liveActivityStaleHours: number;
  liveActivityFreshHours: number;
}

export const DEFAULT_CONFIG: AppConfig = {
  strategy: "regex_first",
  autoCleanup: true,
  cleanupDays: 3,
  liveActivityEnabled: true,
  liveActivityStaleHours: 4,
  liveActivityFreshHours: 12
};
