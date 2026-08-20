import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, Card, ConsentCheckbox, PhotoCapture, ScreenContainer, ScreenHeader, TextField } from "../../components";
import { dutyService } from "../../services";
import { useDutyStore } from "../../store/dutyStore";
import { captureCurrentLocation } from "../../util/location";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "DropOff">;

// Mirrors the Figma "Drop Off" frame (node 675:11655) — optional toll/
// parking expenses before generating the client bill. The odometer-km
// field and photo capture are an original addition, same reason as
// DutyStartMapScreen: the real backend requires both to end a duty.
export function DropOffScreen({ navigation }: Props) {
  const setDutyEndResult = useDutyStore((s) => s.setDutyEndResult);
  const [hasExpense, setHasExpense] = useState(false);
  const [amount, setAmount] = useState("");
  const [odometerKm, setOdometerKm] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = !!odometerKm && !!photoUri;

  const onGenerateBill = async () => {
    if (!canSubmit || !photoUri) return;
    setSubmitting(true);
    try {
      const location = await captureCurrentLocation();
      const result = await dutyService.endDuty({
        odometerKm: Number(odometerKm),
        photoUri,
        location,
        expenseAmount: hasExpense && amount ? Number(amount) : undefined,
      });
      setDutyEndResult(result);
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

        <View style={{ marginTop: spacing.md }}>
          <ConsentCheckbox
            checked={hasExpense}
            onToggle={setHasExpense}
            label="Add expense (toll / parking / stops)"
          />
        </View>
        {hasExpense ? (
          <TextField
            label="Expense Amount (₹)"
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ""))}
            placeholder="0"
            keyboardType="number-pad"
            containerStyle={{ marginTop: spacing.md }}
          />
        ) : null}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: "center", marginBottom: spacing.md },
  title: { ...type.h1, color: colors.textPrimary, textAlign: "center" },
  subtitle: { ...type.body1, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
});
