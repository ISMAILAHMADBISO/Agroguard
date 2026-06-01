/**
 * AgroGuard — root application entry point.
 *
 * Provides:
 *   - TanStack Query client (data fetching / caching)
 *   - AuthProvider (session management, user context)
 *   - Wouter Router (client-side routing, base path from Vite env)
 *   - ProtectedRoute wrapper (redirects unauthenticated users to /login)
 */
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/auth";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import FarmersPage from "@/pages/farmers";
import FarmerDetailPage from "@/pages/farmer-detail";
import DevicesPage from "@/pages/devices";
import DeviceDetailPage from "@/pages/device-detail";
import AlertsPage from "@/pages/alerts";
import RecommendationsPage from "@/pages/recommendations";
import AnalyticsPage from "@/pages/analytics";
import StaffPage from "@/pages/staff";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Wraps a page component with auth guard + AppLayout.
 * If not authenticated, redirects to /login.
 */
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <img
            src="/agroguard-logo.png"
            alt="AgroGuard"
            className="h-16 w-16 mx-auto rounded-full object-cover ring-4 ring-primary/20 animate-pulse"
          />
          <p className="text-muted-foreground text-sm">Loading platform...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/farmers" component={() => <ProtectedRoute component={FarmersPage} />} />
      <Route path="/farmers/:id" component={() => <ProtectedRoute component={FarmerDetailPage} />} />
      <Route path="/devices" component={() => <ProtectedRoute component={DevicesPage} />} />
      <Route path="/devices/:id" component={() => <ProtectedRoute component={DeviceDetailPage} />} />
      <Route path="/alerts" component={() => <ProtectedRoute component={AlertsPage} />} />
      <Route path="/recommendations" component={() => <ProtectedRoute component={RecommendationsPage} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={AnalyticsPage} />} />
      <Route path="/staff" component={() => <ProtectedRoute component={StaffPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
