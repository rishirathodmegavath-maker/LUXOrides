import { useNetworkState } from "expo-network";

// Real device connectivity, distinct from the duty-availability StatusToggle
// (useDutyStore.online, a driver-controlled "I'm accepting duties" flag).
// isInternetReachable is undefined until the first native check resolves, so
// callers should treat undefined the same as connected (no false "offline"
// flash on cold start).
export function useNetworkStatus(): { isOffline: boolean } {
  const state = useNetworkState();
  const isOffline = state.isConnected === false || state.isInternetReachable === false;
  return { isOffline };
}
