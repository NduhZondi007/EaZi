import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MapPin, Navigation, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { locationService } from '@/services/location.service';
import type { Coordinates, PlaceSuggestion } from '@/services/location.service';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSelectPlace: (address: string, coords?: Coordinates) => void;
  onUseCurrentLocation?: () => void;
  isLoadingLocation?: boolean;
  placeholder?: string;
  error?: string;
  label?: string;
  autoFocus?: boolean;
}

export function AddressAutocomplete({
  value,
  onChangeText,
  onSelectPlace,
  onUseCurrentLocation,
  isLoadingLocation = false,
  placeholder = 'Enter address',
  error,
  label,
  autoFocus = false,
}: Props) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const sessionToken = useRef(generateSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await locationService.searchPlaces(value, sessionToken.current);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
      setIsSearching(false);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const handleSelect = useCallback(
    async (suggestion: PlaceSuggestion) => {
      setShowDropdown(false);
      setSuggestions([]);
      onChangeText(suggestion.description);

      const details = await locationService.getPlaceDetails(
        suggestion.placeId,
        sessionToken.current,
      );
      sessionToken.current = generateSessionToken();

      if (details) {
        onSelectPlace(details.formattedAddress, {
          latitude: details.latitude,
          longitude: details.longitude,
        });
      } else {
        onSelectPlace(suggestion.description);
      }
    },
    [onChangeText, onSelectPlace],
  );

  const handleClear = useCallback(() => {
    onChangeText('');
    setSuggestions([]);
    setShowDropdown(false);
  }, [onChangeText]);

  return (
    <View>
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-1.5">{label}</Text>
      )}

      <View
        className={[
          'flex-row items-center border-2 rounded-xl px-3 h-12',
          error
            ? 'border-red-400'
            : value
            ? 'border-gray-900'
            : 'border-gray-200',
        ].join(' ')}
      >
        <MapPin size={16} color={Colors.gray400} style={{ marginRight: 8 }} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray400}
          className="flex-1 text-sm text-gray-900"
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect={false}
          returnKeyType="search"
        />
        {isSearching && (
          <ActivityIndicator size="small" color={Colors.gray400} style={{ marginLeft: 4 }} />
        )}
        {!isSearching && value.length > 0 && (
          <Pressable onPress={handleClear} hitSlop={8}>
            <X size={16} color={Colors.gray400} />
          </Pressable>
        )}
      </View>

      {error && (
        <Text className="text-xs text-red-500 mt-1">{error}</Text>
      )}

      {showDropdown && suggestions.length > 0 && (
        <View className="mt-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm z-50">
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.placeId}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => handleSelect(item)}
                className={[
                  'flex-row items-start px-4 py-3 active:bg-gray-50',
                  index < suggestions.length - 1 ? 'border-b border-gray-100' : '',
                ].join(' ')}
              >
                <MapPin
                  size={14}
                  color={Colors.gray400}
                  style={{ marginTop: 2, marginRight: 10, flexShrink: 0 }}
                />
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                    {item.mainText}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
                    {item.secondaryText}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      )}

      {onUseCurrentLocation && (
        <Pressable
          onPress={onUseCurrentLocation}
          disabled={isLoadingLocation}
          className="flex-row items-center gap-2 mt-2 px-1 py-1.5 active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel="Use current location"
        >
          {isLoadingLocation ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Navigation size={14} color={Colors.primary} />
          )}
          <Text className="text-xs font-semibold text-gray-900">
            {isLoadingLocation ? 'Getting location…' : 'Use current location'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function generateSessionToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
