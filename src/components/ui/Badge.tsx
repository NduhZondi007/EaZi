import React from 'react';
import { Text, View } from 'react-native';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  default: { container: 'bg-[#F3F4F6]', text: 'text-[#374151]' },
  success: { container: 'bg-[#DCFCE7]', text: 'text-[#16A34A]' },
  warning: { container: 'bg-[#FEF9C3]', text: 'text-[#F59E0B]' },
  error: { container: 'bg-[#FEE2E2]', text: 'text-[#DC2626]' },
  info: { container: 'bg-[#DBEAFE]', text: 'text-[#2563EB]' },
  outline: { container: 'bg-transparent border border-[#D1D5DB]', text: 'text-[#374151]' },
};

export const Badge = React.memo(function Badge({ label, variant = 'default' }: BadgeProps) {
  const styles = variantStyles[variant];
  return (
    <View className={`px-3 py-1 rounded-full self-start ${styles.container}`}>
      <Text className={`text-xs font-medium ${styles.text}`}>{label}</Text>
    </View>
  );
});
