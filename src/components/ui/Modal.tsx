import React from 'react';
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  scrollable?: boolean;
}

export function Modal({ visible, onClose, title, children, scrollable = false }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close modal"
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-t-2xl"
          >
            <View className="flex-row items-center justify-between px-5 pt-5 pb-4 border-b border-[#E5E7EB]">
              {title ? (
                <Text className="text-base font-semibold text-[#111111]">{title}</Text>
              ) : (
                <View />
              )}
              <Pressable
                onPress={onClose}
                className="w-8 h-8 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>

            {scrollable ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 20 }}
              >
                {children}
              </ScrollView>
            ) : (
              <View className="p-5">{children}</View>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </RNModal>
  );
}
