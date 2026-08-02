import { defineUserSignupFields } from "wasp/server/auth";

export const userSignupFields = defineUserSignupFields({
  role: (data: any) => {
    const r = data.role;
    if (r === "ANALYST" || r === "MANAGER" || r === "ADMIN") {
      return r;
    }
    return "ANALYST";
  }
});
