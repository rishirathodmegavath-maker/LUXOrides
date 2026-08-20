import { create } from "zustand";

interface OnboardingState {
  garageDone: boolean;
  photoDone: boolean;
  garageName: string | null;
  setGarageDone: (done: boolean, name?: string) => void;
  setPhotoDone: (done: boolean) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  garageDone: false,
  photoDone: false,
  garageName: null,
  setGarageDone: (garageDone, name) => set({ garageDone, garageName: name ?? null }),
  setPhotoDone: (photoDone) => set({ photoDone }),
  reset: () => set({ garageDone: false, photoDone: false, garageName: null }),
}));
