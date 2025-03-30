import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  credits: number;
}

interface LoginData {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<LoginResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<LoginResponse, Error, LoginData>;
  refreshCredits: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Function to fetch current user
  const fetchCurrentUser = async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsLoading(false);
        return null;
      }
      
      const response = await fetch("/api/user", { 
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          setIsLoading(false);
          return null;
        }
        throw new Error(await response.text());
      }
      
      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error("Error fetching user:", error);
      if (error instanceof Error) {
        setError(error);
      }
      localStorage.removeItem('auth_token');
      setIsLoading(false);
      return null;
    }
  };
  
  // Load user on initial render
  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        const userData = await fetchCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Failed to load user:", error);
        if (error instanceof Error) {
          setError(error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const refreshCredits = async () => {
    console.log("Refreshing user credits...");
    try {
      const response = await fetch("/api/credits/balance", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const data = await response.json();
      console.log("New credit balance:", data.credits);

      if (user) {
        const updatedUser = {
          ...user,
          credits: data.credits,
        };
        setUser(updatedUser);
      }
    } catch (error) {
      console.error("Failed to refresh credits:", error);
      toast({
        title: "Error",
        description: "Failed to update credit balance",
        variant: "destructive",
      });
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      return response.json();
    },
    onSuccess: (data: LoginResponse) => {
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
      refreshCredits();
      const firstName = data.user.name.split(' ')[0];
      toast({
        title: "Login successful",
        description: `Welcome back, ${firstName}!`,
      });
    },
    onError: (error: Error) => {
      localStorage.removeItem('auth_token');
      setUser(null);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      localStorage.removeItem('auth_token');
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      return response.json();
    },
    onSuccess: (data: LoginResponse) => {
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
      const firstName = data.user.name.split(' ')[0];
      toast({
        title: "Registration successful",
        description: `Welcome, ${firstName}! Please verify your email to receive free credits.`,
      });
    },
    onError: (error: Error) => {
      localStorage.removeItem('auth_token');
      setUser(null);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        refreshCredits,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}