import React, { useEffect, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, QrPaymentCard, ScreenContainer, ScreenHeader } from "../../components";
import { dutyService } from "../../services";
import { subscribeToDutyPaymentUpdates } from "../../services/realtime/dutyPaymentSocket";
import { useDutyStore } from "../../store/dutyStore";

type Props = NativeStackScreenProps<DutyStackParamList, "PaymentQr">;

// Mirrors the payment QR panel from the Figma side-drawer / payment flow —
// reused here as its own duty-flow screen once a bill is generated. A
// WebSocket push (see dutyPaymentSocket) replaces the old 4s poll; this
// still calls checkPaymentStatus() once up front, which is what makes the
// reconcileActiveDuty resume path work: after a restart, dutyEndResult is
// gone (only executionToken survives), so that first call is what actually
// populates the QR/amount before the socket ever connects.
export function PaymentQrScreen({ navigation }: Props) {
  const result = useDutyStore((s) => s.dutyEndResult);
  const executionToken = useDutyStore((s) => s.executionToken);
  const [paid, setPaid] = useState(false);
  const [amount, setAmount] = useState<number | null>(result?.amountToCollect ?? null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(result?.qrCodeUrl ?? null);

  useEffect(() => {
    if (!executionToken || paid) return;

    let active = true;

    const refresh = async () => {
      const status = await dutyService.checkPaymentStatus();
      if (!active) return;
      if (status.amount != null) setAmount(status.amount);
      if (status.qrImageUrl) setQrCodeUrl(status.qrImageUrl);
      if (status.paid) setPaid(true);
    };

    refresh();

    const unsubscribe = subscribeToDutyPaymentUpdates(executionToken, () => {
      refresh();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [executionToken, paid]);

  return (
    <ScreenContainer footer={<Button label="Payment Received" onPress={() => navigation.navigate("DutyCompletionSlip")} />}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Scan to Pay" />
      <QrPaymentCard qrCodeUrl={qrCodeUrl} amount={amount} paid={paid} />
    </ScreenContainer>
  );
}
