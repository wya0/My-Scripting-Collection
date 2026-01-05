import { 
  NavigationStack, VStack, HStack, ZStack, Text, Image, Spacer, 
  useState, useEffect, DatePicker, useObservable, Widget, Navigation, Script, Divider, ProgressView,
  Toggle, ColorPicker, Color, Slider
} from "scripting";
import { ContentData } from "./shared/types";
import { 
  getDynamicContent,
  getStoredBirthday,
  setStoredBirthday, 
  getStoredSmallWidgetDisplay,
  setStoredSmallWidgetDisplay,
  getStoredContentSource,
  setStoredContentSource,
  getProgressData,
  getWidgetDisplayOptions,
  getWidgetBgConfig,
  setWidgetBgConfig,
  getStoredLifeExpectancy,
  setStoredLifeExpectancy,
  StorageService
} from "./shared/utils";
import { STORAGE_KEYS, CONTENT_SOURCES } from "./shared/constants";

const Card = ({ children, padding = 12 }: { children: any, padding?: number }) => (
  <VStack 
    padding={padding}
    background={{
      style: "secondarySystemGroupedBackground",
      shape: { type: "rect", cornerRadius: 12 }
    }}
    frame={{ maxWidth: Infinity }}
  >
    {children}
  </VStack>
);

function DynamicContentCard({ source }: { source: string }) {
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const refreshContent = async (force: boolean = false) => {
    setLoading(true);
    try {
      const data = await getDynamicContent(force);
      setContent(data);
    } catch (err) {
      console.error("刷新内容失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshContent();
  }, [source]);

  const getIcon = () => {
    switch (source) {
      case CONTENT_SOURCES.HISTORY: return "clock.arrow.circlepath";
      case CONTENT_SOURCES.ALMANAC: return "calendar.circle.fill";
      default: return "quote.bubble.fill";
    }
  };

  const getGradient = () => {
    switch (source) {
      case CONTENT_SOURCES.HISTORY: return ["#ff9966", "#ff5e62"];
      case CONTENT_SOURCES.ALMANAC: return ["#56ab2f", "#a8e063"];
      default: return ["#43cea2", "#185a9d"];
    }
  };

  return (
    <VStack 
      padding={16}
      background={{
        gradient: [
          { color: getGradient()[0], location: 0 },
          { color: getGradient()[1], location: 1 }
        ] as any,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 }
      }}
      alignment="leading" 
      spacing={10}
      clipShape={{ type: "rect", cornerRadius: 12 }}
    >
      <HStack>
        <HStack spacing={6}>
          <Image systemName={getIcon()} foregroundStyle={"white"} font={20} />
          <Text foregroundStyle={"white"} font={14} fontWeight="bold">{content?.title || "正在加载..."}</Text>
        </HStack>
        <Spacer />{source !== CONTENT_SOURCES.ALMANAC && (
          <HStack 
            spacing={6}
            padding={{ horizontal: 12, vertical: 6 }} 
            onTapGesture={() => refreshContent(true)}
            background={{ style: "white", opacity: 0.9, shape: { type: "rect", cornerRadius: 100 } }}
          >
            <Image systemName="arrow.clockwise" foregroundStyle={getGradient()[1] as any} font={12} fontWeight="bold" />
            <Text foregroundStyle={getGradient()[1] as any} font={12} fontWeight="bold">刷新</Text></HStack>
        )}
      </HStack>
      
      <VStack alignment="leading" spacing={6}>
        <Text 
          foregroundStyle={"white"} 
          font={16} 
          fontWeight="bold" 
          fontDesign="serif" 
          lineLimit={6}
          minScaleFactor={0.8}
        >
          {loading ? "获取中..." : content?.content || "暂无内容"}
        </Text>
        {!!content?.subContent && (
          <Text foregroundStyle={"white"} font={12} opacity={0.9} lineLimit={2} minScaleFactor={0.9}>
            {content.subContent}
          </Text>
        )}
      </VStack>

      {!loading && (
        <HStack>
          <Spacer />
          <Text foregroundStyle={"white"} font={11} fontWeight="medium" opacity={0.8}>
            —— {content?.source || "Life Progress"}
          </Text>
        </HStack>
      )}
    </VStack>
  );
}

const SettingRow = ({ icon, title, children }: { icon: string, title: string, children?: any }) => (
  <HStack padding={{ vertical: 2 }}>
    <ZStack padding={6} background={{
      style: "systemGray5",
      shape: { type: "rect", cornerRadius: 6 }
    }}><Image systemName={icon} font={12} foregroundStyle={"label"} /></ZStack>
    <Text font={14}>{title}</Text>
    <Spacer />
    {children}
  </HStack>
);

function MainView() {
  const birthday = getStoredBirthday();
  const birthdayObs = useObservable(birthday || new Date("2000-01-01"));
  const [smallWidgetDisplay, setSmallWidgetDisplayState] = useState(getStoredSmallWidgetDisplay());
  const [contentSource, setContentSourceState] = useState(getStoredContentSource());
  const [lifeExpectancy, setLifeExpectancyState] = useState(getStoredLifeExpectancy());
  
  const [bgConfig, setBgConfigState] = useState(getWidgetBgConfig());
  const now = new Date();

  useEffect(() => {
    setStoredBirthday(birthdayObs.value);
    StorageService.remove(STORAGE_KEYS.PROGRESS_CACHE);
    Widget.reloadAll();
  }, [birthdayObs.value]);

  useEffect(() => {
    setStoredSmallWidgetDisplay(smallWidgetDisplay);
    StorageService.remove(STORAGE_KEYS.PROGRESS_CACHE);
    Widget.reloadAll();
  }, [smallWidgetDisplay]);

  useEffect(() => {
    setStoredContentSource(contentSource);
    Widget.reloadAll();
  }, [contentSource]);

  useEffect(() => {
    setStoredLifeExpectancy(lifeExpectancy);
    StorageService.remove(STORAGE_KEYS.PROGRESS_CACHE);
    Widget.reloadAll();
  }, [lifeExpectancy]);

  useEffect(() => {
    setWidgetBgConfig(bgConfig);
    Widget.reloadAll();
  }, [bgConfig]);

  const items = getProgressData(birthdayObs.value);
  const widgetOptions = getWidgetDisplayOptions();
  const contentOptions = [
    { label: "每日一言", value: CONTENT_SOURCES.QUOTE },
    { label: "历史上的今天", value: CONTENT_SOURCES.HISTORY },
    { label: "老黄历", value: CONTENT_SOURCES.ALMANAC }
  ];

  return (
    <NavigationStack>
      <ZStack background={"systemGroupedBackground"} frame={{ maxWidth: Infinity, maxHeight: Infinity }}>
        <VStack 
          spacing={12}
          padding={{ bottom: 30 }}
          frame={{ maxWidth: Infinity, maxHeight: Infinity }}
        >
          <VStack spacing={2} padding={{ top: 20, horizontal: 16, bottom: 8 }}>
            <Text font={12} fontWeight="semibold" foregroundStyle={"secondaryLabel"}>
              {`${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`}
            </Text>
            <Text font={28} fontWeight="bold">时光进度</Text>
          </VStack>

          <VStack spacing={16} padding={{ horizontal: 16 }}>
          <DynamicContentCard source={contentSource} />

          <VStack spacing={12}>
            <Text font={18} fontWeight="bold">系统设置</Text>
            
            <Card>
              <VStack spacing={12}>
                <SettingRow icon="gift.fill" title="出生日期">
                  <DatePicker 
                    value={birthdayObs}
                    displayedComponents={["date"]}
                    title=""
                  />
                </SettingRow>
                
                <Divider />

                <VStack spacing={10}>
                  <SettingRow icon="hourglass" title="预期寿命">
                    <Text font={14} fontWeight="bold" foregroundStyle="systemBlue">{lifeExpectancy} 岁</Text>
                  </SettingRow>
                  <Slider 
                    min={60}
                    max={120}
                    value={lifeExpectancy}
                    onChanged={setLifeExpectancyState}
                  />
                </VStack>

                <Divider />

                <VStack spacing={10}>
                  <SettingRow icon="doc.text.fill" title="内容源选择" />
                  <HStack spacing={4} padding={4} background={{ style: "systemGray6", shape: { type: "rect", cornerRadius: 10 } }}>
                    {contentOptions.map((option) => (
                      <VStack
                        key={option.value}
                        padding={{ vertical: 8 }}
                        frame={{ maxWidth: Infinity }}
                        background={{
                          style: contentSource === option.value ? "systemBlue" : "clear",
                          shape: { type: "rect", cornerRadius: 8 }
                        }}
                        onTapGesture={() => {
                          setContentSourceState(option.value);
                        }}
                      >
                        <Text 
                          font={12} 
                          fontWeight={contentSource === option.value ? "bold" : "regular"}
                          foregroundStyle={contentSource === option.value ? "white" : "secondaryLabel"}
                        >
                          {option.label}
                        </Text>
                      </VStack>
                    ))}
                  </HStack>
                </VStack>

                <Divider />
                
                <VStack spacing={10}>
                  <SettingRow icon="paintpalette.fill" title="自定义背景色">
                    <Toggle 
                      title=""
                      value={bgConfig.useCustom} 
                      onChanged={(val) => setBgConfigState(prev => ({ ...prev, useCustom: val, isTransparent: val ? false : prev.isTransparent }))} 
                    />
                  </SettingRow>

                  <SettingRow icon="square.dashed" title="透明背景模式">
                    <Toggle 
                      title=""
                      value={bgConfig.isTransparent} 
                      onChanged={(val) => setBgConfigState(prev => ({ ...prev, isTransparent: val, useCustom: val ? false : prev.useCustom }))} 
                    />
                  </SettingRow>
                  
                  {bgConfig.useCustom && (
                    <VStack spacing={10} padding={{ leading: 28 }}>
                      <HStack>
                        <Text font={14} foregroundStyle={"secondaryLabel"}>浅色模式</Text>
                        <Spacer />
                        <ColorPicker 
                          value={bgConfig.light as Color} 
                          onChanged={(color) => setBgConfigState(prev => ({ ...prev, light: color }))}
                        >
                          <HStack spacing={6}>
                            <ZStack frame={{ width: 24, height: 24 }} background={{ style: bgConfig.light as any, shape: { type: "rect", cornerRadius: 12 } }} />
                            <Text font={12}>{bgConfig.light}</Text>
                          </HStack>
                        </ColorPicker>
                      </HStack>
                      
                      <HStack>
                        <Text font={14} foregroundStyle={"secondaryLabel"}>深色模式</Text>
                        <Spacer />
                        <ColorPicker 
                          value={bgConfig.dark as Color} 
                          onChanged={(color) => setBgConfigState(prev => ({ ...prev, dark: color }))}
                        >
                          <HStack spacing={6}>
                            <ZStack frame={{ width: 24, height: 24 }} background={{ style: bgConfig.dark as any, shape: { type: "rect", cornerRadius: 12 } }} />
                            <Text font={12}>{bgConfig.dark}</Text>
                          </HStack>
                        </ColorPicker>
                      </HStack>
                    </VStack>
                  )}
                </VStack>

                <Divider />
                
                <VStack spacing={10}>
                  <SettingRow icon="rectangle.3.group.fill" title="小组件显示" />
                  <HStack spacing={4} padding={4} background={{ style: "systemGray6", shape: { type: "rect", cornerRadius: 10 } }}>
                    {widgetOptions.map((option) => (
                      <VStack
                        key={option.value}
                        padding={{ vertical: 8 }}
                        frame={{ maxWidth: Infinity }}
                        background={{
                          style: smallWidgetDisplay === option.value ? "systemBlue" : "clear",
                          shape: { type: "rect", cornerRadius: 8 }
                        }}
                        onTapGesture={() => {
                          setSmallWidgetDisplayState(option.value);
                        }}
                      >
                        <Text 
                          font={12} 
                          fontWeight={smallWidgetDisplay === option.value ? "bold" : "regular"}
                          foregroundStyle={smallWidgetDisplay === option.value ? "white" : "secondaryLabel"}
                        >
                          {option.label}
                        </Text>
                      </VStack>
                    ))}
                  </HStack>
                </VStack>
              </VStack>
            </Card>
            
            <Text font={11} foregroundStyle={"secondaryLabel"} multilineTextAlignment="center" frame={{ maxWidth: Infinity }} padding={{ top: 10 }}>
              Life Progress v1.1.0
            </Text>
          </VStack>
        </VStack>
      </VStack>
    </ZStack>
  </NavigationStack>
  );
}

async function run() {
  await Navigation.present(<MainView />);
  Script.exit();
}

run();
