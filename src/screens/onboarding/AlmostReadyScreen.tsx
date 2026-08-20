import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/types";
import { ScreenContainer } from "../../components";
import { onboardingService } from "../../services";
import { useAuthStore } from "../../store/authStore";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<OnboardingStackParamList, "AlmostReady">;

// Mirrors the Figma "Almost Ready Account" frame (node 671:9772). Once the
// mock approval resolves, RootNavigator automatically switches to the main
// app (see App.tsx gating on useAuthStore approvalStatus).
export function AlmostReadyScreen({ navigation }: Props) {
  const [approving, setApproving] = useState(true);
  const setApprovalStatus = useAuthStore((s) => s.setApprovalStatus);

  useEffect(() => {
    onboardingService.submitForApproval().then(async () => {
      const status = await onboardingService.getApprovalStatus();
      setApprovalStatus(status);
      setApproving(false);
      // "approved" is picked up by RootNavigator's gating (it swaps away
      // from this whole stack automatically). "rejected" isn't — this
      // stack stays mounted, so it needs an explicit navigate.
      if (status === "rejected") {
        navigation.replace("NotApproved");
      }
    });
  }, [setApprovalStatus, navigation]);

  return (
    <ScreenContainer style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Feather name={approving ? "clock" : "check-circle"} size={44} color={colors.primary} />
      </View>
      <Text style={styles.title}>Almost Ready!</Text>
      <Text style={styles.subtitle}>
        {approving
          ? "Your documents are with our Operations team for review. This usually takes a few minutes."
          : "You're approved! Taking you to your dashboard…"}
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.teal[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { ...type.h1, color: colors.textPrimary, textAlign: "center" },
  subtitle: { ...type.body1, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
});
