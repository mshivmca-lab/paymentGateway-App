import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import api from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionTimeout, setSessionTimeout] = useState(null);
  const tokenRefreshTimeout = useRef(null);

  const SESSION_TIMEOUT = 30 * 60 * 1000;
  const TOKEN_REFRESH_INTERVAL = SESSION_TIMEOUT - 5 * 60 * 1000;

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (storedUser && token) {
          try {
            const res = await api.get("/auth/me");
            if (res.data.success) {
              setUser(res.data.data);
              setIsAuthenticated(true);
            } else {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
            }
          } catch {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading user data:", error);
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.get("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("sessionExpiry");

      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
        setSessionTimeout(null);
      }

      if (tokenRefreshTimeout.current) {
        clearTimeout(tokenRefreshTimeout.current);
        tokenRefreshTimeout.current = null;
      }

      setUser(null);
      setIsAuthenticated(false);
    }
  }, [sessionTimeout]);

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      console.log("📤 Sending registration request:", userData);
      const res = await api.post("/auth/register", userData);
      console.log("📥 Registration response received:", res.data);
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        const expiryTime = Date.now() + SESSION_TIMEOUT;
        localStorage.setItem("sessionExpiry", expiryTime.toString());

        setUser(res.data.user);
        setIsAuthenticated(true);

        resetSessionTimeout();
        setLoading(false);
        return res.data;
      }else {
      // Handle unsuccessful response
      setLoading(false);
      const errorMsg = res.data.error || res.data.message || "Registration failed";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
    } 
    catch (err) {
      console.error("❌ Registration error:", err);
    setLoading(false);
    
    const errorMessage = err.response?.data?.error || err.message || "Something went wrong";
    setError(errorMessage);
    throw err;
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.post("/auth/login", { email, password });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        const expiryTime = Date.now() + SESSION_TIMEOUT;
        localStorage.setItem("sessionExpiry", expiryTime.toString());

        setUser(res.data.user);
        setIsAuthenticated(true);

        resetSessionTimeout();
      }

      setLoading(false);
      return res.data;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || "Invalid credentials");
      throw err;
    }
  };

  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  const refreshToken = useCallback(async () => {
    try {
      if (isAuthenticated && localStorage.getItem("token")) {
        // Using api instance which already handles auth headers and base URL
        const res = await api.get("/auth/refresh-token");

        if (res.data.success) {
          localStorage.setItem("token", res.data.token);

          if (res.data.user) {
            localStorage.setItem("user", JSON.stringify(res.data.user));
            setUser(res.data.user);
          }

          const expiryTime = Date.now() + SESSION_TIMEOUT;
          localStorage.setItem("sessionExpiry", expiryTime.toString());

          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("Token refresh failed:", err);
      logout();
      return false;
    }
  }, [isAuthenticated, logout]);

  const resetSessionTimeout = useCallback(() => {
    if (sessionTimeout) clearTimeout(sessionTimeout);
    if (tokenRefreshTimeout.current) clearTimeout(tokenRefreshTimeout.current);

    if (isAuthenticated) {
      const expiryTime = Date.now() + SESSION_TIMEOUT;
      localStorage.setItem("sessionExpiry", expiryTime.toString());

      const newTimeout = setTimeout(() => {
        logout();
      }, SESSION_TIMEOUT);

      tokenRefreshTimeout.current = setTimeout(() => {
        refreshToken();
      }, TOKEN_REFRESH_INTERVAL);

      setSessionTimeout(newTimeout);
    }
  }, [isAuthenticated, logout, refreshToken]);

  const resetRef = useRef(resetSessionTimeout);
  useEffect(() => {
    resetRef.current = resetSessionTimeout;
  }, [resetSessionTimeout]);

  useEffect(() => {
    if (isAuthenticated) {
      const resetOnActivity = () => resetRef.current();

      const handleBeforeUnload = () => {
        if (window.performance && window.performance.navigation.type !== 1) {
          localStorage.removeItem("sessionExpiry");
        }
      };

      window.addEventListener("mousemove", resetOnActivity);
      window.addEventListener("keypress", resetOnActivity);
      window.addEventListener("click", resetOnActivity);
      window.addEventListener("scroll", resetOnActivity);
      window.addEventListener("beforeunload", handleBeforeUnload);

      const sessionExpiry = localStorage.getItem("sessionExpiry");
      if (sessionExpiry) {
        const expiryTime = parseInt(sessionExpiry, 10);
        if (Date.now() > expiryTime) {
          logoutRef.current();
        } else {
          resetRef.current();
        }
      } else {
        resetRef.current();
      }

      return () => {
        window.removeEventListener("mousemove", resetOnActivity);
        window.removeEventListener("keypress", resetOnActivity);
        window.removeEventListener("click", resetOnActivity);
        window.removeEventListener("scroll", resetOnActivity);
        window.removeEventListener("beforeunload", handleBeforeUnload);

        if (sessionTimeout) {
          clearTimeout(sessionTimeout);
        }

        if (tokenRefreshTimeout.current) {
          clearTimeout(tokenRefreshTimeout.current);
        }
      };
    }
  }, [isAuthenticated]);

  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.put("/auth/updatedetails", userData);

      if (res.data.success) {
        localStorage.setItem("user", JSON.stringify(res.data.data));
        setUser(res.data.data);
      }

      setLoading(false);
      return res.data;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || "Update failed");
      throw err;
    }
  };

  const updatePassword = async (passwordData) => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.put("/auth/updatepassword", passwordData);

      setLoading(false);
      return res.data;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || "Password update failed");
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        updatePassword,
        refreshToken,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;