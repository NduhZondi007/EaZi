import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProviderServicesStackParamList } from '@/types/navigation.types';
import { MyServicesScreen } from '@/screens/provider/MyServicesScreen';
import { CreateServiceScreen } from '@/screens/provider/CreateServiceScreen';
import { EditServiceScreen } from '@/screens/provider/EditServiceScreen';

const Stack = createNativeStackNavigator<ProviderServicesStackParamList>();

export function ProviderServicesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyServices" component={MyServicesScreen} />
      <Stack.Screen name="CreateService" component={CreateServiceScreen} />
      <Stack.Screen name="EditService" component={EditServiceScreen} />
    </Stack.Navigator>
  );
}
