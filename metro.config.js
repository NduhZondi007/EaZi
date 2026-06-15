const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add .mjs to sourceExts so Metro can resolve ESM-only packages (Node.js 22
// enforces exports fields which often point to .mjs files not in Metro's
// default extension list).
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'mjs',
];

module.exports = withNativeWind(config, { input: './global.css' });
