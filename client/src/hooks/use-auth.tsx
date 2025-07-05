import { ReactNode, createContext, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { useToast } from "./use-toast";

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

  // User query with session-based authentication
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/user", { 
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('auth_token') || ''}`
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            throw new Error("Authentication required");
          }
          throw new Error(await response.text());
        }
        
        return response.json();
      } catch (error) {
        // Only clear token if it's an auth error
        if (error instanceof Error && (error.name === "AuthError" || error.message === "Authentication required")) {
          localStorage.removeItem('auth_token');
        }
        throw error;
      }
    },
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

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
        console.log("Updating cached user data:", updatedUser);
        queryClient.setQueryData(["/api/user"], updatedUser);
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
        const errorText = await response.text();
        console.error('Login error:', errorText);
        throw new Error(errorText);
      }
      
      const data = await response.json();
      console.log('Login response:', data);
      return data;
    },
    onSuccess: (data: LoginResponse) => {
      console.log('Login success:', data);
      localStorage.setItem('auth_token', data.token);
      queryClient.setQueryData(["/api/user"], data.user);
      refreshCredits();
      const firstName = data.user.name.split(' ')[0];
      toast({
        title: "Login successful",
        description: `Welcome back, ${firstName}!`,
      });
    },
    onError: (error: Error) => {
      console.error('Login error:', error);
      localStorage.removeItem('auth_token');
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
      queryClient.setQueryData(["/api/user"], null);
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
      queryClient.setQueryData(["/api/user"], data.user);
      const firstName = data.user.name.split(' ')[0];
      toast({
        title: "Registration successful",
        description: `Welcome, ${firstName}! You have received 10 free credits.`,
      });
    },
    onError: (error: Error) => {
      localStorage.removeItem('auth_token');
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
        user: user || null,
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