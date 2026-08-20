import React, { useCallback, useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { DrawerActions, useFocusEffect } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainTabParamList, RootStackParamList } from "../../navigation/types";
import { Button, Card, Chip, StatusToggle } from "../../components";
import { driverService, dutyService } from "../../services";
import { useDutyStore } from "../../store/dutyStore";
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

  useEffect(() => {
    let active = true;
    driverService.getProfile().then((p) => active && setDriverName(p.name));
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      dutyService.getTodayDuty().then((d) => active && setTodayDuty(d));
      return () => {
        active = false;
      };
    }, [setTodayDuty])
  );

  const onToggle = (next: boolean) => {
    setOnline(next);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { backgroundColor: online ? colors.successBg : colors.slate[100] }]}>
        <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} hitSlop={8}>
          <Feather name="menu" size={24} color={colors.textPrimary} />
        </Pressable>
        <StatusToggle online={online} onToggle={onToggle} />
        <Feather name="bell" size={24} color={colors.textPrimary} />
      </View>

      <View style={styles.body}>
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
            <Text style={styles.reportTime}>
              {todayDuty.reportTime} <Text style={styles.reportSub}>AM</Text>
            </Text>
            <Text style={styles.reportBy}>Report by {todayDuty.reportTime} • in 30 mins</Text>

            <View style={styles.stopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stopLabel}>PICKUP</Text>
                <Text style={styles.stopAddress}>{todayDuty.pickup.address}</Text>
              </View>
              <View style={styles.stopMeta}>
                <Text style={styles.stopKm}>{todayDuty.pickup.distanceKm} KM</Text>
                <Text style={styles.stopMin}>{todayDuty.pickup.etaMinutes} mins</Text>
              </View>
            </View>
            <View style={styles.stopRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stopLabel, { color: colors.gold[500] }]}>DROP OFF</Text>
                <Text style={styles.stopAddress}>{todayDuty.dropoff.address}</Text>
              </View>
              <View style={styles.stopMeta}>
                <Text style={styles.stopKm}>{todayDuty.dropoff.distanceKm} KM</Text>
                <Text style={styles.stopMin}>{Math.round(todayDuty.dropoff.etaMinutes / 60)}hr {todayDuty.dropoff.etaMinutes % 60} min</Text>
              </View>
            </View>

            <View style={styles.ctaRow}>
              <Button label="Trip Details" variant="secondary" style={{ flex: 1 }} onPress={() => navigation.navigate("TripDetails", { dutyId: todayDuty.id })} />
              <Button label="Start Duty" style={{ flex: 1 }} onPress={() => navigation.navigate("Duty", { screen: "AcceptDuty" })} />
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
    paddingTop: 56,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  body: { flex: 1, padding: spacing.lg },
  greeting: { ...type.body1, color: colors.textSecondary },
  headline: { ...type.h1, color: colors.textPrimary, marginTop: spacing.xxs },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.xxs },
  dutyTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dutyChipsRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center", flexShrink: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  durationLabel: { ...type.body2, color: colors.textSecondary, textAlign: "right", marginLeft: spacing.sm, flexShrink: 0 },
  reportTime: { ...type.display, color: colors.textPrimary, marginTop: spacing.sm },
  reportSub: { ...type.h4, color: colors.textSecondary },
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
