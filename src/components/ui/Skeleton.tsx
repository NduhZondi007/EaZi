import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export const Skeleton = React.memo(function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#E5E7EB',
        opacity,
      }}
    />
  );
});

export function SkeletonCard() {
  return (
    <View className="bg-white border border-[#E5E7EB] rounded-xl p-4 mb-3">
      <Skeleton height={140} borderRadius={8} />
      <View className="mt-3 gap-2">
        <Skeleton height={14} width="70%" />
        <Skeleton height={12} width="50%" />
        <Skeleton height={12} width="40%" />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}

export function SkeletonBookingCard() {
  return (
    <View className="bg-white border border-[#E5E7EB] rounded-xl p-4 mb-3 mx-4">
      <View className="flex-row items-center gap-3 mb-3">
        <Skeleton width={44} height={44} borderRadius={22} />
        <View className="flex-1 gap-2">
          <Skeleton height={14} width="60%" />
          <Skeleton height={12} width="40%" />
        </View>
        <Skeleton width={72} height={24} borderRadius={12} />
      </View>
      <Skeleton height={1} borderRadius={0} />
      <View className="mt-3 gap-2">
        <Skeleton height={12} width="80%" />
        <Skeleton height={12} width="50%" />
      </View>
    </View>
  );
}

export function SkeletonBookingList({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBookingCard key={i} />
      ))}
    </>
  );
}

export function SkeletonServiceRow() {
  return (
    <View className="bg-white border border-[#E5E7EB] rounded-xl mb-3 mx-4 overflow-hidden flex-row">
      <Skeleton width={80} height={80} borderRadius={0} />
      <View className="flex-1 p-3 gap-2">
        <Skeleton height={14} width="70%" />
        <Skeleton height={12} width="50%" />
        <View className="flex-row justify-between mt-1">
          <Skeleton width={60} height={12} />
          <Skeleton width={40} height={12} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonServiceList({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonServiceRow key={i} />
      ))}
    </>
  );
}
