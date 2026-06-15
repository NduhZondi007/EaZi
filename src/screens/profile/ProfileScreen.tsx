import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  ChevronRight,
  HelpCircle,
  LogOut,
  Settings,
  UserPen,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore, selectProfile } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import type { ProfileStackParamList } from '@/types/navigation.types';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

function MenuItem({ icon, label, onPress, destructive = false }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center px-5 py-4 border-b border-[#F3F4F6]"
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      <View className="w-8 items-center">{icon}</View>
      <Text
        className={`flex-1 ml-3 text-sm font-medium ${
          destructive ? 'text-[#DC2626]' : 'text-[#111111]'
        }`}
      >
        {label}
      </Text>
      {!destructive && <ChevronRight size={18} color="#9CA3AF" />}
    </Pressable>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const profile = useAuthStore(selectProfile);
  const { reset } = useAuthStore();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authService.signOut();
      reset();
    } finally {
      setSigningOut(false);
    }
  };

  const roleVariant =
    profile?.role === 'provider'
      ? 'success'
      : profile?.role === 'admin'
        ? 'info'
        : 'default';

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <ScrollView>
        <View className="bg-white px-5 pt-8 pb-6 items-center border-b border-[#E5E7EB]">
          <Avatar
            uri={profile?.profile_image_url}
            name={profile?.name}
            size="xl"
          />
          <Text className="text-xl font-bold text-[#111111] mt-4">
            {profile?.name ?? 'EaZi User'}
          </Text>
          <Text className="text-sm text-[#6B7280] mt-1">{profile?.email ?? ''}</Text>
          <View className="mt-3">
            <Badge
              label={profile?.role === 'provider' ? 'Service Provider' : profile?.role === 'admin' ? 'Administrator' : 'Client'}
              variant={roleVariant}
            />
          </View>
        </View>

        <View className="mt-4 bg-white rounded-xl mx-4 overflow-hidden border border-[#E5E7EB]">
          <MenuItem
            icon={<UserPen size={20} color="#111111" />}
            label="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <MenuItem
            icon={<Bell size={20} color="#111111" />}
            label="Notifications"
            onPress={() => navigation.navigate('Settings')}
          />
          <MenuItem
            icon={<Settings size={20} color="#111111" />}
            label="Settings"
            onPress={() => navigation.navigate('Settings')}
          />
          <MenuItem
            icon={<HelpCircle size={20} color="#111111" />}
            label="Help & Support"
            onPress={() => navigation.navigate('Support')}
          />
        </View>

        <View className="mt-4 bg-white rounded-xl mx-4 overflow-hidden border border-[#E5E7EB] mb-8">
          <Pressable
            onPress={handleSignOut}
            disabled={signingOut}
            accessibilityRole="button"
            className="flex-row items-center px-5 py-4"
            style={({ pressed }) => [{ opacity: pressed || signingOut ? 0.7 : 1 }]}
          >
            <View className="w-8 items-center">
              {signingOut ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <LogOut size={20} color="#DC2626" />
              )}
            </View>
            <Text className="flex-1 ml-3 text-sm font-medium text-[#DC2626]">
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
