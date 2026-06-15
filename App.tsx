import './global.css';
import 'react-native-url-polyfill/auto';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthGate } from '@/components/layout/AuthGate';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { ToastProvider } from '@/components/ui/Toast';

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <AuthGate />
          <OfflineBanner />
        </ToastProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
