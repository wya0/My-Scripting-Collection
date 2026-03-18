import { Intent, Script, Widget } from "scripting";
import { ParcelManager } from "./logic";

export async function handleShortcutIntent(): Promise<string> {
  if (Intent.shortcutParameter == null) return "";

  let resultMessage = "";
  try {
    if (Intent.shortcutParameter.type === "text") {
      const text = Intent.shortcutParameter.value;
      const success = await ParcelManager.extractFromText(text);
      
      if (success) {
        Widget.reloadAll();
        resultMessage = "已成功从文本中提取并保存快递信息。";
      } else {
        resultMessage = "未能识别文本中的快递信息，请检查格式。";
      }
    } else {
      resultMessage = "捷径参数仅支持文本格式。";
    }
  } catch (err) {
    console.error("[Intent] Error in handleShortcutIntent:", err);
    resultMessage = `处理出错: ${err instanceof Error ? err.message : String(err)}`;
  }
  
  return resultMessage;
}

if (Script.env === "intent") {
  console.log("[Intent] Running in intent environment");

  const safetyTimer = setTimeout(() => {
    console.warn("[Intent] Safety timeout reached");
    Script.exit(Intent.text("执行超时，请稍后重试。"));
  }, 25000);

  handleShortcutIntent().then(result => {
    clearTimeout(safetyTimer);
    if (result) {
      Script.exit(Intent.text(result));
    } else {
      Script.exit();
    }
  }).catch(err => {
    clearTimeout(safetyTimer);
    console.error("[Intent] Top-level error:", err);
    Script.exit(Intent.text("捷径执行发生未知错误"));
  });
}
