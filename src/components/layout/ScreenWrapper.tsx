import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenWrapperProps {
  children: ReactNode;
  scrollable?: boolean;
  avoidKeyboard?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  className?: string;
  contentClassName?: string;
}

export function ScreenWrapper({
  children,
  scrollable = false,
  avoidKeyboard = false,
  edges = ['top', 'bottom', 'left', 'right'],
  className = '',
  contentClassName = '',
}: ScreenWrapperProps) {
  const content = scrollable ? (
    <ScrollView
      className={`flex-1 ${contentClassName}`}
      contentContainerClassName="flex-grow"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 ${contentClassName}`}>{children}</View>
  );

  const wrapped = avoidKeyboard ? (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView
      className={`flex-1 bg-white ${className}`}
      edges={edges}
    >
      {wrapped}
    </SafeAreaView>
  );
}
