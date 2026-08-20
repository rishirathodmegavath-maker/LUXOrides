import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainTabParamList, RootStackParamList } from "../../navigation/types";
import { Button, Card, ListRow } from "../../components";
import { authService, driverService, DriverProfile } from "../../services";
import { useAuthStore } from "../../store/authStore";
import { colors, radius, spacing, type } from "../../theme";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Profile">,
  NativeStackScreenProps<RootStackParamList>
>;

// NOTE: like Activity, no full "Profile" tab screen frame exists in the
// Figma file — only a "Profile Nav Bar" tab-icon component (node
// 435:2709). This screen is original content matching the design system
// (driver identity card + document/garage summary + logout), not
// reproduced from a Figma frame. Flagged in the fidelity report.
export function ProfileScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const reset = useAuthStore((s) => s.reset);

  useEffect(() => {
    driverService.getProfile().then(setProfile);
  }, []);

  const onLogout = async () => {
    await authService.logout();
    reset();
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Profile</Text>

      <Card style={styles.identityCard}>
        <View style={styles.avatar}>
          <Feather name="user" size={32} color={colors.textInverse} />
        </View>
        <Text style={styles.name}>{profile?.name ?? "—"}</Text>
        <Text style={styles.phone}>{profile?.phone ?? ""}</Text>
        <View style={styles.approvedPill}>
          <Feather name="check-circle" size={14} color={colors.successStrong} />
          <Text style={styles.approvedText}>Approved Chauffeur</Text>
        </View>
      </Card>

      <View style={{ height: spacing.lg }} />

      <ListRow
        icon={<Feather name="home" size={20} color={colors.textPrimary} />}
        title="Garage"
        subtitle={profile?.garageName ?? "—"}
        showChevron={false}
      />
      <View style={{ height: spacing.xs }} />
      <ListRow
        icon={<Feather name="briefcase" size={20} color={colors.textPrimary} />}
        title="Experience"
        subtitle={profile?.experienceYears ? `${profile.experienceYears} years` : "Not specified"}
        showChevron={false}
      />
      <View style={{ height: spacing.xs }} />
      <ListRow
        icon={<Feather name="credit-card" size={20} color={colors.textPrimary} />}
        title="Payment & Billing"
        subtitle="UPI details, QR code"
        onPress={() => navigation.navigate("Duty", { screen: "PaymentQr" })}
      />
      <View style={{ height: spacing.xs }} />
      <ListRow
        icon={<Feather name="help-circle" size={20} color={colors.textPrimary} />}
        title="Help & Support"
        onPress={() => navigation.navigate("HelpStack", { screen: "Help" })}
      />

      <View style={{ flex: 1 }} />
      <Button label="Log Out" variant="secondary" onPress={onLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingTop: 56, padding: spacing.lg },
  title: { ...type.h1, color: colors.textPrimary, marginBottom: spacing.lg },
  identityCard: { alignItems: "center" },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  name: { ...type.h3, color: colors.textPrimary },
  phone: { ...type.body2, color: colors.textSecondary },
  approvedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.successBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  approvedText: { ...type.caption, color: colors.successStrong },
});
