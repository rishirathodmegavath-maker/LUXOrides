// Jest manual mock for @expo/vector-icons -- the real package pulls in
// expo-font -> expo-asset (not installed; icon fonts have no meaning in a
// test environment anyway), so every icon-set export is stubbed out as a
// trivial component instead of resolving real font/asset loading.
const React = require("react");
const { Text } = require("react-native");

function makeIconComponent(name) {
  function Icon(props) {
    return React.createElement(Text, props, null);
  }
  Icon.displayName = name;
  return Icon;
}

module.exports = new Proxy(
  {},
  {
    get: (_target, prop) => makeIconComponent(String(prop)),
  }
);
