import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import {
  clearStoredTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredTokens,
} from "../services/api";

const AuthContext = createContext(null);
const storedUserKey = "terramind_user";

const readStoredUser = () => {
  const user = localStorage.getItem(storedUserKey);
  return user ? JSON.parse(user) : null;
};

const persistUser = (user) => {
  if (user) {
    localStorage.setItem(storedUserKey, JSON.stringify(user));
  } else {
    localStorage.removeItem(storedUserKey);
  }
};

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(getStoredAccessToken());
  const [refreshToken, setRefreshToken] = useState(getStoredRefreshToken());
  const [user, setUser] = useState(readStoredUser());
  const [loading, setLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [error, setError] = useState("");

  const syncAuthState = ({ access, refresh, profile }) => {
    if (access || refresh) {
      setStoredTokens({ access, refresh });
      setAccessToken(access || getStoredAccessToken());
      setRefreshToken(refresh || getStoredRefreshToken());
    }

    if (profile) {
      setUser(profile);
      persistUser(profile);
    }
  };

  useEffect(() => {
    const syncFromStorage = async () => {
      const storedAccessToken = getStoredAccessToken();
      const storedRefreshToken = getStoredRefreshToken();
      const storedProfile = readStoredUser();

      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setUser(storedProfile);

      if (!storedAccessToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getProfile();
        setUser(response.data);
        persistUser(response.data);
      } catch (profileError) {
        console.error(profileError);
        clearStoredTokens();
        persistUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    syncFromStorage();

    const handleAuthCleared = () => {
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      persistUser(null);
      setError("");
    };

    window.addEventListener("terramind-auth-cleared", handleAuthCleared);
    window.addEventListener("storage", syncFromStorage);

    return () => {
      window.removeEventListener("terramind-auth-cleared", handleAuthCleared);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  const login = async (credentials) => {
    setAuthBusy(true);
    setError("");

    try {
      const response = await authService.login(credentials);
      const { access, refresh, user: loginUser } = response.data;

      syncAuthState({ access, refresh, profile: loginUser || null });

      const profileResponse = await authService.getProfile();
      syncAuthState({ profile: profileResponse.data });

      return response.data;
    } catch (loginError) {
      const message =
        loginError.response?.data?.detail ||
        loginError.response?.data?.non_field_errors?.[0] ||
        "Unable to log in. Please check your credentials and try again.";
      setError(message);
      throw loginError;
    } finally {
      setAuthBusy(false);
    }
  };

  const logout = () => {
    clearStoredTokens();
    persistUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setError("");
  };

  const isAuthenticated = () => Boolean(accessToken);
  const currentUser = () => user;

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      user,
      loading,
      authBusy,
      error,
      login,
      logout,
      isAuthenticated,
      currentUser,
      setError,
    }),
    [accessToken, refreshToken, user, loading, authBusy, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
