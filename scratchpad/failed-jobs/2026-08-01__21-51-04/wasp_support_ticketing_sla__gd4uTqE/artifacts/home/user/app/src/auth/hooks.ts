import type { OnAfterSignupHook } from "wasp/server/auth";

export const onAfterSignup: OnAfterSignupHook = async ({
  providerId,
  user,
  prisma,
}) => {
  const identity = await prisma.authIdentity.findFirst({
    where: {
      auth: {
        userId: user.id,
      },
    },
  });

  if (identity && identity.providerData) {
    try {
      const providerData = JSON.parse(identity.providerData);
      const hashedPassword = providerData.hashedPassword;
      if (hashedPassword) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
          },
        });
      }
    } catch (err) {
      console.error("Error parsing providerData or updating user password in hook:", err);
    }
  }
};
