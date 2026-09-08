// Jest manual mock for react-native-webview -- it's a real native module
// with no JS-only implementation, so it can't resolve in a Jest test
// environment (no native binary to register RNCWebViewModule against).
// Screens that render a map only need this to mount without crashing;
// nothing in Phase 1's test coverage interacts with the WebView itself.
const React = require("react");
const { View } = require("react-native");

function WebView(props) {
  return React.createElement(View, props);
}

module.exports = { WebView };
module.exports.default = WebView;
