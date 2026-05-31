import { createContext, useEffect, useMemo, useState } from "react";
import { normalizeRole } from "lib/accessControl";
import { refreshAdminClaims, signOutUser, subscribeToAuthState } from "services/authService";

export const AuthContext = createContext({
  user: null,
  claims: null,
  profile: null,
  isLoading: true,
});

const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    user: null,
    claims: null,
    profile: null,
    isLoading: true,
  });

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((nextState) => {
      setState({
        ...nextState,
        isLoading: false,
      });
    });

    const refreshClaims = async () => {
      try {
        const nextState = await refreshAdminClaims();
        const nextRole = normalizeRole(
          nextState?.claims?.role || nextState?.profile?.role
        );
        if (
          nextState?.user &&
          (!nextState.claims?.approved ||
            !["super_admin", "admin", "chef"].includes(nextRole))
        ) {
          await signOutUser();
          return;
        }

        setState((current) => ({
          ...current,
          ...nextState,
          isLoading: false,
        }));
      } catch (error) {
        setState((current) => ({
          ...current,
          error,
          isLoading: false,
        }));
      }
    };

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === "visible") {
        refreshClaims();
      }
    };

    window.addEventListener("focus", refreshClaims);
    document.addEventListener("visibilitychange", handleVisibilityRefresh);

    return () => {
      window.removeEventListener("focus", refreshClaims);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
      unsubscribe();
    };
  }, []);

  const contextValue = useMemo(() => state, [state]);

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
