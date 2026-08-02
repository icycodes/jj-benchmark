import { defineUserSignupFields } from "wasp/server/auth";

export const userSignupFields = defineUserSignupFields({
  username: async (data) => {
    const username = data.username;
    if (typeof username !== "string" || !username) {
      throw new Error("Username is required");
    }
    return username;
  },
  password: async (data) => {
    return "dummy-password";
  },
  role: async (data) => {
    const role = data.role;
    if (typeof role !== "string" || !role) {
      return "CUSTOMER";
    }
    if (role !== "CUSTOMER" && role !== "AGENT" && role !== "MANAGER") {
      throw new Error("Invalid role");
    }
    return role;
  },
});
