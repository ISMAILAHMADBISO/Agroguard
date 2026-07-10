import { useParams } from "wouter";
import { useGetFarmer, useGetFarmerDevices } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Activity, Leaf, Wifi, WifiOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth";
import { useUpdateFarmer, getGetFarmerQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

export default function FarmerDetailPage() {
  const params = useParams();
  const id = parseInt(params.id || "0");

  const { data: farmer, isLoading: farmerLoading } = useGetFarmer(id);
  const { data: devices, isLoading: devicesLoading } = useGetFarmerDevices(id);

  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";
  const updateFarmer = useUpdateFarmer();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleTogglePremium = (checked: boolean) => {
    updateFarmer.mutate({ id, data: { isPremium: checked } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFarmerQueryKey(id) });
        toast({ title: checked ? "Upgraded to Premium" : "Removed Premium Access" });
      },
      onError: () => toast({ title: "Failed to update status", variant: "destructive" })
    });
  };

  if (farmerLoading) {
    return <div className="space-y-6"><Skeleton className="h-48 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!farmer) {
    return <div className="p-12 text-center text-muted-foreground">Farmer not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{farmer.name}</h2>
          <p className="text-muted-foreground">Farmer Profile & Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          {farmer.isPremium && (
            <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
              <Star className="h-3 w-3 mr-1" /> Premium
            </Badge>
          )}
          <Badge variant={farmer.status === 'active' ? 'default' : 'secondary'} className={farmer.status === 'active' ? 'bg-primary' : ''}>
            {farmer.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{farmer.phone}</span>
            </div>
            {farmer.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{farmer.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{farmer.location}</span>
            </div>
            {farmer.whatsappNumber && (
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 text-green-500 font-bold">W</div>
                <span>{farmer.whatsappNumber}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Farm Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Farm Name</div>
                <div className="font-semibold">{farmer.farmName || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Size (Hectares)</div>
                <div className="font-semibold">{farmer.farmSizeHectares || "N/A"} ha</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Crop Types</div>
                <div className="font-semibold flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-primary" />
                  {farmer.cropTypes || "Mixed"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Joined Date</div>
                <div className="font-semibold">{new Date(farmer.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            {farmer.notes && (
              <div className="mt-6 pt-4 border-t">
                <div className="text-sm font-medium text-muted-foreground mb-2">Notes</div>
                <p className="text-sm">{farmer.notes}</p>
              </div>
            )}
            {isAdmin && (
              <div className="mt-6 pt-4 border-t flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="premium-toggle" className="text-base font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    Premium AI Access
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Grant this farmer unlimited AI usage.
                  </p>
                </div>
                <Switch 
                  id="premium-toggle" 
                  checked={!!farmer.isPremium} 
                  onCheckedChange={handleTogglePremium} 
                  disabled={updateFarmer.isPending}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Assigned Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {devicesLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : devices?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No devices assigned to this farmer.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {devices?.map(device => (
                <div key={device.id} className="border rounded-lg p-4 flex flex-col justify-between hover:border-primary/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-medium">
                        <Link href={`/devices/${device.id}`} className="hover:underline">{device.name}</Link>
                      </div>
                      <div className="text-xs text-muted-foreground">{device.deviceId}</div>
                    </div>
                    {device.status === 'online' ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last seen: {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Never'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
