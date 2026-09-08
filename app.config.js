// Dynamic config layered on top of app.json (the static base -- Expo feeds
// its "expo" object in as `config` below when both files are present, which
// is the officially supported way to extend a static config conditionally).
//
// Only job: keep expo-dev-client out of production builds. It's needed for
// the development/preview profiles (eas.json's developmentClient: true /
// internal-distribution flows, and local `expo run:android`), but its native
// module unconditionally adds dev-only capability -- e.g. the
// SYSTEM_ALERT_WINDOW permission for its shake-to-open dev menu overlay --
// that has no place in a Play Store release build. EAS only sets
// EAS_BUILD_PROFILE during a cloud build, so this leaves every local/dev/
// preview workflow completely unchanged.
module.exports = ({ config }) => {
  const isProductionBuild = process.env.EAS_BUILD_PROFILE === "production";

  if (!isProductionBuild) {
    return config;
  }

  return {
    ...config,
    plugins: (config.plugins ?? []).filter((plugin) => {
      const name = Array.isArray(plugin) ? plugin[0] : plugin;
      return name !== "expo-dev-client";
    }),
  };
};
