import { ReactNode, createContext, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
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

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    console.log("Initial auth check:", { hasToken: Boolean(token) });
  }, []);

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const refreshCredits = async () => {
    console.log("Refreshing user credits...");
    try {
      const response = await apiRequest("GET", "/api/credits/balance");
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
      console.log("Attempting login...");
      const res = await apiRequest("POST", "/api/login", credentials);
      const data = await res.json();
      return data;
    },
    onSuccess: (data: LoginResponse) => {
      console.log("Login successful, setting token and user data");
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
      console.error("Login failed:", error);
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
      console.log("Logging out...");
      await apiRequest("POST", "/api/logout");
      localStorage.removeItem('auth_token');
    },
    onSuccess: () => {
      console.log("Logout successful, clearing user data");
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      console.error("Logout failed:", error);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Attempting registration...");
      const res = await apiRequest("POST", "/api/register", credentials);
      const data = await res.json();
      return data;
    },
    onSuccess: (data: LoginResponse) => {
      console.log("Registration successful, setting token and user data");
      localStorage.setItem('auth_token', data.token);
      queryClient.setQueryData(["/api/user"], data.user);
      const firstName = data.user.name.split(' ')[0];
      toast({
        title: "Registration successful",
        description: `Welcome, ${firstName}! Please verify your email to receive free credits.`,
      });
    },
    onError: (error: Error) => {
      console.error("Registration failed:", error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (user) {
      console.log("User data updated, refreshing credits");
      refreshCredits();
    }
  }, [user?.id]);

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