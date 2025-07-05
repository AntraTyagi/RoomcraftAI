<<<<<<< HEAD
import { useCredits } from "../hooks/use-credits";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
=======
import { useCredits } from "@/hooks/use-credits";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
import { Loader2, Coins } from "lucide-react";
import { format } from "date-fns";

export default function CreditHistory() {
  const { history, isLoading } = useCredits();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit History</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {history?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No credit usage history yet
            </p>
          ) : (
            <div className="space-y-4">
              {history?.map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between p-2 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{entry.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(entry.timestamp), "PPpp")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-primary">
                    <Coins className="w-4 h-4" />
                    <span>-{entry.creditsUsed}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
