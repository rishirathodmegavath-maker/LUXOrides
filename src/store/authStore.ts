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
  // permissionsDone deliberately survives a reset -- it tracks whether this
  // device completed the permission wizard, not whether a driver is
  // logged in, so a logout/login cycle must not re-litigate it (it would
  // also disagree with what's already persisted in permissionsStorage the
  // moment the driver logs back in without an app restart in between).
  reset: () => set({ session: null, approvalStatus: "pending" }),
}));
