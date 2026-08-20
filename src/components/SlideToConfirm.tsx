import React, { useMemo, useState } from "react";
import { Animated, LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radius, type } from "../theme";

export interface SlideToConfirmProps {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
}

const THUMB = 56;

// Mirrors the Figma "Duty Slider" component (node 556:3767) seen on the
// Duty Start Map screen: light-green track, dark-green circular thumb with
// a double-chevron icon, "Slide to start the duty" label underneath.
export function SlideToConfirm({ label, onConfirm, disabled }: SlideToConfirmProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [translateX] = useState(() => new Animated.Value(0));
  const maxDistance = Math.max(trackWidth - THUMB - 8, 1);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderMove: (_, gesture) => {
          const next = Math.min(Math.max(gesture.dx, 0), maxDistance);
          translateX.setValue(next);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx >= maxDistance * 0.85) {
            Animated.timing(translateX, {
              toValue: maxDistance,
              duration: 120,
              useNativeDriver: true,
            }).start(() => onConfirm());
          } else {
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          }
        },
      }),
    [maxDistance, disabled, onConfirm, translateX]
  );

  const onLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  return (
    <View
      onLayout={onLayout}
      style={[styles.track, disabled && styles.trackDisabled]}
    >
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.thumb, disabled && styles.thumbDisabled, { transform: [{ translateX }] }]}
      >
        <Feather name="chevrons-right" size={24} color={colors.textInverse} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.successBg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  trackDisabled: { backgroundColor: colors.surfaceSunken },
  label: { ...type.button, color: colors.successStrong },
  labelDisabled: { color: colors.textMuted },
  thumb: {
    position: "absolute",
    left: 4,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbDisabled: { backgroundColor: colors.textMuted },
});
