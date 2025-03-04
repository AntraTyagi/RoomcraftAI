import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";

export default function NavBar() {
  const { user, logout } = useUser();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <a className="text-2xl font-bold">RoomcraftAI</a>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                Welcome, {user.username}
              </span>
              <Button variant="ghost" onClick={() => logout()}>
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
