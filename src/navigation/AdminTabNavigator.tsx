import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  BarChart2,
  HelpCircle,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from 'lucide-react-native';
import { AdminDashboardScreen } from '@/screens/admin/AdminDashboardScreen';
import { UserListScreen } from '@/screens/admin/UserListScreen';
import { VerificationQueueScreen } from '@/screens/admin/VerificationQueueScreen';
import { QueriesListScreen } from '@/screens/admin/QueriesListScreen';
import { AnalyticsScreen } from '@/screens/admin/AnalyticsScreen';
import type { AdminTabParamList } from '@/types/navigation.types';

const Tab = createBottomTabNavigator<AdminTabParamList>();

const ACTIVE_COLOR = '#111111';
const INACTIVE_COLOR = '#6B7280';
const TAB_HEIGHT = 60;

function tabIcon(
  IconComponent: (props: { size: number; color: string }) => ReactNode,
  focused: boolean,
) {
  return (
    <View className="items-center justify-center">
      <IconComponent size={22} color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} />
    </View>
  );
}

export function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#D1D5DB',
          height: TAB_HEIGHT + (Platform.OS === 'ios' ? 20 : 0),
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => tabIcon(LayoutDashboard, focused),
        }}
      />
      <Tab.Screen
        name="Users"
        component={UserListScreen}
        options={{
          tabBarLabel: 'Users',
          tabBarIcon: ({ focused }) => tabIcon(Users, focused),
        }}
      />
      <Tab.Screen
        name="Verification"
        component={VerificationQueueScreen}
        options={{
          tabBarLabel: 'Verify',
          tabBarIcon: ({ focused }) => tabIcon(ShieldCheck, focused),
        }}
      />
      <Tab.Screen
        name="Queries"
        component={QueriesListScreen}
        options={{
          tabBarLabel: 'Queries',
          tabBarIcon: ({ focused }) => tabIcon(HelpCircle, focused),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ focused }) => tabIcon(BarChart2, focused),
        }}
      />
    </Tab.Navigator>
  );
}
