import { defineUserSignupFields } from "wasp/server/auth";

export const userSignupFields = defineUserSignupFields({
  username: async (data: any) => {
    const username = data.username;
    if (typeof username !== "string" || !username) {
      throw new Error("Username is required");
    }
    return username;
  },
});
