import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/types";
import { Button, ScreenContainer } from "../../components";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<OnboardingStackParamList, "NotApproved">;

// No Figma frame exists for the "Not Approved" branch either — the sitemap
// shows "Approved" and "Not Approved" as sibling outcomes of ops review,
// but only the approved path was ever mocked up (see AlmostReadyScreen's
// comment). Original content matching the app's design system.
export function NotApprovedScreen({ navigation }: Props) {
  return (
    <ScreenContainer
      style={styles.wrap}
      footer={<Button label="Resubmit Documents" onPress={() => navigation.replace("OnboardingHub")} />}
    >
      <View style={styles.iconWrap}>
        <Feather name="x-circle" size={44} color={colors.error} />
      </View>
      <Text style={styles.title}>Application Not Approved</Text>
      <Text style={styles.subtitle}>
        Our Operations team couldn&apos;t verify one or more of your documents. Please review and resubmit them to
        continue.
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
    backgroundColor: colors.errorBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { ...type.h1, color: colors.textPrimary, textAlign: "center" },
  subtitle: { ...type.body1, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
});
