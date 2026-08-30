import * as SecureStore from "expo-secure-store";

// executionToken is a bearer-equivalent credential for the token-authenticated
// /driver-api/duty/{token}/** endpoints (it alone can end a duty and generate
// a payment QR — see ExternalDriverDutyController), the same sensitivity
// class as the driver's JWT, so it belongs in SecureStore (iOS Keychain /
// Android Keystore), never AsyncStorage. Only the minimum needed to
// reconcile is stored: the duty id and its token — no fare, personal, or
// route data.
const ACTIVE_DUTY_KEY = "luxorides_active_duty";

export interface PersistedActiveDuty {
  dutyId: string;
  executionToken: string;
}

export const dutyStorage = {
  async getActiveDuty(): Promise<PersistedActiveDuty | null> {
    const raw = await SecureStore.getItemAsync(ACTIVE_DUTY_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PersistedActiveDuty;
    } catch {
      return null;
    }
  },
  async setActiveDuty(duty: PersistedActiveDuty): Promise<void> {
    await SecureStore.setItemAsync(ACTIVE_DUTY_KEY, JSON.stringify(duty));
  },
  async clearActiveDuty(): Promise<void> {
    await SecureStore.deleteItemAsync(ACTIVE_DUTY_KEY);
  },
};
