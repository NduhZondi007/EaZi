import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ExternalLink, RefreshCw } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

type WebViewNavEvent = { url: string };

let WebView: React.ComponentType<{
  source: { uri: string };
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (e: { nativeEvent: { description: string } }) => void;
  onNavigationStateChange?: (e: WebViewNavEvent) => void;
  startInLoadingState?: boolean;
  style?: object;
  ref?: React.RefObject<{ reload: () => void }>;
}> | null = null;

if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

interface WebViewScreenProps {
  navigation: { goBack: () => void };
  route: { params: { url: string; title: string } };
}

export function WebViewScreen({ navigation, route }: WebViewScreenProps) {
  const { url, title } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef<{ reload: () => void }>(null);

  const handleReload = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  }, []);

  const openInBrowser = useCallback(() => {
    Linking.openURL(url).catch(() => null);
  }, [url]);

  const handleNavigationStateChange = useCallback(
    (e: WebViewNavEvent) => {
      // Yoco redirects to these URLs after payment completes or is cancelled
      if (
        e.url.includes('eazi.app/payment/success') ||
        e.url.includes('eazi.app/payment/cancel')
      ) {
        navigation.goBack();
      }
    },
    [navigation],
  );

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
          <Pressable onPress={() => navigation.goBack()} hitSlop={8} className="mr-3">
            <ChevronLeft size={22} color={Colors.primary} />
          </Pressable>
          <Text className="flex-1 text-base font-semibold text-gray-900" numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View className="flex-1 items-center justify-center px-8 gap-4">
          <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
            <ExternalLink size={28} color={Colors.primary} />
          </View>
          <Text className="text-lg font-semibold text-gray-900 text-center">{title}</Text>
          <Text className="text-sm text-gray-500 text-center leading-5">
            This will open in your browser to complete the payment securely.
          </Text>
          <Pressable
            onPress={openInBrowser}
            className="bg-[#111111] rounded-xl px-8 h-12 items-center justify-center"
          >
            <Text className="text-white font-semibold">Open in Browser</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} className="mr-3">
          <ChevronLeft size={22} color={Colors.primary} />
        </Pressable>
        <Text className="flex-1 text-base font-semibold text-gray-900" numberOfLines={1}>
          {title}
        </Text>
        <Pressable onPress={openInBrowser} hitSlop={8} className="ml-3">
          <ExternalLink size={18} color={Colors.gray500} />
        </Pressable>
      </View>

      {/* Loading overlay */}
      {isLoading && !hasError && (
        <View className="absolute inset-0 top-16 items-center justify-center bg-white z-10">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="text-sm text-gray-400 mt-3">Loading payment page…</Text>
        </View>
      )}

      {/* Error state */}
      {hasError ? (
        <View className="flex-1 items-center justify-center px-8 gap-4">
          <Text className="text-lg font-semibold text-gray-900 text-center">
            Failed to load
          </Text>
          <Text className="text-sm text-gray-500 text-center leading-5">
            Could not load the payment page. Check your connection and try again.
          </Text>
          <View className="flex-row gap-3 mt-2">
            <Pressable
              onPress={handleReload}
              className="flex-row items-center gap-2 bg-gray-100 rounded-xl px-5 h-11"
            >
              <RefreshCw size={16} color={Colors.primary} />
              <Text className="text-sm font-semibold text-gray-900">Retry</Text>
            </Pressable>
            <Pressable
              onPress={openInBrowser}
              className="flex-row items-center gap-2 bg-[#111111] rounded-xl px-5 h-11"
            >
              <ExternalLink size={16} color="white" />
              <Text className="text-sm font-semibold text-white">Browser</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        WebView && (
          <WebView
            ref={webViewRef as React.RefObject<{ reload: () => void }>}
            source={{ uri: url }}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            onNavigationStateChange={handleNavigationStateChange}
            startInLoadingState={false}
            style={{ flex: 1 }}
          />
        )
      )}
    </SafeAreaView>
  );
}
