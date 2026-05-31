import { useParams } from "wouter";
import { useGetDevice, useGetSensorTrends } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Cpu, Wifi, WifiOff, ThermometerSun, Droplets, Sun, Activity, Battery } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";
import { format } from "date-fns";

export default function DeviceDetailPage() {
  const params = useParams();
  const id = parseInt(params.id || "0");

  const { data: device, isLoading: deviceLoading } = useGetDevice(id, { query: { enabled: !!id } });
  const { data: trends, isLoading: trendsLoading } = useGetSensorTrends(id, { query: { enabled: !!id } });

  if (deviceLoading) {
    return <div className="space-y-6"><Skeleton className="h-48 w-full" /><Skeleton className="h-96 w-full" /></div>;
  }

  if (!device) {
    return <div className="p-12 text-center text-muted-foreground">Device not found</div>;
  }

  const latestReading = trends && trends.length > 0 ? trends[trends.length - 1] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{device.name}</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <Cpu className="h-4 w-4" /> {device.deviceId}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {device.batteryLevel !== null && device.batteryLevel !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              <Battery className={`h-4 w-4 ${device.batteryLevel < 20 ? 'text-destructive' : 'text-primary'}`} />
              {device.batteryLevel}%
            </div>
          )}
          {device.status === 'online' ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Wifi className="h-3 w-3 mr-1" /> Online
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <WifiOff className="h-3 w-3 mr-1" /> Offline
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Soil Moisture</CardTitle>
            <Droplets className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${latestReading && latestReading.soilMoisture < 30 ? 'text-destructive' : 'text-primary'}`}>
              {latestReading ? `${latestReading.soilMoisture.toFixed(1)}%` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestReading && latestReading.soilMoisture < 30 ? 'Warning: Low moisture' : 'Optimal level'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <ThermometerSun className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${latestReading && latestReading.temperature > 35 ? 'text-destructive' : 'text-orange-600'}`}>
              {latestReading ? `${latestReading.temperature.toFixed(1)}°C` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestReading && latestReading.temperature > 35 ? 'Critical: High temp' : 'Normal range'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Humidity</CardTitle>
            <Activity className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">
              {latestReading ? `${latestReading.humidity.toFixed(1)}%` : '--'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heat Index</CardTitle>
            <Sun className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {latestReading ? `${latestReading.heatIndex.toFixed(1)}°C` : '--'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>24-Hour Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <div className="h-[350px] flex items-center justify-center"><Skeleton className="h-full w-full" /></div>
          ) : trends?.length === 0 ? (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">No data for the last 24 hours</div>
          ) : (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(val) => format(new Date(val), "HH:mm")}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <RechartsTooltip 
                    labelFormatter={(val) => format(new Date(val), "MMM d, yyyy HH:mm")}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="soilMoisture" 
                    name="Moisture (%)"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="temperature" 
                    name="Temp (°C)"
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
