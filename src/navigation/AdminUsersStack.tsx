import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserListScreen } from '@/screens/admin/UserListScreen';
import { UserDetailScreen } from '@/screens/admin/UserDetailScreen';
import type { AdminUsersStackParamList } from '@/types/navigation.types';

const Stack = createNativeStackNavigator<AdminUsersStackParamList>();

export function AdminUsersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserList" component={UserListScreen} />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} />
    </Stack.Navigator>
  );
}
