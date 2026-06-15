import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { CheckCircle, Info, TriangleAlert, XCircle } from 'lucide-react-native';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

const VARIANT_STYLES: Record<
  ToastVariant,
  { bg: string; text: string; Icon: React.ComponentType<{ size: number; color: string }> }
> = {
  success: { bg: '#16A34A', text: '#FFFFFF', Icon: CheckCircle },
  error: { bg: '#DC2626', text: '#FFFFFF', Icon: XCircle },
  warning: { bg: '#F59E0B', text: '#FFFFFF', Icon: TriangleAlert },
  info: { bg: '#2563EB', text: '#FFFFFF', Icon: Info },
};

function ToastItem({
  message,
  variant,
  onHide,
}: {
  message: string;
  variant: ToastVariant;
  onHide: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const { bg, text, Icon } = VARIANT_STYLES[variant];

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2800),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(onHide);
  }, [opacity, onHide]);

  return (
    <Animated.View
      style={{
        opacity,
        backgroundColor: bg,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      }}
    >
      <Icon size={18} color={text} />
      <Text style={{ color: text, fontSize: 14, fontWeight: '500', flex: 1 }}>{message}</Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View
        style={{
          position: 'absolute',
          top: 60,
          left: 16,
          right: 16,
          zIndex: 9999,
        }}
        pointerEvents="none"
      >
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            message={t.message}
            variant={t.variant}
            onHide={() => remove(t.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
