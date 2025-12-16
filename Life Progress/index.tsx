import { 
  NavigationStack, VStack, HStack, ZStack, Text, ProgressView, Image, Spacer, 
  useState, useEffect, DatePicker, useObservable, Widget, Navigation, Script, Divider,
  List, Section
} from "scripting";
import { QuoteData, WidgetDisplayOption, ProgressData } from "./shared/types";
import { 
  WIDGET_FAMILIES,
  ERROR_MESSAGES,
  COLORS
} from "./shared/constants";
import { 
  getStoredBirthday,
  setStoredBirthday, 
  getStoredSmallWidgetDisplay,
  setStoredSmallWidgetDisplay,
  fetchQuoteWithTimeout,
  formatPercentage,
  getProgressData,
  getWidgetDisplayOptions
} from "./shared/utils";
// 通用卡片容器
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

function QuoteCard() {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchQuoteWithTimeout()
      .then(setQuote)
      .catch(() => setQuote({ text: "时间不等人，珍惜当下。", from: "Life Progress" }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <VStack 
      padding={16}
      background={{
        gradient: [
          { color: "#43cea2", location: 0 },
          { color: "#185a9d", location: 1 }
        ] as any,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 }
      }}
      alignment="leading" 
      spacing={10}
      clipShape={{ type: "rect", cornerRadius: 12 }}
    >
      <HStack>
        <Image systemName="quote.bubble.fill" foregroundStyle={"white"} font={20} />
        <Spacer />
      </HStack>
      <Text foregroundStyle={"white"} font={16} fontWeight="bold" fontDesign="serif" lineLimit={4}>
        {loading ? "正在加载每日一言..." : `"${quote?.text}"`}
      </Text>
      {!loading && (
        <HStack>
          <Spacer />
          <Text foregroundStyle={"white"} font={12} fontWeight="medium">
            —— {quote?.from}
          </Text>
        </HStack>
      )}
    </VStack>
  );
}
const SettingRow = ({ icon, title, children }: { icon: string, title: string, children: any }) => (
  <HStack padding={{ vertical: 2 }}>
    <ZStack padding={6} background={{
      style: "systemGray5",
      shape: { type: "rect", cornerRadius: 6 }
    }}>
      <Image systemName={icon} font={12} foregroundStyle={"label"} />
    </ZStack>
    <Text font={14}>{title}</Text>
    <Spacer />
    {children}
  </HStack>
);
function MainView() {
  const birthday = getStoredBirthday();
  const birthdayObs = useObservable(birthday || new Date("2000-01-01"));
  const [smallWidgetDisplay, setSmallWidgetDisplayState] = useState(getStoredSmallWidgetDisplay());
  const now = new Date();

  useEffect(() => {
    setStoredBirthday(birthdayObs.value);
    Widget.reloadAll();
  }, [birthdayObs.value]);

  useEffect(() => {
    setStoredSmallWidgetDisplay(smallWidgetDisplay);
    Widget.reloadAll();
  }, [smallWidgetDisplay]);

  const items = getProgressData(birthdayObs.value);
  const widgetOptions = getWidgetDisplayOptions();

  return (
    <NavigationStack>
      <VStack 
        background={"systemGroupedBackground"} 
        spacing={12}
        padding={{ bottom: 20 }}
        frame={{ maxWidth: Infinity, maxHeight: Infinity }}
      >
        <VStack spacing={2} padding={{ top: 10, horizontal: 16 }}>
          <Text font={12} fontWeight="semibold" foregroundStyle={"secondaryLabel"}>
            {`${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`}
          </Text>
          <Text font={28} fontWeight="bold">时光进度</Text>
        </VStack>

        <VStack padding={{ horizontal: 16 }}>
          <QuoteCard />
        </VStack>

        <VStack spacing={12} padding={{ horizontal: 16 }}>
          <Text font={18} fontWeight="bold">设置</Text>
          <Card>
            <VStack spacing={6}>
              <SettingRow icon="gift.fill" title="出生日期">
                <DatePicker 
                  value={birthdayObs}
                  displayedComponents={["date"]}
                  title=""
                />
              </SettingRow>
              
              <Divider />
              
              <VStack spacing={8}>
                <SettingRow icon="rectangle.3.group.fill" title="小组件显示" children={null} />
                <VStack spacing={6} padding={{ horizontal: 12, vertical: 6 }}>
                  {widgetOptions.map((option) => (
                    <HStack
                      key={option.value}
                      padding={{ vertical: 10, horizontal: 14 }}
                      background={{
                        style: smallWidgetDisplay === option.value ? "systemBlue" : "secondarySystemGroupedBackground",
                        shape: { type: "rect", cornerRadius: 10 }
                      }}
                      onTapGesture={() => {
                        setSmallWidgetDisplayState(option.value);
                      }}
                    >
                      <Text 
                        font={15} 
                        foregroundStyle={smallWidgetDisplay === option.value ? "white" : "label"}
                      >
                        {option.label}
                      </Text>
                      {smallWidgetDisplay === option.value ? (
                        <>
                          <Spacer />
                          <Image systemName="checkmark" foregroundStyle={"white"} font={14} />
                        </>
                      ) : null}
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </VStack>
          </Card>
          <Text font={11} foregroundStyle={"secondaryLabel"} multilineTextAlignment="center">
            Life Progress Pro v1.0.0
          </Text>
        </VStack>
      </VStack>
    </NavigationStack>
  );
}

async function run() {
  await Navigation.present(<MainView />);
  Script.exit();
}

run();