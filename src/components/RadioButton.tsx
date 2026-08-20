import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing, type } from "../theme";

export interface RadioButtonProps {
  selected: boolean;
  onPress: () => void;
  label: string;
  description?: string;
}

// Mirrors the Figma "Radio Button" component (node 654:5296).
export function RadioButton({ selected, onPress, label, description }: RadioButtonProps) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.outer, selected && styles.outerSelected]}>
        {selected ? <View style={styles.inner} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs },
  outer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  outerSelected: { borderColor: colors.primary },
  inner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  label: { ...type.body1, color: colors.textPrimary },
  description: { ...type.body3, color: colors.textSecondary },
});
