import { ActivityIndicator, Pressable, Text } from 'react-native';
import type { PressableProps } from 'react-native';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  isLoading = false,
  fullWidth = true,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  const containerClass = [
    'h-12 rounded-xl items-center justify-center flex-row',
    fullWidth ? 'w-full' : 'px-6',
    variant === 'primary' && 'bg-[#111111]',
    variant === 'secondary' && 'bg-transparent border-2 border-[#111111]',
    variant === 'ghost' && 'bg-transparent',
    isDisabled && 'opacity-50',
  ]
    .filter(Boolean)
    .join(' ');

  const textClass = [
    'text-sm font-semibold',
    variant === 'primary' && 'text-white',
    variant === 'secondary' && 'text-[#111111]',
    variant === 'ghost' && 'text-[#111111]',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Pressable
      className={containerClass}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : '#111111'}
        />
      ) : (
        <Text className={textClass}>{label}</Text>
      )}
    </Pressable>
  );
}
