import React, { createContext, useContext, useState, useEffect } from "react";
import { Role } from "@realestate-crm/shared";
import { apiClient } from "@/lib/api-client";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check current session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await apiClient("/api/auth/me");
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const data = await apiClient("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await apiClient("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  };

  const isAdmin = user?.role === Role.ADMIN;
  const isSalesEmployee = user?.role === Role.SALES_EMPLOYEE;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAdmin,
        isSalesEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
