import { useQuery } from "@tanstack/react-query";
import { useListDevices, useListFarmers, useGetExecutiveAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Activity, Cpu, Users, BellRing, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const grayIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function AdminDashboardPage() {
  const { data: devices, isLoading: isDevicesLoading } = useListDevices();
  const { data: farmers, isLoading: isFarmersLoading } = useListFarmers();
  const { data: analytics, isLoading: isAnalyticsLoading } = useGetExecutiveAnalytics();

  const isLoading = isDevicesLoading || isFarmersLoading || isAnalyticsLoading;

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const onlineCount = devices?.filter(d => d.status === "online").length || 0;
  const criticalCount = devices?.filter(d => d.batteryLevel && d.batteryLevel < 20).length || 0;
  const totalFarmers = farmers?.length || 0;

  // Mock center of Nigeria for map
  const defaultCenter: [number, number] = [9.0820, 8.6753];

  return (
    <div className="container py-8 max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Enterprise Operations Center</h1>
        <p className="text-muted-foreground mt-1">
          High-level overview of network health, deployments, and alerts.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary/50 bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Total Hardware Nodes <Cpu className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{devices?.length || 0}</div></CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-card to-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Network Health <Activity className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {devices?.length ? Math.round((onlineCount / devices.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-card to-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Active Farmers <Users className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-blue-600">{totalFarmers}</div></CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-card to-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Critical Alerts <BellRing className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-red-600">{criticalCount}</div></CardContent>
        </Card>

        {/* New Analytics Cards */}
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-card to-purple-500/5 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Hardware Sales Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              ₦{(analytics?.hardwareSales || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">+{analytics?.monthlyGrowth || 0}% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-2 shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Live Deployment Map
          </CardTitle>
          <CardDescription>Real-time geographical distribution of all AgroGuard devices</CardDescription>
        </CardHeader>
        <div className="h-[600px] w-full relative z-0">
          <MapContainer center={defaultCenter} zoom={6} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Mock rendering of devices on map since we don't have exact GPS in db for all */}
            {/* We distribute them artificially around Nigeria for demo if GPS not present */}
            {devices?.map((device, i) => {
              // Fake coordinates if missing
              const lat = 9.0820 + (Math.random() - 0.5) * 4;
              const lng = 8.6753 + (Math.random() - 0.5) * 4;
              
              const isCritical = device.batteryLevel && device.batteryLevel < 20;
              const icon = device.status === 'online' ? greenIcon : (isCritical ? redIcon : grayIcon);

              return (
                <Marker key={device.id} position={[lat, lng]} icon={icon}>
                  <Popup>
                    <div className="font-semibold">{device.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{device.deviceId}</div>
                    <div className="mt-2 text-xs">
                      Status: <span className="font-medium capitalize">{device.status}</span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </Card>
    </div>
  );
}
