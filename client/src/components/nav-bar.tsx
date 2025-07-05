import { Link } from "wouter";
<<<<<<< HEAD
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/use-auth";
=======
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
import { Loader2, Coins } from "lucide-react";

export default function NavBar() {
  const { user, logoutMutation } = useAuth();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <span className="text-2xl font-bold">RoomcraftAI</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-4">
                <Link href="/generate">
                  <Button variant="ghost">Full Remake</Button>
                </Link>
                <Link href="/virtual-staging">
                  <Button variant="ghost">Virtual Staging</Button>
                </Link>
                <Link href="/account">
                  <Button variant="ghost">Account</Button>
                </Link>
              </div>
              <div className="flex items-center gap-2 text-sm border-l pl-4">
                <span className="text-muted-foreground">
                  Welcome, {user.name?.split(' ')[0] || user.username}
                </span>
                <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="font-medium">
                    {user.credits ?? 0} credits
                  </span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Logout
              </Button>
            </>
          ) : (
            <Link href="/auth">
              <Button variant="ghost">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}