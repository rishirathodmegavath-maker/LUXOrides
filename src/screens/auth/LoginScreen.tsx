import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { Button, ScreenContainer, TextField } from "../../components";
import { authService } from "../../services";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

const hero = require("../../../assets/brand/photo_login_hero.png");

// Mirrors the Figma "Log in Screen" frame (node 669:8361).
export function LoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const canSubmit = phone.length === 10;

  const onSubmit = async () => {
    setLoading(true);
    try {
      await authService.sendOtp(phone);
      navigation.navigate("Otp", { phone });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>
        Drive with <Text style={styles.italic}>Pride</Text>.{"\n"}Deliver <Text style={styles.italic}>Excellence</Text>.
      </Text>
      <Image source={hero} style={styles.hero} resizeMode="contain" />
      <Text style={styles.h1}>Welcome back</Text>
      <Text style={styles.subtitle}>Log in to your account.</Text>

      <View style={{ marginTop: spacing.lg }}>
        <TextField
          label="Mobile Number"
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, "").slice(0, 10))}
          keyboardType="number-pad"
          placeholder="Enter your Phone Number"
          leftAdornment={<Text style={styles.prefix}>+91</Text>}
        />
      </View>

      <Button label="Log in" onPress={onSubmit} disabled={!canSubmit} loading={loading} style={{ marginTop: spacing.lg }} />

      <Text style={styles.footerText}>
        By continuing you agree to our{"\n"}
        <Text style={styles.link}>Terms of service</Text> <Text style={styles.link}>Privacy Policy</Text>{" "}
        <Text style={styles.link}>Content Policy</Text>
      </Text>
      <Text style={styles.footerText}>
        Don&apos;t have an account? <Text style={styles.linkStrong} onPress={() => navigation.navigate("Welcome")}>Sign Up</Text>
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  italic: { fontStyle: "italic" },
  hero: { width: "100%", height: 240, marginVertical: spacing.lg },
  h1: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.xxs },
  prefix: { ...type.body1, color: colors.textPrimary },
  footerText: { ...type.body2, color: colors.textSecondary, textAlign: "center", marginTop: spacing.lg },
  link: { color: colors.info },
  linkStrong: { color: colors.textPrimary, fontFamily: type.label.fontFamily },
});
