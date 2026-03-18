import { 
  LiveActivity,
  LiveActivityUI, 
  LiveActivityUIExpandedLeading, 
  LiveActivityUIExpandedTrailing, 
  LiveActivityUIExpandedCenter, 
  LiveActivityUIExpandedBottom,
  VStack,
  HStack,
  Text,
  Image,
  Spacer,
  LiveActivityUIBuilder,
  Script,
  Link
} from "scripting";

export interface ParcelLiveActivityState {
  count: number;
  lastCourier: string;
  lastCode: string;
  lastAddress: string;
  lastIcon: string;
  lastColor: string;
}

const builder: LiveActivityUIBuilder<ParcelLiveActivityState> = (state) => {
  return (
    <LiveActivityUI
      compactLeading={
        <HStack alignment="center" spacing={6}>
          <Image systemName={state.lastIcon} foregroundStyle={state.lastColor as any} font={14} bold />
          <Text font={14} bold foregroundStyle={state.lastColor as any}>{state.count}</Text>
        </HStack>
      }
      compactTrailing={
        <Text font={14} bold foregroundStyle="systemBlue">{state.lastCode}</Text>
      }
      minimal={
        <VStack alignment="center">
           <Text font={12} bold foregroundStyle="systemBlue">{state.count}</Text>
        </VStack>
      }
      content={
        <Link url={Script.createRunURLScheme(Script.name)}>
          <VStack 
            padding={16} 
            spacing={8} 
            frame={{ maxWidth: "infinity", alignment: "leading" }}
            activityBackgroundTint={{ light: "rgba(255, 255, 255, 0.5)", dark: "rgba(0, 0, 0, 0.2)" }}
          >
            <HStack alignment="center" frame={{ maxWidth: "infinity" }}>
              <Image systemName={state.lastIcon} foregroundStyle={state.lastColor as any} font={18} />
              <Text font="headline" bold>{state.lastCourier}</Text>
              <Spacer />
              <Text font="subheadline" foregroundStyle="secondaryLabel">还有 {state.count} 件待取</Text>
            </HStack>
            <VStack alignment="center" spacing={2} frame={{ maxWidth: "infinity" }}>
              <Text font={32} bold>{state.lastCode}</Text>
              <Text font="caption" foregroundStyle="secondaryLabel" multilineTextAlignment="center">{state.lastAddress}</Text>
            </VStack>
          </VStack>
        </Link>
      }
    >
      <LiveActivityUIExpandedLeading>
              <VStack alignment="center" padding={{ leading: 12 }}>
                <Image systemName={state.lastIcon} foregroundStyle={state.lastColor as any} font={20} />
                <Text font={10} foregroundStyle="secondaryLabel">{state.lastCourier}</Text>
              </VStack>
            </LiveActivityUIExpandedLeading>

            <LiveActivityUIExpandedTrailing>
              <VStack alignment="center" padding={{ trailing: 12 }}>
                <Text font={24} bold foregroundStyle="systemBlue">{state.count}</Text>
                <Text font={10} foregroundStyle="secondaryLabel">待取件</Text>
              </VStack>
            </LiveActivityUIExpandedTrailing>

      <LiveActivityUIExpandedCenter>
        <Link url={Script.createRunURLScheme(Script.name)}>
          <VStack 
            alignment="center" 
            spacing={2} 
            padding={{ horizontal: 8 }}
            frame={{ maxWidth: "infinity" }}
          >
            <Text font={22} bold>{state.lastCode}</Text>
            <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={1} multilineTextAlignment="center">{state.lastAddress}</Text>
          </VStack>
        </Link>
      </LiveActivityUIExpandedCenter>

      <LiveActivityUIExpandedBottom>
        <Link url={Script.createRunURLScheme(Script.name)}>
          <HStack 
            padding={{ horizontal: 20, vertical: 8 }} 
            spacing={12}
          >
             <Text font="footnote" foregroundStyle="secondaryLabel">打开 App 查看详情</Text>
             <Spacer />
             <Image systemName="arrow.right.circle.fill" foregroundStyle="systemBlue" font={20} />
          </HStack>
        </Link>
      </LiveActivityUIExpandedBottom>
    </LiveActivityUI>
  );
}

export const ParcelLiveActivity = LiveActivity.register("ParcelActivity", builder);
