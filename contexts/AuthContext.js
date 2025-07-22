"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Refresh user data from server to get latest profile including avatar
        try {
          const response = await fetch("/api/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            const updatedUser = {
              ...parsedUser,
              ...data.user,
              id: data.user._id || data.user.id,
            };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));

            // Dispatch user update event
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("userUpdated", { detail: updatedUser })
              );
            }
          }
        } catch (error) {
          console.warn("Failed to refresh user profile on app load:", error);
          // Keep the existing user data if refresh fails
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);

      // Automatically refresh user profile to get complete data including avatar
      try {
        await refreshUser();
      } catch (error) {
        console.warn("Failed to refresh user profile after login:", error);
        // Don't fail the login if profile refresh fails
      }

      return { success: true };
    }

    return { success: false, error: data.error };
  };

  const register = async (email, password, name, role) => {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", email, password, name, role }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    }

    return { success: false, error: data.error };
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Enhanced API call wrapper with automatic token refresh
  const apiCall = async (url, options = {}) => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token available");
    }

    // Make the initial request
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    // If token expired, try to refresh user session
    if (response.status === 401 || response.status === 403) {
      try {
        const errorData = await response.json();

        // Check if it's specifically a token expiration error
        if (
          errorData.type === "TokenExpiredError" ||
          errorData.error?.includes("expired") ||
          errorData.error?.includes("token")
        ) {
          console.log("🔄 Token expired, attempting to refresh session...");

          // Clear expired token
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);

          // Notify user and redirect to login
          if (typeof window !== "undefined") {
            // Show a user-friendly message
            alert("Your session has expired. Please log in again.");

            // Redirect to login page or refresh the page
            window.location.reload();
          }

          throw new Error("Session expired. Please log in again.");
        }
      } catch (jsonError) {
        // If we can't parse the error response, still handle as auth error
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);

          if (typeof window !== "undefined") {
            alert("Your session has expired. Please log in again.");
            window.location.reload();
          }

          throw new Error("Session expired. Please log in again.");
        }
      }
    }

    return response;
  };

  // Enhanced getAuthHeaders with token validation
  const getAuthHeadersValidated = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return {};
    }

    // Quick token validation by checking expiration
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      // If token expires within the next 5 minutes, treat it as expired
      if (payload.exp && payload.exp < currentTime + 300) {
        console.log("🔄 Token expiring soon, clearing session...");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);

        if (typeof window !== "undefined") {
          alert("Your session has expired. Please log in again.");
          window.location.reload();
        }

        return {};
      }
    } catch (error) {
      console.log("⚠️ Could not validate token format, using as-is");
    }

    return { Authorization: `Bearer ${token}` };
  };

  // Token validation utility
  const isTokenValid = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      // Check if token is expired (with 1 minute buffer)
      return payload.exp && payload.exp > currentTime + 60;
    } catch (error) {
      console.log("⚠️ Invalid token format");
      return false;
    }
  };

  // Check token validity periodically
  useEffect(() => {
    const checkTokenPeriodically = () => {
      if (user && !isTokenValid()) {
        console.log("🔄 Token expired during session, logging out...");
        logout();
        if (typeof window !== "undefined") {
          alert("Your session has expired. Please log in again.");
          window.location.reload();
        }
      }
    };

    // Check token every 5 minutes
    const interval = setInterval(checkTokenPeriodically, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const refreshUser = async () => {
    try {
      console.log("Refreshing user profile...");
      const response = await fetch("/api/profile", {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        // Use the complete user data from the API, preserving any existing data
        const updatedUser = {
          ...user,
          ...data.user,
          id: data.user._id || data.user.id,
        };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // Dispatch user update event
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("userUpdated", { detail: updatedUser })
          );
        }

        console.log("User profile refreshed successfully:", updatedUser);
        return { success: true, user: updatedUser };
      }

      console.error(
        "Failed to refresh user profile:",
        response.status,
        response.statusText
      );
      return { success: false, error: "Failed to refresh user data" };
    } catch (error) {
      console.error("Error refreshing user:", error);
      return { success: false, error: "Failed to refresh user data" };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      }

      return { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: "Failed to update profile" };
    }
  };

  const updateUser = (updatedUserData) => {
    const newUser = { ...user, ...updatedUserData };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));

    // Dispatch a custom event to notify components of user update
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("userUpdated", { detail: newUser }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        register,
        logout,
        getAuthHeaders,
        getAuthHeadersValidated,
        apiCall,
        isTokenValid,
        updateProfile,
        updateUser,
        refreshUser,
        loading,
        isAuthenticated: !!user, // Add isAuthenticated property
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
