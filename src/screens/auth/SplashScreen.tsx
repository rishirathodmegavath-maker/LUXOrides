import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { BrandWordmark } from "../../components";
import { colors, spacing } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Splash">;

const logo = require("../../../assets/brand/logo_mark_white.png");

export function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const t = setTimeout(() => navigation.replace("Welcome"), 1400);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} contentFit="contain" />
      <View style={{ height: spacing.lg }} />
      <BrandWordmark variant="light" size="lg" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  logo: { width: 96, height: 118 },
});
