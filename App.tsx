import './global.css';
import 'react-native-url-polyfill/auto';
import { StatusBar } from 'expo-status-bar';
import { AuthGate } from '@/components/layout/AuthGate';

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <AuthGate />
    </>
  );
}
