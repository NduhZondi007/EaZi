import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ExternalLink, Info, Shield, Smartphone } from 'lucide-react-native';
import Constants from 'expo-constants';

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  icon?: React.ReactNode;
}

function ToggleRow({ label, description, value, onToggle, icon }: ToggleRowProps) {
  return (
    <View className="flex-row items-center px-5 py-4 border-b border-[#F3F4F6]">
      {icon && <View className="mr-3">{icon}</View>}
      <View className="flex-1">
        <Text className="text-sm font-medium text-[#111111]">{label}</Text>
        {description && (
          <Text className="text-xs text-[#6B7280] mt-0.5">{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#D1D5DB', true: '#111111' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#D1D5DB"
      />
    </View>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

function InfoRow({ label, value, icon }: InfoRowProps) {
  return (
    <View className="flex-row items-center px-5 py-4 border-b border-[#F3F4F6]">
      {icon && <View className="mr-3">{icon}</View>}
      <Text className="flex-1 text-sm font-medium text-[#111111]">{label}</Text>
      <Text className="text-sm text-[#6B7280]">{value}</Text>
    </View>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [bookingAlerts, setBookingAlerts] = useState(true);
  const [chatAlerts, setChatAlerts] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <View className="flex-row items-center px-5 py-4 bg-white border-b border-[#E5E7EB]">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mr-3"
        >
          <ChevronLeft size={24} color="#111111" />
        </Pressable>
        <Text className="text-lg font-bold text-[#111111]">Settings</Text>
      </View>

      <ScrollView>
        <Text className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider px-5 pt-6 pb-2">
          Notifications
        </Text>
        <View className="bg-white rounded-xl mx-4 overflow-hidden border border-[#E5E7EB]">
          <ToggleRow
            label="Push Notifications"
            description="Receive alerts on your device"
            value={pushEnabled}
            onToggle={setPushEnabled}
            icon={<Smartphone size={18} color="#111111" />}
          />
          <ToggleRow
            label="Booking Alerts"
            description="Status updates for your bookings"
            value={bookingAlerts}
            onToggle={setBookingAlerts}
          />
          <ToggleRow
            label="Chat Messages"
            description="New messages from providers / clients"
            value={chatAlerts}
            onToggle={setChatAlerts}
          />
          <ToggleRow
            label="Promotions"
            description="Deals, discounts, and new features"
            value={promoAlerts}
            onToggle={setPromoAlerts}
          />
        </View>

        <Text className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider px-5 pt-6 pb-2">
          Legal
        </Text>
        <View className="bg-white rounded-xl mx-4 overflow-hidden border border-[#E5E7EB]">
          <Pressable
            className="flex-row items-center px-5 py-4 border-b border-[#F3F4F6]"
            accessibilityRole="button"
          >
            <Shield size={18} color="#111111" />
            <Text className="flex-1 ml-3 text-sm font-medium text-[#111111]">Privacy Policy</Text>
            <ExternalLink size={16} color="#9CA3AF" />
          </Pressable>
          <Pressable
            className="flex-row items-center px-5 py-4"
            accessibilityRole="button"
          >
            <Info size={18} color="#111111" />
            <Text className="flex-1 ml-3 text-sm font-medium text-[#111111]">Terms of Service</Text>
            <ExternalLink size={16} color="#9CA3AF" />
          </Pressable>
        </View>

        <Text className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider px-5 pt-6 pb-2">
          About
        </Text>
        <View className="bg-white rounded-xl mx-4 overflow-hidden border border-[#E5E7EB] mb-8">
          <InfoRow label="App Version" value={`v${appVersion}`} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
