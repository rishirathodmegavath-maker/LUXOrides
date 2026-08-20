import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { colors, radius, spacing, type } from "../theme";

export interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label?: string;
  errorText?: string;
  disabled?: boolean;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  containerStyle?: import("react-native").ViewStyle;
}

// Mirrors the Figma "Phone Number Input Field" component states (node
// 141:793 / "States of Input and Buttons" 144:660): radius 10, border
// #9ba2a8 enabled -> #010714 focused/filled -> #b23a34 + #fcecea fill on
// error -> #edeef0 fill when disabled.
export function TextField({
  label,
  errorText,
  disabled,
  leftAdornment,
  rightAdornment,
  value,
  onFocus,
  onBlur,
  containerStyle,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const hasError = !!errorText;
  const filled = !focused && !!value && !hasError;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          filled && styles.fieldFilled,
          focused && !hasError && styles.fieldFocused,
          hasError && styles.fieldError,
          disabled && styles.fieldDisabled,
        ]}
      >
        {leftAdornment}
        <TextInput
          value={value}
          editable={!disabled}
          placeholderTextColor={colors.placeholder}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            hasError && { color: colors.error },
            (filled || focused) && !hasError && { color: colors.textPrimary },
          ]}
          {...rest}
        />
        {rightAdornment}
      </View>
      {hasError ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { ...type.label, color: colors.textSecondary },
  field: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  fieldFocused: { borderColor: colors.slate[900] },
  fieldFilled: { borderColor: colors.slate[900] },
  fieldError: { borderColor: colors.errorBorder, backgroundColor: colors.errorBg },
  fieldDisabled: { backgroundColor: colors.slate[100] },
  input: { flex: 1, ...type.body1, color: colors.textPrimary, padding: 0 },
  errorText: { ...type.body3, color: colors.error },
});
