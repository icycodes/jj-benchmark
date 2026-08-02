import { defineUserSignupFields } from "wasp/server/auth";

export const userSignupFields = defineUserSignupFields({
  username: (data: any) => {
    if (!data.username) {
      throw new Error("Username is required");
    }
    return data.username;
  },
  password: (data: any) => {
    return data.password || "password123";
  },
});
