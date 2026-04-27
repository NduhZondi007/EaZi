import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  isSecure?: boolean;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  isSecure = false,
  containerClassName = '',
  ...props
}: InputProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const borderClass = error
    ? 'border-2 border-[#DC2626]'
    : 'border border-[#D1D5DB] focus:border-2 focus:border-[#111111]';

  return (
    <View className={`w-full ${containerClassName}`}>
      {label ? (
        <Text className="text-sm font-medium text-[#374151] mb-1.5">{label}</Text>
      ) : null}

      <View className={`flex-row items-center bg-white rounded-lg px-3 h-12 ${borderClass}`}>
        <TextInput
          className="flex-1 text-sm text-[#111111]"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isSecure && !isRevealed}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        {isSecure && (
          <Pressable
            onPress={() => setIsRevealed((v) => !v)}
            accessibilityLabel={isRevealed ? 'Hide password' : 'Show password'}
            hitSlop={8}
          >
            {isRevealed ? (
              <EyeOff size={18} color="#9CA3AF" />
            ) : (
              <Eye size={18} color="#9CA3AF" />
            )}
          </Pressable>
        )}
      </View>

      {error ? (
        <Text className="text-xs text-[#DC2626] mt-1">{error}</Text>
      ) : null}
    </View>
  );
}
