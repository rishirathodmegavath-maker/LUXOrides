import { create } from "zustand";
import { Session } from "../services/types";

interface AuthState {
  session: Session | null;
  permissionsDone: boolean;
  approvalStatus: "pending" | "approved" | "rejected";
  setSession: (session: Session | null) => void;
  setPermissionsDone: (done: boolean) => void;
  setApprovalStatus: (status: AuthState["approvalStatus"]) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  permissionsDone: false,
  approvalStatus: "pending",
  setSession: (session) => set({ session }),
  setPermissionsDone: (permissionsDone) => set({ permissionsDone }),
  setApprovalStatus: (approvalStatus) => set({ approvalStatus }),
  reset: () => set({ session: null, permissionsDone: false, approvalStatus: "pending" }),
}));
