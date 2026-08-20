import React from "react";
import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import { colors, spacing, type } from "../theme";

export interface EmptyStateProps {
  image?: ImageSourcePropType;
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ image, icon, title, description }: EmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      {image ? <Image source={image} style={styles.image} resizeMode="contain" /> : icon}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", paddingHorizontal: spacing.xl, gap: spacing.sm },
  image: { width: 220, height: 180, marginBottom: spacing.sm },
  title: { ...type.h4, color: colors.textPrimary, textAlign: "center" },
  description: { ...type.body2, color: colors.textSecondary, textAlign: "center" },
});
