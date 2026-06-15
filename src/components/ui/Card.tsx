import React from 'react';
import { Pressable, View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

export const Card = React.memo(function Card({ children, onPress, className = '' }: CardProps) {
  const baseClass = `bg-white border border-[#E5E7EB] rounded-xl p-4 ${className}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={baseClass}
        accessibilityRole="button"
        style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}
      >
        {children}
      </Pressable>
    );
  }

  return <View className={baseClass}>{children}</View>;
});
