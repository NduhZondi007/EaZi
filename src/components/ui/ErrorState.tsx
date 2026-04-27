import { Text, View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-20 h-20 rounded-full bg-red-50 items-center justify-center mb-6">
        <AlertCircle size={40} color="#DC2626" />
      </View>

      <Text className="text-xl font-semibold text-[#111111] text-center mb-2">
        {title}
      </Text>

      <Text className="text-sm text-[#6B7280] text-center leading-5 mb-6">
        {message}
      </Text>

      {onRetry ? (
        <View className="w-full max-w-[240px]">
          <Button label={retryLabel} onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}
