import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, ScreenContainer } from "../../components";
import { dutyService } from "../../services";
import { track } from "../../services/analytics";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "ArrivedAtDropOff">;

// Mirrors the Figma "Arrived at Drop Off" frame (node 675:11577).
export function ArrivedAtDropOffScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);

  const onContinue = async () => {
    setLoading(true);
    try {
      await dutyService.markArrivedAtDropoff();
      track("drop_completed");
      navigation.navigate("DropOff");
    } catch (e) {
      // Without this, a failure left `loading` true forever -- the button
      // stuck on its spinner with no way to retry or navigate away.
      Alert.alert("Couldn't continue", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer style={styles.wrap} footer={<Button label="Continue" onPress={onContinue} loading={loading} />}>
      <View style={styles.iconWrap}>
        <Feather name="flag" size={44} color={colors.gold[500]} />
      </View>
      <Text style={styles.title}>You&apos;ve arrived at the drop-off</Text>
      <Text style={styles.subtitle}>Help your client out safely, then continue to close out the trip.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.gold[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { ...type.h1, color: colors.textPrimary, textAlign: "center" },
  subtitle: { ...type.body1, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
});
