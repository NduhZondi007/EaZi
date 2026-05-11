import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VerificationQueueScreen } from '@/screens/admin/VerificationQueueScreen';
import { VerificationDetailScreen } from '@/screens/admin/VerificationDetailScreen';
import type { AdminVerificationStackParamList } from '@/types/navigation.types';

const Stack = createNativeStackNavigator<AdminVerificationStackParamList>();

export function AdminVerificationStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VerificationQueue" component={VerificationQueueScreen} />
      <Stack.Screen name="VerificationDetail" component={VerificationDetailScreen} />
    </Stack.Navigator>
  );
}
