import React, { useCallback, useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { DrawerActions, useFocusEffect } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainTabParamList, RootStackParamList } from "../../navigation/types";
import { Button, Card, Chip, InlineErrorBanner, StatusToggle } from "../../components";
import { notificationApi } from "../../api/notification.api";
import { driverService, dutyService } from "../../services";
import { useDutyStore } from "../../store/dutyStore";
import { reconcileActiveDuty, type DutyResumeTarget } from "../../util/resumeDuty";
import { colors, spacing, type } from "../../theme";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

const offlineIllustration = require("../../../assets/brand/illustration_offline_break.png");

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

// Mirrors the Figma "Home Page (Online)" (675:10414) and "Home Page
// (Offline)" (675:10342 / 675:10967 / 682:14117 — three near-identical
// exports of the same empty state) frames — one dynamic screen toggling on
// the real online/duty state instead of four routes.
export function HomeScreen({ navigation }: Props) {
  const online = useDutyStore((s) => s.online);
  const setOnline = useDutyStore((s) => s.setOnline);
  const todayDuty = useDutyStore((s) => s.todayDuty);
  const setTodayDuty = useDutyStore((s) => s.setTodayDuty);
  const [driverName, setDriverName] = React.useState<string | null>(null);
  const [resumeTarget, setResumeTarget] = React.useState<DutyResumeTarget | null>(null);
  // Both loads below used to swallow a failure entirely -- e.g. a real duty
  // existing but getTodayDuty() rejecting looked identical to "no duty
  // assigned yet", with no way for the driver to tell the difference or
  // retry. loadError + reloadKey give the driver a real retry action instead
  // of a permanently-stale/blank home screen.
  const [loadError, setLoadError] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      notificationApi
        .list()
        .then((res) => active && setUnreadCount(res.unreadCount))
        .catch(() => {
          // Best-effort -- a failed unread-count fetch just means no badge shows, not a broken Home screen.
        });
      return () => {
        active = false;
      };
    }, [])
  );

  useEffect(() => {
    let active = true;
    driverService
      .getProfile()
      .then((p) => active && setDriverName(p.name))
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      dutyService
        .getTodayDuty()
        .then((d) => active && setTodayDuty(d))
        .catch(() => active && setLoadError(true));
      // Reconciles any genuinely-started duty against the real backend
      // state (GET /driver/app/duties/{dutyId}) so an app restart mid-duty
      // routes back into the correct real screen instead of silently losing
      // it — see resumeDuty.ts.
      reconcileActiveDuty()
        .then((target) => active && setResumeTarget(target))
        .catch(() => active && setLoadError(true));
      return () => {
        active = false;
      };
      // reloadKey isn't read in the body -- it's a deliberate re-run trigger
      // so the Retry banner can force a refetch without leaving/re-focusing
      // this screen, which is the only other thing that would normally
      // re-invoke a useFocusEffect callback.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setTodayDuty, reloadKey])
  );

  const onRetryLoad = () => {
    setLoadError(false);
    setReloadKey((k) => k + 1);
  };

  const onToggle = (next: boolean) => {
    setOnline(next);
  };

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + spacing.md, backgroundColor: online ? colors.successBg : colors.slate[100] },
        ]}
      >
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Feather name="menu" size={24} color={colors.textPrimary} />
        </Pressable>
        <StatusToggle online={online} onToggle={onToggle} />
        <Pressable
          onPress={() => navigation.navigate("Notifications")}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <Feather name="bell" size={24} color={colors.textPrimary} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.body}>
        {loadError ? <InlineErrorBanner message="Couldn't load your latest duty." onRetry={onRetryLoad} /> : null}
        <Text style={styles.greeting}>{greeting()}{driverName ? `, ${driverName}` : ""}</Text>
        <Text style={styles.headline}>{online ? "You're Online" : "You're Offline"}</Text>
        <Text style={styles.subtitle}>
          {online ? "Go offline when you're ready to end your duty." : "Go online when you're ready to start your duty."}
        </Text>

        {online && todayDuty ? (
          <Card style={{ marginTop: spacing.xl }}>
            <View style={styles.dutyTopRow}>
              <View style={styles.dutyChipsRow}>
                <Chip label="Today's Duty" tone="success" icon={<View style={styles.dot} />} />
                <Chip label={todayDuty.type} tone="info" icon={<Feather name="briefcase" size={12} color={colors.info} />} />
              </View>
              <Text style={styles.durationLabel}>{todayDuty.durationLabel}</Text>
            </View>
            {/* reportTime already carries its own real am/pm marker
                (toDutySummary formats it via toLocaleTimeString) -- no
                second, hardcoded period label appended here. */}
            <Text style={styles.reportTime}>{todayDuty.reportTime}</Text>
            <Text style={styles.reportBy}>Report by {todayDuty.reportTime}</Text>

            <View style={styles.stopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stopLabel}>PICKUP</Text>
                <Text style={styles.stopAddress}>{todayDuty.pickup.address}</Text>
              </View>
              {todayDuty.pickup.distanceKm != null && todayDuty.pickup.etaMinutes != null ? (
                <View style={styles.stopMeta}>
                  <Text style={styles.stopKm}>{todayDuty.pickup.distanceKm} KM</Text>
                  <Text style={styles.stopMin}>{todayDuty.pickup.etaMinutes} mins</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.stopRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stopLabel, { color: colors.gold[500] }]}>DROP OFF</Text>
                <Text style={styles.stopAddress}>{todayDuty.dropoff.address}</Text>
              </View>
              {todayDuty.dropoff.distanceKm != null && todayDuty.dropoff.etaMinutes != null ? (
                <View style={styles.stopMeta}>
                  <Text style={styles.stopKm}>{todayDuty.dropoff.distanceKm} KM</Text>
                  <Text style={styles.stopMin}>
                    {Math.round(todayDuty.dropoff.etaMinutes / 60)}hr {todayDuty.dropoff.etaMinutes % 60} min
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.ctaRow}>
              <Button label="Trip Details" variant="secondary" style={{ flex: 1 }} onPress={() => navigation.navigate("TripDetails", { dutyId: todayDuty.id })} />
              <Button
                label={resumeTarget ? "Resume Duty" : "Start Duty"}
                style={{ flex: 1 }}
                onPress={() => navigation.navigate("Duty", { screen: resumeTarget ?? "AcceptDuty" })}
              />
            </View>
          </Card>
        ) : (
          <View style={styles.emptyWrap}>
            {!online ? (
              <>
                <Card style={{ marginTop: spacing.xl }}>
                  <View style={styles.emptyRow}>
                    <Feather name="calendar" size={22} color={colors.textPrimary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.emptyTitle}>All new bookings will appear here</Text>
                      <Text style={styles.emptyBody}>All new Trips and bookings will be assigned to you here. Go online to start your duty.</Text>
                    </View>
                  </View>
                </Card>
                <Image source={offlineIllustration} style={styles.illustration} resizeMode="contain" />
                <Text style={styles.emptyTitle}>Take a break!</Text>
                <Text style={[styles.emptyBody, { textAlign: "center" }]}>
                  All new Trips and bookings will be assigned to you here. Go online to start your duty.
                </Text>
              </>
            ) : (
              <Card style={{ marginTop: spacing.xl }}>
                <Text style={styles.emptyTitle}>No duty assigned yet</Text>
                <Text style={styles.emptyBody}>We&apos;ll notify you the moment a duty is assigned.</Text>
              </Card>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  body: { flex: 1, padding: spacing.lg },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { ...type.caption, fontSize: 10, lineHeight: 12, color: colors.textInverse },
  greeting: { ...type.body1, color: colors.textSecondary },
  headline: { ...type.h1, color: colors.textPrimary, marginTop: spacing.xxs },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.xxs },
  dutyTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dutyChipsRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center", flexShrink: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  durationLabel: { ...type.body2, color: colors.textSecondary, textAlign: "right", marginLeft: spacing.sm, flexShrink: 0 },
  reportTime: { ...type.display, color: colors.textPrimary, marginTop: spacing.sm },
  reportBy: { ...type.label, color: colors.success, marginTop: -4 },
  stopRow: { flexDirection: "row", marginTop: spacing.lg, gap: spacing.sm },
  stopLabel: { ...type.label, color: colors.success, letterSpacing: 0.5 },
  stopAddress: { ...type.body1, color: colors.textPrimary, marginTop: 2 },
  stopMeta: { alignItems: "flex-end" },
  stopKm: { ...type.h4, color: colors.textPrimary },
  stopMin: { ...type.body3, color: colors.textSecondary },
  ctaRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl },
  emptyWrap: { alignItems: "stretch" },
  emptyRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  emptyTitle: { ...type.h4, color: colors.textPrimary, marginTop: spacing.lg, textAlign: "center" },
  emptyBody: { ...type.body2, color: colors.textSecondary, marginTop: spacing.xxs },
  illustration: { width: "100%", height: 220, marginTop: spacing.xxl },
});
