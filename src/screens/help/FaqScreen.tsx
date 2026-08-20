import React, { useEffect, useState } from "react";
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HelpStackParamList } from "../../navigation/types";
import { ScreenContainer, ScreenHeader } from "../../components";
import { FaqItem, supportService } from "../../services";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<HelpStackParamList, "Faqs">;

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Mirrors the Figma "FAQs" frame (node 675:13736) and its "Expandable Box"
// component variants (675:13289 / 13303 / 13362 / 13384 / 13487) — an
// accordion list rather than separate static routes per box size.
export function FaqScreen({ navigation }: Props) {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    supportService.getFaqs().then(setFaqs);
  }, []);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((cur) => (cur === id ? null : id));
  };

  return (
    <ScreenContainer>
      <ScreenHeader onBack={() => navigation.goBack()} title="FAQs" />
      {faqs.map((faq) => {
        const open = openId === faq.id;
        return (
          <Pressable key={faq.id} style={styles.box} onPress={() => toggle(faq.id)}>
            <View style={styles.row}>
              <Text style={styles.question}>{faq.question}</Text>
              <Feather name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.textSecondary} />
            </View>
            {open ? <Text style={styles.answer}>{faq.answer}</Text> : null}
          </Pressable>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  question: { ...type.body1, color: colors.textPrimary, flex: 1, fontFamily: type.label.fontFamily },
  answer: { ...type.body2, color: colors.textSecondary, marginTop: spacing.sm },
});
