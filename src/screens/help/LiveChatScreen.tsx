import React, { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HelpStackParamList } from "../../navigation/types";
import { ScreenHeader } from "../../components";
import { ChatMessage, supportService } from "../../services";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<HelpStackParamList, "LiveChat">;

// Mirrors the Figma "Live Support Chat" frames (nodes 675:13662 / 13911 /
// 13706 — empty / typing / conversation states) — one dynamic chat screen
// driven by real message state instead of three routes.
export function LiveChatScreen({ navigation }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    supportService.getChatMessages().then(setMessages);
  }, []);

  const onSend = async () => {
    if (!draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    setMessages((m) => [...m, { id: `local_${Date.now()}`, from: "driver", text, timestamp: "Just now" }]);
    setSending(true);
    try {
      const reply = await supportService.sendChatMessage(text);
      setMessages((m) => [...m, reply]);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <ScreenHeader onBack={() => navigation.goBack()} title="Live Support" />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.from === "driver" ? styles.bubbleDriver : styles.bubbleSupport]}>
              <Text style={[styles.bubbleText, item.from === "driver" && styles.bubbleTextDriver]}>{item.text}</Text>
              <Text style={[styles.timestamp, item.from === "driver" && styles.timestampDriver]}>{item.timestamp}</Text>
            </View>
          )}
        />
        {sending ? <Text style={styles.typing}>Support is typing…</Text> : null}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message…"
            placeholderTextColor={colors.placeholder}
          />
          <Pressable onPress={onSend} hitSlop={8}>
            <Feather name="send" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  bubble: { maxWidth: "80%", padding: spacing.sm, borderRadius: radius.md },
  bubbleSupport: { backgroundColor: colors.surfaceSunken, alignSelf: "flex-start" },
  bubbleDriver: { backgroundColor: colors.primary, alignSelf: "flex-end" },
  bubbleText: { ...type.body2, color: colors.textPrimary },
  bubbleTextDriver: { color: colors.textInverse },
  timestamp: { ...type.caption, color: colors.textMuted, marginTop: 4 },
  timestampDriver: { color: colors.teal[100] },
  typing: { ...type.caption, color: colors.textMuted, paddingHorizontal: spacing.lg },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  input: {
    flex: 1,
    ...type.body1,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
