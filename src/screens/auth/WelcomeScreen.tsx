import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { Button, ScreenContainer } from "../../components";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

const illustration = require("../../../assets/brand/illustration_welcome_driving.png");

// Mirrors the Figma "Sign Up Screen" frame (node 669:6909): line-art
// chauffeur illustration, "Welcome to Luxorides Chauffeur" heading,
// "Get Started" primary CTA, "Already have an account? Log In" link.
export function WelcomeScreen({ navigation }: Props) {
  return (
    <ScreenContainer
      edges={["top", "bottom"]}
      footer={
        <View style={styles.footer}>
          <Button label="Get Started" onPress={() => navigation.navigate("MobileNumber")} />
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
  footerText: { ...type.body2, color: colors.textSecondary, textAlign: "center" },
  link: { color: colors.textPrimary, fontFamily: type.label.fontFamily },
});
