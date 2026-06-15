import React from 'react';
import { View } from 'react-native';

interface ProgressBarProps {
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
}

export const ProgressBar = React.memo(function ProgressBar({
  progress,
  color = '#111111',
  trackColor = '#E5E7EB',
  height = 4,
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View
      style={{
        height,
        backgroundColor: trackColor,
        borderRadius: height / 2,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height,
          width: `${clampedProgress * 100}%`,
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
});
