import './global.css';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold" style={{ color: '#111111' }}>EaZi Platform</Text>
      <StatusBar style="auto" />
    </View>
  );
}
