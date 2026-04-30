const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
  resolveRequest: (context, moduleName, platform) => {
    if (platform === 'web') {
      if (moduleName === 'react-native-google-mobile-ads') {
        return {
          type: 'sourceFile',
          filePath: path.resolve(__dirname, 'src/mocks/googleMobileAdsMock.ts'),
        };
      }
      if (moduleName === 'expo-tracking-transparency') {
        return {
          type: 'sourceFile',
          filePath: path.resolve(__dirname, 'src/mocks/expoTrackingTransparencyMock.ts'),
        };
      }
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
