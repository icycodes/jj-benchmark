import { defineUserSignupFields } from "wasp/server/auth";

export const userSignupFields = defineUserSignupFields({
  username: async (data) => {
    const username = data.username;
    if (typeof username !== "string" || !username) {
      throw new Error("Username is required");
    }
    return username;
  },
  role: async (data) => {
    const role = data.role;
    if (typeof role !== "string") {
      return "CUSTOMER";
    }
    const upperRole = role.toUpperCase();
    if (upperRole !== "CUSTOMER" && upperRole !== "AGENT" && upperRole !== "MANAGER") {
      throw new Error("Invalid role. Must be CUSTOMER, AGENT, or MANAGER");
    }
    return upperRole;
  },
  password: async (data) => {
    return "temp-password";
  }
});
