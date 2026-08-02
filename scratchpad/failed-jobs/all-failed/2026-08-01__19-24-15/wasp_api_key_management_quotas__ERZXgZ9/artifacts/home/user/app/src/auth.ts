import { defineUserSignupFields } from 'wasp/server/auth';

export const userSignupFields = defineUserSignupFields({
  username: async (data: any) => {
    if (!data.username) {
      throw new Error('Username is required');
    }
    return data.username;
  },
  password: async (data: any) => {
    if (!data.password) {
      throw new Error('Password is required');
    }
    return data.password;
  }
});
