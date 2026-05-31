import { useGetDashboardStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, BarChart, Bar } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// Mock historical data since we only have single-device trends in the API
const mockWeeklyTrends = Array.from({ length: 7 }).map((_, i) => ({
  day: `Day ${i + 1}`,
  avgMoisture: 45 + Math.random() * 20,
  avgTemp: 28 + Math.random() * 8,
  alerts: Math.floor(Math.random() * 15)
}));

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-48 w-full" /><Skeleton className="h-96 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Analytics</h2>
        <p className="text-muted-foreground">Global data insights across all regions.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Average Soil Moisture Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockWeeklyTrends}>
                  <defs>
                    <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                  <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} />
                  <Area type="monotone" dataKey="avgMoisture" name="Moisture (%)" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorMoisture)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alert Volume by Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockWeeklyTrends}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} />
                  <Bar dataKey="alerts" name="Alerts" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Readings</p>
              <p className="text-3xl font-bold text-foreground">{stats?.totalReadingsToday?.toLocaleString() || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Pending Interventions</p>
              <p className="text-3xl font-bold text-orange-500">{stats?.pendingRecommendations || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Overall Uptime</p>
              <p className="text-3xl font-bold text-green-600">
                {stats?.totalDevices && stats.totalDevices > 0 
                  ? ((stats.onlineDevices / stats.totalDevices) * 100).toFixed(1) 
                  : 0}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Active Alerts</p>
              <p className="text-3xl font-bold text-destructive">{stats?.activeAlerts || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
