import { User } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';

export function ProfileScreen() {
  const { profile, reset } = useAuthStore();

  const handleSignOut = async () => {
    await authService.signOut();
    reset();
  };

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 py-8">
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-[#F3F4F6] items-center justify-center mb-4">
            {profile?.profile_image_url ? null : (
              <User size={36} color="#9CA3AF" />
            )}
          </View>
          <Text className="text-xl font-bold text-[#111111]">
            {profile?.name ?? 'EaZi User'}
          </Text>
          <Text className="text-sm text-[#6B7280] mt-1">{profile?.email ?? ''}</Text>
          <View className="mt-2 px-3 py-1 bg-[#F3F4F6] rounded-full">
            <Text className="text-xs font-medium text-[#374151] capitalize">
              {profile?.role ?? 'client'}
            </Text>
          </View>
        </View>

        <View className="mt-auto">
          <Pressable
            onPress={handleSignOut}
            className="h-12 rounded-xl border-2 border-[#DC2626] items-center justify-center"
            accessibilityRole="button"
          >
            <Text className="text-sm font-semibold text-[#DC2626]">Sign Out</Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
}
