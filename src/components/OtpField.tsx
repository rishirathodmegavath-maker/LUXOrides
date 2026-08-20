import React, { useRef } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, type } from "../theme";

export interface OtpFieldProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  errorText?: string;
  autoFocus?: boolean;
}

// Mirrors the Figma "OTP Field" component (node 148:1417): 6 boxed digits,
// enabled/focused/filled/error border states.
export function OtpField({ length = 6, value, onChange, errorText, autoFocus }: OtpFieldProps) {
  const inputRef = useRef<TextInput>(null);
  const hasError = !!errorText;
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {digits.map((digit, i) => {
          const isActive = i === activeIndex && value.length < length;
          const isFilled = !!digit;
          return (
            <View
              key={i}
              style={[
                styles.box,
                isFilled && styles.boxFilled,
                isActive && !hasError && styles.boxFocused,
                hasError && styles.boxError,
              ]}
            >
              <Text style={styles.digit}>{digit}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, "").slice(0, length))}
        keyboardType="number-pad"
        autoFocus={autoFocus}
        style={styles.hiddenInput}
        maxLength={length}
      />
      {hasError ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

const BOX = 52;

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between" },
  box: {
    width: BOX,
    height: BOX + 20,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  boxFilled: { borderColor: colors.slate[900] },
  boxFocused: { borderColor: colors.slate[900], borderWidth: 1.5 },
  boxError: { borderColor: colors.errorBorder, backgroundColor: colors.errorBg },
  digit: { ...type.h2, color: colors.textPrimary },
  hiddenInput: { position: "absolute", opacity: 0, height: 1, width: "100%" },
  errorText: { ...type.body3, color: colors.error },
});
