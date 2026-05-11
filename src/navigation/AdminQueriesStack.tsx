import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueriesListScreen } from '@/screens/admin/QueriesListScreen';
import { QueryDetailScreen } from '@/screens/admin/QueryDetailScreen';
import type { AdminQueriesStackParamList } from '@/types/navigation.types';

const Stack = createNativeStackNavigator<AdminQueriesStackParamList>();

export function AdminQueriesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="QueriesList" component={QueriesListScreen} />
      <Stack.Screen name="QueryDetail" component={QueryDetailScreen} />
    </Stack.Navigator>
  );
}
