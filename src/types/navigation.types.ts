import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
};

export type HomeStackParamList = {
  HomeMain: undefined;
  ServiceDetail: { serviceId: string };
  ProviderProfile: { providerId: string };
};

export type ClientTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Chat: undefined;
  Wallet: undefined;
  Profile: undefined;
};

export type ProviderTabParamList = {
  Dashboard: undefined;
  Services: undefined;
  Bookings: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type AdminTabParamList = {
  Dashboard: undefined;
  Users: undefined;
  Verification: undefined;
  Queries: undefined;
  Analytics: undefined;
};

export type RootStackParamList = {
  AuthStack: undefined;
  ClientTabs: undefined;
  ProviderTabs: undefined;
  AdminTabs: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  NativeStackScreenProps<HomeStackParamList, T>;

export type ClientTabScreenProps<T extends keyof ClientTabParamList> =
  BottomTabScreenProps<ClientTabParamList, T>;

export type ProviderTabScreenProps<T extends keyof ProviderTabParamList> =
  BottomTabScreenProps<ProviderTabParamList, T>;

export type AdminTabScreenProps<T extends keyof AdminTabParamList> =
  BottomTabScreenProps<AdminTabParamList, T>;
