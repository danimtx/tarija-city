// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  
  // Solución para el problema de Firebase con Expo SDK 53
  config.resolver.sourceExts.push('cjs');
  config.resolver.unstable_enablePackageExports = false;
  
  return config;
})();