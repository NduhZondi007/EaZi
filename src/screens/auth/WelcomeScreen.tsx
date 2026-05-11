import { useEffect, useRef } from 'react';
import { Animated, Pressable, StatusBar, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AuthStackScreenProps } from '@/types/navigation.types';
import { Button } from '@/components/ui/Button';

type Props = AuthStackScreenProps<'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const { height, width } = useWindowDimensions();
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
    <View style={{ height, width, backgroundColor: '#ffffff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ width: '100%', maxWidth: 384, alignItems: 'center' }}>

            {/* Logo */}
            <Animated.View
              style={{ opacity: logoOpacity, transform: [{ translateY: logoTranslateY }], alignItems: 'center', marginBottom: 64 }}
            >
              <View className="w-24 h-24 rounded-3xl bg-[#111111] items-center justify-center mb-6">
                <Text className="text-white text-4xl font-bold">E</Text>
              </View>
              <Text className="text-4xl font-bold text-[#111111] tracking-tight">EaZi</Text>
              <Text className="text-base text-[#6B7280] mt-2 text-center">
                Services, on demand.
              </Text>
            </Animated.View>

            {/* Actions */}
            <Animated.View style={{ opacity: contentOpacity, width: '100%', gap: 12 }}>
              <Button
                label="Get Started"
                onPress={() => navigation.navigate('SignUp')}
              />
              <Pressable
                onPress={() => navigation.navigate('Login')}
                style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}
                accessibilityRole="button"
                accessibilityLabel="Already have an account"
              >
                <Text className="text-sm text-[#6B7280]">
                  Already have an account?{' '}
                  <Text className="text-[#111111] font-semibold">Log in</Text>
                </Text>
              </Pressable>
            </Animated.View>

            {/* Terms */}
            <Animated.View style={{ opacity: contentOpacity, marginTop: 32, alignItems: 'center' }}>
              <Text className="text-xs text-[#9CA3AF] text-center">
                By continuing, you agree to our Terms &amp; Privacy Policy
              </Text>
            </Animated.View>

          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
