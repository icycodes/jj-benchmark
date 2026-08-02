import { defineUserSignupFields } from 'wasp/server/auth';

export const userSignupFields = defineUserSignupFields({
  role: (data: any) => {
    const role = data.role;
    if (!role) {
      throw new Error('Role is required');
    }
    const upperRole = role.toUpperCase();
    if (upperRole !== 'CUSTOMER' && upperRole !== 'AGENT' && upperRole !== 'MANAGER') {
      throw new Error('Role must be CUSTOMER, AGENT, or MANAGER');
    }
    return upperRole;
  },
});
