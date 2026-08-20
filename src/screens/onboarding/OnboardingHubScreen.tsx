import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/types";
import { ListRow, ScreenContainer, ScreenHeader, ProgressBar, IconCircle } from "../../components";
import { onboardingService, DocumentStatus } from "../../services";
import { useOnboardingStore } from "../../store/onboardingStore";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<OnboardingStackParamList, "OnboardingHub">;

// Mirrors the Figma "Welcome Screen" frames (nodes 671:8670 / 671:8739 —
// the same hub at "0 of 4" vs "1 of 4" progress) — one dynamic screen
// driven by real document/garage/photo status instead of two routes.
export function OnboardingHubScreen({ navigation }: Props) {
  const [licence, setLicence] = useState<DocumentStatus>("idle");
  const [aadhaar, setAadhaar] = useState<DocumentStatus>("idle");
  const garageDone = useOnboardingStore((s) => s.garageDone);
  const photoDone = useOnboardingStore((s) => s.photoDone);

  useFocusEffect(
    useCallback(() => {
      onboardingService.getDocumentStatus("drivingLicence").then(setLicence);
      onboardingService.getDocumentStatus("aadhaarCard").then(setAadhaar);
    }, [])
  );

  const completed = [licence === "verified", aadhaar === "verified", garageDone, photoDone].filter(Boolean).length;
  const allDone = completed === 4;

  const rowStatus = (status: DocumentStatus | boolean) => {
    if (status === "verified" || status === true) return { label: "COMPLETED", color: colors.success };
    if (status === "verifying" || status === "uploading") return { label: "In review", color: colors.warning };
    if (status === "failed") return { label: "Action needed", color: colors.error };
    return null;
  };

  return (
    <ScreenContainer>
      <ScreenHeader onBack={() => navigation.goBack()} />
      <Text style={styles.title}>Welcome, Raja</Text>
      <Text style={styles.subtitle}>Complete four verification steps to start driving with Luxorides.</Text>

      <Text style={styles.progressLabel}>
        <Text style={styles.bold}>{completed}</Text> of <Text style={styles.bold}>4</Text> steps completed
      </Text>
      <ProgressBar steps={4} completedSteps={completed} />

      <View style={{ height: spacing.xl }} />

      <View style={{ gap: spacing.xs }}>
        <ListRow
          icon={<IconCircle><Feather name="credit-card" size={20} color={colors.textPrimary} /></IconCircle>}
          title="Driving Licence"
          subtitle={rowStatus(licence)?.label ?? "Verify your Driving Licence to continue"}
          onPress={() => navigation.navigate("DocEntry", { doc: "drivingLicence" })}
        />
        <ListRow
          icon={<IconCircle><Feather name="shield" size={20} color={colors.textPrimary} /></IconCircle>}
          title="Aadhaar Card"
          subtitle={rowStatus(aadhaar)?.label ?? "Verify your identity using Aadhaar Card"}
          onPress={() => navigation.navigate("DocEntry", { doc: "aadhaarCard" })}
        />
        <ListRow
          icon={<IconCircle><Feather name="home" size={20} color={colors.textPrimary} /></IconCircle>}
          title="Garage Location"
          subtitle={garageDone ? "COMPLETED" : "Select the location of your assigned Garage"}
          onPress={() => navigation.navigate("GarageLocation")}
        />
        <ListRow
          icon={<IconCircle><Feather name="user" size={20} color={colors.textPrimary} /></IconCircle>}
          title="Profile Picture"
          subtitle={photoDone ? "COMPLETED" : "Upload a clear photo to verify your identity"}
          onPress={() => navigation.navigate("ProfilePhoto")}
        />
      </View>

      <View style={{ flex: 1 }} />

      {allDone ? (
        <ListRow
          icon={<IconCircle tone="success"><Feather name="check" size={20} color={colors.success} /></IconCircle>}
          title="Submit for Approval"
          subtitle="All steps completed — submit to Operations"
          onPress={() => navigation.navigate("AlmostReady")}
        />
      ) : (
        <ListRow
          icon={<Feather name="lock" size={20} color={colors.textSecondary} />}
          title="Your information is secure"
          subtitle="Used only for verification purposes."
          showChevron={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.xs },
  progressLabel: { ...type.body1, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.sm },
  bold: { fontFamily: type.h4.fontFamily },
});
