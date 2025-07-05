import { useQuery, useQueryClient } from "@tanstack/react-query";
<<<<<<< HEAD
import { useUser } from "../hooks/use-user";
=======
import { useUser } from "@/hooks/use-user";
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff

interface CreditHistory {
  _id: string;
  userId: string;
  operationType: 'generate' | 'inpaint';
  creditsUsed: number;
  timestamp: string;
  description: string;
}

export function useCredits() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const { data: balance, isLoading: isBalanceLoading } = useQuery({
    queryKey: ["/api/credits/balance"],
    queryFn: async () => {
      const response = await fetch("/api/credits/balance");
      if (!response.ok) throw new Error("Failed to fetch credit balance");
      const data = await response.json();
      return data.credits;
    },
    enabled: !!user,
  });

  const { data: history, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["/api/credits/history"],
    queryFn: async () => {
      const response = await fetch("/api/credits/history");
      if (!response.ok) throw new Error("Failed to fetch credit history");
      const data = await response.json();
      return data.history as CreditHistory[];
    },
    enabled: !!user,
  });

  return {
    balance,
    history,
    isLoading: isBalanceLoading || isHistoryLoading,
  };
}