module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': [
      'babel-jest',
      { configFile: './babel.config.test.js' },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(date-fns|@supabase)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native$': '<rootDir>/src/__tests__/__mocks__/react-native.js',
    '^react-native/(.*)$': '<rootDir>/src/__tests__/__mocks__/react-native.js',
    '^expo-.*$': '<rootDir>/src/__tests__/__mocks__/expo-module.js',
    '^@expo/.*$': '<rootDir>/src/__tests__/__mocks__/expo-module.js',
    '^@react-navigation/.*$': '<rootDir>/src/__tests__/__mocks__/navigation.js',
    '^lucide-react-native$': '<rootDir>/src/__tests__/__mocks__/lucide-react-native.js',
    '^@shopify/flash-list$': '<rootDir>/src/__tests__/__mocks__/expo-module.js',
    '^nativewind$': '<rootDir>/src/__tests__/__mocks__/nativewind.js',
    '^react-native-svg$': '<rootDir>/src/__tests__/__mocks__/expo-module.js',
    '^react-native-webview$': '<rootDir>/src/__tests__/__mocks__/expo-module.js',
    '^react-native-maps$': '<rootDir>/src/__tests__/__mocks__/expo-module.js',
    '^react-native-reanimated$': '<rootDir>/src/__tests__/__mocks__/expo-module.js',
    '^react-native-safe-area-context$': '<rootDir>/src/__tests__/__mocks__/expo-module.js',
    '^@sentry/react-native$': '<rootDir>/src/__tests__/__mocks__/expo-module.js',
  },
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/repositories/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageReporters: ['text', 'lcov'],
  maxWorkers: 1,
  coverageThreshold: {
    'src/services/booking-state-machine.ts': {
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100,
    },
  },
};
