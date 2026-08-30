import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, Card, ScreenContainer, ScreenHeader, StatusToggle } from "../../components";
import type { FareBreakdown, ReturnRoute } from "../../services/types";
import { useDutyStore } from "../../store/dutyStore";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "PaymentBilling">;

function money(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function km(n: number) {
  return `${n.toLocaleString("en-IN", { maximumFractionDigits: 1 })} km`;
}

function hrs(seconds: number | null) {
  if (seconds == null) return null;
  return `${(seconds / 3600).toLocaleString("en-IN", { maximumFractionDigits: 2 })} hr`;
}

function titleCase(s: string | null) {
  if (!s) return null;
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function baseFareLabel(fare: FareBreakdown): string {
  const dutyType = titleCase(fare.dutyTypeLabel);
  const included =
    fare.includedTimeUnits != null && fare.includedDistanceKm != null
      ? `${fare.includedTimeUnits} ${fare.packageUnit ?? "hrs"} / ${fare.includedDistanceKm} km`
      : null;

  const parts = [dutyType, included].filter(Boolean);
  return parts.length > 0 ? `Base fare (${parts.join(" · ")})` : "Base fare";
}

// A backend-real leg with genuinely zero distance/duration is indistinguishable from
// GarageReturnEstimate.zero() (drop or garage location missing, or the geo lookup
// failed) except by routeAvailable + both figures being exactly zero -- that combination
// is the "nothing to show" sentinel; anything else is a real (possibly road-geometry-free)
// estimate and must be shown, not hidden.
function returnLegUnavailable(route: ReturnRoute | null): boolean {
  if (!route) return true;
  return !route.routeAvailable && route.distanceKm === 0 && route.durationSeconds === 0;
}

// Mirrors the "FINAL FARE" reference screen: garage-to-garage fare including the
// estimated return leg, broken down exactly as Fleetovo computed it (BookingUtil /
// PackageFareBreakdownFactory) -- every figure here comes straight from the real
// /driver-api/duty/{token}/end response already stored in dutyEndResult. Nothing on
// this screen is computed on-device; rows for data the backend didn't return show
// "Unavailable" rather than a fabricated number.
export function PaymentBillingScreen({ navigation }: Props) {
  const result = useDutyStore((s) => s.dutyEndResult);
  const online = useDutyStore((s) => s.online);

  const fare: FareBreakdown | null = result?.fareBreakdown ?? null;
  const returnRoute = result?.returnRoute ?? null;
  const legUnavailable = returnLegUnavailable(returnRoute);

  const projectedTotalKm = result?.projectedTotalKm ?? null;
  const projectedTotalHrs = fare ? hrs(fare.projectedTotalDurationSeconds) : null;

  return (
    <ScreenContainer
      footer={
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Button label="Cash Received" variant="secondary" style={{ flex: 1 }} onPress={() => navigation.navigate("CashPaymentReceived")} />
          <Button label="Proceed to Payment" style={{ flex: 1 }} onPress={() => navigation.navigate("PaymentQr")} />
        </View>
      }
    >
      <View style={styles.header}>
        <Feather name="menu" size={24} color={colors.textPrimary} />
        <StatusToggle online={online} onToggle={() => {}} />
        <Feather name="bell" size={24} color={colors.textPrimary} />
      </View>
      <ScreenHeader onBack={() => navigation.goBack()} />
      <Text style={styles.title}>Final Fare</Text>
      <Text style={styles.subtitle}>
        Complete garage-to-garage fare, including the estimated return leg. This amount will not change from here.
      </Text>

      {result ? (
        <Card style={{ marginTop: spacing.xl }}>
          {fare ? (
            <>
              <Row
                label={baseFareLabel(fare)}
                value={fare.baseFareAmount != null ? money(fare.baseFareAmount) : "Unavailable"}
                emphasis
              />
              <Divider />
            </>
          ) : null}

          <Row
            label="Actual driven distance"
            sublabel="Garage → Drop via Pickup"
            value={result.actualDrivenKm != null ? km(result.actualDrivenKm) : "Unavailable"}
          />

          <Row
            label="Estimated · Drop → Garage (C→A)"
            value={
              legUnavailable
                ? "Unavailable"
                : `${km(returnRoute!.distanceKm)}${hrs(returnRoute!.durationSeconds) ? ` · ${hrs(returnRoute!.durationSeconds)}` : ""}`
            }
          />

          <Divider />

          <Row
            label="Projected total (A→A)"
            value={
              projectedTotalKm != null
                ? `${projectedTotalKm.toLocaleString("en-IN", { maximumFractionDigits: 1 })}${
                    fare?.includedDistanceKm != null ? ` / ${fare.includedDistanceKm}` : ""
                  } km${projectedTotalHrs ? ` · ${projectedTotalHrs}` : ""}`
                : "Unavailable"
            }
          />

          {fare ? (
            <>
              <Row
                label={`Extra distance${fare.extraDistanceRatePerKm != null ? ` (₹${fare.extraDistanceRatePerKm}/km)` : ""}`}
                value={`${fare.extraDistanceKm.toLocaleString("en-IN", { maximumFractionDigits: 1 })} km · ${money(fare.extraDistanceCharge)}`}
              />
              <Row
                label={`Extra time${fare.extraTimeRatePerHour != null ? ` (₹${fare.extraTimeRatePerHour}/hr)` : ""}`}
                value={`${fare.extraTimeHours.toLocaleString("en-IN", { maximumFractionDigits: 2 })} hr · ${money(fare.extraTimeCharge)}`}
              />
            </>
          ) : null}

          <Row label="Expenses" value={money(result.expensesTotal ?? 0)} />

          {result.gstAmount ? (
            <Row
              label={`GST${result.gstRatePercent != null ? ` (${result.gstRatePercent}%)` : ""}`}
              value={money(result.gstAmount)}
            />
          ) : null}

          <Divider />

          <View style={styles.finalRow}>
            <Text style={styles.finalLabel}>FINAL AMOUNT</Text>
            <Text style={styles.amountValue}>{money(result.amountToCollect)}</Text>
          </View>
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

function Row({ label, sublabel, value, emphasis }: { label: string; sublabel?: string; value: string; emphasis?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, emphasis && styles.rowLabelEmphasis]}>{label}</Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      <Text style={[styles.rowValue, emphasis && styles.rowValueEmphasis]}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg },
  title: { ...type.h1, color: colors.textPrimary, textAlign: "center" },
  subtitle: { ...type.body2, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs },
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingVertical: spacing.sm, gap: spacing.md },
  rowLabel: { ...type.body2, color: colors.textSecondary, flexShrink: 1 },
  rowLabelEmphasis: { color: colors.textPrimary, fontWeight: "600" },
  rowSublabel: { ...type.body3, color: colors.textSecondary, marginTop: 2 },
  rowValue: { ...type.body2, color: colors.textPrimary, textAlign: "right" },
  rowValueEmphasis: { fontWeight: "700" },
  divider: { height: 1, backgroundColor: colors.borderMuted, marginVertical: spacing.sm },
  finalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: spacing.xs },
  finalLabel: { ...type.h4, color: colors.textPrimary },
  amountValue: { ...type.display, color: colors.success },
});
