import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      {icon ? (
        <View className="w-20 h-20 rounded-full bg-[#F3F4F6] items-center justify-center mb-6">
          {icon}
        </View>
      ) : null}

      <Text className="text-xl font-semibold text-[#111111] text-center mb-2">
        {title}
      </Text>

      {subtitle ? (
        <Text className="text-sm text-[#6B7280] text-center leading-5 mb-6">
          {subtitle}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <View className="w-full max-w-[240px]">
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
