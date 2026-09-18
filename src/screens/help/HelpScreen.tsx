import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HelpStackParamList } from "../../navigation/types";
import { ListRow, ScreenContainer, ScreenHeader } from "../../components";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from "../../constants/support";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<HelpStackParamList, "Help">;

// Mirrors the Figma "Help Page" frame (node 675:13614).
export function HelpScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <ScreenHeader onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} title="Help & Support" />
      <Text style={styles.subtitle}>How can we help you today?</Text>

      <ListRow
        icon={<Feather name="message-circle" size={20} color={colors.textPrimary} />}
        title="Message Support"
        subtitle="Call or text our support team"
        onPress={() => navigation.navigate("LiveChat")}
      />
      <View style={{ height: spacing.xs }} />
      <ListRow
        icon={<Feather name="help-circle" size={20} color={colors.textPrimary} />}
        title="FAQs"
        subtitle="Answers to common questions"
        onPress={() => navigation.navigate("Faqs")}
      />
      <View style={{ height: spacing.xs }} />
      <ListRow
        icon={<Feather name="phone-call" size={20} color={colors.textPrimary} />}
        title="Call Support"
        subtitle={SUPPORT_PHONE_DISPLAY}
        onPress={() => Linking.openURL(SUPPORT_PHONE_TEL)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: { ...type.body1, color: colors.textSecondary, marginBottom: spacing.lg },
});
