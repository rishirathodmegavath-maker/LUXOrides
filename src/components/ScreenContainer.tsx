import React from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView, Edge } from "react-native-safe-area-context";
import { colors, screenPadding } from "../theme";

export interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  padded?: boolean;
  backgroundColor?: string;
  style?: ViewStyle;
  footer?: React.ReactNode;
}

export function ScreenContainer({
  children,
  scroll = true,
  edges = ["top", "bottom"],
  padded = true,
  backgroundColor = colors.background,
  style,
  footer,
}: ScreenContainerProps) {
  const Body = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? { contentContainerStyle: [padded && styles.padded, style], showsVerticalScrollIndicator: false }
    : { style: [{ flex: 1 }, padded && styles.padded, style] };

  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, { backgroundColor }]}>
      <Body {...bodyProps}>{children}</Body>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  padded: { padding: screenPadding, flexGrow: 1 },
  footer: { padding: screenPadding },
});
