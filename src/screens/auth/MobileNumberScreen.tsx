import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { Button, ScreenContainer, ScreenHeader, TextField } from "../../components";
import { authService } from "../../services";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "MobileNumber">;

// Mirrors the Figma "Mobile No. Screen 01" (idle) and "02" (filled) frames
// (nodes 669:6922 / 669:7006) — consolidated into one dynamic screen since
// they are the same layout in the enabled vs. filled input state.
export function MobileNumberScreen({ navigation }: Props) {
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
    <ScreenContainer
      footer={
        <Button
          label="Continue"
          onPress={onSubmit}
          disabled={!canSubmit}
          loading={loading}
          trailingIcon={<Text style={styles.chevron}>{">"}</Text>}
        />
      }
    >
      <ScreenHeader onBack={() => navigation.goBack()} />
      <Text style={styles.title}>Enter your mobile number</Text>
      <Text style={styles.subtitle}>Enter your mobile number & we&apos;ll send a one-time code to confirm it&apos;s you.</Text>

      <View style={{ marginTop: spacing.xl }}>
        <TextField
          label="Mobile Number"
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, "").slice(0, 10))}
          keyboardType="number-pad"
          placeholder="Enter your Phone Number"
          leftAdornment={<Text style={styles.prefix}>+91</Text>}
          autoFocus
        />
      </View>

      <Text style={styles.footerText}>
        By continuing you agree to our{"\n"}
        <Text style={styles.link}>Terms of service</Text> <Text style={styles.link}>Privacy Policy</Text>{" "}
        <Text style={styles.link}>Code of Conduct</Text>
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm },
  prefix: { ...type.body1, color: colors.textPrimary },
  chevron: { color: colors.textInverse, fontFamily: type.button.fontFamily, fontSize: 18 },
  footerText: { ...type.body2, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xl },
  link: { color: colors.info },
});
