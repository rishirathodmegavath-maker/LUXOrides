const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// node_modules ship native-template source trees (android/, ios/) that the
// JS bundler never needs to read. Watching them triggers flaky ENOENT
// races in Metro's Node-based fallback file watcher on Windows (no
// watchman installed here), so they're excluded from the watch set.
config.resolver.blockList = [
  /node_modules[\\/].*[\\/]android[\\/]src[\\/].*/,
  /node_modules[\\/].*[\\/]ios[\\/].*\.xcodeproj[\\/].*/,
];

module.exports = config;
