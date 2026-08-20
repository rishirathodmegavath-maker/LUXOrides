import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { colors, radius, spacing, type } from "../theme";

export interface OtpFieldProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  errorText?: string;
  autoFocus?: boolean;
  // When true, plays a one-shot animation where the trailing boxes collapse
  // into the first one, which morphs into a filled checkmark tile.
  success?: boolean;
}

// Mirrors the Figma "OTP Field" component (node 148:1417): 6 boxed digits,
// enabled/focused/filled/error border states. The success merge-animation
// is an original addition (not from Figma), ported from a standalone
// reference (d:/LUXOrides/otp animation/Animated-otp-Verification) onto
// this app's own teal/gold palette instead of that reference's dark theme.
export function OtpField({ length = 6, value, onChange, errorText, autoFocus, success = false }: OtpFieldProps) {
  const inputRef = useRef<TextInput>(null);
  const hasError = !!errorText;
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const activeIndex = Math.min(value.length, length - 1);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(success ? 1 : 0, {
      duration: success ? 700 : 150,
      easing: Easing.out(Easing.cubic),
    });
  }, [success, progress]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {digits.map((digit, i) => {
          const isActive = i === activeIndex && value.length < length;
          const isFilled = !!digit;
          return (
            <OtpBox
              key={i}
              index={i}
              digit={digit}
              isFirst={i === 0}
              isActive={isActive}
              isFilled={isFilled}
              hasError={hasError}
              progress={progress}
            />
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, "").slice(0, length))}
        keyboardType="number-pad"
        autoFocus={autoFocus}
        editable={!success}
        style={styles.hiddenInput}
        maxLength={length}
      />
      {hasError ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

interface OtpBoxProps {
  index: number;
  digit: string;
  isFirst: boolean;
  isActive: boolean;
  isFilled: boolean;
  hasError: boolean;
  progress: SharedValue<number>;
}

function OtpBox({ index, digit, isFirst, isActive, isFilled, hasError, progress }: OtpBoxProps) {
  const boxStyle = useAnimatedStyle(() => {
    if (isFirst) {
      const scale = interpolate(progress.value, [0, 0.5, 0.75, 1], [1, 0.94, 1.16, 1]);
      const backgroundColor = interpolateColor(progress.value, [0, 0.5, 1], [
        colors.background,
        colors.primary,
        colors.success,
      ]);
      return { transform: [{ scale }], backgroundColor };
    }
    const scale = interpolate(progress.value, [0, 0.55, 1], [1, 0.9, 0]);
    const opacity = interpolate(progress.value, [0, 0.5, 0.7], [1, 1, 0]);
    const rotateDeg = interpolate(progress.value, [0, 1], [0, index % 2 === 0 ? -10 : 10]);
    return { transform: [{ scale }, { rotate: `${rotateDeg}deg` }], opacity };
  });

  const digitStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.35], [1, 0]),
  }));

  const tickStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.7, 1], [0, 0, 1]),
    transform: [{ scale: interpolate(progress.value, [0.7, 0.85, 1], [0.4, 1.2, 1]) }],
  }));

  return (
    <Animated.View
      style={[
        styles.box,
        isFilled && styles.boxFilled,
        isActive && !hasError && styles.boxFocused,
        hasError && styles.boxError,
        boxStyle,
      ]}
    >
      <Animated.Text style={[styles.digit, digitStyle]}>{digit}</Animated.Text>
      {isFirst ? (
        <Animated.View style={[styles.tick, tickStyle]} pointerEvents="none">
          <Feather name="check" size={26} color={colors.textInverse} />
        </Animated.View>
      ) : null}
    </Animated.View>
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
  tick: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  hiddenInput: { position: "absolute", opacity: 0, height: 1, width: "100%" },
  errorText: { ...type.body3, color: colors.error },
});
