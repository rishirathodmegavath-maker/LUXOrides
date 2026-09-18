import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/types";
import { IconCircle, InlineErrorBanner, ListRow, ScreenContainer, ScreenHeader } from "../../components";
import { onboardingService, DocumentStatus } from "../../services";
import { colors, spacing } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Documents">;

const ROW_STATUS: Partial<Record<DocumentStatus, { label: string; color: string }>> = {
  verified: { label: "Verified", color: colors.success },
  verifying: { label: "In review", color: colors.warning },
  uploading: { label: "In review", color: colors.warning },
  failed: { label: "Action needed", color: colors.error },
};

// Same real document status (documentApi -> DriverDocumentController) that
// onboarding's OnboardingHubScreen shows -- surfaced here too so an already
// approved driver can still see/re-check their licence & Aadhaar status
// without re-entering onboarding, which only ever mounts before approval.
export function DocumentsScreen({ navigation }: Props) {
  const [licence, setLicence] = useState<DocumentStatus>("idle");
  const [aadhaar, setAadhaar] = useState<DocumentStatus>("idle");
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    onboardingService.getDocumentStatus("drivingLicence").then(setLicence).catch(() => setLoadError(true));
    onboardingService.getDocumentStatus("aadhaarCard").then(setAadhaar).catch(() => setLoadError(true));
  }, []);

  useFocusEffect(load);

  return (
    <ScreenContainer>
      <ScreenHeader onBack={() => navigation.goBack()} title="Documents" />

      {loadError ? <InlineErrorBanner message="Couldn't load your document status." onRetry={load} /> : null}

      <ListRow
        icon={<IconCircle><Feather name="credit-card" size={20} color={colors.textPrimary} /></IconCircle>}
        title="Driving Licence"
        subtitle={ROW_STATUS[licence]?.label ?? "Not uploaded yet"}
        onPress={() => navigation.navigate("DocumentUpload", { doc: "drivingLicence" })}
      />
      <View style={{ height: spacing.xs }} />
      <ListRow
        icon={<IconCircle><Feather name="shield" size={20} color={colors.textPrimary} /></IconCircle>}
        title="Aadhaar Card"
        subtitle={ROW_STATUS[aadhaar]?.label ?? "Not uploaded yet"}
        onPress={() => navigation.navigate("DocumentUpload", { doc: "aadhaarCard" })}
      />
    </ScreenContainer>
  );
}
