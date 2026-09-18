import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { Button, Card, ScreenContainer, ScreenHeader } from "../../components";
import { isCriticalPoint, POLICIES } from "../../constants/policies";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "PoliciesLegal">;

// Same three policies, same wording, same "Read Full Policy" targets as the
// Customer App's Policies & Legal screen (components/views/PoliciesView.tsx)
// -- see src/constants/policies.ts.
export function PoliciesLegalScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <ScreenHeader onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} title="Policies & Legal" />

      {POLICIES.map((policy, index) => (
        <React.Fragment key={policy.type}>
          <Card>
            <View style={styles.header}>
              <Text style={styles.title}>{policy.title}</Text>
              <Text style={styles.version}>{policy.version}</Text>
            </View>
            <Text style={styles.lastUpdated}>Last updated: {policy.lastUpdated}</Text>

            <View style={styles.bulletList}>
              {policy.summaryPoints.map((point, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, isCriticalPoint(point) && styles.criticalText]}>{"•"}</Text>
                  <Text style={[styles.bulletText, isCriticalPoint(point) && styles.criticalText]}>{point}</Text>
                </View>
              ))}
            </View>

            <Button
              label="Read Full Policy"
              variant="secondary"
              trailingIcon={<Feather name="external-link" size={16} color={colors.primary} />}
              onPress={() => Linking.openURL(policy.fullUrl).catch(() => {})}
              style={styles.readButton}
            />
          </Card>
          {index < POLICIES.length - 1 ? <View style={{ height: spacing.md }} /> : null}
        </React.Fragment>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { ...type.h3, color: colors.textPrimary, flex: 1 },
  version: { ...type.caption, color: colors.textMuted },
  lastUpdated: { ...type.caption, color: colors.textMuted, marginTop: spacing.xxs },
  bulletList: { marginTop: spacing.md, gap: spacing.xs },
  bulletRow: { flexDirection: "row", gap: spacing.xs },
  bulletDot: { ...type.body2, color: colors.textSecondary },
  bulletText: { ...type.body2, color: colors.textSecondary, flex: 1 },
  criticalText: { color: colors.error },
  readButton: { marginTop: spacing.lg },
});
