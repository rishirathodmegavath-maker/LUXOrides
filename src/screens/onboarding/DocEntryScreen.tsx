import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/types";
import { Button, ScreenContainer, ScreenHeader, TextField } from "../../components";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<OnboardingStackParamList, "DocEntry">;

// Mirrors the Figma "Enter your Driving Licence number..." (671:8832) and
// "Enter your 12-digit Aadhaar Number" (671:8808) frames — one screen
// branching on `doc` since both share the reference-card + form layout.
export function DocEntryScreen({ route, navigation }: Props) {
  const { doc } = route.params;
  const isLicence = doc === "drivingLicence";
  const [licenceNumber, setLicenceNumber] = useState("");
  const [dob, setDob] = useState("");
  const [aadhaar, setAadhaar] = useState("");

  const canSubmit = isLicence ? licenceNumber.length > 4 && dob.length === 10 : aadhaar.length === 12;

  return (
    <ScreenContainer
      footer={
        <Button
          label={isLicence ? "Submit" : "Submit"}
          onPress={() => navigation.navigate("DocUpload", { doc })}
          disabled={!canSubmit}
        />
      }
    >
      <ScreenHeader onBack={() => navigation.goBack()} />
      {isLicence ? (
        <>
          <Text style={styles.title}>Enter your Driving Licence number and date of birth</Text>
          <Text style={styles.subtitle}>
            Enter your Driving Licence number and date of birth, or upload a photo of your licence to complete your account setup.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.title}>Enter your 12-digit Aadhaar Number</Text>
          <Text style={styles.subtitle}>
            By entering your 12-digit Aadhaar number, you confirm that the information is accurate and consent to its use for identity verification and account setup.
          </Text>
        </>
      )}

      <View style={styles.cardArt}>
        <Feather name={isLicence ? "credit-card" : "shield"} size={36} color={colors.textMuted} />
        <Text style={styles.cardArtLabel}>{isLicence ? "Driving Licence sample" : "Aadhaar Card sample"}</Text>
      </View>

      {isLicence ? (
        <>
          <TextField
            label="License Number"
            value={licenceNumber}
            onChangeText={setLicenceNumber}
            placeholder="DL00000000000"
            autoCapitalize="characters"
          />
          <TextField
            label="Date of birth"
            value={dob}
            onChangeText={setDob}
            placeholder="DD/MM/YYYY"
            keyboardType="number-pad"
            containerStyle={{ marginTop: spacing.lg }}
          />
        </>
      ) : (
        <TextField
          label="Enter your 12-digit Aadhaar Number"
          value={aadhaar}
          onChangeText={(t) => setAadhaar(t.replace(/[^0-9]/g, "").slice(0, 12))}
          placeholder="1234 XXXX XXXX"
          keyboardType="number-pad"
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm },
  cardArt: {
    width: "100%",
    height: 160,
    marginVertical: spacing.xl,
    backgroundColor: colors.slate[50],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  cardArtLabel: { ...type.body3, color: colors.textMuted },
});
