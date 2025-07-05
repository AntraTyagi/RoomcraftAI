<<<<<<< HEAD
import { jsxDEV } from "react/jsx-dev-runtime";
import { useAuth } from "../hooks/use-auth";
=======
import { useAuth } from "@/hooks/use-auth";
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/auth" />;
        }

        try {
          return <Component />;
        } catch (error) {
          console.error('Error rendering protected component:', error);
          return (
            <div className="flex flex-col items-center justify-center min-h-screen">
              <p className="text-destructive mb-4">Something went wrong</p>
              <Redirect to="/" />
            </div>
          );
        }
      }}
    </Route>
  );
}