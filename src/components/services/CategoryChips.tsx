import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

const SERVICE_CATEGORIES = [
  'Cleaning',
  'Plumbing',
  'Electrical',
  'Beauty',
  'Transport',
  'Tutoring',
  'Photography',
  'Personal Training',
  'Gardening',
  'Handyman',
  'Moving',
  'Catering',
  'Other',
];

interface CategoryChipsProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export const CategoryChips = React.memo(function CategoryChips({
  selected,
  onSelect,
}: CategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8, flexDirection: 'row' }}
    >
      <Chip
        label="All"
        isActive={selected === null}
        onPress={() => onSelect(null)}
      />
      {SERVICE_CATEGORIES.map((cat) => (
        <Chip
          key={cat}
          label={cat}
          isActive={selected === cat}
          onPress={() => onSelect(cat)}
        />
      ))}
    </ScrollView>
  );
});

function Chip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      className={`px-4 py-2 rounded-full border ${
        isActive
          ? 'bg-[#111111] border-[#111111]'
          : 'bg-white border-[#D1D5DB]'
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          isActive ? 'text-white' : 'text-[#374151]'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
