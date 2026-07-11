import { useListOrders } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Package, Truck, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getStatusInfo(status: string) {
  switch (status) {
    case "pending_review": return { label: "Pending Review", color: "bg-slate-500", icon: Clock };
    case "payment_verified": return { label: "Payment Verified", color: "bg-blue-500", icon: CheckCircle2 };
    case "approved": return { label: "Approved", color: "bg-indigo-500", icon: CheckCircle2 };
    case "installation_scheduled": return { label: "Scheduled", color: "bg-violet-500", icon: Clock };
    case "officer_assigned": return { label: "Officer Assigned", color: "bg-purple-500", icon: Truck };
    case "installation_in_progress": return { label: "In Progress", color: "bg-amber-500", icon: Truck };
    case "installed": return { label: "Installed", color: "bg-green-500", icon: CheckCircle2 };
    case "activated": return { label: "Activated", color: "bg-emerald-500", icon: CheckCircle2 };
    case "completed": return { label: "Completed", color: "bg-emerald-600", icon: CheckCircle2 };
    case "cancelled": return { label: "Cancelled", color: "bg-red-500", icon: AlertCircle };
    default: return { label: status, color: "bg-slate-500", icon: Package };
  }
}

export default function OrdersPage() {
  const { data: orders, isLoading } = useListOrders();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading orders...</div>;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container mx-auto py-12 max-w-4xl text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold tracking-tight mb-2">No Orders Found</h2>
        <p className="text-muted-foreground mb-6">You haven't purchased any AgroGuard hardware yet.</p>
        <Link href="/shop">
          <Button>Browse Hardware Store</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Tracking</h1>
          <p className="text-muted-foreground">Monitor the deployment of your AgroGuard hardware.</p>
        </div>
        <Link href="/shop">
          <Button variant="outline">Buy New Device</Button>
        </Link>
      </div>

      <div className="space-y-6">
        {orders.map((order) => {
          const { label, color, icon: Icon } = getStatusInfo(order.status);
          
          return (
            <Card key={order.id} className="overflow-hidden border-2">
              <div className="flex flex-col md:flex-row">
                <div className="bg-slate-50 dark:bg-slate-900 p-6 md:w-1/3 border-b md:border-b-0 md:border-r flex flex-col justify-center items-center text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg capitalize">AgroGuard {order.productType}</h3>
                  <p className="text-sm text-muted-foreground mb-2">Order #{order.id.toString().padStart(4, '0')}</p>
                  <div className="font-semibold text-lg">₦{order.price.toLocaleString()}</div>
                </div>
                
                <div className="p-6 md:w-2/3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-lg mb-1">Delivery & Installation</h4>
                        <p className="text-sm text-muted-foreground">{order.farmAddress}, {order.lga}, {order.state}</p>
                      </div>
                      <Badge className={`${color} text-white hover:${color} flex items-center gap-1.5 px-3 py-1`}>
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </Badge>
                    </div>
                    
                    <div className="mt-8 border-t pt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block mb-1">Ordered On</span>
                        <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-1">Contact Phone</span>
                        <span className="font-medium">{order.contactPhone}</span>
                      </div>
                    </div>
                  </div>
                  
                  {order.status === "completed" && (
                    <div className="mt-4 pt-4 border-t flex justify-end">
                      <Link href="/my-farm">
                        <Button variant="secondary" size="sm">Go to Dashboard</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
