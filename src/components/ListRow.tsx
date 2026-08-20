import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radius, spacing, type } from "../theme";

export interface ListRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  showChevron?: boolean;
}

export function ListRow({ icon, title, subtitle, onPress, trailing, showChevron = true }: ListRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing}
      {showChevron && onPress ? <Feather name="chevron-right" size={20} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

export function IconCircle({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "error" }) {
  return (
    <View
      style={[
        styles.iconCircle,
        tone === "success" && { backgroundColor: colors.successBg },
        tone === "error" && { backgroundColor: colors.errorBg },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  pressed: { opacity: 0.7 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.slate[100],
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1, gap: 2 },
  title: { ...type.h4, fontSize: 16, color: colors.textPrimary },
  subtitle: { ...type.body2, color: colors.textSecondary },
});
