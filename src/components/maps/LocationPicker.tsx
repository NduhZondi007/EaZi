import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { ChevronLeft, LocateFixed, MapPin } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { EaziMapView } from '@/components/maps/MapView';
import { AddressAutocomplete } from '@/components/maps/AddressAutocomplete';
import { locationService } from '@/services/location.service';
import type { Coordinates } from '@/services/location.service';
import type { Region } from '@/components/maps/MapView';

interface Props {
  visible: boolean;
  initialAddress?: string;
  initialCoordinates?: Coordinates;
  onConfirm: (address: string, coords?: Coordinates) => void;
  onClose: () => void;
}

const DEFAULT_REGION: Region = {
  latitude: -26.2041,
  longitude: 28.0473,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export function LocationPicker({
  visible,
  initialAddress = '',
  initialCoordinates,
  onConfirm,
  onClose,
}: Props) {
  const [address, setAddress] = useState(initialAddress);
  const [coords, setCoords] = useState<Coordinates | undefined>(initialCoordinates);
  const [region, setRegion] = useState<Region>(
    initialCoordinates
      ? {
          latitude: initialCoordinates.latitude,
          longitude: initialCoordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      : DEFAULT_REGION,
  );
  const [isLocating, setIsLocating] = useState(false);

  const handleSelectPlace = useCallback(
    (selectedAddress: string, selectedCoords?: Coordinates) => {
      setAddress(selectedAddress);
      setCoords(selectedCoords);
      if (selectedCoords) {
        setRegion({
          latitude: selectedCoords.latitude,
          longitude: selectedCoords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    },
    [],
  );

  const handleMapPress = useCallback(async (tapped: Coordinates) => {
    setCoords(tapped);
    setRegion((r) => ({ ...r, latitude: tapped.latitude, longitude: tapped.longitude }));
    const reverseAddr = await locationService.reverseGeocode(tapped);
    setAddress(reverseAddr);
  }, []);

  const handleMarkerDrag = useCallback(async (dragged: Coordinates) => {
    setCoords(dragged);
    const reverseAddr = await locationService.reverseGeocode(dragged);
    setAddress(reverseAddr);
  }, []);

  const handleUseCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    try {
      const granted = await locationService.requestPermission();
      if (!granted) return;
      const current = await locationService.getCurrentPosition();
      setCoords(current);
      setRegion({
        latitude: current.latitude,
        longitude: current.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      const reverseAddr = await locationService.reverseGeocode(current);
      setAddress(reverseAddr);
    } catch {
      // permission denied or error — user can still type manually
    } finally {
      setIsLocating(false);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (!address.trim()) return;
    onConfirm(address.trim(), coords);
  }, [address, coords, onConfirm]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#f3f4f6',
          }}
        >
          <Pressable onPress={onClose} hitSlop={8} style={{ marginRight: 12 }}>
            <ChevronLeft size={22} color={Colors.primary} />
          </Pressable>
          <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#111827' }}>
            Select Location
          </Text>
          {isLocating && <ActivityIndicator size="small" color={Colors.primary} />}
        </View>

        {/* Map (native only) */}
        {Platform.OS !== 'web' && (
          <View style={{ height: 280 }}>
            <EaziMapView
              style={{ flex: 1 }}
              region={region}
              markerCoordinate={coords}
              onPress={handleMapPress}
              onMarkerDragEnd={handleMarkerDrag}
              draggableMarker
              scrollEnabled
              zoomEnabled
            />
            <Pressable
              onPress={handleUseCurrentLocation}
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                backgroundColor: '#fff',
                borderRadius: 24,
                padding: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 4,
                elevation: 3,
              }}
              accessibilityRole="button"
              accessibilityLabel="Use current location"
            >
              <LocateFixed size={20} color={Colors.primary} />
            </Pressable>
          </View>
        )}

        {/* Address search */}
        <View style={{ flex: 1, padding: 16 }}>
          <AddressAutocomplete
            label="Address"
            value={address}
            onChangeText={setAddress}
            onSelectPlace={handleSelectPlace}
            onUseCurrentLocation={Platform.OS === 'web' ? handleUseCurrentLocation : undefined}
            isLoadingLocation={isLocating}
            placeholder="Search for an address…"
          />

          {coords && Platform.OS === 'web' && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 8,
                gap: 6,
                backgroundColor: '#f9fafb',
                borderRadius: 8,
                padding: 10,
              }}
            >
              <MapPin size={14} color={Colors.gray500} />
              <Text style={{ fontSize: 12, color: Colors.gray500, flex: 1 }}>
                {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
              </Text>
            </View>
          )}
        </View>

        {/* Confirm button */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 16,
            borderTopWidth: 1,
            borderTopColor: '#f3f4f6',
            paddingTop: 12,
          }}
        >
          <Pressable
            onPress={handleConfirm}
            disabled={!address.trim()}
            style={{
              height: 48,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: address.trim() ? '#111111' : '#e5e7eb',
            }}
            accessibilityRole="button"
            accessibilityLabel="Confirm location"
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: address.trim() ? '#fff' : Colors.gray400,
              }}
            >
              Confirm Location
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

