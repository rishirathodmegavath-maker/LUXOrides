import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing, type } from "../theme";

export interface ConsentCheckboxProps {
  checked: boolean;
  onToggle: (next: boolean) => void;
  label: React.ReactNode;
}

// Mirrors the Figma "Consent Box" component (node 281:2338): square
// checkbox, navy fill + white check when checked.
export function ConsentCheckbox({ checked, onToggle, label }: ConsentCheckboxProps) {
  return (
    <Pressable style={styles.row} onPress={() => onToggle(!checked)}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Feather name="check" size={14} color={colors.textInverse} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { ...type.body2, color: colors.textSecondary, flex: 1 },
});
