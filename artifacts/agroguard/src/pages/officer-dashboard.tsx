import { useListDeployments, useListOrders } from "@workspace/api-client-react";
import { Link } from "wouter";
import { MapPin, Navigation, ArrowRight, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";

export default function OfficerDashboardPage() {
  const { user } = useAuth();
  const { data: deployments, isLoading: loadingDeployments } = useListDeployments();
  const { data: orders, isLoading: loadingOrders } = useListOrders();

  if (loadingDeployments || loadingOrders) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading assigned jobs...</div>;
  }

  // Use optional chaining carefully
  const activeJobs = deployments?.filter(d => d.status !== "completed" && d.status !== "failed") || [];
  const completedJobs = deployments?.filter(d => d.status === "completed") || [];

  return (
    <div className="container py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Officer Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}. Here are your assigned installations.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Active Jobs */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Active Assignments
            <Badge variant="secondary">{activeJobs.length}</Badge>
          </h2>
          
          <div className="space-y-4">
            {activeJobs.map(deployment => {
              const order = orders?.find(o => o.id === deployment.orderId);
              if (!order) return null;
              
              return (
                <Card key={deployment.id} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{order.farmName || "Farm"} Installation</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {order.farmAddress}, {order.state}
                        </CardDescription>
                      </div>
                      <Badge className="capitalize">{deployment.status.replace("_", " ")}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        <Package className="h-3 w-3" /> AgroGuard {order.productType}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => {
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.farmAddress + ', ' + order.state)}`, '_blank');
                      }}>
                        <Navigation className="h-4 w-4 mr-2" /> Navigate
                      </Button>
                      <Link href={`/officer/installation/${deployment.id}`} className="flex-1">
                        <Button className="w-full">
                          Execute Job <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {activeJobs.length === 0 && (
              <div className="p-8 text-center border rounded-lg bg-slate-50 dark:bg-slate-900">
                <p className="text-muted-foreground">No active assignments right now.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Completed Jobs */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Completions</h2>
          <div className="space-y-4">
            {completedJobs.slice(0, 5).map(deployment => {
              const order = orders?.find(o => o.id === deployment.orderId);
              
              return (
                <Card key={deployment.id} className="opacity-75">
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">{order?.farmName || "Farm"}</CardTitle>
                      <Badge variant="outline" className="text-green-600 border-green-600">Completed</Badge>
                    </div>
                    <CardDescription>Finished on {new Date(deployment.updatedAt).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
