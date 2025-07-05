<<<<<<< HEAD
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useAuth } from "../hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { Loader2, CreditCard } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
=======
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { Loader2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff

export default function AccountPage() {
  const { user, refreshCredits } = useAuth();
  const { toast } = useToast();

  const addCreditsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/add-credits");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add credits");
      }
      return response.json();
    },
    onSuccess: () => {
      refreshCredits();
      toast({
        title: "Credits Added",
        description: "10 credits have been added to your account.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="space-y-2">
            <p><span className="text-muted-foreground">Username:</span> {user?.username}</p>
            <p><span className="text-muted-foreground">Credits:</span> {user?.credits}</p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Credits Management</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Add test credits to your account. For testing purposes only.
            </p>
            <Button 
              onClick={() => addCreditsMutation.mutate()}
              disabled={addCreditsMutation.isPending}
            >
              {addCreditsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <CreditCard className="mr-2 h-4 w-4" />
              Add 10 Test Credits
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}