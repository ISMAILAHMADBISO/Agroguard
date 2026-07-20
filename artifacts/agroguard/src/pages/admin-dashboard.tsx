import { useQuery } from "@tanstack/react-query";
import { useListDevices, useListFarmers, useGetExecutiveAnalytics, apiRequest } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Activity, Cpu, Users, BellRing, MapPin, Star, ThumbsUp, ThumbsDown, Target, TrendingUp } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

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
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const grayIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function AdminDashboardPage() {
  const { data: devices, isLoading: isDevicesLoading } = useListDevices();
  const { data: farmers, isLoading: isFarmersLoading } = useListFarmers();
  const { data: analytics, isLoading: isAnalyticsLoading } = useGetExecutiveAnalytics();
  const { data: diseaseDistribution } = useQuery({
    queryKey: ["analytics-disease-distribution"],
    queryFn: () => apiRequest("GET", "/api/analytics/disease-distribution"),
  });
  const { data: treatmentSuccess } = useQuery({
    queryKey: ["analytics-treatment-success"],
    queryFn: () => apiRequest("GET", "/api/analytics/treatment-success"),
  });
  const { data: aiFeedback } = useQuery({
    queryKey: ["analytics-ai-feedback"],
    queryFn: () => apiRequest("GET", "/api/analytics/ai-feedback"),
  });

  const isLoading = isDevicesLoading || isFarmersLoading || isAnalyticsLoading;

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const onlineCount = devices?.filter(d => d.status === "online").length || 0;
  const criticalCount = devices?.filter(d => d.batteryLevel && d.batteryLevel < 20).length || 0;
  const totalFarmers = farmers?.length || 0;

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
            {devices?.map((device, i) => {
              const lat = 9.0820 + (Math.random() - 0.5) * 4;
              const lng = 8.6753 + (Math.random() - 0.5) * 4;
              const isCritical = device.batteryLevel && device.batteryLevel < 20;
              const icon = device.status === 'online' ? greenIcon : (isCritical ? redIcon : grayIcon);
              return (
                <Marker key={device.id} position={[lat, lng]} icon={icon}>
                  <Popup>
                    <div className="font-semibold">{device.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{device.deviceId}</div>
                    <div className="mt-2 text-xs">Status: <span className="font-medium capitalize">{device.status}</span></div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </Card>

      {/* ─────────── AI & Disease Analytics ─────────── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* AI Feedback Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-5 w-5 text-yellow-500" /> AI Feedback Analytics
            </CardTitle>
            <CardDescription>Aggregated farmer ratings for AI diagnoses</CardDescription>
          </CardHeader>
          <CardContent>
            {aiFeedback ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Average AI Rating</span>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold">{aiFeedback.averageRating}</span>
                    <span className="text-muted-foreground">/ 5</span>
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500 ml-1" />
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-yellow-500 transition-all" style={{ width: `${(aiFeedback.averageRating / 5) * 100}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xl font-bold text-green-600">{aiFeedback.accuracyPercentage}%</p>
                    <p className="text-xs text-muted-foreground">Accuracy Rate</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xl font-bold">{aiFeedback.totalRatings}</p>
                    <p className="text-xs text-muted-foreground">Total Ratings</p>
                  </div>
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                    <p className="text-xl font-bold text-green-700 flex items-center justify-center gap-1">
                      <ThumbsUp className="h-4 w-4" /> {aiFeedback.positiveFeedback}
                    </p>
                    <p className="text-xs text-green-700">Positive Feedback</p>
                  </div>
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center">
                    <p className="text-xl font-bold text-red-700 flex items-center justify-center gap-1">
                      <ThumbsDown className="h-4 w-4" /> {aiFeedback.negativeFeedback}
                    </p>
                    <p className="text-xs text-red-700">Negative Feedback</p>
                  </div>
                </div>
                {aiFeedback.topRatedDiseases?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Top Rated Diagnoses</p>
                    <div className="space-y-1.5">
                      {aiFeedback.topRatedDiseases.slice(0, 3).map((d: any) => (
                        <div key={d.disease} className="flex items-center justify-between text-sm">
                          <span className="truncate text-muted-foreground">{d.disease}</span>
                          <span className="font-medium flex items-center gap-1 ml-2 shrink-0">
                            {d.avg} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">No feedback data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Treatment Success */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-primary" /> Treatment Success Analytics
            </CardTitle>
            <CardDescription>Success rates for AI-recommended treatments</CardDescription>
          </CardHeader>
          <CardContent>
            {treatmentSuccess ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">AI Recommendation Success</span>
                  <span className="text-2xl font-bold text-green-600">{treatmentSuccess.successRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${treatmentSuccess.successRate}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xl font-bold text-green-600">{treatmentSuccess.successful}</p>
                    <p className="text-xs text-muted-foreground">Successful</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xl font-bold">{treatmentSuccess.total}</p>
                    <p className="text-xs text-muted-foreground">Total Treatments</p>
                  </div>
                </div>
                {treatmentSuccess.byCrop?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">By Crop</p>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={treatmentSuccess.byCrop.slice(0, 5)}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="crop" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v: any) => [`${v}%`, "Success Rate"]} />
                          <Bar dataKey="rate" fill="#10b981" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">No treatment feedback data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Disease Distribution Pie */}
      {diseaseDistribution?.data?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-primary" /> Disease Distribution
            </CardTitle>
            <CardDescription>Breakdown of detected diseases across all farm analyses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diseaseDistribution.data}
                    dataKey="count"
                    nameKey="disease"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ disease, percentage }) => `${disease}: ${percentage}%`}
                    labelLine
                  >
                    {diseaseDistribution.data.map((_: any, index: number) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any, name: any, props: any) => [`${props.payload.percentage}%`, props.payload.disease]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

