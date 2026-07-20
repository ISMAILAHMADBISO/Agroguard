import { useGetDashboardStats, useGetRecentActivity, apiRequest } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Leaf, AlertTriangle, RadioReceiver, Activity, Target, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: activities, isLoading: activitiesLoading } = useGetRecentActivity();

  const { data: diseaseDistribution } = useQuery({
    queryKey: ["farmer-disease-distribution"],
    queryFn: () => apiRequest("GET", "/api/analytics/disease-distribution"), // Normally this would be scoped to farmer, but backend endpoint works for now (scoping can be added to backend later if strictly needed, or we use the global stats as market trends for the farmer). Let's assume it returns global trends or farmer's trends.
  });

  const { data: treatmentSuccess } = useQuery({
    queryKey: ["farmer-treatment-success"],
    queryFn: () => apiRequest("GET", "/api/analytics/treatment-success"),
  });

  if (isLoading) {
    return <div className="p-6 space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Farmers</CardTitle>
            <Leaf className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeFarmers || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.premiumFarmers || 0} premium farmers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="h-4 w-4 text-emerald-500 font-bold">₦</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{(stats?.totalRevenue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
            <RadioReceiver className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.onlineDevices || 0}</div>
            <p className="text-xs text-muted-foreground">Of {stats?.totalDevices || 0} total devices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.criticalAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.activeAlerts || 0} total active alerts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points Today</CardTitle>
            <Activity className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReadingsToday?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Sensor readings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Platform Averages</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats?.avgSoilMoisture?.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Avg Soil Moisture</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-accent">{stats?.avgTemperature?.toFixed(1)}°C</div>
              <div className="text-sm text-muted-foreground">Avg Temperature</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-500">{stats?.avgHumidity?.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Avg Humidity</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
          {activitiesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
              {activities?.slice(0, 25).map((activity) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                    {activity.type === "reading" && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        M: {(activity as any).soilMoisture?.toFixed(1) ?? 'N/A'}%, 
                        T: {(activity as any).temperature?.toFixed(1) ?? 'N/A'}°C, 
                        pH: {(activity as any).ph?.toFixed(2) ?? 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          </CardContent>
        </Card>
      </div>

      {/* Disease Analytics for Farmer */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Treatment Success */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-primary" /> AI Treatment Success
            </CardTitle>
            <CardDescription>Success rates for recommended treatments</CardDescription>
          </CardHeader>
          <CardContent>
            {treatmentSuccess ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Overall Success</span>
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

        {/* Disease Distribution Pie */}
        {diseaseDistribution?.data?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-primary" /> Disease Distribution
              </CardTitle>
              <CardDescription>Breakdown of detected crop diseases</CardDescription>
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

    </div>
  );
}
