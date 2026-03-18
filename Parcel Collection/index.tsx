import { Text, HStack, VStack, Button, Spacer, Image, Navigation, useState, useEffect, Picker, TextField, ScrollView, Color, ZStack, Toggle, Intent, Script, AppEvents, ScenePhase } from "scripting";
import { handleShortcutIntent } from "./intent";
import { ParcelManager, LiveActivityManager } from "./logic";
import { Parcel, AppConfig, DEFAULT_CONFIG } from "./model";
declare const HapticFeedback: any;

const BRAND_CONFIG: Record<string, { color: Color; icon: string }> = {
  "菜鸟驿站": { color: "#0081FF", icon: "house.fill" },
  "菜鸟": { color: "#0081FF", icon: "house.fill" },
  "丰巢": { color: "#FF8000", icon: "archivebox.fill" },
  "丰巢柜": { color: "#FF8000", icon: "archivebox.fill" },
  "顺丰": { color: "label", icon: "bolt.fill" },
  "顺丰速运": { color: "label", icon: "bolt.fill" },
  "京东": { color: "#E1251B", icon: "shippingbox.fill" },
  "京东快递": { color: "#E1251B", icon: "shippingbox.fill" },
  "邮政": { color: "#34C759", icon: "envelope.fill" },
  "中通": { color: "#007AFF", icon: "box.truck.fill" },
  "圆通": { color: "#AF52DE", icon: "shippingbox.circle.fill" },
  "韵达": { color: "#FFCC00", icon: "cube.fill" },
  "兔喜生活": { color: "#FF3B30", icon: "house.circle.fill" },
  "极兔": { color: "#FF3B30", icon: "bolt.circle.fill" },
  "申通": { color: "#FF9500", icon: "cube.box.fill" },
  "其他": { color: "secondaryLabel", icon: "shippingbox.fill" }
};

function App() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [showTools, setShowTools] = useState<boolean>(false);
  const [pasteText, setPasteText] = useState<string>("");
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  const refresh = () => {
    const data = ParcelManager.getAll();
    setParcels(data);
  };

  useEffect(() => {
    const savedConfig = ParcelManager.getConfig();
    setConfig(savedConfig);
    ParcelManager.autoCleanup();
    LiveActivityManager.sync();
    refresh();

    const listener = (phase: ScenePhase) => {
      if (phase === 'active') {
        refresh();
        LiveActivityManager.sync();
      }
    };
    AppEvents.scenePhase.addListener(listener);

    return () => {
      AppEvents.scenePhase.removeListener(listener);
    };
  }, []);

  const handleRefresh = () => {
    try { if (typeof HapticFeedback !== 'undefined') HapticFeedback.selectionChanged(); } catch (e) {}
    refresh();
  };

  const handleCollect = async (id: string) => {
    await ParcelManager.updateStatus(id, "collected");
    refresh();
    try { if (typeof HapticFeedback !== 'undefined') HapticFeedback.notificationSuccess(); } catch (e) {}
  };

  const handleDelete = async (id: string) => {
    await ParcelManager.delete(id);
    handleRefresh();
    try { if (typeof HapticFeedback !== 'undefined') HapticFeedback.notificationSuccess(); } catch (e) {}
  };

  const handleMockSms = async () => {
    try { if (typeof HapticFeedback !== 'undefined') HapticFeedback.impactLight(); } catch (e) {}
    const mockTemplates = [
      "【菜鸟驿站】您有2个包裹在新城家园万森便利店，取件码为8-2-3007, 12-4-3020",
      "【菜鸟驿站】您的包裹已到站，凭1-2-4017到新城家园万森便利店取件。",
      "【丰巢】您的快件已投递至 科技园科苑路15号丰巢柜，取件码 990011",
      "【顺丰速运】您的快件已到达 软件产业基地5栋B座大堂点部，请凭 123456 取件",
      "【京东快递】您的快件已送达 腾讯滨海大厦南塔楼京东快递柜，取件码 102938",
      "【菜鸟驿站】您的包裹已到站，凭2-2-4017到新城家园万森便利店取件。",
      "【丰巢】您的快件已投递至 科技园科苑路15号丰巢柜，取件码 990012",
      "【顺丰速运】您的快件已到达 软件产业基地5栋B座大堂点部，请凭 123457 取件",
      "【京东快递】您的快件已送达 腾讯滨海大厦南塔楼京东快递柜，取件码 102937",
      "【菜鸟驿站】您的包裹已到站，凭3-2-4017到新城家园万森便利店取件。",
      "【丰巢】您的快件已投递至 科技园科苑路15号丰巢柜，取件码 990013",
      "【顺丰速运】您的快件已到达 软件产业基地5栋B座大堂点部，请凭 123458 取件",
      "【京东快递】您的快件已送达 腾讯滨海大厦南塔楼京东快递柜，取件码 102936",
      "【菜鸟驿站】您的包裹已到站，凭4-2-4017到新城家园万森便利店取件。",
      "【丰巢】您的快件已投递至 科技园科苑路15号丰巢柜，取件码 990014",
      "【顺丰速运】您的快件已到达 软件产业基地5栋B座大堂点部，请凭 123459 取件",
      "【京东快递】您的快件已送达 腾讯滨海大厦南塔楼京东快递柜，取件码 102935"
    ];
    const randomText = mockTemplates[Math.floor(Math.random() * mockTemplates.length)];
    await ParcelManager.extractFromText(randomText);
    try { if (typeof HapticFeedback !== 'undefined') HapticFeedback.notificationSuccess(); } catch (e) {}
    refresh();
  };

  const handlePasteTest = async () => {
    if (!pasteText.trim() || isExtracting) return;
    setIsExtracting(true);
    setTestResult(null);
    try { if (typeof HapticFeedback !== 'undefined') HapticFeedback.impactLight(); } catch (e) {}
    try {
      const success = await ParcelManager.extractFromText(pasteText);
      if (success) {
        setTestResult({ success: true, msg: "解析成功！" });
        setPasteText("");
        try { if (typeof HapticFeedback !== 'undefined') HapticFeedback.notificationSuccess(); } catch (e) {}
        refresh();
      } else {
        setTestResult({ success: false, msg: "未识别到信息" });
        try { if (typeof HapticFeedback !== 'undefined') HapticFeedback.notificationError(); } catch (e) {}
      }
    } catch (err) {
      setTestResult({ success: false, msg: "解析出错" });
    } finally {
      setIsExtracting(false);
      setTimeout(() => setTestResult(null), 2000);
    }
  };

  const updateConfig = (updates: Partial<AppConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    ParcelManager.setConfig(newConfig);
    try { if (typeof HapticFeedback !== 'undefined') HapticFeedback.selectionChanged(); } catch (e) {}
  };

  const pendingCount = parcels.filter(p => p.status === "pending").length;
  const displayList = activeTab === "pending" 
    ? parcels.filter(p => p.status === "pending") 
    : parcels.filter(p => p.status === "collected");

  const renderCommandCenter = () => (
    <VStack spacing={24} padding={24} background="secondarySystemBackground" frame={{ maxHeight: "infinity" }}>
      <HStack>
        <VStack alignment="leading" spacing={2}>
          <Text font="title2" bold foregroundStyle="label">控制中心</Text>
          <Text font="caption" foregroundStyle="secondaryLabel">配置提取偏好与测试工具</Text>
        </VStack>
        <Spacer />
        <Button 
          title="完成" 
          action={() => setShowTools(false)} 
          font="headline" 
          buttonStyle="borderless"
          foregroundStyle="systemBlue"
        />
      </HStack>

      <ScrollView>
        <VStack spacing={24}>
          <VStack spacing={12}>
            <Text font="subheadline" bold foregroundStyle="secondaryLabel" padding={{ leading: 8 }}>提取策略</Text>
            <HStack 
              padding={16} 
              background={{ style: "tertiarySystemBackground", shape: { type: "rect", cornerRadius: 20 } }}
            >
              <VStack background={{ style: "systemOrange", shape: { type: "rect", cornerRadius: 10 } }} padding={8}>
                <Image systemName="bolt.shield.fill" foregroundStyle="white" font={18} />
              </VStack>
              <VStack alignment="leading" spacing={2} padding={{ leading: 12 }}>
                <Text font="body" bold foregroundStyle="label">智能解析引擎</Text>
                <Text font="caption" foregroundStyle="secondaryLabel">AI 与正则的优先级切换</Text>
              </VStack>
              <Spacer />
              <Picker 
                label={<Text foregroundStyle="secondaryLabel">策略</Text>}
                value={config.strategy} 
                onChanged={(val: any) => updateConfig({ strategy: val })}
                pickerStyle="menu"
              >
                <Text tag="regex_first">正则优先</Text>
                <Text tag="ai_first">AI 优先</Text>
              </Picker>
            </HStack>
          </VStack>

          <VStack spacing={12}>
            <Text font="subheadline" bold foregroundStyle="secondaryLabel" padding={{ leading: 8 }}>手动测试与模拟</Text>
            <VStack spacing={16} padding={16} background={{ style: "tertiarySystemBackground", shape: { type: "rect", cornerRadius: 20 } }}>
              <VStack padding={4} background={{ style: "secondarySystemBackground", shape: { type: "rect", cornerRadius: 12 } }}>
                <TextField 
                  title=""
                  prompt="在此粘贴短信内容进行提取测试..." 
                  value={pasteText}
                  onChanged={setPasteText}
                  axis="vertical"
                  lineLimit={{ min: 4, max: 6 }}
                  padding={12}
                />
              </VStack>
              <HStack spacing={12}>
                <Button 
                  title={isExtracting ? "正在提取" : "开始解析"} 
                  systemImage="wand.and.stars.inverse" 
                  action={handlePasteTest}
                  buttonStyle="borderedProminent"
                  disabled={!pasteText.trim() || isExtracting}
                  frame={{ maxWidth: Infinity }}
                  padding={{ vertical: 12 }}
                  foregroundStyle={!pasteText.trim() || isExtracting ? "tertiaryLabel" : "white"}
                />
                <Button 
                  title="模拟短信" 
                  systemImage="paperplane.fill" 
                  action={handleMockSms}
                  buttonStyle="bordered"
                  frame={{ maxWidth: Infinity }}
                  padding={{ vertical: 12 }}
                />
              </HStack>
              {testResult && (
                <HStack spacing={6} alignment="center" padding={8} offset={{ x: 0, y: -8 }}>
                   <Image systemName={testResult.success ? "checkmark.circle.fill" : "exclamationmark.triangle.fill"} 
                         foregroundStyle={testResult.success ? "systemGreen" : "systemRed"} font={14} />
                  <Text font="caption" bold foregroundStyle={testResult.success ? "systemGreen" : "systemRed"}>
                    {testResult.msg}
                  </Text>
                </HStack>
              )}
            </VStack>
          </VStack>

          <VStack spacing={12}>
            <Text font="subheadline" bold foregroundStyle="secondaryLabel" padding={{ leading: 8 }}>数据管理</Text>
            <VStack spacing={0} background={{ style: "tertiarySystemBackground", shape: { type: "rect", cornerRadius: 20 } }}>
              {/* --- 自动清理组 --- */}
              <HStack padding={16} alignment="center" frame={{ maxWidth: "infinity" }}>
                <HStack spacing={12} alignment="center">
                  <VStack background={{ style: "systemGreen", shape: { type: "rect", cornerRadius: 10 } }} padding={8}>
                    <Image systemName="clock.arrow.2.circlepath" foregroundStyle="white" font={18} />
                  </VStack>
                  <VStack alignment="leading" spacing={2}>
                    <Text font="body" bold foregroundStyle="label">自动清理历史</Text>
                    <Text font="caption" foregroundStyle="secondaryLabel">清理已签收的过期包裹</Text>
                  </VStack>
                </HStack>
                <Spacer />
                <Toggle 
                  title=""
                  value={config.autoCleanup} 
                  onChanged={(val) => updateConfig({ autoCleanup: val })}
                  frame={{ width: 51, height: 31 }}
                />
              </HStack>
              
              {config.autoCleanup && (
                <VStack spacing={0}>
                  <VStack background="separator" frame={{ height: 0.5, maxWidth: Infinity }} padding={{ leading: 52, trailing: 16 }} />
                  <HStack padding={{ leading: 52, trailing: 16, top: 12, bottom: 12 }} alignment="center" frame={{ maxWidth: "infinity" }}>
                    <Text font="body" foregroundStyle="label">保留天数</Text>
                    <Spacer />
                    <Picker 
                      label={<Text font="body" foregroundStyle="systemBlue" bold>{config.cleanupDays} 天</Text>}
                      value={config.cleanupDays} 
                      onChanged={(val: any) => updateConfig({ cleanupDays: Number(val) })}
                      pickerStyle="menu"
                    >
                      <Text tag={1}>1 天</Text>
                      <Text tag={3}>3 天</Text>
                      <Text tag={7}>7 天</Text>
                      <Text tag={15}>15 天</Text>
                      <Text tag={30}>30 天</Text>
                    </Picker>
                  </HStack>
                </VStack>
              )}

              <VStack background="separator" frame={{ height: 0.5, maxWidth: Infinity }} padding={{ horizontal: 16 }} />

              <HStack padding={16} alignment="center" frame={{ maxWidth: "infinity" }}>
                <HStack spacing={12} alignment="center">
                  <VStack background={{ style: "systemBlue", shape: { type: "rect", cornerRadius: 10 } }} padding={8}>
                    <Image systemName="iphone.radiowaves.left.and.right" foregroundStyle="white" font={18} />
                  </VStack>
                  <VStack alignment="leading" spacing={2}>
                    <Text font="body" bold foregroundStyle="label">开启灵动岛提示</Text>
                    <Text font="caption" foregroundStyle="secondaryLabel">在灵动岛实时显示取件码</Text>
                  </VStack>
                </HStack>
                <Spacer />
                <Toggle 
                  title=""
                  value={config.liveActivityEnabled ?? true} 
                  onChanged={(val) => updateConfig({ liveActivityEnabled: val })} 
                  frame={{ width: 51, height: 31 }}
                />
              </HStack>

              {config.liveActivityEnabled && (
                <VStack spacing={0}>
                  <VStack background="separator" frame={{ height: 0.5, maxWidth: Infinity }} padding={{ leading: 52, trailing: 16 }} />
                  <HStack padding={{ leading: 52, trailing: 16, top: 12, bottom: 12 }} alignment="center" frame={{ maxWidth: "infinity" }}>
                    <VStack alignment="leading" spacing={2}>
                      <Text font="body" foregroundStyle="label">强提醒时长</Text>
                      <Text font="caption2" foregroundStyle="secondaryLabel">超时后自动收起至锁屏</Text>
                    </VStack>
                    <Spacer />
                    <Picker 
                      label={<Text font="body" foregroundStyle="systemBlue" bold>{config.liveActivityStaleHours} 小时</Text>}
                      value={config.liveActivityStaleHours} 
                      onChanged={(val: any) => updateConfig({ liveActivityStaleHours: Number(val) })}
                      pickerStyle="menu"
                    >
                      <Text tag={1}>1 小时</Text>
                      <Text tag={2}>2 小时</Text>
                      <Text tag={4}>4 小时</Text>
                      <Text tag={8}>8 小时</Text>
                      <Text tag={12}>12 小时</Text>
                    </Picker>
                  </HStack>

                  <VStack background="separator" frame={{ height: 0.5, maxWidth: Infinity }} padding={{ leading: 52, trailing: 16 }} />
                  <HStack padding={{ leading: 52, trailing: 16, top: 12, bottom: 12 }} alignment="center" frame={{ maxWidth: "infinity" }}>
                    <VStack alignment="leading" spacing={2}>
                      <Text font="body" foregroundStyle="label">提醒新鲜度</Text>
                      <Text font="caption2" foregroundStyle="secondaryLabel">超过此时间的包裹不主动提示</Text>
                    </VStack>
                    <Spacer />
                    <Picker 
                      label={<Text font="body" foregroundStyle="systemBlue" bold>{config.liveActivityFreshHours} 小时</Text>}
                      value={config.liveActivityFreshHours} 
                      onChanged={(val: any) => updateConfig({ liveActivityFreshHours: Number(val) })}
                      pickerStyle="menu"
                    >
                      <Text tag={4}>4 小时</Text>
                      <Text tag={8}>8 小时</Text>
                      <Text tag={12}>12 小时</Text>
                      <Text tag={24}>24 小时</Text>
                      <Text tag={48}>48 小时</Text>
                    </Picker>
                  </HStack>
                </VStack>
              )}
            </VStack>
          </VStack>
        </VStack>
      </ScrollView>
    </VStack>
  );

  return (
    <VStack background="systemBackground" frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
      <HStack padding={{ horizontal: 24, top: 16}}>
        <VStack alignment="leading" spacing={2}>
          <Text font={28} bold foregroundStyle="label">快递管家</Text>
          <Text font="caption" foregroundStyle="secondaryLabel">今天有 {pendingCount} 个包裹等您领取</Text>
        </VStack>
        <Spacer />
        <Button 
          title=""
          systemImage="line.3.horizontal.decrease.circle" 
          action={() => setShowTools(true)} 
          foregroundStyle="systemBlue" 
          font={24}
          buttonStyle="borderless"
          sheet={{
            isPresented: showTools,
            onChanged: setShowTools,
            content: renderCommandCenter()
          }}
        />
      </HStack>

      <ScrollView>
        <VStack spacing={10} padding={24}>
          {/* Hero Dashboard - iOS 26 Mesh Gradient Style */}
          <ZStack frame={{ maxWidth: Infinity }}>
            <VStack 
              alignment="leading" 
              spacing={16} 
              padding={28} 
              background={{
                style: { colors: ["#FF3B30", "#FF9500"], startPoint: "topLeading", endPoint: "bottomTrailing" },
                shape: { type: "rect", cornerRadius: 32 }
              }}
              frame={{ maxWidth: Infinity }}
            >
              <HStack>
                <VStack alignment="leading" spacing={4}>
                  <Text foregroundStyle="white" font="subheadline" bold opacity={0.8}>待取件总数</Text>
                  <Text foregroundStyle="white" font={64} bold>{pendingCount}</Text>
                </VStack>
                <Spacer />
                <Button 
                  title=""
                  systemImage="arrow.clockwise.circle.fill" 
                  action={handleRefresh} 
                  foregroundStyle="white" 
                  font={32}
                  buttonStyle="borderless"
                />
              </HStack>
              
              <HStack spacing={10}>
                <Image systemName="bell.badge.fill" foregroundStyle="white" font={14} />
                <Text foregroundStyle="white" font="caption" bold opacity={0.9}>实时监听短信通知中</Text>
              </HStack>
            </VStack>
          </ZStack>

          <VStack spacing={12} frame={{ maxWidth: Infinity }}>
            <HStack background={{ style: "secondarySystemBackground", shape: { type: "rect", cornerRadius: 16 } }} padding={4}>
              <Button 
                title="待取包裹" 
                action={() => setActiveTab("pending")}
                buttonStyle="borderless"
                frame={{ maxWidth: Infinity }}
                padding={{ vertical: 10 }}
                background={activeTab === "pending" ? { style: "tertiarySystemBackground", shape: { type: "rect", cornerRadius: 12 } } : undefined}
                foregroundStyle={activeTab === "pending" ? "label" : "secondaryLabel"}
                font={15}
                bold={activeTab === "pending"}
              />
              <Button 
                title="历史记录" 
                action={() => setActiveTab("history")}
                buttonStyle="borderless"
                frame={{ maxWidth: Infinity }}
                padding={{ vertical: 10 }}
                background={activeTab === "history" ? { style: "tertiarySystemBackground", shape: { type: "rect", cornerRadius: 12 } } : undefined}
                foregroundStyle={activeTab === "history" ? "label" : "secondaryLabel"}
                font={15}
                bold={activeTab === "history"}
              />
            </HStack>

            <VStack spacing={16} frame={{ maxWidth: Infinity }}>
              {displayList.length === 0 ? (
                <VStack alignment="center" padding={{ vertical: 80 }} spacing={20}>
                  <VStack>
                    <Image systemName="shippingbox.and.arrow.backward" font={48} foregroundStyle="quaternaryLabel" />
                  </VStack>
                  <VStack spacing={4} alignment="center">
                    <Text foregroundStyle="label" font="headline">
                      {activeTab === "pending" ? "全部处理完毕" : "暂无历史记录"}
                    </Text>
                    <Text foregroundStyle="secondaryLabel" font="subheadline">
                      {activeTab === "pending" ? "暂无待取包裹，享受您的时光吧" : "您取过的包裹将出现在这里"}
                    </Text>
                  </VStack>
                </VStack>
              ) : (
                displayList.map(p => {
                  const brand = BRAND_CONFIG[p.courier] || BRAND_CONFIG["其他"];
                  const isPending = p.status === "pending";
                  const date = new Date(p.timestamp);
                  const formatTime = (ts: number) => {
                    const now = new Date();
                    const d = new Date(ts);
                    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
                    if (diff === 0) return "今天";
                    if (diff === 1) return "昨天";
                    if (diff < 7) return `${diff}天前`;
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  };
                  const dateLabel = formatTime(p.timestamp);
                  
                  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                     <VStack 
                       key={p.id} 
                       background={{ style: "tertiarySystemBackground", shape: { type: "rect", cornerRadius: 24 } }} 
                       shadow={{ color: "#00000008", radius: 15, x: 0, y: 8 }}
                       frame={{ maxWidth: Infinity }}
                     >
                       <HStack 
                            padding={{ horizontal: 16, vertical: 8 }} 
                            background={{ 
                              style: (brand.color + "10") as any, 
                              shape: { type: "rect", cornerRadii: { topLeading: 24, topTrailing: 24, bottomLeading: 0, bottomTrailing: 0 } } 
                            }}
                            alignment="center"
                          >
                          <HStack spacing={6} alignment="center">
                            <Image systemName={brand.icon} foregroundStyle={brand.color} font={12} bold />
                            <Text font="footnote" bold foregroundStyle={brand.color}>{p.courier}</Text>
                          </HStack>
                          <Spacer />
                          <Text font="caption2" foregroundStyle="secondaryLabel" bold>
                            {(dateLabel + " " + timeStr).toUpperCase()}
                          </Text>
                        </HStack>

                        <VStack padding={{ horizontal: 16, bottom: 12, top: 4 }} spacing={8}>
                          <HStack alignment="center">
                            <VStack alignment="leading" spacing={0}>
                              <HStack spacing={4} alignment="center">
                                <Image systemName="tag.fill" foregroundStyle="tertiaryLabel" font={10} />
                                <Text font="caption2" foregroundStyle="tertiaryLabel" bold>{"取件码：".toUpperCase()}</Text>
                              </HStack>
                              <Text font={40} bold foregroundStyle="label">{p.code}</Text>
                            </VStack>
                            <Spacer />
                            {isPending ? (
                              <Button 
                                title=""
                                systemImage="checkmark.circle.fill" 
                                action={() => handleCollect(p.id)}
                                buttonStyle="borderless"
                                foregroundStyle={brand.color}
                                font={36}
                                shadow={{ color: (brand.color + "30") as any, radius: 8, x: 0, y: 4 }}
                              />
                            ) : (
                              <HStack spacing={12}>
                                <Button 
                                  title=""
                                  systemImage="trash.fill" 
                                  action={() => handleDelete(p.id)}
                                  buttonStyle="borderless"
                                  foregroundStyle="systemRed"
                                  font={20}
                                />
                                <VStack padding={10}>
                                  <Image systemName="archivebox.fill" foregroundStyle="tertiaryLabel" font={18} />
                                </VStack>
                              </HStack>
                            )}
                          </HStack>

                          <HStack 
                            padding={10} 
                            background={{ style: "secondarySystemBackground", shape: { type: "rect", cornerRadius: 12 } }}
                            spacing={1}
                            alignment="center"
                          >
                            <VStack background={{ style: brand.color, shape: { type: "rect", cornerRadius: 100 } }} padding={5}>
                              <Image systemName="mappin.and.ellipse" foregroundStyle="white" font={8} />
                            </VStack>
                            <Text font="caption" foregroundStyle="secondaryLabel" bold>地址：</Text>
                            <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={2} frame={{ maxWidth: Infinity }}>
                              {p.address}
                            </Text>
                          </HStack>
                        </VStack>
                     </VStack>
                   );
                })
              )}
            </VStack>
          </VStack>
        </VStack>
      </ScrollView>
    </VStack>
  );
}

async function start() {
  console.log("[System] Script started");

  let safetyTimer: any = null;
  if (Intent.shortcutParameter != null) {
    safetyTimer = setTimeout(() => {
      console.warn("[System] Safety timeout reached, forcing exit");
      Script.exit(Intent.text("执行超时，请检查网络或稍后重试。"));
    }, 25000);
  }

  try {
    if (Intent.shortcutParameter != null) {
      console.log("[System] Shortcut mode detected");
      const resultMessage = await handleShortcutIntent();
      console.log("[System] Logic completed:", resultMessage);
      
      if (safetyTimer) clearTimeout(safetyTimer);
      Script.exit(Intent.text(resultMessage));
    } else {
      console.log("[System] Normal mode detected");
      Navigation.present({
        element: <App />
      });
    }
  } catch (err) {
    console.error("[System] Global error:", err);
    if (safetyTimer) clearTimeout(safetyTimer);
    if (Intent.shortcutParameter != null) {
      Script.exit(Intent.text(`执行出错: ${err instanceof Error ? err.message : String(err)}`));
    }
  }
}

start();
