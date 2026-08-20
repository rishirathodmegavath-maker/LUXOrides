import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, Card, ConsentCheckbox, ScreenContainer, ScreenHeader, TextField } from "../../components";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "DropOff">;

// Mirrors the Figma "Drop Off" frame (node 675:11655) — optional toll/
// parking expenses before generating the client bill.
export function DropOffScreen({ navigation }: Props) {
  const [hasExpense, setHasExpense] = useState(false);
  const [amount, setAmount] = useState("");

  return (
    <ScreenContainer footer={<Button label="Generate Bill" onPress={() => navigation.navigate("TripSummary")} />}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Trip Complete" />
      <View style={styles.iconWrap}>
        <Feather name="check-circle" size={44} color={colors.success} />
      </View>
      <Text style={styles.title}>Trip Completed</Text>
      <Text style={styles.subtitle}>Add any extra tolls, parking, or stop charges before generating the client bill.</Text>

      <Card style={{ marginTop: spacing.xl }}>
        <ConsentCheckbox
          checked={hasExpense}
          onToggle={setHasExpense}
          label="Add expense (toll / parking / stops)"
        />
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
