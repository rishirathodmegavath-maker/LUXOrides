import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HelpStackParamList } from "../../navigation/types";
import { Button, ScreenContainer, ScreenHeader } from "../../components";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL, SUPPORT_SMS_URI } from "../../constants/support";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<HelpStackParamList, "LiveChat">;

// Previously a fully local, fake chat (MockSupportService): canned
// "we're looking into this" replies, a scripted "Support is typing…"
// indicator, in-memory-only history -- presented under a "Live Support"
// title as if a real agent were on the other end. There's no real
// ticket/chat backend to replace it with tonight (see the Driver App
// audit), so this is now an honest hand-off to the one real support
// channel the app has: the same support number HelpScreen/ErrorBoundary
// already dial, offered here as both a call and a text so "Message
// Support" is a real action, not a relabeled fake one.
export function LiveChatScreen({ navigation }: Props) {
  const call = () => Linking.openURL(SUPPORT_PHONE_TEL).catch(() => {});
  const text = () => Linking.openURL(SUPPORT_SMS_URI).catch(() => {});

  return (
    <ScreenContainer>
      <ScreenHeader onBack={() => navigation.goBack()} title="Message Support" />
      <View style={styles.iconWrap}>
        <Feather name="message-circle" size={32} color={colors.gold[500]} />
      </View>
      <Text style={styles.title}>In-app chat isn&apos;t available yet</Text>
      <Text style={styles.subtitle}>
        Reach our support team directly and we&apos;ll help right away.
      </Text>

      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        <Button label={`Call Support · ${SUPPORT_PHONE_DISPLAY}`} onPress={call} leadingIcon={<Feather name="phone-call" size={18} color={colors.textInverse} />} />
        <Button label="Text Support" variant="secondary" onPress={text} leadingIcon={<Feather name="message-square" size={18} color={colors.primary} />} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.gold[50],
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: { ...type.h1, color: colors.textPrimary, textAlign: "center" },
  subtitle: { ...type.body1, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
});
