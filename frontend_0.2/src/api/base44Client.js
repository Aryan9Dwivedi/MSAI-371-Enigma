const noAuth =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_NO_AUTH === "true") ||
  false;

export const base44 = {
  auth: {
    me: async () => ({ id: "demo-user", name: "Demo User", role: "admin" }),
    logout: () => {},
    redirectToLogin: () => {},
  },
  entities: {},
  functions: {},
  __noAuth: noAuth,
};
