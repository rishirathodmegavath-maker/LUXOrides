import React from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, QrPaymentCard, ScreenContainer, ScreenHeader } from "../../components";

type Props = NativeStackScreenProps<DutyStackParamList, "PaymentQr">;

// Mirrors the payment QR panel from the Figma side-drawer / payment flow —
// reused here as its own duty-flow screen once a bill is generated.
export function PaymentQrScreen({ navigation }: Props) {
  return (
    <ScreenContainer footer={<Button label="Payment Received" onPress={() => navigation.navigate("DutyCompletionSlip")} />}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Scan to Pay" />
      <QrPaymentCard />
    </ScreenContainer>
  );
}
