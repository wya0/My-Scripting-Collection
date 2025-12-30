import { AppIntentManager, AppIntentProtocol, Widget } from "scripting";
import { PROGRESS_KEYS } from "./shared/constants";
import { 
  getStoredSmallWidgetDisplay, 
  setStoredSmallWidgetDisplay,
  getDynamicContent
} from "./shared/utils";

export const ToggleDisplayIntent = AppIntentManager.register({
  name: "ToggleDisplayIntent",
  protocol: AppIntentProtocol.AppIntent,
  perform: async () => {
    const current = getStoredSmallWidgetDisplay();
    const options = [
      PROGRESS_KEYS.DAY,
      PROGRESS_KEYS.WEEK,
      PROGRESS_KEYS.MONTH,
      PROGRESS_KEYS.YEAR,
      PROGRESS_KEYS.LIFE
    ];
    const currentIndex = options.indexOf(current as any);
    const nextIndex = (currentIndex + 1) % options.length;
    setStoredSmallWidgetDisplay(options[nextIndex]);
    Widget.reloadAll();
  }
});

export const RefreshQuoteIntent = AppIntentManager.register({
  name: "RefreshQuoteIntent",
  protocol: AppIntentProtocol.AppIntent,
  perform: async () => {
    try {
      await getDynamicContent(true);
    } catch (error) {
      console.error("[RefreshQuoteIntent] 刷新失败:", error);
    }
    Widget.reloadAll();
  }
});
