import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from '@/types/navigation.types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['eazi://', 'https://eazi.co.za'],
  config: {
    screens: {
      AuthStack: {
        screens: {
          Welcome: 'welcome',
          Login: 'login',
          SignUp: 'signup',
          ForgotPassword: 'forgot-password',
          ResetPassword: 'reset-password',
        },
      },
      ClientTabs: {
        screens: {
          Home: 'home',
          Bookings: 'bookings',
          Chat: 'chat',
          Wallet: 'wallet',
          Profile: 'profile',
        },
      },
      ProviderTabs: {
        screens: {
          Dashboard: 'dashboard',
          Services: 'services',
          Bookings: 'provider-bookings',
          Chat: 'provider-chat',
          Profile: 'provider-profile',
        },
      },
      AdminTabs: {
        screens: {
          Dashboard: 'admin',
          Users: 'admin/users',
          Verification: 'admin/verification',
          Queries: 'admin/queries',
          Analytics: 'admin/analytics',
        },
      },
      Notifications: 'notifications',
    },
  },
};
