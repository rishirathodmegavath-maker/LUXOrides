import React from "react";
import { Image, Share, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radius, spacing, type } from "../theme";
import { Button } from "./Button";

export interface QrPaymentCardProps {
  qrCodeUrl?: string | null;
  amount?: number | null;
  paid?: boolean;
}

// Mirrors the payment QR panel seen in the Figma side-drawer / payment
// flow: LuxoRides identity, a QR block, and a "Share QR Code" action. When
// a real qrCodeUrl is available (from endDuty's PaymentInstruction) it
// renders that image; otherwise falls back to the placeholder frame.
export function QrPaymentCard({ qrCodeUrl, amount, paid }: QrPaymentCardProps) {
  // Reuses the QR/amount already loaded into this screen -- never triggers
  // a second QR/payment-status request just to share what's already shown.
  const onShare = async () => {
    if (!qrCodeUrl) return;
    const amountText = amount != null ? `₹${amount.toLocaleString("en-IN")}` : "the amount shown";
    try {
      await Share.share({
        message: `Scan this QR code to pay ${amountText} for your LuxoRides trip: ${qrCodeUrl}`,
        url: qrCodeUrl,
      });
    } catch {
      // Share sheet dismissed/failed -- nothing to recover, the QR itself is still visible on screen.
    }
  };

  return (
    <View>
      <View style={[styles.notice, paid && styles.noticePaid]}>
        <Feather name="shield" size={18} color={colors.successStrong} />
        <Text style={styles.noticeText}>
          {paid
            ? "Payment received — thank you."
            : "Payments are made directly to LuxoRides. Chauffeurs do not collect or receive client payments."}
        </Text>
      </View>

      <View style={styles.upiRow}>
        <View style={styles.upiIcon}>
          <Feather name="check-circle" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.upiTitle}>LuxoRides Payment</Text>
          {amount != null ? <Text style={styles.upiId}>Amount: ₹{amount.toLocaleString("en-IN")}</Text> : null}
        </View>
      </View>

      <View style={styles.qrFrame}>
        {qrCodeUrl ? (
          <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} resizeMode="contain" />
        ) : (
          <Feather name={paid ? "check-circle" : "grid"} size={140} color={paid ? colors.success : colors.primary} />
        )}
      </View>
      <Text style={styles.qrCaption}>
        {paid
          ? "This trip has already been paid for -- nothing left to collect."
          : qrCodeUrl
            ? "Ask the client to scan this QR code and complete the payment."
            : "A payment QR isn't available for this trip right now."}
      </Text>

      {!paid ? (
        <Button
          label="Share QR Code"
          variant="secondary"
          leadingIcon={<Feather name="share" size={18} color={colors.primary} />}
          onPress={onShare}
          disabled={!qrCodeUrl}
        />
      ) : null}
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
  noticePaid: { backgroundColor: colors.successBg },
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
    overflow: "hidden",
  },
  qrImage: { width: "100%", height: "100%" },
  qrCaption: { ...type.body2, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.lg },
});
