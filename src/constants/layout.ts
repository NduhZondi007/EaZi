import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

export const TAB_BAR_HEIGHT = 60 + (Platform.OS === 'ios' ? 20 : 0);
export const HEADER_HEIGHT = 56;
export const BOTTOM_SAFE_AREA = Platform.OS === 'ios' ? 34 : 0;

export const CARD_PADDING = SPACING.base;
export const SCREEN_PADDING = SPACING.base;
