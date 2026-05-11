import { useEffect, useRef } from 'react';
import { Animated, Pressable, SafeAreaView, StatusBar, Text, View } from 'react-native';
import type { AuthStackScreenProps } from '@/types/navigation.types';
import { Button } from '@/components/ui/Button';

type Props = AuthStackScreenProps<'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(24)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-sm items-center">
          <Animated.View
            style={{ opacity: logoOpacity, transform: [{ translateY: logoTranslateY }] }}
            className="items-center mb-16"
          >
            <View className="w-24 h-24 rounded-3xl bg-[#111111] items-center justify-center mb-6">
              <Text className="text-white text-4xl font-bold">E</Text>
            </View>
            <Text className="text-4xl font-bold text-[#111111] tracking-tight">EaZi</Text>
            <Text className="text-base text-[#6B7280] mt-2 text-center">
              Services, on demand.
            </Text>
          </Animated.View>

          <Animated.View style={{ opacity: contentOpacity }} className="w-full gap-4">
            <Button
              label="Get Started"
              onPress={() => navigation.navigate('SignUp')}
            />

            <Pressable
              onPress={() => navigation.navigate('Login')}
              className="h-12 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Already have an account"
            >
              <Text className="text-sm text-[#6B7280]">
                Already have an account?{' '}
                <Text className="text-[#111111] font-semibold">Log in</Text>
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View style={{ opacity: contentOpacity }} className="mt-8 items-center">
            <Text className="text-xs text-[#9CA3AF] text-center">
              By continuing, you agree to our Terms & Privacy Policy
            </Text>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}
