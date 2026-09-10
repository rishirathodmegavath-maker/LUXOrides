import { useAuthStore } from "../store/authStore";

// permissionsDone tracks whether this device completed the permission
// wizard -- a device-level fact, not an account credential -- so logging
// out must not force a returning driver back through it. Before this fix,
// reset() unconditionally zeroed permissionsDone, which (once persistence
// exists) would disagree with what's still true in permissionsStorage the
// moment the same device logs back in without an app restart in between.

describe("useAuthStore.reset", () => {
  test("clears session and approvalStatus but leaves permissionsDone untouched", () => {
    useAuthStore.setState({
      session: { driverId: "d1", phone: "+919999999999", isNewUser: false },
      permissionsDone: true,
      approvalStatus: "approved",
    });

    useAuthStore.getState().reset();

    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().approvalStatus).toBe("pending");
    expect(useAuthStore.getState().permissionsDone).toBe(true);
  });

  test("a driver who never completed the wizard still has it correctly false after reset", () => {
    useAuthStore.setState({ session: { driverId: "d1", phone: "+919999999999", isNewUser: false }, permissionsDone: false, approvalStatus: "pending" });

    useAuthStore.getState().reset();

    expect(useAuthStore.getState().permissionsDone).toBe(false);
  });
});
