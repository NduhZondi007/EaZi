import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center">
      <View className="items-center gap-4">
        <View className="w-16 h-16 rounded-2xl bg-[#111111] items-center justify-center mb-2">
          <Text className="text-white text-2xl font-bold">E</Text>
        </View>
        <ActivityIndicator size="large" color="#111111" />
        {message ? (
          <Text className="text-sm text-[#6B7280] text-center mt-1">{message}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
