// context/AuthContext.tsx
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// 1. Define the shape of your context
type AuthContextType = {
  user: any; // Replace with your User type later
  token: string | null;
  isloggedin: boolean;
  isLoading: boolean;
  authorizationToken: string | null;
  storeTokenInLS: (token: string) => void;
  LogoutUser: () => void;
};

// 2. Create context with undefined as default (forces provider check)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Provider component - MUST accept children
type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  // Fix: Only access localStorage in useEffect (client-side only)
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token only on client side
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    }
    setIsLoading(false);
  }, []);

  const authorizationToken = token ? `Bearer ${token}` : null;
  const isloggedin = !!token;

  const storeTokenInLS = (serverToken: string) => {
    localStorage.setItem("token", serverToken);
    setToken(serverToken);
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
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:5000/api/auth/user", {
        method: "GET",
        headers: {
          Authorization: authorizationToken!,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.userData);
      } else {
        setUser(null);
        LogoutUser(); // optional: auto logout on invalid token
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user when token changes
  useEffect(() => {
    if (token) {
      userAuthentication();
    } else {
      setUser(null);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isloggedin,
        isLoading,
        authorizationToken,
        storeTokenInLS,
        LogoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 4. Custom hook with proper typing and error
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}