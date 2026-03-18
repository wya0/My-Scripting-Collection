import { AppIntentManager, AppIntentProtocol, Widget } from "scripting";
import { ParcelManager, LiveActivityManager } from "./logic";
import { SHARED_STORAGE } from "./model";

declare const Storage: {
  get<T>(key: string, options?: { shared: boolean }): T | null;
  set<T>(key: string, value: T, options?: { shared: boolean }): boolean;
};

export const SwitchWidgetAddressIntent = AppIntentManager.register({
  name: "SwitchWidgetAddressIntent",
  protocol: AppIntentProtocol.AppIntent,
  perform: async () => {
    console.log("[SwitchWidgetAddressIntent] Triggered");
    const groups = ParcelManager.getGroupedPending();
    const groupCount = groups.length;
    
    if (groupCount <= 1) {
      console.log("[SwitchWidgetAddressIntent] No need to switch (count <= 1)");
      return { success: true };
    }
    
    const storedValue = Storage.get("widget_addr_idx", SHARED_STORAGE);
    let currentIndex = 0;
    if (storedValue !== null && storedValue !== undefined) {
      currentIndex = parseInt(String(storedValue), 10);
      if (isNaN(currentIndex)) currentIndex = 0;
    }
    
    console.log(`[SwitchWidgetAddressIntent] Starting switch logic. Current index stored: ${storedValue}`);
    const nextIndex = (currentIndex + 1) % groupCount;
    Storage.set("widget_addr_idx", nextIndex, SHARED_STORAGE);
    console.log(`[SwitchWidgetAddressIntent] Successfully switched index from ${currentIndex} to ${nextIndex}. Total groups: ${groupCount}`);
    
    Widget.reloadAll();
    console.log("[SwitchWidgetAddressIntent] Widget reload requested");
    return { success: true };
  }
});

export const AddParcelIntent = AppIntentManager.register({
  name: "AddParcelIntent",
  protocol: AppIntentProtocol.AppIntent,
  perform: async ({ text }: { text: string }) => {
    const success = await ParcelManager.extractFromText(text);
    return {
      success,
      message: success ? "成功提取快递信息" : "未能识别取件码"
    };
  }
});

export const UpdateParcelStatusIntent = AppIntentManager.register({
  name: "UpdateParcelStatusIntent",
  protocol: AppIntentProtocol.AppIntent,
  perform: async ({ id, status }: { id: string, status: string }) => {
    console.log(`[UpdateParcelStatusIntent] Triggered for ID: ${id}, Status: ${status}`);
    await ParcelManager.updateStatus(id, status as any);
    Widget.reloadAll();
    return { success: true };
  }
});

export const BatchCollectByAddressIntent = AppIntentManager.register({
  name: "BatchCollectByAddressIntent",
  protocol: AppIntentProtocol.AppIntent,
  perform: async ({ address }: { address: string }) => {
    console.log(`[BatchCollectByAddressIntent] Triggered for address: ${address}`);
    if (!address) {
      console.error("[BatchCollectByAddressIntent] Error: Address is empty");
      return { success: false };
    }
    await ParcelManager.updateStatusByAddress(address, "collected");
    console.log(`[BatchCollectByAddressIntent] Successfully updated status for: ${address}`);
    Widget.reloadAll();
    return { success: true };
  }
});
