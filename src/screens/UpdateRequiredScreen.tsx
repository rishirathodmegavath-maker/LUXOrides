import React from "react";
import { Linking, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Button } from "../components";
import { SUPPORT_PHONE_TEL } from "../constants/support";
import { colors, radius, spacing, type } from "../theme";

// Store URLs are optional, like EXPO_PUBLIC_SENTRY_DSN -- this app has no
// published listing yet, and fabricating a placeholder App Store numeric id
// would be worse than not linking at all. Once published, ops sets these
// with no code change; until then "Update Now" simply doesn't render, and
// Call Support remains a real way forward instead of a dead-end button.
const STORE_URL = Platform.OS === "ios" ? process.env.EXPO_PUBLIC_IOS_STORE_URL : process.env.EXPO_PUBLIC_ANDROID_STORE_URL;

interface Props {
  latestVersion: string | null;
}

// The one screen in this app deliberately allowed to have no back
// action and no footer escape hatch besides Call Support -- an
// unsupported build is treated as unsafe to keep using at all, matching
// "mandatory update only when the backend says the installed version is
// unsupported." Never rendered while a duty is genuinely active — see
// RootNavigator, which gates this on useVersionStore's launch-time
// snapshot of whether a duty was already in progress.
export function UpdateRequiredScreen({ latestVersion }: Props) {
  const onUpdate = () => {
    if (STORE_URL) Linking.openURL(STORE_URL).catch(() => {});
  };

  const onCallSupport = () => {
    Linking.openURL(SUPPORT_PHONE_TEL).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Feather name="download" size={40} color={colors.primary} />
        </View>
        <Text style={styles.title}>Update Required</Text>
        <Text style={styles.subtitle}>
          {latestVersion
            ? `A newer version (${latestVersion}) of LuxoRides Chauffeur is required to continue. Please update to keep working.`
            : "A newer version of LuxoRides Chauffeur is required to continue. Please update to keep working."}
        </Text>
        {STORE_URL ? <Button label="Update Now" onPress={onUpdate} style={styles.button} /> : null}
        <Button label="Call Support" variant="secondary" onPress={onCallSupport} style={styles.button} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.teal[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: { ...type.h1, color: colors.textPrimary, textAlign: "center" },
  subtitle: { ...type.body1, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm, marginBottom: spacing.md },
  button: { width: "100%", marginTop: spacing.sm },
});
