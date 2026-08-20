import * as SecureStore from "expo-secure-store";

// The driver's JWT lives in the platform's secure storage (iOS Keychain /
// Android Keystore), never AsyncStorage, which is unencrypted.
const TOKEN_KEY = "luxorides_driver_token";

export const authStorage = {
  getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  setToken(token: string): Promise<void> {
    return SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  clearToken(): Promise<void> {
    return SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};
