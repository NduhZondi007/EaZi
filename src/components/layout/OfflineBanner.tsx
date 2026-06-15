import { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const BANNER_HEIGHT = 40;

export function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  const translateY = useRef(new Animated.Value(-BANNER_HEIGHT)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isConnected ? -BANNER_HEIGHT : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [isConnected, translateY]);

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateY }],
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          height: BANNER_HEIGHT,
          backgroundColor: '#DC2626',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 16,
        },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityLabel="You are offline"
    >
      <WifiOff size={15} color="#FFFFFF" />
      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
        No internet connection
      </Text>
    </Animated.View>
  );
}
