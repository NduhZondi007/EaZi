import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: AvatarSize;
}

const sizeMap: Record<AvatarSize, { container: number; icon: number; font: number }> = {
  xs: { container: 28, icon: 14, font: 10 },
  sm: { container: 36, icon: 18, font: 12 },
  md: { container: 48, icon: 22, font: 16 },
  lg: { container: 64, icon: 28, font: 20 },
  xl: { container: 80, icon: 36, font: 24 },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const Avatar = React.memo(function Avatar({
  uri,
  name,
  size = 'md',
}: AvatarProps) {
  const { container, icon, font } = sizeMap[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: container, height: container, borderRadius: container / 2 }}
        contentFit="cover"
        transition={200}
      />
    );
  }

  if (name) {
    return (
      <View
        style={{
          width: container,
          height: container,
          borderRadius: container / 2,
          backgroundColor: '#111111',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: font, fontWeight: '600' }}>
          {getInitials(name)}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        width: container,
        height: container,
        borderRadius: container / 2,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <User size={icon} color="#9CA3AF" />
    </View>
  );
});
