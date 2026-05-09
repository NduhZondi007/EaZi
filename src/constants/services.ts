export const SERVICE_CATEGORIES = [
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
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
