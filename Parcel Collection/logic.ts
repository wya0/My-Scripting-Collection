import { Widget, LiveActivity } from "scripting";
import { Parcel, STORAGE_KEY, CONFIG_KEY, SHARED_STORAGE, AppConfig, DEFAULT_CONFIG, PARCEL_REGEX } from "./model";
import { ParcelLiveActivity, ParcelLiveActivityState } from "./live_activity";

const LIVE_ACTIVITY_ID_KEY = "parcel_live_activity_id";

const BRAND_VISUALS: Record<string, { color: string; icon: string }> = {
  "菜鸟驿站": { color: "#0081FF", icon: "house.fill" },
  "菜鸟": { color: "#0081FF", icon: "house.fill" },
  "丰巢": { color: "#FF8000", icon: "archivebox.fill" },
  "顺丰": { color: "#000000", icon: "bolt.fill" },
  "京东": { color: "#E1251B", icon: "shippingbox.fill" },
  "邮政": { color: "#34C759", icon: "envelope.fill" },
  "其他": { color: "#8E8E93", icon: "shippingbox.fill" }
};

export class LiveActivityManager {
  private static instance() {
    return ParcelLiveActivity();
  }

  static async sync() {
    try {
      const config = ParcelManager.getConfig();
      const pending = ParcelManager.getPending();
      const count = pending.length;
      let activityId = Storage.get<string>(LIVE_ACTIVITY_ID_KEY, SHARED_STORAGE);

      if (!config.liveActivityEnabled || count === 0) {
        await LiveActivity.endAllActivities({ dismissTimeInterval: 0 });
        Storage.set(LIVE_ACTIVITY_ID_KEY, "", SHARED_STORAGE);
        return;
      }
      
      let activity: LiveActivity<ParcelLiveActivityState> | null = null;
      if (activityId) {
        activity = await LiveActivity.from<ParcelLiveActivityState>(activityId, "ParcelActivity");
      }
      
      if (!activity) {
        const activeList = await LiveActivity.getAllActivities();
        const match = activeList.find(a => a.state === "active");
        if (match) {
          activity = await LiveActivity.from<ParcelLiveActivityState>(match.id, "ParcelActivity");
          activityId = match.id;
          if (activityId) {
            Storage.set(LIVE_ACTIVITY_ID_KEY, activityId, SHARED_STORAGE);
          }
        }
      }

      const last = pending[0];
      const visual = BRAND_VISUALS[last.courier] || BRAND_VISUALS["其他"];
      const state: ParcelLiveActivityState = {
        count,
        lastCourier: last.courier,
        lastCode: last.code,
        lastAddress: last.address,
        lastIcon: visual.icon,
        lastColor: visual.color
      };

      const staleDate = Date.now() + (config.liveActivityStaleHours * 60 * 60 * 1000);

      if (activity) {
        await activity.update(state, {
          staleDate,
          relevanceScore: count
        });
      } else {
        const isFresh = pending.some(p => (Date.now() - p.timestamp) < (config.liveActivityFreshHours * 60 * 60 * 1000));
        
        if (isFresh) {
          const newActivity = this.instance();
          const success = await newActivity.start(state, {
            staleDate
          });
          if (success && newActivity.activityId) {
            Storage.set(LIVE_ACTIVITY_ID_KEY, newActivity.activityId, SHARED_STORAGE);
          }
        }
      }
    } catch (e) {
      console.error("[LiveActivity] Sync error:", e);
    }
  }
}

declare const Storage: {
  get<T>(key: string, options?: { shared: boolean }): T | null;
  set<T>(key: string, value: T, options?: { shared: boolean }): boolean;
};
declare const Crypto: {
  md5(data: any): { toHexString(): string };
};
declare const Assistant: {
  requestStructuredData<T>(text: string, schema: any): Promise<T>;
};
declare const Data: {
  fromRawString(text: string): any;
};

export class ParcelManager {
  static getAll(): Parcel[] {
    const data = Storage.get<string>(STORAGE_KEY, SHARED_STORAGE);
    if (!data) return [];
    try {
      return JSON.parse(data) as Parcel[];
    } catch (e) {
      console.error("Failed to parse parcel data:", e);
      return [];
    }
  }

  static getPending(): Parcel[] {
    return this.getAll().filter(p => p.status === "pending");
  }

  static getCollected(): Parcel[] {
    return this.getAll().filter(p => p.status === "collected");
  }

  static async save(parcel: Omit<Parcel, "id" | "status" | "timestamp">): Promise<boolean> {
    try {
      const all = this.getAll();
      
      const cleanCode = parcel.code.replace(PARCEL_REGEX.FINGERPRINT_CLEAN, "");
      const cleanAddr = parcel.address.replace(PARCEL_REGEX.FINGERPRINT_CLEAN, "");
      const fingerprint = `${cleanCode}_${cleanAddr}`;
      
      const data = Data.fromRawString(fingerprint);
      if (!data) {
        return false;
      }
      const id = Crypto.md5(data).toHexString();

      if (all.some(p => p.id === id)) {
        return true; 
      }

      const newParcel: Parcel = {
        ...parcel,
        id,
        status: "pending",
        timestamp: Date.now()
      };

      all.unshift(newParcel);
      const success = Storage.set(STORAGE_KEY, JSON.stringify(all), SHARED_STORAGE);
      
      Widget.reloadAll();
      return success;
    } catch (e) {
      return false;
    }
  }

  static async updateStatus(id: string, status: Parcel["status"]) {
    const all = this.getAll();
    const index = all.findIndex(p => p.id === id);
    if (index !== -1) {
      all[index].status = status;
      Storage.set(STORAGE_KEY, JSON.stringify(all), SHARED_STORAGE);
      Widget.reloadAll();
      await LiveActivityManager.sync();
    }
  }

  static async autoCleanup() {
    const config = this.getConfig();
    console.log("Auto cleanup triggered, config:", config);
    if (!config.autoCleanup) return;

    const all = this.getAll();
    const now = Date.now();
    const cleanupMs = config.cleanupDays * 24 * 60 * 60 * 1000;

    const filtered = all.filter(p => {
      if (p.status === "pending") return true;
      return (now - p.timestamp) < cleanupMs;
    });

    if (filtered.length !== all.length) {
      console.log(`Cleaned up ${all.length - filtered.length} parcels`);
      Storage.set(STORAGE_KEY, JSON.stringify(filtered), SHARED_STORAGE);
      Widget.reloadAll();
      await LiveActivityManager.sync();
    }
  }

  static async delete(id: string): Promise<boolean> {
    const all = this.getAll();
    const filtered = all.filter(p => p.id !== id);
    if (filtered.length !== all.length) {
      Storage.set(STORAGE_KEY, JSON.stringify(filtered), SHARED_STORAGE);
      Widget.reloadAll();
      await LiveActivityManager.sync();
      return true;
    }
    return false;
  }

  static getConfig(): AppConfig {
    const data = Storage.get<string>(CONFIG_KEY, SHARED_STORAGE);
    if (!data) return DEFAULT_CONFIG;
    try {
      const saved = JSON.parse(data);
      return {
        ...DEFAULT_CONFIG, 
        ...saved,
        liveActivityEnabled: saved.liveActivityEnabled ?? DEFAULT_CONFIG.liveActivityEnabled,
        liveActivityStaleHours: saved.liveActivityStaleHours ?? DEFAULT_CONFIG.liveActivityStaleHours,
        liveActivityFreshHours: saved.liveActivityFreshHours ?? DEFAULT_CONFIG.liveActivityFreshHours
      };
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  }

  static setConfig(config: AppConfig) {
    Storage.set(CONFIG_KEY, JSON.stringify(config), SHARED_STORAGE);
  }

  static async extractFromText(text: string): Promise<boolean> {
    try {
      console.log("Extracting from text:", text);
      const config = this.getConfig();
      let results: Array<{ code: string, address: string, courier: string }> = [];

      if (config.strategy === "regex_first") {
        results = await this.tryRegex(text);
        if (results.length === 0) {
          results = await this.tryAI(text);
        }
      } else {
        results = await this.tryAI(text);
        if (results.length === 0) {
          results = await this.tryRegex(text);
        }
      }

      if (results.length > 0) {
        console.log(`Successfully extracted ${results.length} parcels.`);
        for (const parcel of results) {
          await this.save(parcel);
        }
        await LiveActivityManager.sync();
        return true;
      }
      
      return false;
    } catch (e) {
      console.error("Error in extractFromText:", e);
      return false;
    }
  }

  private static async tryRegex(text: string): Promise<Array<{ code: string, address: string, courier: string }>> {
    console.log("[Regex] Starting extraction...");
    const results: Array<{ code: string, address: string, courier: string }> = [];
    
    const courier = this.parseBrand(text);
    
    const codes = this.parseCodes(text);
    if (codes.length === 0) {
      console.log("[Regex] No codes found, aborting.");
      return [];
    }

    let address = this.parseAddress(text);
    address = this.cleanAddress(address);

    if (address.length < 2 || /^\d+$/.test(address) || address.includes("码")) {
      address = "未知地点";
    }

    for (const code of codes) {
      console.log(`[Regex] Found: ${courier} | ${code} | ${address}`);
      results.push({ code, address, courier });
    }
    
    return results;
  }

  private static parseBrand(text: string): string {
    const brandMatch = text.match(PARCEL_REGEX.BRAND_SIGN);
    if (brandMatch) return brandMatch[1];

    const brands = ["菜鸟驿站", "菜鸟", "丰巢", "顺丰", "中通", "圆通", "韵达", "京东", "兔喜生活", "兔喜", "邮政", "极兔", "申通", "德邦"];
    for (const b of brands) {
      if (text.includes(b)) {
        if (b === "菜鸟" || b === "菜鸟驿站") return "菜鸟驿站";
        if (b === "兔喜" || b === "兔喜生活") return "兔喜生活";
        return b.includes("快递") || b.includes("驿站") || b.includes("柜") ? b : `${b}快递`;
      }
    }
    return "外部快递";
  }

  private static parseCodes(text: string): string[] {
    const codes: string[] = [];
    
    const firstMatch = text.match(PARCEL_REGEX.CODE);
    if (!firstMatch) {
      const backupRegex = new RegExp(PARCEL_REGEX.CODE_BACKUP.source, "g");
      let bMatch;
      while ((bMatch = backupRegex.exec(text)) !== null) {
        codes.push(bMatch[1]);
      }
      return [...new Set(codes)];
    }

    const startIndex = firstMatch.index || 0;
    const remainingText = text.substring(startIndex);
    
    const globalRegex = new RegExp(PARCEL_REGEX.CODE_PURE.source, "gi");
    let match;
    while ((match = globalRegex.exec(remainingText)) !== null) {
      if (match[1]) {
        const code = match[1].trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(code)) continue;
        codes.push(code);
      }
    }

    return [...new Set(codes)];
  }

  private static parseAddress(text: string): string {
    const explicitAddressMatch = text.match(PARCEL_REGEX.ADDRESS_LEAD);
    if (explicitAddressMatch) return explicitAddressMatch[1].trim();

    if (text.includes("到") && text.includes("取件")) {
      const reverseMatch = text.match(PARCEL_REGEX.ADDRESS_REVERSE);
      if (reverseMatch) return reverseMatch[1].trim();
    }

    const locationKeywords = ["驿站", "快递柜", "柜", "超市", "店", "大堂", "门卫", "保安室", "自提点", "喵喵小站", "代收点", "物业", "大厅", "点部", "分部", "服务中心", "便利店"];
    for (const kw of locationKeywords) {
      const kwMatch = text.match(new RegExp(`([^，。！请\n\r【】（）]{2,20}${kw})`));
      if (kwMatch) return kwMatch[1].trim();
    }

    return "未知地点";
  }

  private static cleanAddress(address: string): string {
    if (address === "未知地点") return address;
    
    return address
      .replace(/[【\[][^】\]]+[】\]]/g, "")
      .replace(/[（(][^）)]+[）)]/g, "")
      .replace(/^(?:您的|我们的|该|此|您有\d+个包裹在|您有\d+个包裹已到|您有\d+个包裹已到达|您有包裹已到|您有包裹已到达)?(?:包裹|快件|快递|邮件)?(?:已|已经)?(?:到达|送达|到站|投递至|放置在|放置于|放置|存放在|存放于|派送至|放在|在)/, "")
      .replace(/^(?:达|到)\s*/, "")
      .replace(/(?:，|。|！|请|及时|尽快|凭码|查询|回复|退订|拒收|取件码|取码|取件).*$/, "")
      .trim();
  }

  private static async tryAI(text: string): Promise<Array<{ code: string, address: string, courier: string }>> {
    try {
      const prompt = `
# Role
你是一个高精度的物流数据解析专家，专门负责从复杂的短信中提取快递取件核心要素。

# Target Text
"${text}"

# Extraction Rules
1. **识别多个包裹**: 如果文本中包含多个包裹信息（如多个取件码），必须全部提取。
2. **code (取件码)**: 
   - 提取唯一的取件凭证（如：888888、1-2-3456、A502）。
   - **注意**: 严禁提取手机号、运单号（长串数字）或普通短信验证码。
3. **address (取件地址)**:
   - **核心要求**: 仅提取具体的物理位置（如：XX路菜鸟驿站、XX小区5栋丰巢柜）。
   - **清理机制**: 自动剔除“您的包裹已到达”、“请及时领取”等描述性动词。
   - **严禁包含**: 严禁包含品牌名（如【丰巢】）或取件码。
4. **courier (快递品牌)**:
   - 标准化品牌名（如：菜鸟驿站、丰巢、顺丰、中通、圆通、韵达、京东、兔喜生活、邮政、极兔、申通、德邦）。
   - 优先参考签名。若提到“驿站”但无品牌，默认为“菜鸟驿站”。

# Few-Shot Examples
- **Input**: "【菜鸟驿站】您有2个包裹在上海新城家园，取件码为8-2-3007, 12-4-3020"
  **Output**: {"parcels": [{"code": "8-2-3007", "address": "上海新城家园", "courier": "菜鸟驿站"}, {"code": "12-4-3020", "address": "上海新城家园", "courier": "菜鸟驿站"}]}

# Output Format
严格按 JSON 格式输出，不要有任何多余的解释文字。
`.trim();

      const schema: any = {
        type: "object",
        description: "快递取件信息列表提取",
        properties: {
          parcels: {
            type: "array",
            required: true,
            description: "包裹信息列表",
            items: {
              type: "object",
              description: "单个包裹信息",
              properties: {
                code: { type: "string", required: true, description: "取件码" },
                address: { type: "string", required: false, description: "取件地址" },
                courier: { type: "string", required: false, description: "快递品牌" }
              }
            }
          }
        }
      };

      const result = await Assistant.requestStructuredData<{
        parcels: Array<{
          code: string;
          address?: string;
          courier?: string;
        }>;
      }>(prompt, schema);

      if (result && result.parcels && result.parcels.length > 0) {
        return result.parcels.map(p => ({
          code: p.code,
          address: p.address || "未知地点",
          courier: p.courier || "外部快递"
        }));
      }

      return [];
    } catch (e) {
      console.error("[AI] Extraction failed:", e);
      return [];
    }
  }
  static getGroupedPending() {
    const pending = this.getPending();
    const groups = new Map<string, { courier: string, parcels: Parcel[] }>();
    
    pending.forEach(p => {
      if (!groups.has(p.address)) {
        groups.set(p.address, { courier: p.courier, parcels: [] });
      }
      groups.get(p.address)!.parcels.push(p);
    });

    return Array.from(groups.entries()).map(([address, data]) => ({
      address,
      ...data
    }));
  }

  static async updateStatusByAddress(address: string, status: Parcel["status"]) {
    const all = this.getAll();
    let changed = false;
    all.forEach(p => {
      if (p.address === address && p.status === "pending") {
        p.status = status;
        changed = true;
      }
    });
    if (changed) {
      Storage.set(STORAGE_KEY, JSON.stringify(all), SHARED_STORAGE);
      Widget.reloadAll();
      await LiveActivityManager.sync();
    }
  }
}
