import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout";
import LandingPage from "@/pages/landing";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      
      {/* App Routes wrapped in Layout */}
      <Route path="/:rest*">
        <AppLayout>
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/farmers" component={FarmersPage} />
            <Route path="/farmers/:id" component={FarmerDetailPage} />
            <Route path="/devices" component={DevicesPage} />
            <Route path="/devices/:id" component={DeviceDetailPage} />
            <Route path="/alerts" component={AlertsPage} />
            <Route path="/recommendations" component={RecommendationsPage} />
            <Route path="/analytics" component={AnalyticsPage} />
            <Route path="/staff" component={StaffPage} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
