import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/types";
import { Button, ConsentCheckbox, ScreenContainer, ScreenHeader } from "../../components";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<OnboardingStackParamList, "PrivacyTerms">;

// Mirrors the Figma "Privacy and Terms Conditions" frame (node 671:8592).
export function PrivacyTermsScreen({ navigation }: Props) {
  const [agreed, setAgreed] = useState(false);

  return (
    <ScreenContainer footer={<Button label="Continue" onPress={() => navigation.replace("ProfileBasics")} disabled={!agreed} />}>
      <ScreenHeader onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
      <Text style={styles.title}>Privacy & Terms</Text>
      <Text style={styles.subtitle}>
        Please review and accept our policies before continuing. These explain how your data, documents, and duty
        activity are handled by LuxoRides.
      </Text>

      <ConsentCheckbox
        checked={agreed}
        onToggle={setAgreed}
        label={
          <Text>
            I have read and agree to the <Text style={styles.link}>Terms of Service</Text>,{" "}
            <Text style={styles.link}>Privacy Policy</Text> and <Text style={styles.link}>Code of Conduct</Text>.
          </Text>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xl },
  link: { color: colors.info },
});
