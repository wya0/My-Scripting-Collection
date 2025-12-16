import { Script, Widget, VStack, HStack, ZStack, Text, ProgressView, Spacer, Image, Divider, Color, fetch } from "scripting";
import { ProgressData, QuoteData } from "./shared/types";
import { COLORS } from "./shared/constants";
import { 
  getStoredBirthday,
  getStoredSmallWidgetDisplay,
  getProgressData,
  getProgressItemByKey,
  getCachedQuoteData,
  cacheQuoteData,
  fetchQuoteWithTimeout as fetchQuote
} from "./shared/utils";

const REFRESH_INTERVAL = 30 * 60; // 30分钟

function getDateInfo() {
  const now = new Date();
  const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  return {
    shortDate: now.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    fullDate: now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
    weekDay: weekDays[now.getDay()],
    fullYear: now.getFullYear(),
    dayOfYear: dayOfYear
  };
}

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

async function fetchQuoteWithTimeout(retryCount: number = 3): Promise<QuoteData> {
  return await fetchQuote(retryCount);
}

async function getQuoteDataWithNetworkFirst(): Promise<QuoteData> {
  try {
    const quote = await fetchQuoteWithTimeout();
    cacheQuoteData(quote);
    
    return quote;
  } catch (error) {
    console.warn("网络请求一言数据失败，尝试使用缓存:", error);
    try {
      const cached = getCachedQuoteData();
      if (cached) {
        return cached;
      }
    } catch (cacheError) {
      console.error("获取缓存一言数据失败:", cacheError);
    }
    return {
      text: "时间不等人，珍惜当下。",
      from: "Life Progress"
    };
  }
}

function SmallWidgetView() {
  const birthday = getStoredBirthday();
  const displayKey = getStoredSmallWidgetDisplay();
  const item = getProgressItemByKey(displayKey, birthday) || getProgressData(birthday)[3]; 
  const dateInfo = getDateInfo();
  const remaining = 100 - (item.value * 100);

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
      <VStack padding={14} alignment="leading">
        <HStack spacing={4} alignment="center">
          <ZStack frame={{ width: 20, height: 20 }} background={{ style: "ultraThinMaterial", shape: { type: "rect", cornerRadius: 10 } }}>
            <Image systemName={item.icon} foregroundStyle={"white"} font={10} />
          </ZStack>
          <Spacer />
          <VStack alignment="trailing" spacing={0}>
             <Text foregroundStyle={"white"} font={11} fontWeight="bold" opacity={0.95}>
               {dateInfo.shortDate}
             </Text>
             <Text foregroundStyle={"white"} font={9} fontWeight="medium" opacity={0.8}>
               {dateInfo.weekDay}
             </Text>
             <Text foregroundStyle={"white"} font={9} fontWeight="medium" opacity={0.8}>
               第{dateInfo.dayOfYear}天
             </Text>
          </VStack>
        </HStack>
        <Spacer />
        <HStack alignment="lastTextBaseline" spacing={2}>
          <Text foregroundStyle={"white"} font={40} fontWeight="heavy" fontDesign="rounded">
            {(item.value * 100).toFixed(0)}
          </Text>
          <Text foregroundStyle={"white"} font={16} fontWeight="bold" padding={{ bottom: 6 }} opacity={0.8}>%</Text>
        </HStack>
        <Text foregroundStyle={"white"} font={10} opacity={0.7}>
          {item.label}剩余 {remaining.toFixed(0)}%
        </Text>
        <Spacer />
        <VStack spacing={0}>
            <ProgressView value={item.value} tint={"white"} background={"ultraThinMaterial"} frame={{ height: 6 }} />
        </VStack>
      </VStack>
    </ZStack>
  );
}

async function MediumWidgetView() {
  const data = getProgressData(getStoredBirthday());
  const dateInfo = getDateInfo();
  const quote = await getQuoteDataWithNetworkFirst();
  const displayItems = [data[0], data[2], data[3]]; // Day, Month, Year

  return (
    <VStack padding={14} spacing={8} background={"systemBackground"} frame={{ maxWidth: Infinity, maxHeight: Infinity }}>
      <HStack>
        <Text font={14} fontWeight="bold" foregroundStyle={"red"}>
          {dateInfo.fullDate}
        </Text>
        <Spacer />
        <Text font={12} foregroundStyle={"secondaryLabel"}>
          {dateInfo.weekDay} · 第{dateInfo.dayOfYear}天
        </Text>
      </HStack>
      <Divider /> 
      <HStack spacing={12} alignment="center" frame={{ maxHeight: Infinity }}>
        <VStack spacing={6} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
           {displayItems.map((item) => (
             <VStack key={item.key} spacing={2}>
               <HStack>
                 <Image systemName={item.icon} font={9} foregroundStyle={item.color as any} />
                 <Text font={10} fontWeight="medium" foregroundStyle={"secondaryLabel"}>{item.label}</Text>
                 <Spacer />
                 <Text font={10} fontWeight="bold" fontDesign="monospaced" foregroundStyle={item.color as any}>
                   {(item.value * 100).toFixed(0)}%
                 </Text>
               </HStack>
               <ProgressView value={item.value} tint={item.color as any} />
             </VStack>
           ))}
        </VStack>
        <VStack 
          frame={{ maxWidth: "infinity", maxHeight: "infinity" }} 
          padding={8}
          alignment="center"
        >
          <Spacer />
          <Image systemName="quote.bubble" font={14} foregroundStyle={"tertiaryLabel"} padding={{ bottom: 2 }} />
          <Text font={11} fontWeight="medium" fontDesign="serif" multilineTextAlignment="center" lineLimit={3} foregroundStyle={"label"}>
            {quote.text}
          </Text>
          <Spacer />
          <Text font={10} fontWeight="medium" fontDesign="serif" multilineTextAlignment="center" lineLimit={1} foregroundStyle={"secondaryLabel"}>
            —— {quote.from}
          </Text>
        </VStack>

      </HStack>
    </VStack>
  );
}
async function LargeWidgetView() {
  const data = getProgressData(getStoredBirthday());
  const dateInfo = getDateInfo();
  const quote = await getQuoteDataWithNetworkFirst();

  return (
    <VStack frame={{ maxWidth: Infinity, maxHeight: Infinity }} padding={14} spacing={6} background={"systemBackground"}>
      <HStack padding={{ bottom: 20 }}>
        <Text font={18} fontWeight="bold" foregroundStyle={"label"}>时光流逝</Text>
        <Spacer />
        <Image systemName="hourglass" foregroundStyle={"red"} font={16} />
      </HStack>
      <VStack spacing={8} frame={{ maxHeight: Infinity }}>
        {data.map((item) => (
          <HStack key={item.key} spacing={8}>
            <ZStack frame={{ width: 22, height: 22 }} background={{ style: "secondarySystemFill", shape: { type: "rect", cornerRadius: 11 } }}>
                <Image systemName={item.icon} foregroundStyle={item.color as any} font={10} />
            </ZStack>
            <Text font={13} fontWeight="medium" foregroundStyle={"secondaryLabel"} frame={{ width: 35 }}>{item.label}</Text>
            <ProgressView value={item.value} tint={item.color as any} />
            <Text font={13} fontWeight="bold" fontDesign="monospaced" foregroundStyle={"label"} frame={{ width: 45 }} multilineTextAlignment="trailing">
              {(item.value * 100).toFixed(1)}%
            </Text>
          </HStack>
        ))}
      </VStack>
      <VStack frame={{ height: 6 }} /> 
      
      <HStack 
        padding={{ vertical: 6, horizontal: 10 }} 
        background={{ style: "secondarySystemGroupedBackground", shape: { type: "rect", cornerRadius: 8 } }}
      >
        <HStack spacing={6}>
            <Image systemName="calendar" font={12} foregroundStyle={"blue"} />
            <Text font={13} fontWeight="bold" foregroundStyle={"label"}>{dateInfo.shortDate}</Text>
        </HStack>
        <Spacer />
        <Text font={11} foregroundStyle={"secondaryLabel"}>
           {dateInfo.weekDay} · 第{dateInfo.dayOfYear}天
        </Text>
      </HStack>
      
      <ZStack 
        padding={8} 
        frame={{ maxHeight: Infinity }}
      >
        <VStack spacing={2} alignment="leading">
          <Image systemName="quote.bubble" font={14} foregroundStyle={"tertiaryLabel"} padding={{ bottom: 2 }} />
          <Text font={12} fontWeight="regular" fontDesign="serif" lineLimit={3} foregroundStyle={"label"}>
            "{quote.text}"
          </Text>
          <HStack>
            <Spacer />
            <Text font={10} foregroundStyle={"secondaryLabel"}>—— {quote.from}</Text>
          </HStack>
        </VStack>
      </ZStack>
    </VStack>
  );
}

function WidgetView() {
  const family = Widget.family;
  if (family === "systemSmall") {
    return SmallWidgetView();
  } else if (family === "systemMedium") {
    return MediumWidgetView();
  } else if (family === "systemLarge") {
    return LargeWidgetView();
  } else {
    return <VStack><Text>未适配</Text></VStack>;
  }
}

async function main() {
  try {
    const view = await WidgetView();
    Widget.present(view, {
      policy: "after",
      date: new Date(Date.now() + REFRESH_INTERVAL * 1000)
    });
  } catch (error) {
    console.error("Widget主进程错误:", error);
    Widget.present(<ErrorView />, {
      policy: "after",
      date: new Date(Date.now() + REFRESH_INTERVAL * 1000)
    });
  } finally {
    Script.exit();
  }
}

main();