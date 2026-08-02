import { HttpError } from "wasp/server";
import type { OnBeforeSignupHook } from "wasp/server/auth";

export const onBeforeSignup: OnBeforeSignupHook = async ({ providerId, prisma, req }) => {
  const body = req.body || {};
  const username = body.username || providerId.providerUserId;
  const role = body.role;

  if (role === "ADMIN") {
    if (!username || !username.endsWith("_admin")) {
      throw new HttpError(403, "Admin username must end with _admin");
    }
  }
};
