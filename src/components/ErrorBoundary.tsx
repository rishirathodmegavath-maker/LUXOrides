import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Sentry } from "../config/sentry";
import { track } from "../services/analytics";
import { SUPPORT_PHONE_TEL } from "../constants/support";
import { colors, spacing, type } from "../theme";
import { Button } from "./Button";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  resetKey: number;
}

// Catches a render-time crash ANYWHERE in the tree below it (a bad API
// response shape, a null the UI didn't expect, etc.) so it never white-
// screens the whole app. Deliberately a minimal, self-contained fallback --
// no ScreenContainer, no store reads -- because the very thing being
// recovered from is "something in this app's own rendering broke," so the
// recovery screen itself must not depend on anything that could also break.
//
// "Try Again" doesn't just clear the error flag: it changes `resetKey`,
// which is used as the children wrapper's `key`, forcing React to fully
// unmount and remount the subtree rather than resume whatever component
// state existed when it crashed. Screens across this app already refetch
// their own authoritative state on mount (today's duty, fare, payment
// status), so a fresh mount is what actually gets the driver back to real
// data instead of replaying the same broken state.
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, resetKey: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack ?? undefined } },
    });
  }

  private handleRetry = (): void => {
    track("error_recovery");
    this.setState((s) => ({ hasError: false, resetKey: s.resetKey + 1 }));
  };

  private handleCallSupport = (): void => {
    Linking.openURL(SUPPORT_PHONE_TEL).catch(() => {});
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.root}>
          <View style={styles.content}>
            <Feather name="alert-triangle" size={40} color={colors.error} />
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              Your trip information is safe. Please try again.
            </Text>
            <Button label="Try Again" onPress={this.handleRetry} style={styles.button} />
            <Button
              label="Call Support"
              variant="secondary"
              onPress={this.handleCallSupport}
              style={styles.button}
            />
          </View>
        </SafeAreaView>
      );
    }

    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  title: { ...type.h4, color: colors.textPrimary, textAlign: "center", marginTop: spacing.md },
  subtitle: { ...type.body2, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.md },
  button: { width: "100%", marginTop: spacing.sm },
});
