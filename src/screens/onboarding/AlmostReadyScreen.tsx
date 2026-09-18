import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/types";
import { Button, ScreenContainer } from "../../components";
import { onboardingService } from "../../services";
import { useAuthStore } from "../../store/authStore";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<OnboardingStackParamList, "AlmostReady">;

// Mirrors the Figma "Almost Ready Account" frame (node 671:9772). Once
// getApprovalStatus's real derivation resolves (see
// FleetovoOnboardingService's own comment -- both required documents
// genuinely submitted, not a simulated coin flip), RootNavigator
// automatically switches to the main app (see App.tsx gating on
// useAuthStore approvalStatus).
//
// In practice this whole Onboarding stack is unreachable for a real driver
// today: FleetovoAuthService marks a real login "approved" immediately
// (ops vets/creates every Driver row before OTP login is even possible --
// see its own comment), so resolveRootStack never routes here for a real
// session. Flagged in the Driver App audit as a deliberate-but-undecided
// architecture question, not something to change without a product call.
export function AlmostReadyScreen({ navigation }: Props) {
  const [approving, setApproving] = useState(true);
  // Previously: a failure anywhere in this chain left `approving` true
  // forever, and this screen has no back button or footer at all -- a
  // driver whose submission failed here was completely stuck with no way
  // out short of force-quitting the app.
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const setApprovalStatus = useAuthStore((s) => s.setApprovalStatus);

  useEffect(() => {
    let active = true;
    onboardingService
      .submitForApproval()
      .then(async () => {
        const status = await onboardingService.getApprovalStatus();
        if (!active) return;
        setApprovalStatus(status);
        setApproving(false);
        // "approved" is picked up by RootNavigator's gating (it swaps away
        // from this whole stack automatically). "rejected" isn't — this
        // stack stays mounted, so it needs an explicit navigate.
        if (status === "rejected") {
          navigation.replace("NotApproved");
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [setApprovalStatus, navigation, reloadKey]);

  return (
    <ScreenContainer style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Feather
          name={error ? "alert-triangle" : approving ? "clock" : "check-circle"}
          size={44}
          color={error ? colors.error : colors.primary}
        />
      </View>
      <Text style={styles.title}>{error ? "Couldn't submit for approval" : "Almost Ready!"}</Text>
      <Text style={styles.subtitle}>
        {error
          ? "Check your connection and try again."
          : approving
            ? "Your documents are with our Operations team for review. This usually takes a few minutes."
            : "You're approved! Taking you to your dashboard…"}
      </Text>
      {error ? (
        <Button
          label="Try Again"
          onPress={() => {
            setApproving(true);
            setError(false);
            setReloadKey((k) => k + 1);
          }}
          style={styles.retryButton}
        />
      ) : null}
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
  retryButton: { marginTop: spacing.xl, alignSelf: "stretch" },
});
