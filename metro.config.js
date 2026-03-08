const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Expo Router support
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

module.exports = config;