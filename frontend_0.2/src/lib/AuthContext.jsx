import React, { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const noAuth = import.meta.env.VITE_NO_AUTH === "true";

  // Minimal "user" placeholder so the UI doesn't explode if it expects something.
  const [user] = useState(
    noAuth
      ? { id: "demo-user", name: "Demo User", role: "admin" }
      : null
  );

  const value = useMemo(() => {
    if (noAuth) {
      return {
        user,
        isAuthenticated: true,
        isLoadingAuth: false,
        isLoadingPublicSettings: false,
        authError: null,
        appPublicSettings: { id: "demo-app", public_settings: {} },
        logout: () => {},
        navigateToLogin: () => {},
        checkAppState: async () => {}
      };
    }

    // If noAuth is false, we still return a safe shape,
    // but you're not using Base44 anymore, so treat it as unauthenticated.
    return {
      user: null,
      isAuthenticated: false,
      isLoadingAuth: false,
      isLoadingPublicSettings: false,
      authError: { type: "auth_disabled", message: "Auth disabled in static build" },
      appPublicSettings: null,
      logout: () => {},
      navigateToLogin: () => {},
      checkAppState: async () => {}
    };
  }, [noAuth, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      isAuthenticated: false,
      isLoadingAuth: false,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: null,
      logout: () => {},
      navigateToLogin: () => {},
      checkAppState: async () => {}
    };
  }
  return ctx;
};
