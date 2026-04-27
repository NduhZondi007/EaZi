import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: ReactNode;
  subtitle?: string;
}

export function Header({
  title,
  showBack = false,
  onBack,
  rightElement,
  subtitle,
}: HeaderProps) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View className="flex-row items-center px-4 py-3 bg-white border-b border-[#E5E7EB] min-h-[56px]">
      {showBack ? (
        <Pressable
          onPress={handleBack}
          className="p-1 -ml-1 mr-2"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <ChevronLeft size={24} color="#111111" />
        </Pressable>
      ) : (
        <View className="w-8 mr-2" />
      )}

      <View className="flex-1">
        <Text className="text-base font-semibold text-[#111111]" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-xs text-[#6B7280] mt-0.5" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View className="w-8 items-end">
        {rightElement ?? null}
      </View>
    </View>
  );
}
