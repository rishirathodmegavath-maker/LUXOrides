import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, Card, Dropdown, PhotoCapture, ScreenContainer, ScreenHeader, TextField } from "../../components";
import { dutyService } from "../../services";
import { track } from "../../services/analytics";
import type { DutyExpenseEntry, ExpenseCategory } from "../../services/types";
import { useDutyStore } from "../../store/dutyStore";
import { useOdometerOcrCheck } from "../../hooks/useOdometerOcrCheck";
import { captureCurrentLocation } from "../../util/location";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "DropOff">;

const EXPENSE_CATEGORY_OPTIONS: { label: string; value: ExpenseCategory }[] = [
  { label: "Toll", value: "TOLL" },
  { label: "Parking", value: "PARKING" },
  { label: "State Tax", value: "STATE_TAX" },
  { label: "Other", value: "OTHER" },
];

const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  TOLL: "Toll",
  PARKING: "Parking",
  STATE_TAX: "State Tax",
  OTHER: "Other",
};

function money(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

// Mirrors the Figma "Drop Off" frame (node 675:11655) plus the "Add Expense"
// reference screens -- one or more real, categorized, receipted expenses
// (TOLL/PARKING/STATE_TAX/OTHER, matching com.core.models.enums.
// DriverDutyExpenseType exactly) built up locally here, then submitted
// together with the real /end call. Nothing here computes or previews a
// customer-payable total: the backend is the only place that ever turns
// these into a billed amount (see PaymentBillingScreen, which reads the
// result). The odometer-km field and photo capture are an original
// addition, same reason as DutyStartMapScreen: the real backend requires
// both to end a duty.
export function DropOffScreen({ navigation }: Props) {
  const setDutyEndResult = useDutyStore((s) => s.setDutyEndResult);
  const [odometerKm, setOdometerKm] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const odometerOcr = useOdometerOcrCheck(photoUri, odometerKm);

  const [expenses, setExpenses] = useState<DutyExpenseEntry[]>([]);
  const [addingExpense, setAddingExpense] = useState(false);
  const [draftCategory, setDraftCategory] = useState<ExpenseCategory | null>(null);
  const [draftAmount, setDraftAmount] = useState("");
  const [draftReceiptUri, setDraftReceiptUri] = useState<string | undefined>();
  const [draftNotes, setDraftNotes] = useState("");

  const canSubmit = !!odometerKm && !!photoUri;
  const canSaveExpense = !!draftCategory && Number(draftAmount) > 0 && !!draftReceiptUri;

  const resetDraft = () => {
    setDraftCategory(null);
    setDraftAmount("");
    setDraftReceiptUri(undefined);
    setDraftNotes("");
    setAddingExpense(false);
  };

  const onSaveExpense = () => {
    if (!canSaveExpense || !draftCategory || !draftReceiptUri) return;
    setExpenses((prev) => [
      ...prev,
      {
        type: draftCategory,
        amount: Number(draftAmount),
        description: draftNotes.trim() || undefined,
        receiptUri: draftReceiptUri,
      },
    ]);
    resetDraft();
  };

  const onRemoveExpense = (index: number) => {
    setExpenses((prev) => prev.filter((_, i) => i !== index));
  };

  const onGenerateBill = async () => {
    if (!canSubmit || !photoUri) return;
    setSubmitting(true);
    try {
      const location = await captureCurrentLocation();
      const result = await dutyService.endDuty({
        odometerKm: Number(odometerKm),
        photoUri,
        location,
        expenses,
      });
      setDutyEndResult(result);
      track("bill_generated");
      navigation.navigate("TripSummary");
    } catch (e) {
      Alert.alert("Couldn't complete duty", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      footer={<Button label="Generate Bill" onPress={onGenerateBill} disabled={!canSubmit} loading={submitting} />}
    >
      <ScreenHeader onBack={() => navigation.goBack()} title="Trip Complete" />
      <View style={styles.iconWrap}>
        <Feather name="check-circle" size={44} color={colors.success} />
      </View>
      <Text style={styles.title}>Trip Completed</Text>
      <Text style={styles.subtitle}>Add any extra tolls, parking, or stop charges before generating the client bill.</Text>

      <Card style={{ marginTop: spacing.xl }}>
        <TextField
          label="Odometer Reading (Km)"
          value={odometerKm}
          onChangeText={(t) => setOdometerKm(t.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          placeholder="e.g. 12580"
        />
        <View style={{ marginTop: spacing.md }}>
          <PhotoCapture uri={photoUri} status="idle" onCapture={setPhotoUri} label="Photo of odometer" compact />
        </View>
        {odometerOcr.checking ? (
          <Text style={styles.ocrHint}>Checking odometer photo…</Text>
        ) : odometerOcr.mismatch ? (
          <View style={styles.ocrWarning}>
            <Feather name="alert-triangle" size={14} color={colors.warning} />
            <Text style={styles.ocrWarningText}>
              This doesn&apos;t match the reading in the photo
              {odometerOcr.recognizedDigits ? ` (photo shows ${odometerOcr.recognizedDigits})` : ""}. Please double-check.
            </Text>
          </View>
        ) : null}
      </Card>

      <Text style={styles.sectionTitle}>Expenses</Text>

      {expenses.map((expense, index) => (
        <Card key={index} style={styles.expenseRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.expenseCategory}>{CATEGORY_LABEL[expense.type]}</Text>
            {expense.description ? <Text style={styles.expenseNotes}>{expense.description}</Text> : null}
          </View>
          <Text style={styles.expenseAmount}>{money(expense.amount)}</Text>
          <Pressable
            onPress={() => onRemoveExpense(index)}
            hitSlop={8}
            style={styles.removeButton}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${CATEGORY_LABEL[expense.type]} expense`}
          >
            <Feather name="x" size={18} color={colors.error} />
          </Pressable>
        </Card>
      ))}

      {addingExpense ? (
        <Card style={{ marginTop: spacing.sm }}>
          <Dropdown
            label="Category"
            value={draftCategory}
            options={EXPENSE_CATEGORY_OPTIONS}
            onChange={(v) => setDraftCategory(v as ExpenseCategory)}
            placeholder="Select a category"
          />
          <TextField
            label="Amount (₹)"
            value={draftAmount}
            onChangeText={(t) => setDraftAmount(t.replace(/[^0-9]/g, ""))}
            placeholder="0"
            keyboardType="number-pad"
            containerStyle={{ marginTop: spacing.md }}
          />
          <View style={{ marginTop: spacing.md }}>
            <PhotoCapture uri={draftReceiptUri} status="idle" onCapture={setDraftReceiptUri} label="Receipt photo" compact />
          </View>
          <TextField
            label="Notes (optional)"
            value={draftNotes}
            onChangeText={setDraftNotes}
            placeholder="e.g. NH48 toll plaza"
            containerStyle={{ marginTop: spacing.md }}
          />
          <View style={styles.draftActionsRow}>
            <Button label="Cancel" variant="secondary" onPress={resetDraft} style={{ flex: 1 }} />
            <Button label="Save Expense" onPress={onSaveExpense} disabled={!canSaveExpense} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : (
        <Pressable style={styles.addExpenseButton} onPress={() => setAddingExpense(true)} accessibilityRole="button">
          <Feather name="plus-circle" size={18} color={colors.primary} />
          <Text style={styles.addExpenseText}>Add Expense</Text>
        </Pressable>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  ocrHint: { ...type.body3, color: colors.textMuted, marginTop: spacing.sm },
  ocrWarning: { flexDirection: "row", alignItems: "flex-start", gap: spacing.xs, marginTop: spacing.sm },
  ocrWarningText: { ...type.body3, color: colors.warning, flex: 1 },
  iconWrap: { alignItems: "center", marginBottom: spacing.md },
  title: { ...type.h1, color: colors.textPrimary, textAlign: "center" },
  subtitle: { ...type.body1, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
  sectionTitle: { ...type.h4, fontSize: 16, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.sm },
  expenseRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  expenseCategory: { ...type.body1, color: colors.textPrimary },
  expenseNotes: { ...type.body3, color: colors.textSecondary, marginTop: 2 },
  expenseAmount: { ...type.h4, fontSize: 16, color: colors.textPrimary },
  removeButton: { padding: spacing.xxs },
  addExpenseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.control,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
  },
  addExpenseText: { ...type.label, color: colors.primary },
  draftActionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
});
