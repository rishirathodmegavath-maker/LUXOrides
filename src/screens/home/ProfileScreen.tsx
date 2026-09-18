import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainTabParamList, RootStackParamList } from "../../navigation/types";
import { Button, Card, InlineErrorBanner, ListRow, ScreenContainer } from "../../components";
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
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const reset = useAuthStore((s) => s.reset);

  useEffect(() => {
    let active = true;
    driverService
      .getProfile()
      .then((p) => {
        if (!active) return;
        setProfile(p);
        setLoadError(false);
      })
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const onLogout = async () => {
    await authService.logout();
    reset();
  };

  return (
    <ScreenContainer footer={<Button label="Log Out" variant="secondary" onPress={onLogout} />}>
      <Text style={styles.title}>Profile</Text>

      {loadError ? (
        <InlineErrorBanner
          message="Couldn't load your profile."
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      ) : null}

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
        icon={<Feather name="user" size={20} color={colors.textPrimary} />}
        title="Profile Info"
        subtitle="Personal details & documents"
        onPress={() => navigation.navigate("ProfileInfo")}
      />
      <View style={{ height: spacing.xs }} />
      <ListRow
        icon={<Feather name="home" size={20} color={colors.textPrimary} />}
        title="Garage"
        subtitle={profile?.garageAddress ?? "Set your garage location"}
        onPress={() => navigation.navigate("ProfileInfo")}
      />
      <View style={{ height: spacing.xs }} />
      <ListRow
        icon={<Feather name="briefcase" size={20} color={colors.textPrimary} />}
        title="Experience"
        subtitle={profile?.experienceYears ? `${profile.experienceYears} years` : "Not specified"}
        onPress={() => navigation.navigate("ProfileInfo")}
      />
      <View style={{ height: spacing.xs }} />
      <ListRow
        icon={<Feather name="file-text" size={20} color={colors.textPrimary} />}
        title="Documents"
        subtitle="Driving Licence & Aadhaar verification"
        onPress={() => navigation.navigate("Documents")}
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
      <View style={{ height: spacing.xs }} />
      <ListRow
        icon={<Feather name="shield" size={20} color={colors.textPrimary} />}
        title="Policies & Legal"
        subtitle="Terms, privacy and cancellation policies"
        onPress={() => navigation.navigate("PoliciesLegal")}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
