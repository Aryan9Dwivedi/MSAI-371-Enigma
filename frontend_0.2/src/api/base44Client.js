const isNoAuth = import.meta.env.VITE_NO_AUTH === "true";

export const base44 = isNoAuth
  ? {
      entities: {},
      functions: {},
      auth: {},
    }
  : null;
