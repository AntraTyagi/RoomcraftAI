import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Generate from "@/pages/generate";
import AuthPage from "@/pages/auth-page";
import VirtualStaging from "@/pages/virtual-staging";
import Account from "@/pages/account";
import Layout from "@/components/layout";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/generate" component={Generate} />
        <Route path="/virtual-staging" component={VirtualStaging} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/account" component={Account} />
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