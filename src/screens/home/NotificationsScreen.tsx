import React, { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { EmptyState, InlineErrorBanner, ScreenContainer, ScreenHeader } from "../../components";
import { notificationApi } from "../../api/notification.api";
import type { NotificationResponse } from "../../api/notification.types";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Real, backend-persisted feed (DriverNotificationController -> the same
// NotificationService/Notification entity the client app's feed already
// uses, under NotificationRecipientType.DRIVER) -- populated today from
// DutyAllottedEvent, not a fabricated/local list.
export function NotificationsScreen({ navigation }: Props) {
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    notificationApi
      .list()
      .then((res) => setItems(res.notifications))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  const onPressItem = async (item: NotificationResponse) => {
    if (!item.readAt) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)));
      notificationApi.markRead(item.id).catch(() => {
        // Best-effort -- a failed mark-read just means it re-shows as unread next load, not a broken app.
      });
    }
  };

  return (
    <ScreenContainer scroll={false}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Notifications" />

      {loadError ? <InlineErrorBanner message="Couldn't load your notifications." onRetry={load} /> : null}

      {!loading && !loadError && items.length === 0 ? (
        <EmptyState
          icon={<Feather name="bell-off" size={32} color={colors.textMuted} />}
          title="No notifications yet"
          description="Duty assignments and updates will show up here."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPressItem(item)}
              style={[styles.row, !item.readAt && styles.rowUnread]}
              accessibilityRole="button"
            >
              {!item.readAt ? <View style={styles.dot} /> : <View style={styles.dotSpacer} />}
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xl },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSunken,
    marginBottom: spacing.xs,
  },
  rowUnread: { backgroundColor: colors.teal[50] },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  dotSpacer: { width: 8 },
  title: { ...type.h4, fontSize: 15, color: colors.textPrimary },
  body: { ...type.body2, color: colors.textSecondary, marginTop: 2 },
  time: { ...type.caption, color: colors.textMuted, marginTop: spacing.xxs },
});
