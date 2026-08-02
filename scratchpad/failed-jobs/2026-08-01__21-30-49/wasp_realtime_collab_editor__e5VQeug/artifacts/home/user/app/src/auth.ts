import { defineUserSignupFields } from "wasp/server/auth";

export const userSignupFields = defineUserSignupFields({
  username: (data) => {
    const username = data.username;
    if (typeof username !== "string") {
      throw new Error("Username is required");
    }
    if (!username || username.trim() === "") {
      throw new Error("Username cannot be empty");
    }
    return username.trim();
  },
});
