import { 
  VStack, HStack, ZStack, Text, Image, Spacer, Widget, Script, ProgressView, Divider, Button
} from "scripting";
import { 
  getProgressData, 
  getStoredBirthday, 
  getDateInfo, 
  getDynamicContent, 
  getStoredSmallWidgetDisplay,
  getProgressItemByKey,
  getRefreshInterval,
  getWidgetBgConfig,
  getContrastColor,
  formatPercentage
} from "./shared/utils";
import { ToggleDisplayIntent, RefreshQuoteIntent } from "./app_intents";

function ErrorView() {
  return (
    <VStack alignment="center" frame={{ maxWidth: Infinity, maxHeight: Infinity }} padding={20}>
      <Image
        systemName="exclamationmark.triangle"
        font={40}
        foregroundStyle={"red"}
      />
      <Text
        font={14}
        foregroundStyle={"secondaryLabel"}
        padding={{ top: 8 }}
      >
        组件加载失败
      </Text>
      <Text
        font={12}
        foregroundStyle={"tertiaryLabel"}
        padding={{ top: 4 }}
      >
        请稍后重试
      </Text>
    </VStack>
  );
}

function SmallWidgetView() {
  const birthday = getStoredBirthday();
  const displayKey = getStoredSmallWidgetDisplay();
  const item = getProgressItemByKey(displayKey, birthday) || getProgressData(birthday)[3]; 
  const dateInfo = getDateInfo();
  const remaining = 100 - (item.value * 100);
  const bgConfig = getWidgetBgConfig();

  let adaptiveColor: any = "white";
  if (bgConfig.isTransparent) {
    adaptiveColor = "label"; // 透明模式下通常使用系统标签颜色
  } else if (bgConfig.useCustom) {
    adaptiveColor = {
      light: getContrastColor(bgConfig.light),
      dark: getContrastColor(bgConfig.dark)
    };
  }

  const content = (
    <Button intent={ToggleDisplayIntent(undefined as any)} buttonStyle="plain">
      <VStack padding={14} alignment="leading">
        <HStack spacing={4} alignment="center">
          <ZStack frame={{ width: 20, height: 20 }} background={{ style: "ultraThinMaterial", shape: { type: "rect", cornerRadius: 10 } }}>
            <Image systemName={item.icon} foregroundStyle={adaptiveColor as any} font={10} />
          </ZStack>
          <Spacer />
          <VStack alignment="trailing" spacing={0}>
             <Text foregroundStyle={adaptiveColor as any} font={14} fontWeight="bold" opacity={0.95}>
               {dateInfo.shortDate}
             </Text>
             <Text foregroundStyle={adaptiveColor as any} font={10} fontWeight="medium" opacity={0.8}>
               {dateInfo.weekDay}
             </Text>
             <Text foregroundStyle={adaptiveColor as any} font={10} fontWeight="medium" opacity={0.8}>
               第{dateInfo.dayOfYear}天
             </Text>
          </VStack>
        </HStack>
        <Spacer />
        <HStack alignment="lastTextBaseline" spacing={2}>
          <Text foregroundStyle={adaptiveColor as any} font={45} fontWeight="heavy" fontDesign="rounded">
            {formatPercentage(item.value, 1).replace('%', '')}
          </Text>
          <Text foregroundStyle={adaptiveColor as any} font={16} fontWeight="bold" padding={{ bottom: 6 }} opacity={0.8}>%</Text>
        </HStack>
        <Text foregroundStyle={adaptiveColor as any} font={10} opacity={0.7}>
          {item.label}剩余 {formatPercentage(remaining / 100, 1)}
        </Text>
        <Spacer />
        <VStack spacing={0}>
            <ProgressView value={item.value} tint={adaptiveColor as any} background={"ultraThinMaterial"} frame={{ height: 6 }} />
        </VStack>
      </VStack>
    </Button>
  );

  if (bgConfig.isTransparent) {
    return (
      <ZStack 
        background="clear" 
        {...({ containerBackground: "clear" } as any)}
      >
        {content}
      </ZStack>
    );
  }

  if (bgConfig.useCustom) {
    return (
      <ZStack background={{ light: bgConfig.light, dark: bgConfig.dark } as any}>
        {content}
      </ZStack>
    );
  }

  return (
    <ZStack background={item.color as any}>
      <ZStack 
        background={{
          gradient: [{ color: "white", location: 0 }, { color: "black", location: 1 }] as any,
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 1, y: 1 }
        }}
        opacity={0.2} 
      />
      {content}
    </ZStack>
  );
}

function MediumWidgetView({ content }: { content: any }) {
  const data = getProgressData(getStoredBirthday());
  const dateInfo = getDateInfo();
  const bgConfig = getWidgetBgConfig();
  
  const displayItems = [data[1], data[2],data[3], data[4]];

  let background: any = "systemBackground";
  if (bgConfig.isTransparent) {
    background = "clear"; // 强制透明背景
  } else if (bgConfig.useCustom) {
    background = { light: bgConfig.light, dark: bgConfig.dark };
  }

  let adaptiveLabelColor: any = "label";
  let adaptiveSecondaryColor: any = "secondaryLabel";

  if (bgConfig.isTransparent) {
    adaptiveLabelColor = "label";
    adaptiveSecondaryColor = "secondaryLabel";
  } else if (bgConfig.useCustom) {
    adaptiveLabelColor = { light: getContrastColor(bgConfig.light), dark: getContrastColor(bgConfig.dark) };
    adaptiveSecondaryColor = { light: getContrastColor(bgConfig.light), dark: getContrastColor(bgConfig.dark) };
  }

  return (
    <VStack 
      padding={12} 
      spacing={6} 
      background={background} 
      {...(bgConfig.isTransparent ? { containerBackground: "clear" } : {}) as any}
      frame={{ maxWidth: Infinity, maxHeight: Infinity }}
    >
      <HStack padding={{ horizontal: 4 }}>
        <Text font={15} fontWeight="bold" foregroundStyle={adaptiveLabelColor as any}>{dateInfo.fullDate}</Text>
        <Spacer />
        <Text font={10} fontWeight="medium" foregroundStyle={adaptiveSecondaryColor as any}>{dateInfo.weekDay} · 第{dateInfo.dayOfYear}天</Text>
      </HStack>
      
      <Divider /> 

      <HStack spacing={10} alignment="center" frame={{ maxHeight: Infinity }}>
        <VStack spacing={4} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
           {displayItems.map((item) => (
             <VStack key={item.key} spacing={2}>
               <HStack>
                 <Image systemName={item.icon} font={9} foregroundStyle={item.color as any} />
                 <Text font={11} fontWeight="medium" foregroundStyle={adaptiveSecondaryColor as any}>{item.label}</Text>
                 <Spacer />
                 <Text font={11}  fontWeight="bold" fontDesign="monospaced" foregroundStyle={adaptiveLabelColor as any}>{formatPercentage(item.value, 1)}</Text>
               </HStack>
               <ProgressView value={item.value} tint={item.color as any} />
             </VStack>
           ))}
        </VStack>

        <Button 
          intent={content.source !== "老黄历" ? RefreshQuoteIntent(undefined as any) : (undefined as any)} 
          buttonStyle="plain" 
          frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
        >
          <VStack 
            padding={{ horizontal: 4, vertical: 2 }}
            alignment="center"
            spacing={2}
            frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
          >
            <HStack spacing={4} alignment="center">
              {content.icon && <Image systemName={content.icon} font={9} foregroundStyle={adaptiveSecondaryColor as any} opacity={0.7} />}
              <Text font={10} fontWeight="bold" foregroundStyle={adaptiveSecondaryColor as any} opacity={0.7}>
                {content.title}
              </Text>
            </HStack>
            
            {content.source === "老黄历" ? (
              <VStack spacing={2} alignment="center">
                <Text font={10} fontWeight="bold" foregroundStyle={"#ff5e62"}>忌</Text>
                <Text 
                  font={11} 
                  fontWeight="medium" 
                  fontDesign="serif" 
                  multilineTextAlignment="center" 
                  lineLimit={5} 
                  minScaleFactor={0.7}
                  foregroundStyle={adaptiveLabelColor as any}
                >
                  {(content.content.split('\n').find((l: string) => l.startsWith('忌：')) || content.content).replace('忌：', '')}
                </Text>
              </VStack>
            ) : (
              <Text 
                font={11} 
                fontWeight="medium" 
                fontDesign="serif" 
                multilineTextAlignment="center" 
                lineLimit={6} 
                minScaleFactor={0.7}
                foregroundStyle={adaptiveLabelColor as any}
              >
                {content.content}
              </Text>
            )}
            {content.subContent ? (
              <Text font={9} foregroundStyle={adaptiveSecondaryColor as any} opacity={0.6} lineLimit={2} minScaleFactor={0.8} multilineTextAlignment="center">
                {content.subContent}
              </Text>
            ) : null}

            <HStack>
              <Spacer />
              <Text font={9} foregroundStyle={adaptiveSecondaryColor as any} opacity={0.6}>
                —— {content.source}
              </Text>
            </HStack>
          </VStack>
        </Button>

      </HStack>
    </VStack>
  );
}

function LargeWidgetView({ content }: { content: any }) {
  const data = getProgressData(getStoredBirthday());
  const dateInfo = getDateInfo();
  const bgConfig = getWidgetBgConfig();
  const sourceIsAlmanac = content.source === "老黄历";

  let background: any = "systemBackground";
  if (bgConfig.isTransparent) {
    background = "clear"; // 强制透明背景
  } else if (bgConfig.useCustom) {
    background = { light: bgConfig.light, dark: bgConfig.dark };
  }

  // 动态文字颜色逻辑
  let adaptiveLabelColor: any = "label";
  let adaptiveSecondaryColor: any = "secondaryLabel";

  if (bgConfig.isTransparent) {
    adaptiveLabelColor = "label";
    adaptiveSecondaryColor = "secondaryLabel";
  } else if (bgConfig.useCustom) {
    adaptiveLabelColor = { light: getContrastColor(bgConfig.light), dark: getContrastColor(bgConfig.dark) };
    adaptiveSecondaryColor = { light: getContrastColor(bgConfig.light), dark: getContrastColor(bgConfig.dark) };
  }

  return (
    <VStack 
      frame={{ maxWidth: Infinity, maxHeight: Infinity }} 
      padding={14} 
      spacing={6} 
      background={background}
      {...(bgConfig.isTransparent ? { containerBackground: "clear" } : {}) as any}
    >
      <HStack padding={{ top: 15, bottom: 5 }}>
        <Text font={18} fontWeight="bold" foregroundStyle={adaptiveLabelColor as any}>时光流逝</Text>
        <Spacer />
        <Image systemName="hourglass" foregroundStyle={"red"} font={16} />
      </HStack>

      <VStack spacing={8} frame={{ maxHeight: Infinity }}>
        {data.map((item) => (
          <HStack key={item.key} spacing={8}>
            <ZStack frame={{ width: 22, height: 22 }} background={{ style: "secondarySystemFill", shape: { type: "rect", cornerRadius: 11 } }}>
                <Image systemName={item.icon} foregroundStyle={item.color as any} font={10} />
            </ZStack>
            <Text font={13} fontWeight="medium" foregroundStyle={adaptiveSecondaryColor as any} frame={{ width: 35 }}>{item.label}</Text>
            <ProgressView value={item.value} tint={item.color as any} />
            <Text font={13} fontWeight="bold" fontDesign="monospaced" foregroundStyle={adaptiveLabelColor as any} frame={{ width: 45 }} multilineTextAlignment="trailing">
              {formatPercentage(item.value, 1)}
            </Text>
          </HStack>
        ))}
      </VStack>

      <HStack 
        padding={{ vertical: 6, horizontal: 10 }} 
        background={{ style: "secondarySystemFill", shape: { type: "rect", cornerRadius: 8 } }}
      >
        <HStack spacing={6}><Image systemName="calendar" font={12} foregroundStyle={"red"} /><Text font={13} fontWeight="bold" foregroundStyle={adaptiveLabelColor as any}>{dateInfo.shortDate}</Text></HStack>
        <Spacer />
        <Text font={11} foregroundStyle={adaptiveSecondaryColor as any}>{dateInfo.weekDay} · 第{dateInfo.dayOfYear}天</Text>
      </HStack>

      <Divider />
      <Button 
        intent={!sourceIsAlmanac ? RefreshQuoteIntent(undefined as any) : (undefined as any)} 
        buttonStyle="plain"
      >
        <VStack 
          padding={{ vertical: 8 }} 
          spacing={sourceIsAlmanac ? 6 : 4}
        >
          <HStack spacing={4} alignment="center">
            {content.icon && <Image systemName={content.icon} font={11} foregroundStyle={adaptiveSecondaryColor as any} opacity={0.7} />}
            <Text font={11} fontWeight="bold" foregroundStyle={adaptiveSecondaryColor as any} opacity={0.7}>
              {content.title}
            </Text>
          </HStack>
          
          {sourceIsAlmanac ? (
            <HStack spacing={12} alignment="top">
              <VStack spacing={2} frame={{ maxWidth: "infinity" }}>
                <Text font={10} fontWeight="bold" foregroundStyle={"#56ab2f"}>宜</Text>
                <Text 
                    font={11} 
                    fontWeight="medium" 
                    lineLimit={4} 
                    minScaleFactor={0.8}
                    foregroundStyle={adaptiveLabelColor as any}
                  >
                    {content.content.split('\n').find((l: string) => l.startsWith('宜：'))?.replace('宜：', '') || "-"}
                  </Text>
                </VStack>
                <Divider frame={{ width: 1, height: 40 }} background={"secondarySystemFill"} />
                <VStack spacing={2} frame={{ maxWidth: "infinity" }}>
                  <Text font={10} fontWeight="bold" foregroundStyle={"#ff5e62"}>忌</Text>
                  <Text 
                    font={11} 
                    fontWeight="medium" 
                    lineLimit={4} 
                    minScaleFactor={0.8}
                    foregroundStyle={adaptiveLabelColor as any}
                  >
                    {content.content.split('\n').find((l: string) => l.startsWith('忌：'))?.replace('忌：', '') || "-"}
                  </Text>
                </VStack>
              </HStack>
            ) : (
              <Text 
                font={12} 
                fontWeight="medium" 
                fontDesign="serif" 
                multilineTextAlignment="center" 
                lineLimit={5} 
                minScaleFactor={0.7}
                foregroundStyle={adaptiveLabelColor as any}
              >
                {content.content}
              </Text>
            )}
            {content.subContent ? (
              <Text font={10} foregroundStyle={adaptiveSecondaryColor as any} opacity={0.6} lineLimit={1} minScaleFactor={0.8} multilineTextAlignment="center">
                {content.subContent}
              </Text>
            ) : null}

            <HStack>
              <Spacer />
              <Text font={10} foregroundStyle={adaptiveSecondaryColor as any} opacity={0.6} lineLimit={1} minScaleFactor={0.8}>
                —— {content.source}
              </Text>
            </HStack>
        </VStack>
      </Button>
    </VStack>
  );
}

function WidgetView({ content }: { content: any }) {
  const family = Widget.family;
  
  if (family === "systemSmall") {
    return <SmallWidgetView />;
  } else if (family === "systemMedium") {
    return <MediumWidgetView content={content} />;
  } else if (family === "systemLarge") {
    return <LargeWidgetView content={content} />;
  }
  
  return <ErrorView />;
}

async function run() {
  try {
    const content = await getDynamicContent();
    
    let refreshAfter = 3600;
    if (Widget.family === "systemSmall") {
      const displayKey = getStoredSmallWidgetDisplay();
      refreshAfter = getRefreshInterval(displayKey);
    }

    Widget.present(<WidgetView content={content || { title: "每日一言", content: "时间不等人，珍惜当下。", source: "Life Progress" }} />, {
      policy: "after",
      date: new Date(Date.now() + refreshAfter * 1000)
    });
  } catch (error) {
    console.error("小组件运行崩溃:", error);
    Widget.present(<ErrorView />);
  } finally {
    Script.exit();
  }
}

run();
