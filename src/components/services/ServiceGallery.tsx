import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ServiceGalleryProps {
  images: string[];
}

export function ServiceGallery({ images }: ServiceGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const prev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
  };

  const next = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % images.length);
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
      >
        {images.map((uri, index) => (
          <Pressable
            key={uri}
            onPress={() => openLightbox(index)}
            accessibilityRole="button"
            accessibilityLabel={`View image ${index + 1}`}
          >
            <Image
              source={{ uri }}
              style={{ width: 120, height: 100, borderRadius: 8 }}
              contentFit="cover"
              transition={200}
            />
          </Pressable>
        ))}
      </ScrollView>

      <Modal
        visible={lightboxIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={closeLightbox}
      >
        <View className="flex-1 bg-black items-center justify-center">
          <Pressable
            onPress={closeLightbox}
            className="absolute top-12 right-5 z-10 w-10 h-10 items-center justify-center bg-white/20 rounded-full"
            accessibilityRole="button"
            accessibilityLabel="Close gallery"
          >
            <X size={22} color="#FFFFFF" />
          </Pressable>

          {lightboxIndex !== null && (
            <Image
              source={{ uri: images[lightboxIndex] }}
              style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.75 }}
              contentFit="contain"
            />
          )}

          <Text className="text-white text-sm mt-4">
            {lightboxIndex !== null ? `${lightboxIndex + 1} / ${images.length}` : ''}
          </Text>

          {images.length > 1 && (
            <View className="flex-row gap-6 mt-6">
              <Pressable
                onPress={prev}
                className="w-12 h-12 items-center justify-center bg-white/20 rounded-full"
                accessibilityRole="button"
                accessibilityLabel="Previous image"
              >
                <ChevronLeft size={24} color="#FFFFFF" />
              </Pressable>
              <Pressable
                onPress={next}
                className="w-12 h-12 items-center justify-center bg-white/20 rounded-full"
                accessibilityRole="button"
                accessibilityLabel="Next image"
              >
                <ChevronRight size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}
