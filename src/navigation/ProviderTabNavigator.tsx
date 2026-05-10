import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Briefcase,
  Calendar,
  LayoutDashboard,
  MessageSquare,
  User,
} from 'lucide-react-native';
import { ProviderDashboardScreen } from '@/screens/provider/ProviderDashboardScreen';
import { ProviderServicesStack } from './ProviderServicesStack';
import { ProviderBookingsStack } from './ProviderBookingsStack';
import { ChatStack } from './ChatStack';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import type { ProviderTabParamList } from '@/types/navigation.types';

const Tab = createBottomTabNavigator<ProviderTabParamList>();

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

export function ProviderTabNavigator() {
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
        component={ProviderDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => tabIcon(LayoutDashboard, focused),
        }}
      />
      <Tab.Screen
        name="Services"
        component={ProviderServicesStack}
        options={{
          tabBarLabel: 'Services',
          tabBarIcon: ({ focused }) => tabIcon(Briefcase, focused),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={ProviderBookingsStack}
        options={{
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ focused }) => tabIcon(Calendar, focused),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatStack}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ focused }) => tabIcon(MessageSquare, focused),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => tabIcon(User, focused),
        }}
      />
    </Tab.Navigator>
  );
}
