import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing, type } from "../theme";

export interface ScreenHeaderProps {
  onBack?: () => void;
  title?: string;
  right?: React.ReactNode;
}

export function ScreenHeader({ onBack, title, right }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable style={styles.backRow} onPress={onBack} hitSlop={8}>
          <Feather name="chevron-left" size={22} color={colors.textPrimary} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
      ) : (
        <View />
      )}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {right ?? <View style={{ width: 24 }} />}
    </View>
  );
}

export function Chip({ label, tone = "neutral", icon }: { label: string; tone?: "neutral" | "success" | "info"; icon?: React.ReactNode }) {
  return (
    <View
      style={[
        chipStyles.chip,
        tone === "success" && { backgroundColor: colors.successBg },
        tone === "info" && { backgroundColor: colors.infoBg },
      ]}
    >
      {icon}
      <Text
        style={[
          chipStyles.label,
          tone === "success" && { color: colors.successStrong },
          tone === "info" && { color: colors.info },
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  backRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  backLabel: { ...type.body1, color: colors.textPrimary },
  title: { ...type.h4, color: colors.textPrimary },
});

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.slate[100],
    alignSelf: "flex-start",
    flexShrink: 1,
  },
  label: { ...type.caption, fontFamily: type.label.fontFamily, color: colors.textSecondary, flexShrink: 1 },
});
