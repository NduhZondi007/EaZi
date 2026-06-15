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

export type BookingsStackParamList = {
  BookingsList: undefined;
  BookingDetail: { bookingId: string };
  WebView: { url: string; title: string };
};

export type WalletStackParamList = {
  WalletMain: undefined;
  TransactionHistory: undefined;
  TopUp: undefined;
  SavedCards: undefined;
  Withdrawal: undefined;
  WebView: { url: string; title: string };
};

export type ClientTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Chat: undefined;
  Wallet: undefined;
  Profile: undefined;
};

export type ChatStackParamList = {
  ChatList: undefined;
  ChatRoom: { roomId: string; otherUserId: string; otherUserName: string };
};

export type ProviderServicesStackParamList = {
  MyServices: undefined;
  CreateService: undefined;
  EditService: { serviceId: string };
};

export type ProviderBookingsStackParamList = {
  ProviderBookingsList: undefined;
  ProviderBookingDetail: { bookingId: string };
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

export type AdminUsersStackParamList = {
  UserList: undefined;
  UserDetail: { userId: string };
};

export type AdminVerificationStackParamList = {
  VerificationQueue: undefined;
  VerificationDetail: { providerId: string };
};

export type AdminQueriesStackParamList = {
  QueriesList: undefined;
  QueryDetail: { queryId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Support: undefined;
  SupportDetail: { queryId: string };
};

export type RootStackParamList = {
  AuthStack: undefined;
  ClientTabs: undefined;
  ProviderTabs: undefined;
  AdminTabs: undefined;
  MainTabs: undefined;
  Notifications: undefined;
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

export type BookingsStackScreenProps<T extends keyof BookingsStackParamList> =
  NativeStackScreenProps<BookingsStackParamList, T>;

export type WalletStackScreenProps<T extends keyof WalletStackParamList> =
  NativeStackScreenProps<WalletStackParamList, T>;

export type ChatStackScreenProps<T extends keyof ChatStackParamList> =
  NativeStackScreenProps<ChatStackParamList, T>;

export type ProviderServicesStackScreenProps<T extends keyof ProviderServicesStackParamList> =
  NativeStackScreenProps<ProviderServicesStackParamList, T>;

export type ProviderBookingsStackScreenProps<T extends keyof ProviderBookingsStackParamList> =
  NativeStackScreenProps<ProviderBookingsStackParamList, T>;

export type AdminUsersStackScreenProps<T extends keyof AdminUsersStackParamList> =
  NativeStackScreenProps<AdminUsersStackParamList, T>;

export type AdminVerificationStackScreenProps<T extends keyof AdminVerificationStackParamList> =
  NativeStackScreenProps<AdminVerificationStackParamList, T>;

export type AdminQueriesStackScreenProps<T extends keyof AdminQueriesStackParamList> =
  NativeStackScreenProps<AdminQueriesStackParamList, T>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  NativeStackScreenProps<ProfileStackParamList, T>;
