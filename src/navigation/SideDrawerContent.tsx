import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { BrandWordmark, ListRow, QrPaymentCard } from "../components";
import { colors, spacing, type } from "../theme";

// Mirrors the Figma side-drawer "Home Menu Bar" frames (nodes 671:10006 /
// 671:10174): dark navy header with the brand wordmark, the QR payment
// panel, then Help/Privacy/Terms/About rows and a footer wordmark.
export function SideDrawerContent({ navigation }: DrawerContentComponentProps) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <BrandWordmark variant="light" size="sm" />
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <QrPaymentCard />

        <View style={{ height: spacing.lg }} />

        <ListRow
          icon={<Feather name="headphones" size={20} color={colors.textPrimary} />}
          title="Help & Support"
          subtitle="Chat, FAQs & contact support"
          onPress={() => navigation.navigate("HelpStack", { screen: "Help" })}
        />
        <View style={{ height: spacing.xs }} />
        <ListRow
          icon={<Feather name="shield" size={20} color={colors.textPrimary} />}
          title="Privacy Policy"
          subtitle="Learn how we protect your data"
        />
        <View style={{ height: spacing.xs }} />
        <ListRow
          icon={<Feather name="file-text" size={20} color={colors.textPrimary} />}
          title="Terms of Service"
          subtitle="Read our terms and conditions"
        />
        <View style={{ height: spacing.xs }} />
        <ListRow
          icon={<Feather name="info" size={20} color={colors.textPrimary} />}
          title="About"
          subtitle="About LuxoRides Chauffeur"
        />

        <View style={styles.footer}>
          <BrandWordmark size="sm" />
          <Text style={styles.footerVersion}>v1.0.0 · Phase 1</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 64, paddingBottom: spacing.xl, alignItems: "center" },
  body: { padding: spacing.lg },
  footer: { alignItems: "center", marginTop: spacing.xxl },
  footerVersion: { ...type.caption, color: colors.textMuted, marginTop: spacing.xs },
});
