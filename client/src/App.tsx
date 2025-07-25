import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
<<<<<<< HEAD
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import Home from "./pages/home";
import Generate from "./pages/generate";
import AuthPage from "./pages/auth-page";
import VirtualStaging from "./pages/virtual-staging";
import Account from "./pages/account";
import VerifyEmail from "./pages/verify-email";
import Layout from "./components/layout";
import { AuthProvider } from "./hooks/use-auth";
=======
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Generate from "@/pages/generate";
import AuthPage from "@/pages/auth-page";
import VirtualStaging from "@/pages/virtual-staging";
import Account from "@/pages/account";
import VerifyEmail from "@/pages/verify-email";
import Layout from "@/components/layout";
import { AuthProvider } from "@/hooks/use-auth";
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <ProtectedRoute path="/generate" component={Generate} />
        <ProtectedRoute path="/virtual-staging" component={VirtualStaging} />
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/account" component={Account} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;