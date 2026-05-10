import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '@/types/navigation.types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateTo(
  name: keyof RootStackParamList,
  params?: RootStackParamList[keyof RootStackParamList],
): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
}
