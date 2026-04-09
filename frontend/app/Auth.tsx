// context/AuthContext.tsx
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// Define User Type (Recommended)
type User = {
  _id: string;
  username?: string;
  email: string;
  role: "user" | "admin";     // ← Important for admin check
  isAdmin?: boolean;          // Optional fallback
  // Add other fields your backend returns
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isloggedin: boolean;
  isLoading: boolean;
  isAdmin: boolean;                    // ← New: Easy admin check
  authorizationToken: string | null;
  storeTokenInLS: (token: string) => void;
  LogoutUser: () => void;
};

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount (client-side only)
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    }
    setIsLoading(false);
  }, []);

  const authorizationToken = token ? `Bearer ${token}` : null;
  const isloggedin = !!token;

  // New: Check if user is admin
  const isAdmin = !!(user?.role === "admin" || user?.isAdmin === true);

  const storeTokenInLS = (serverToken: string) => {
    localStorage.setItem("token", serverToken);
    setToken(serverToken);
    // Optional: You can remove alert or replace with toast later
    alert("You have been logged in successfully.");
  };

  const LogoutUser = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    alert("You have been logged out successfully.");
  };

  const userAuthentication = async () => {
    if (!token) {
      setUser(null);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
        method: "GET",
        headers: {
          Authorization: authorizationToken!,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.userData || data.user); // Handle both possible response shapes
      } else {
        console.warn("Failed to fetch user data");
        setUser(null);
        LogoutUser(); // Auto logout on invalid token
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user data whenever token changes
  useEffect(() => {
    if (token) {
      userAuthentication();
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isloggedin,
        isLoading,
        isAdmin,                    // ← Now available everywhere
        authorizationToken,
        storeTokenInLS,
        LogoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom Hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}