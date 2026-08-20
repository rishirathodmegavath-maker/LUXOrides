import { BillBreakdown, PaymentService } from "../types";
import { delay } from "./utils";

export class MockPaymentService implements PaymentService {
  async getBill(_dutyId: string): Promise<BillBreakdown> {
    const bookingAmount = 20000;
    const additionalCharges = 1750;
    const subtotal = bookingAmount + additionalCharges;
    const gstPercent = 17;
    const gstAmount = Math.round(subtotal * (gstPercent / 100) * 100) / 100;
    const totalBill = subtotal + gstAmount;
    const advancePaid = 10000;
    return delay(
      {
        bookingAmount,
        additionalCharges,
        subtotal,
        gstPercent,
        gstAmount,
        totalBill,
        advancePaid,
        advancePaidDate: "18 May 2025",
        balancePayable: totalBill - advancePaid,
        distanceKm: 57.5,
        durationLabel: "3 Hrs 30 mins",
      },
      500
    );
  }

  async getQrPaymentInfo(): Promise<{ upiId: string; qrPayload: string }> {
    return delay({ upiId: "123XXXXXXX@paytm", qrPayload: "upi://pay?pa=luxorides@paytm&pn=LuxoRides" }, 300);
  }

  async confirmCashPayment(_amount: number): Promise<void> {
    await delay(null, 600);
  }
}
