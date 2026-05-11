import { Platform } from 'react-native';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
const GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

type AutocompleteResponse = {
  status: string;
  predictions: Array<{
    place_id: string;
    description: string;
    structured_formatting: { main_text: string; secondary_text: string };
  }>;
};

type DetailsResponse = {
  status: string;
  result?: {
    formatted_address: string;
    geometry: { location: { lat: number; lng: number } };
  };
};

type GeocodingResponse = {
  status: string;
  results: Array<{ formatted_address: string }>;
};

export class LocationService {
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      if (!('geolocation' in navigator)) return false;
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 5000 },
        );
      });
    }
    const ExpoLocation = await import('expo-location');
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  async getCurrentPosition(): Promise<Coordinates> {
    if (Platform.OS === 'web') {
      return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
          reject(new Error('Geolocation is not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          (err) => reject(new Error(err.message)),
          { enableHighAccuracy: true, timeout: 10000 },
        );
      });
    }
    const ExpoLocation = await import('expo-location');
    const loc = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Balanced,
    });
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  }

  async reverseGeocode(coords: Coordinates): Promise<string> {
    if (!GOOGLE_API_KEY) {
      return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
    }
    const params = new URLSearchParams({
      latlng: `${coords.latitude},${coords.longitude}`,
      key: GOOGLE_API_KEY,
      language: 'en',
      result_type: 'street_address|route|premise',
    });
    try {
      const res = await fetch(`${GEOCODING_URL}?${params}`);
      const json = (await res.json()) as GeocodingResponse;
      if (json.status === 'OK' && json.results.length > 0) {
        return json.results[0].formatted_address;
      }
    } catch {
      // fall through to coordinate fallback
    }
    return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
  }

  async searchPlaces(query: string, sessionToken?: string): Promise<PlaceSuggestion[]> {
    if (!query.trim() || !GOOGLE_API_KEY) return [];
    const params = new URLSearchParams({
      input: query,
      key: GOOGLE_API_KEY,
      components: 'country:za',
      language: 'en',
    });
    if (sessionToken) params.set('sessiontoken', sessionToken);
    try {
      const res = await fetch(`${AUTOCOMPLETE_URL}?${params}`);
      const json = (await res.json()) as AutocompleteResponse;
      if (json.status !== 'OK') return [];
      return json.predictions.map((p) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting.main_text,
        secondaryText: p.structured_formatting.secondary_text,
      }));
    } catch {
      return [];
    }
  }

  async getPlaceDetails(placeId: string, sessionToken?: string): Promise<PlaceDetails | null> {
    if (!GOOGLE_API_KEY) return null;
    const params = new URLSearchParams({
      place_id: placeId,
      fields: 'geometry,formatted_address',
      key: GOOGLE_API_KEY,
      language: 'en',
    });
    if (sessionToken) params.set('sessiontoken', sessionToken);
    try {
      const res = await fetch(`${DETAILS_URL}?${params}`);
      const json = (await res.json()) as DetailsResponse;
      if (json.status !== 'OK' || !json.result) return null;
      return {
        placeId,
        formattedAddress: json.result.formatted_address,
        latitude: json.result.geometry.location.lat,
        longitude: json.result.geometry.location.lng,
      };
    } catch {
      return null;
    }
  }
}

export const locationService = new LocationService();
