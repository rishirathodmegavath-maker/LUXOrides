import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontFamily } from "../theme";

export interface BrandWordmarkProps {
  variant?: "light" | "dark";
  size?: "sm" | "lg";
}

// Recreates the "LUXORIDES / Chauffeur" wordmark seen on the splash and
// side-drawer header. Figma used a licensed serif ("The Seasons") which
// cannot be redistributed here — substituted with Playfair Display
// (open-source, same serif-caps + italic-script pairing).
export function BrandWordmark({ variant = "dark", size = "lg" }: BrandWordmarkProps) {
  const color = variant === "light" ? colors.textInverse : colors.primary;
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.brand, size === "lg" ? styles.brandLg : styles.brandSm, { color }]}>
        LUXORIDES
      </Text>
      <Text style={[styles.tagline, size === "lg" ? styles.taglineLg : styles.taglineSm, { color }]}>
        Chauffeur
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center" },
  brand: { fontFamily: fontFamily.displaySerif, letterSpacing: 4 },
  brandLg: { fontSize: 30 },
  brandSm: { fontSize: 18 },
  tagline: { fontFamily: fontFamily.displaySerifItalic },
  taglineLg: { fontSize: 26, marginTop: 2 },
  taglineSm: { fontSize: 16, marginTop: 0 },
});
