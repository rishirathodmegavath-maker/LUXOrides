import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Feather } from "@expo/vector-icons";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { useDrawerStatus } from "@react-navigation/drawer";
import { BrandWordmark, ListRow, QrPaymentCard } from "../components";
import { dutyService } from "../services";
import { useDutyStore } from "../store/dutyStore";
import { colors, spacing, type } from "../theme";

// Mirrors the Figma side-drawer "Home Menu Bar" frames (nodes 671:10006 /
// 671:10174): dark navy header with the brand wordmark, the QR payment
// panel, then Help/Privacy/Terms/About rows and a footer wordmark.
export function SideDrawerContent({ navigation }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const dutyEndResult = useDutyStore((s) => s.dutyEndResult);
  const version = Constants.expoConfig?.version ?? "0.0.0";

  // dutyEndResult is a one-shot snapshot captured the moment the duty ended
  // -- it never reflects a payment that gets confirmed afterwards. Under the
  // MOCK gateway (this org's actual configured gateway today -- see
  // MockPaymentService.generateMockQr) that snapshot's qrCodeUrl is *always*
  // null and the payment is already auto-confirmed by the time this drawer
  // can even show it, so trusting the snapshot alone rendered a permanently
  // empty QR box with a "please scan" prompt for a trip that was already
  // paid. Re-checking real status (same call PaymentQrScreen already makes)
  // every time the drawer is actually opened fixes that -- paid only ever
  // escalates true -> never back to false client-side, matching
  // PaymentQrScreen's own financial-integrity rule.
  const drawerStatus = useDrawerStatus();
  const [paid, setPaid] = useState(false);
  const [liveQrCodeUrl, setLiveQrCodeUrl] = useState<string | null>(null);

  // "Adjusting state during render" (not an effect) so a new dutyEndResult
  // (the next duty) never briefly shows the PREVIOUS duty's "already paid"
  // state before its own live check resolves -- React applies this reset
  // before the screen ever paints the stale value.
  const [trackedDutyEndResult, setTrackedDutyEndResult] = useState(dutyEndResult);
  if (dutyEndResult !== trackedDutyEndResult) {
    setTrackedDutyEndResult(dutyEndResult);
    setPaid(false);
    setLiveQrCodeUrl(null);
  }

  useEffect(() => {
    if (!dutyEndResult || drawerStatus !== "open") return;

    let cancelled = false;
    dutyService
      .checkPaymentStatus()
      .then((status) => {
        if (cancelled) return;
        if (status.paid) setPaid(true);
        if (status.qrImageUrl) setLiveQrCodeUrl(status.qrImageUrl);
      })
      .catch(() => {
        // Best-effort refresh -- the drawer just keeps showing the duty-end
        // snapshot if the live check fails.
      });
    return () => {
      cancelled = true;
    };
  }, [drawerStatus, dutyEndResult]);

  const qrCodeUrl = liveQrCodeUrl ?? dutyEndResult?.qrCodeUrl ?? null;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
        <BrandWordmark variant="light" size="sm" />
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {dutyEndResult ? (
          <>
            <QrPaymentCard qrCodeUrl={qrCodeUrl} amount={dutyEndResult.amountToCollect} paid={paid} />
            <View style={{ height: spacing.lg }} />
          </>
        ) : null}

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
          onPress={() => navigation.navigate("PoliciesLegal")}
        />
        <View style={{ height: spacing.xs }} />
        <ListRow
          icon={<Feather name="file-text" size={20} color={colors.textPrimary} />}
          title="Terms of Service"
          subtitle="Read our terms and conditions"
          onPress={() => navigation.navigate("PoliciesLegal")}
        />
        <View style={{ height: spacing.xs }} />
        <ListRow
          icon={<Feather name="info" size={20} color={colors.textPrimary} />}
          title="About"
          subtitle="About LuxoRides Chauffeur"
          onPress={() => navigation.navigate("About")}
        />

        <View style={styles.footer}>
          <BrandWordmark size="sm" />
          <Text style={styles.footerVersion}>v{version} · Phase 1</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingBottom: spacing.xl, alignItems: "center" },
  body: { padding: spacing.lg },
  footer: { alignItems: "center", marginTop: spacing.xxl },
  footerVersion: { ...type.caption, color: colors.textMuted, marginTop: spacing.xs },
});
