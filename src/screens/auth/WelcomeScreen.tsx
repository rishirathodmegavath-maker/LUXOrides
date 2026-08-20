import React from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { Button, ScreenContainer } from "../../components";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

const illustration = require("../../../assets/brand/illustration_welcome_driving.png");

// Mirrors the Figma "Sign Up Screen" frame (node 669:6909): line-art
// chauffeur illustration, "Welcome to Luxorides Chauffeur" heading,
// "Get Started" primary CTA, "Already have an account? Log In" link.
// The sitemap's "Google Log In" branch has no corresponding Figma frame
// anywhere in the file (checked Login/Sign Up screens in full and searched
// all frame names) — there's no real backend endpoint for it either (driver
// auth is phone+OTP only). This button is an intentional, disclosed
// placeholder for that flowchart-only branch, not a functional sign-in.
function onGoogleLogin() {
  Alert.alert("Google Sign-In", "Not available yet — please continue with your phone number for now.");
}

export function WelcomeScreen({ navigation }: Props) {
  return (
    <ScreenContainer
      edges={["top", "bottom"]}
      footer={
        <View style={styles.footer}>
          <Button label="Get Started" onPress={() => navigation.navigate("MobileNumber")} />
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
          <Button
            label="Continue with Google"
            variant="secondary"
            leadingIcon={<AntDesign name="google" size={18} color={colors.primary} />}
            onPress={onGoogleLogin}
          />
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.link} onPress={() => navigation.navigate("Login")}>Log In</Text>
          </Text>
        </View>
      }
    >
      <Image source={illustration} style={styles.illustration} resizeMode="contain" />
      <Text style={styles.title}>Welcome to{"\n"}Luxorides Chauffeur</Text>
      <Text style={styles.subtitle}>Deliver every journey with professionalism, precision, and care.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  illustration: { width: "100%", height: 300, marginTop: spacing.xxl },
  title: { ...type.h1, color: colors.textPrimary, marginTop: spacing.xxl },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm },
  footer: { gap: spacing.md },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.borderMuted },
  dividerText: { ...type.body3, color: colors.textMuted },
  footerText: { ...type.body2, color: colors.textSecondary, textAlign: "center" },
  link: { color: colors.textPrimary, fontFamily: type.label.fontFamily },
});
