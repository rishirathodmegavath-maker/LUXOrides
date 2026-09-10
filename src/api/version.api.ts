import { publicApi } from "./client";

export interface AppVersionCheckResponse {
  minimumSupportedVersion: string;
  latestVersion: string;
  forceUpdate: boolean;
}

// Unauthenticated (see backend SecurityConfiguration's /public/** permitAll)
// -- must be reachable before login, at cold launch.
export const versionApi = {
  checkVersion(installedVersion: string): Promise<AppVersionCheckResponse> {
    return publicApi.get<AppVersionCheckResponse>(`/public/app/version?installedVersion=${encodeURIComponent(installedVersion)}`);
  },
};
