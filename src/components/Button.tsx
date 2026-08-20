import React from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { colors, radius, spacing, type } from "../theme";

type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

// Mirrors the Figma "Full Width, Filled Primary Button" / "Full Width,
// Outlined Secondary Button" components: radius 10, enabled fill #003142,
// disabled fill #9fb6be (teal 200), white label/icon; secondary is an
// outlined navy button on white.
export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  leadingIcon,
  trailingIcon,
  style,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "primary" && isDisabled && styles.primaryDisabled,
        variant === "primary" && pressed && !isDisabled && styles.primaryPressed,
        variant === "secondary" && styles.secondary,
        variant === "secondary" && isDisabled && styles.secondaryDisabled,
        variant === "secondary" && pressed && !isDisabled && styles.secondaryPressed,
        variant === "ghost" && styles.ghost,
        variant === "ghost" && pressed && !isDisabled && styles.ghostPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.textInverse : colors.primary} />
      ) : (
        <View style={styles.content}>
          {leadingIcon}
          <Text
            style={[
              styles.label,
              variant === "primary" && styles.labelPrimary,
              variant === "secondary" && styles.labelSecondary,
              variant === "ghost" && styles.labelGhost,
            ]}
          >
            {label}
          </Text>
          {trailingIcon}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.control,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  label: { ...type.button },
  primary: { backgroundColor: colors.primary },
  primaryDisabled: { backgroundColor: colors.primaryDisabled },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  labelPrimary: { color: colors.textInverse },
  secondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryDisabled: { borderColor: colors.borderMuted },
  secondaryPressed: { backgroundColor: colors.teal[50] },
  labelSecondary: { color: colors.primary },
  ghost: { backgroundColor: "transparent" },
  ghostPressed: { backgroundColor: colors.surfaceSunken },
  labelGhost: { color: colors.primary },
});
