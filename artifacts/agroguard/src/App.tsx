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
import { AuthProvider, useAuth, homePathForUser } from "@/context/auth";
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
import ChangePasswordPage from "@/pages/change-password";
import MyFarmPage from "@/pages/my-farm";

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
type Access = "staff" | "farmer" | "admin";

/**
 * Auth guard + AppLayout wrapper.
 *  - unauthenticated → /login
 *  - users with mustChangePassword → /change-password
 *  - role mismatch → redirected to their own home
 */
function ProtectedRoute({
  component: Component,
  access = "staff",
}: {
  component: React.ComponentType;
  access?: Access;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <img
            src="/agroguard-logo.png"
            alt="AgroGuard"
            className="h-20 w-20 mx-auto object-contain animate-pulse"
          />
          <p className="text-muted-foreground text-sm">Loading platform...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;

  if (user.mustChangePassword) return <Redirect to="/change-password" />;

  const isFarmer = user.userType === "farmer";
  const isAdmin = user.role === "super_admin" || user.role === "admin";

  if (access === "farmer" && !isFarmer) return <Redirect to={homePathForUser(user)} />;
  if (access === "staff" && isFarmer) return <Redirect to={homePathForUser(user)} />;
  if (access === "admin" && !isAdmin) return <Redirect to={homePathForUser(user)} />;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

/** Bare protected route (no layout) used by the change-password gate. */
function BareProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/change-password" component={() => <BareProtectedRoute component={ChangePasswordPage} />} />
      <Route path="/my-farm" component={() => <ProtectedRoute access="farmer" component={MyFarmPage} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/farmers" component={() => <ProtectedRoute component={FarmersPage} />} />
      <Route path="/farmers/:id" component={() => <ProtectedRoute component={FarmerDetailPage} />} />
      <Route path="/devices" component={() => <ProtectedRoute component={DevicesPage} />} />
      <Route path="/devices/:id" component={() => <ProtectedRoute component={DeviceDetailPage} />} />
      <Route path="/alerts" component={() => <ProtectedRoute component={AlertsPage} />} />
      <Route path="/recommendations" component={() => <ProtectedRoute component={RecommendationsPage} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={AnalyticsPage} />} />
      <Route path="/staff" component={() => <ProtectedRoute access="admin" component={StaffPage} />} />
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
