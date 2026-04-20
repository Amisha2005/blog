// context/AuthContext.tsx
"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { signOut, useSession } from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://virtual-interview-32pw.onrender.com";

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
  const { data: session, status } = useSession();
  const logoutInProgressRef = useRef(false);

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
  };

  // If user logged in via NextAuth (GitHub/Google), persist backend token for the rest of the app.
  useEffect(() => {
    if (logoutInProgressRef.current) return;
    if (status !== "authenticated") return;
    if (!session?.backendToken) return;
    if (token) return;
    const existing = localStorage.getItem("token");
    if (existing) {
      setToken(existing);
      return;
    }
    storeTokenInLS(session.backendToken);
  }, [status, session?.backendToken, token]);

  // Once NextAuth finishes logging out, allow token sync again.
  useEffect(() => {
    if (status === "unauthenticated") {
      logoutInProgressRef.current = false;
    }
  }, [status]);

  const LogoutUser = () => {
    // Prevent the session->token sync effect from re-adding the token while signOut() is in-flight.
    logoutInProgressRef.current = true;
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    // Also clear any NextAuth session so OAuth users don't get "auto-logged-in" again.
    signOut({ redirect: false }).catch(() => {
      // ignore
    });
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
