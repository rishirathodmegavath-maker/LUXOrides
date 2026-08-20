import React, { useEffect, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, QrPaymentCard, ScreenContainer, ScreenHeader } from "../../components";
import { dutyService } from "../../services";
import { useDutyStore } from "../../store/dutyStore";

type Props = NativeStackScreenProps<DutyStackParamList, "PaymentQr">;

const POLL_INTERVAL_MS = 4000;

// Mirrors the payment QR panel from the Figma side-drawer / payment flow —
// reused here as its own duty-flow screen once a bill is generated. Polls
// the real payment-status endpoint once a duty was actually ended for
// real (executionToken set); no-ops harmlessly on the mock-only path.
export function PaymentQrScreen({ navigation }: Props) {
  const result = useDutyStore((s) => s.dutyEndResult);
  const executionToken = useDutyStore((s) => s.executionToken);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!executionToken || paid) return;
    const interval = setInterval(async () => {
      const status = await dutyService.checkPaymentStatus();
      if (status.paid) setPaid(true);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [executionToken, paid]);

  return (
    <ScreenContainer footer={<Button label="Payment Received" onPress={() => navigation.navigate("DutyCompletionSlip")} />}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Scan to Pay" />
      <QrPaymentCard qrCodeUrl={result?.qrCodeUrl} amount={result?.amountToCollect} paid={paid} />
    </ScreenContainer>
  );
}
