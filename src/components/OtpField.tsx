import React, { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, TextInput, View } from "react-native";
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
  // When true, plays a one-shot animation where all boxes converge into a
  // single checkmark badge at the center of the row.
  success?: boolean;
}

const BOX = 52;
const BOX_HEIGHT = BOX + 20;
const BADGE_SIZE = 64;

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
  const [rowWidth, setRowWidth] = useState(0);

  useEffect(() => {
    progress.value = withTiming(success ? 1 : 0, {
      duration: success ? 800 : 150,
      easing: Easing.out(Easing.cubic),
    });
  }, [success, progress]);

  const onRowLayout = (e: LayoutChangeEvent) => setRowWidth(e.nativeEvent.layout.width);

  const gap = length > 1 ? Math.max((rowWidth - length * BOX) / (length - 1), 0) : 0;
  const rowCenter = rowWidth / 2;

  const connectorStyle = useAnimatedStyle(() => {
    const width = interpolate(progress.value, [0, 0.35, 0.55, 1], [0, Math.max(rowWidth, 1), BADGE_SIZE, BADGE_SIZE]);
    const height = interpolate(progress.value, [0, 0.35, 0.55, 1], [3, 3, BADGE_SIZE, BADGE_SIZE]);
    const borderRadius = interpolate(progress.value, [0, 0.35, 0.55, 1], [2, 2, BADGE_SIZE / 2, BADGE_SIZE / 2]);
    const backgroundColor = interpolateColor(progress.value, [0, 0.5, 1], [colors.primary, colors.primary, colors.success]);
    const opacity = interpolate(progress.value, [0, 0.02, 1], [0, 1, 1]);
    return { width, height, borderRadius, backgroundColor, opacity };
  });

  const tickStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.65, 0.85], [0, 0, 1]),
    transform: [{ scale: interpolate(progress.value, [0.65, 0.8, 1], [0.4, 1.2, 1]) }],
  }));

  return (
    <View style={styles.wrapper}>
      <View style={styles.fieldStack}>
        <View style={styles.row} onLayout={onRowLayout}>
          {digits.map((digit, i) => {
            const isActive = i === activeIndex && value.length < length;
            const isFilled = !!digit;
            const boxCenter = i * (BOX + gap) + BOX / 2;
            const targetX = rowCenter - boxCenter;
            return (
              <OtpBox
                key={i}
                digit={digit}
                isActive={isActive}
                isFilled={isFilled}
                hasError={hasError}
                progress={progress}
                targetX={targetX}
                spreadOut={i % 2 === 0 ? -8 : 8}
              />
            );
          })}
        </View>

        <View style={styles.centerOverlay} pointerEvents="none">
          <Animated.View style={[styles.connector, connectorStyle]}>
            <Animated.View style={tickStyle}>
              <Feather name="check" size={28} color={colors.textInverse} />
            </Animated.View>
          </Animated.View>
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
      </View>
      {hasError ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

interface OtpBoxProps {
  digit: string;
  isActive: boolean;
  isFilled: boolean;
  hasError: boolean;
  progress: SharedValue<number>;
  targetX: number;
  spreadOut: number;
}

function OtpBox({ digit, isActive, isFilled, hasError, progress, targetX, spreadOut }: OtpBoxProps) {
  const boxStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 0.55], [0, targetX + spreadOut]);
    const scale = interpolate(progress.value, [0, 0.4, 0.6], [1, 0.85, 0]);
    const opacity = interpolate(progress.value, [0, 0.4, 0.6], [1, 1, 0]);
    return { transform: [{ translateX }, { scale }], opacity };
  });

  const digitStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3], [1, 0]),
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  fieldStack: { position: "relative" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  box: {
    width: BOX,
    height: BOX_HEIGHT,
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
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  connector: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  hiddenInput: { ...StyleSheet.absoluteFillObject, opacity: 0 },
  errorText: { ...type.body3, color: colors.error },
});
