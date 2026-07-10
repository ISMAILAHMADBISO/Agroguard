/**
 * My Farm — farmer-facing dashboard.
 * Shows only the signed-in farmer's own profile, devices, alerts and recommendations.
 * All data is RBAC-scoped server-side to the farmer's own records.
 */
import { useAuth } from "@/context/auth";
import {
  useGetFarmer,
  useGetFarmerDevices,
  useListAlerts,
  useListRecommendations,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cpu, Bell, Lightbulb, MapPin, Leaf, Star, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetFarmerQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function MyFarmPage() {
  const { user } = useAuth();
  const farmerId = user?.id ?? 0;

  const { data: farmer, isLoading: farmerLoading } = useGetFarmer(farmerId);
  const { data: devices } = useGetFarmerDevices(farmerId);
  const { data: alerts } = useListAlerts();
  const { data: recommendations } = useListRecommendations();

  const openAlerts = (alerts ?? []).filter((a) => a.status !== "resolved");
  const activeRecs = (recommendations ?? []).filter((r) => r.status !== "applied");
  const onlineDevices = (devices ?? []).filter((d) => d.status === "online").length;

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const upgradeToPremium = async () => {
    setIsUpgrading(true);
    try {
      const res = await fetch("/api/farmers/me/upgrade", { method: "POST" });
      if (!res.ok) throw new Error("Upgrade failed");
      queryClient.invalidateQueries({ queryKey: getGetFarmerQueryKey(farmerId) });
      toast({ title: "Welcome to AgroGuard Premium!", description: "You now have unlimited AI access." });
    } catch {
      toast({ title: "Failed to upgrade", variant: "destructive" });
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h2>
          <p className="text-muted-foreground">Your farm at a glance.</p>
        </div>
        {farmer && !farmer.isPremium && (
          <div className="bg-gradient-to-r from-amber-500/10 to-amber-500/20 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4 shadow-sm w-full md:w-auto">
            <div className="flex items-center gap-3 text-amber-700">
              <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
              <div className="text-sm font-medium">Unlock Unlimited AI Access</div>
            </div>
            <Button 
              size="sm" 
              className="bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto"
              onClick={upgradeToPremium}
              disabled={isUpgrading}
            >
              {isUpgrading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Upgrade to Premium"}
            </Button>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Devices</CardTitle>
            <Cpu className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">{onlineDevices} online</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Alerts</CardTitle>
            <Bell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openAlerts.length}</div>
            <p className="text-xs text-muted-foreground">need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recommendations</CardTitle>
            <Lightbulb className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRecs.length}</div>
            <p className="text-xs text-muted-foreground">active advisories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Farm Size</CardTitle>
            <Leaf className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {farmer?.farmSizeHectares != null ? `${farmer.farmSizeHectares}` : "-"}
              <span className="text-sm font-normal text-muted-foreground"> ha</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{farmer?.cropTypes ?? "No crops set"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Farm profile */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Farm Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {farmerLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : farmer ? (
              <>
                <div>
                  <div className="font-medium">{farmer.farmName ?? farmer.name}</div>
                  <div className="text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" /> {farmer.location}
                  </div>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{farmer.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className="capitalize">{farmer.status}</Badge>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No farm profile found.</p>
            )}
          </CardContent>
        </Card>

        {/* Devices */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">My Devices</CardTitle>
          </CardHeader>
          <CardContent>
            {(devices ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No devices registered yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {devices!.map((d) => (
                  <div key={d.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{d.name}</div>
                      <Badge
                        variant={d.status === "online" ? "default" : "secondary"}
                        className={d.status === "online" ? "bg-primary" : ""}
                      >
                        {d.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{d.deviceId}</div>
                    {d.location && <div className="text-xs text-muted-foreground">{d.location}</div>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {openAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open alerts. Your farm is healthy.</p>
            ) : (
              openAlerts.slice(0, 6).map((a) => (
                <div key={a.id} className="flex items-start gap-3 border rounded-lg p-3">
                  <Badge
                    variant="outline"
                    className={`capitalize shrink-0 ${SEVERITY_STYLES[a.severity] ?? ""}`}
                  >
                    {a.severity}
                  </Badge>
                  <div className="text-sm">{a.message}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Advisories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeRecs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active recommendations.</p>
            ) : (
              activeRecs.slice(0, 6).map((r) => (
                <div key={r.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{r.title}</div>
                    <Badge variant="outline" className="capitalize">{r.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
