const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (contents.includes('use_modular_headers!')) {
        return config;
      }

      const lines = contents.split('\n');

      // Insert use_modular_headers! right after the last use_frameworks! line.
      // In Expo-generated Podfiles, use_frameworks! lives inside the target block —
      // use_modular_headers! must be at the same scope to affect its pods.
      let lastFrameworksIdx = -1;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes('use_frameworks!')) {
          lastFrameworksIdx = i;
          break;
        }
      }

      if (lastFrameworksIdx >= 0) {
        lines.splice(lastFrameworksIdx + 1, 0, '  use_modular_headers!');
        fs.writeFileSync(podfilePath, lines.join('\n'));
        return config;
      }

      // Fallback: no use_frameworks! found — add globally after platform :ios
      const platformIdx = lines.findIndex((l) => l.trim().startsWith('platform :ios'));
      if (platformIdx >= 0) {
        lines.splice(platformIdx + 1, 0, 'use_modular_headers!');
        fs.writeFileSync(podfilePath, lines.join('\n'));
      }

      return config;
    },
  ]);
};

module.exports = withModularHeaders;
