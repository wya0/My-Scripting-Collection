import { Widget, VStack, HStack, ZStack, Text, Spacer, Button, Image, Script } from "scripting";
import { ParcelManager } from "./logic";
import { SwitchWidgetAddressIntent, BatchCollectByAddressIntent } from "./app_intents";
import { SHARED_STORAGE, Parcel } from "./model";
declare const Storage: any;

const BRAND_MAP: Record<string, { color: string; icon: string }> = {
  "菜鸟驿站": { color: "#0081FF", icon: "house.fill" },
  "丰巢": { color: "#FF8000", icon: "archivebox.fill" },
  "顺丰": { color: "label", icon: "bolt.fill" },
  "京东": { color: "#E1251B", icon: "shippingbox.fill" },
  "其他": { color: "secondaryLabel", icon: "shippingbox.fill" }
};


function ParcelWidget() {
  const groupedData = ParcelManager.getGroupedPending();
  const family = Widget.family;

  if (groupedData.length === 0) {
    return (
      <VStack alignment="center" spacing={12} padding={20}>
        <Image systemName="shippingbox.and.arrow.backward" font={32} foregroundStyle="secondaryLabel" opacity={0.5} />
        <Text foregroundStyle="secondaryLabel" font="subheadline" bold>暂无待取包裹</Text>
      </VStack>
    );
  }

  if (family === "systemSmall") {
    const storedValue = Storage.get("widget_addr_idx", SHARED_STORAGE);
    let currentIndex = 0;
    
    if (storedValue !== null && storedValue !== undefined) {
      currentIndex = parseInt(String(storedValue), 10);
      if (isNaN(currentIndex)) currentIndex = 0;
    }
    
    const safeIndex = currentIndex % (groupedData.length || 1);
    const group = groupedData[safeIndex] || { address: "暂无包裹", parcels: [], courier: "其他" };
    const { address, parcels, courier } = group;
    const brand = BRAND_MAP[courier] || BRAND_MAP["其他"];

    const content = (
      <VStack 
        alignment="leading" 
        spacing={6} 
        padding={12} 
        frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      >
        <HStack spacing={4}>
          <Image systemName={brand.icon} foregroundStyle={brand.color as any} font={10} bold />
          <Text font={10} bold foregroundStyle={brand.color as any} lineLimit={1}>{courier}</Text>
          <Spacer />
          {groupedData.length > 0 && (
            <Text font={9} foregroundStyle="tertiaryLabel">{safeIndex + 1}/{groupedData.length}</Text>
          )}
        </HStack>
        
        <Text font={13} bold foregroundStyle="label" lineLimit={2} frame={{ height: 32 }}>{address}</Text>
        
        <VStack spacing={4} alignment="leading" frame={{ maxWidth: Infinity }}>
          <HStack spacing={4}>
            {parcels.slice(0, 2).map(p => (
               <Text key={p.id} font={12} bold padding={{ horizontal: 4, vertical: 3 }} 
                     background={{ style: "tertiarySystemBackground", shape: { type: "rect", cornerRadius: 6 } }}
                     shadow={{ color: "#00000005", radius: 2 }}
                     lineLimit={1}
                     minScaleFactor={0.8}
                     allowsTightening
               >
                 {p.code}
               </Text>
            ))}
          </HStack>
          {parcels.length > 2 && (
            <HStack spacing={4}>
              {parcels.slice(2, 4).map(p => (
                <Text key={p.id} font={12} bold padding={{ horizontal: 4, vertical: 3 }} 
                      background={{ style: "tertiarySystemBackground", shape: { type: "rect", cornerRadius: 6 } }}
                      shadow={{ color: "#00000005", radius: 2 }}
                      lineLimit={1}
                      minScaleFactor={0.8}
                      allowsTightening
                >
                  {p.code}
                </Text>
              ))}
            </HStack>
          )}
        </VStack>
        
        <Spacer />
        
        <HStack alignment="bottom">
          <VStack alignment="leading" spacing={0}>
            {parcels.length > 4 && (
              <Text font={10} bold foregroundStyle="systemOrange" padding={{ bottom: 2 }}>
                还有 {parcels.length - 4} 个包裹...
              </Text>
            )}
            <Text font={9} foregroundStyle="secondaryLabel" opacity={0.8}>
              {groupedData.length > 1 ? "点击切换地址" : "点击查看详情"}
            </Text>
          </VStack>
          <Spacer />
          <Spacer frame={{ width: 24 }} />
        </HStack>
      </VStack>
    );

    return (
      <ZStack background="secondarySystemBackground" alignment="bottomTrailing" frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
        {groupedData.length > 1 ? (
          <Button 
            intent={SwitchWidgetAddressIntent(undefined as any)} 
            buttonStyle="plain"
            frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
          >
            {content}
          </Button>
        ) : (
          content
        )}

        {groupedData.length > 0 && (
          <Button 
            title="" systemImage="checkmark.seal.fill"
            intent={BatchCollectByAddressIntent({ address: address })}
            foregroundStyle={brand.color as any} font={22}
            buttonStyle="plain"
            frame={{ width: 44, height: 44 }}
            offset={{ x: -2, y: -2 }}
          />
        )}
      </ZStack>
    );
  }

  const displayCount = family === "systemMedium" ? 2 : 5;
  const itemSpacing = family === "systemMedium" ? 6 : 10;
  
  return (
    <VStack 
      alignment="leading" 
      spacing={8} 
      padding={12} 
      background="secondarySystemBackground"
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
    >
      <HStack>
        <Text font="headline" bold foregroundStyle="label" lineLimit={1}>待取件 ({ParcelManager.getPending().length})</Text>
        <Spacer />
        <Image systemName="shippingbox.circle.fill" foregroundStyle="systemOrange" font={18} />
      </HStack>

      <VStack spacing={itemSpacing}>
        {groupedData.slice(0, displayCount).map((group) => {
          const { address, parcels, courier } = group;
          const brand = BRAND_MAP[courier] || BRAND_MAP["其他"];
          return (
            <HStack key={address} padding={10} background={{ style: "tertiarySystemBackground", shape: { type: "rect", cornerRadius: 12 } }} shadow={{ color: "#00000005", radius: 3 }}>
              <VStack alignment="leading" spacing={2}>
                <HStack spacing={4}>
                  <Image systemName={brand.icon} foregroundStyle={brand.color as any} font={8} />
                  <Text font={9} bold foregroundStyle="secondaryLabel" lineLimit={1}>{address}</Text>
                </HStack>
                <HStack spacing={6}>
                  {parcels.slice(0, 3).map(p => (
                    <Text key={p.id} font={13} bold foregroundStyle="label" lineLimit={1} minScaleFactor={0.9} allowsTightening>{p.code}</Text>
                  ))}
                  {parcels.length > 3 && <Text font={9} foregroundStyle="tertiaryLabel">+{parcels.length - 3}</Text>}
                </HStack>
              </VStack>
              <Spacer />
              <Button
                title="" systemImage="checkmark.seal.fill"
                intent={BatchCollectByAddressIntent({ address: address })}
                foregroundStyle={brand.color as any} font={20}
                buttonStyle="plain"
                frame={{ width: 32, height: 32 }}
              />
            </HStack>
          );
        })}
      </VStack>
      
      {groupedData.length > displayCount ? (
        <Text font={10} foregroundStyle="tertiaryLabel" frame={{ maxWidth: "infinity", alignment: "center" }} padding={{ top: 4 }}>
          余下 {groupedData.length - displayCount} 个地址包裹...
        </Text>
      ) : (
        <Spacer />
      )}
    </VStack>

  );
}

Widget.present(<ParcelWidget />);
Script.exit();