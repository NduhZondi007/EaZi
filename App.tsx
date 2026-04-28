import './global.css';
import 'react-native-url-polyfill/auto';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthGate } from '@/components/layout/AuthGate';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthGate />
    </SafeAreaProvider>
  );
}
