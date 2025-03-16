import { ReactNode, createContext, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
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

  // Initialize auth token from localStorage
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      queryClient.setDefaultOptions({
        queries: {
          retry: false,
        },
      });
    }
  }, []);

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return null;

      try {
        return await apiRequest("GET", "/api/user"); // ✅ Fix applied
      } catch (error) {
        localStorage.removeItem("auth_token");
        throw error;
      }
    },
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const refreshCredits = async () => {
    try {
      const response = await apiRequest("GET", "/api/credits/balance");
      const data = await response.json();
      if (user) {
        queryClient.setQueryData(["/api/user"], {
          ...user,
          credits: data.credits,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update credit balance",
        variant: "destructive",
      });
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return res.json();
    },
    onSuccess: (data: LoginResponse) => {
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["/api/user"], data.user);
      refreshCredits();
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.name.split(" ")[0]}!`,
      });
    },
    onError: (error: Error) => {
      localStorage.removeItem("auth_token");
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
      localStorage.removeItem("auth_token");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return res.json();
    },
    onSuccess: (data: LoginResponse) => {
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["/api/user"], data.user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${data.user.name.split(" ")[0]}! Please verify your email to receive free credits.`,
      });
    },
  });

  useEffect(() => {
    if (user) {
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
