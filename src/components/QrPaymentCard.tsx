import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { paymentService } from "../services";
import { colors, radius, spacing, type } from "../theme";
import { Button } from "./Button";

// Mirrors the payment QR panel seen in the Figma side-drawer / payment
// flow: LuxoRides UPI identity, a QR block, and a "Share QR Code" action.
// A real QR image isn't rendered (no QR-generation lib in Phase 1 scope);
// the bordered placeholder communicates the same layout.
export function QrPaymentCard() {
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    paymentService.getQrPaymentInfo().then((info) => setUpiId(info.upiId));
  }, []);

  return (
    <View>
      <View style={styles.notice}>
        <Feather name="shield" size={18} color={colors.successStrong} />
        <Text style={styles.noticeText}>
          Payments are made directly to LuxoRides. Chauffeurs do not collect or receive client payments.
        </Text>
      </View>

      <View style={styles.upiRow}>
        <View style={styles.upiIcon}>
          <Feather name="check-circle" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.upiTitle}>LuxoRides Payment</Text>
          <Text style={styles.upiId}>UPI ID: {upiId}</Text>
        </View>
      </View>

      <View style={styles.qrFrame}>
        <Feather name="grid" size={140} color={colors.primary} />
      </View>
      <Text style={styles.qrCaption}>Ask the client to scan this QR code and complete the payment.</Text>

      <Button label="Share QR Code" variant="secondary" leadingIcon={<Feather name="share" size={18} color={colors.primary} />} />
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.successBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeText: { ...type.body2, color: colors.successStrong, flex: 1 },
  upiRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
  upiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.teal[50],
    alignItems: "center",
    justifyContent: "center",
  },
  upiTitle: { ...type.h4, fontSize: 16, color: colors.textPrimary },
  upiId: { ...type.body2, color: colors.textSecondary },
  qrFrame: {
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  qrCaption: { ...type.body2, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.lg },
});
