import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { BrandWordmark, Card, ListRow, ScreenContainer, ScreenHeader } from "../../components";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "About">;

// Version is read from the real app config (same source as the force-update
// gate's getInstalledVersion, see versionGateBoot.ts) -- never hardcoded, so
// it can't drift from what's actually installed.
export function AboutScreen({ navigation }: Props) {
  const version = Constants.expoConfig?.version ?? "0.0.0";
  const buildNumber =
    (Constants.expoConfig?.android?.versionCode ?? Constants.expoConfig?.ios?.buildNumber) ?? undefined;

  return (
    <ScreenContainer>
      <ScreenHeader onBack={() => navigation.goBack()} title="About" />

      <View style={styles.brandWrap}>
        <BrandWordmark size="lg" />
        <Text style={styles.version}>
          Version {version}
          {buildNumber ? ` (${buildNumber})` : ""}
        </Text>
      </View>

      <Card>
        <Text style={styles.body}>
          LuxoRides Chauffeur is the driver app for LuxoRides&apos; chauffeur-driven car rental platform — duty execution,
          trip payments, and document verification for drivers on the LuxoRides network.
        </Text>
      </Card>

      <View style={{ height: spacing.lg }} />

      <ListRow
        icon={<Feather name="shield" size={20} color={colors.textPrimary} />}
        title="Policies & Legal"
        subtitle="Terms, privacy and cancellation policies"
        onPress={() => navigation.navigate("PoliciesLegal")}
      />
      <View style={{ height: spacing.xs }} />
      <ListRow
        icon={<Feather name="headphones" size={20} color={colors.textPrimary} />}
        title="Help & Support"
        subtitle="Chat, FAQs & contact support"
        onPress={() => navigation.navigate("HelpStack", { screen: "Help" })}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  brandWrap: { alignItems: "center", marginVertical: spacing.xl, gap: spacing.xs },
  version: { ...type.body2, color: colors.textSecondary },
  body: { ...type.body1, color: colors.textPrimary, lineHeight: 22 },
});
