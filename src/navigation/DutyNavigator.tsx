import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "./types";
import { AcceptDutyScreen } from "../screens/duty/AcceptDutyScreen";
import { DeclineDutyScreen } from "../screens/duty/DeclineDutyScreen";
import { UniformSelfieScreen } from "../screens/duty/UniformSelfieScreen";
import { VehicleExteriorScreen } from "../screens/duty/VehicleExteriorScreen";
import { VehicleInteriorScreen } from "../screens/duty/VehicleInteriorScreen";
import { DutyReadinessSubmitScreen } from "../screens/duty/DutyReadinessSubmitScreen";
import { DutyStartMapScreen } from "../screens/duty/DutyStartMapScreen";
import { PickupMapScreen } from "../screens/duty/PickupMapScreen";
import { PickupOtpScreen } from "../screens/duty/PickupOtpScreen";
import { WaitingForClientScreen } from "../screens/duty/WaitingForClientScreen";
import { DropOffMapScreen } from "../screens/duty/DropOffMapScreen";
import { DropOffScreen } from "../screens/duty/DropOffScreen";
import { ArrivedAtDropOffScreen } from "../screens/duty/ArrivedAtDropOffScreen";
import { TripSummaryScreen } from "../screens/duty/TripSummaryScreen";
import { PaymentBillingScreen } from "../screens/duty/PaymentBillingScreen";
import { PaymentQrScreen } from "../screens/duty/PaymentQrScreen";
import { CashPaymentReceivedScreen } from "../screens/duty/CashPaymentReceivedScreen";
import { DutyCompletionSlipScreen } from "../screens/duty/DutyCompletionSlipScreen";
import { BackToGarageScreen } from "../screens/duty/BackToGarageScreen";
import { GarageMapScreen } from "../screens/duty/GarageMapScreen";
import { DutyClosedScreen } from "../screens/duty/DutyClosedScreen";

const Stack = createNativeStackNavigator<DutyStackParamList>();

export function DutyNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="AcceptDuty">
      <Stack.Screen name="AcceptDuty" component={AcceptDutyScreen} />
      <Stack.Screen name="DeclineDuty" component={DeclineDutyScreen} />
      <Stack.Screen name="UniformSelfie" component={UniformSelfieScreen} />
      <Stack.Screen name="VehicleExterior" component={VehicleExteriorScreen} />
      <Stack.Screen name="VehicleInterior" component={VehicleInteriorScreen} />
      <Stack.Screen name="DutyReadinessSubmit" component={DutyReadinessSubmitScreen} />
      <Stack.Screen name="DutyStartMap" component={DutyStartMapScreen} />
      <Stack.Screen name="PickupMap" component={PickupMapScreen} />
      <Stack.Screen name="PickupOtp" component={PickupOtpScreen} />
      <Stack.Screen name="WaitingForClient" component={WaitingForClientScreen} />
      <Stack.Screen name="DropOffMap" component={DropOffMapScreen} />
      <Stack.Screen name="DropOff" component={DropOffScreen} />
      <Stack.Screen name="ArrivedAtDropOff" component={ArrivedAtDropOffScreen} />
      <Stack.Screen name="TripSummary" component={TripSummaryScreen} />
      <Stack.Screen name="PaymentBilling" component={PaymentBillingScreen} />
      <Stack.Screen name="PaymentQr" component={PaymentQrScreen} />
      <Stack.Screen name="CashPaymentReceived" component={CashPaymentReceivedScreen} />
      <Stack.Screen name="DutyCompletionSlip" component={DutyCompletionSlipScreen} />
      <Stack.Screen name="BackToGarage" component={BackToGarageScreen} />
      <Stack.Screen name="GarageMap" component={GarageMapScreen} />
      <Stack.Screen name="DutyClosed" component={DutyClosedScreen} />
    </Stack.Navigator>
  );
}
