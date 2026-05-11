import React from 'react';
import { Platform, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

export interface EaziMapViewProps {
  region?: Region;
  markerCoordinate?: MapCoordinate;
  onPress?: (coords: MapCoordinate) => void;
  onMarkerDragEnd?: (coords: MapCoordinate) => void;
  style?: object;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  draggableMarker?: boolean;
}

// Lazy-load react-native-maps — it has no web support
let RNMapView: React.ComponentType<{
  style?: object;
  region?: Region;
  onPress?: (e: { nativeEvent: { coordinate: MapCoordinate } }) => void;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
  children?: React.ReactNode;
}> | null = null;

let RNMarker: React.ComponentType<{
  coordinate: MapCoordinate;
  draggable?: boolean;
  onDragEnd?: (e: { nativeEvent: { coordinate: MapCoordinate } }) => void;
}> | null = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps') as {
      default: NonNullable<typeof RNMapView>;
      Marker: NonNullable<typeof RNMarker>;
    };
    RNMapView = Maps.default;
    RNMarker = Maps.Marker;
  } catch {
    // map unavailable on this platform
  }
}

export function EaziMapView({
  region,
  markerCoordinate,
  onPress,
  onMarkerDragEnd,
  style,
  scrollEnabled = true,
  zoomEnabled = true,
  draggableMarker = false,
}: EaziMapViewProps) {
  if (Platform.OS === 'web' || !RNMapView) {
    return (
      <View
        style={[
          { backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
        <MapPin size={32} color={Colors.gray400} />
        <Text style={{ color: Colors.gray500, fontSize: 13, marginTop: 8, fontWeight: '500' }}>
          Map view not available in browser
        </Text>
        {markerCoordinate && (
          <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 4 }}>
            {markerCoordinate.latitude.toFixed(5)}, {markerCoordinate.longitude.toFixed(5)}
          </Text>
        )}
      </View>
    );
  }

  const MapViewComponent = RNMapView;
  const MarkerComponent = RNMarker;

  return (
    <MapViewComponent
      style={style}
      region={region}
      scrollEnabled={scrollEnabled}
      zoomEnabled={zoomEnabled}
      pitchEnabled={false}
      rotateEnabled={false}
      onPress={onPress ? (e) => onPress(e.nativeEvent.coordinate) : undefined}
    >
      {markerCoordinate && MarkerComponent && (
        <MarkerComponent
          coordinate={markerCoordinate}
          draggable={draggableMarker}
          onDragEnd={
            onMarkerDragEnd ? (e) => onMarkerDragEnd(e.nativeEvent.coordinate) : undefined
          }
        />
      )}
    </MapViewComponent>
  );
}
