import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HelpStackParamList } from "../../navigation/types";
import { ListRow, ScreenContainer, ScreenHeader } from "../../components";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<HelpStackParamList, "Help">;

// The only support number the app has to offer -- reused for both the
// display text and the dialer, never a second/different number invented
// for the tel: link.
const SUPPORT_PHONE_DISPLAY = "+91 1800-123-4567";
const SUPPORT_PHONE_TEL = "tel:18001234567";

// Mirrors the Figma "Help Page" frame (node 675:13614).
export function HelpScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <ScreenHeader onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} title="Help & Support" />
      <Text style={styles.subtitle}>How can we help you today?</Text>

      <ListRow
        icon={<Feather name="message-circle" size={20} color={colors.textPrimary} />}
        title="Live Support Chat"
        subtitle="Chat with our support team"
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
