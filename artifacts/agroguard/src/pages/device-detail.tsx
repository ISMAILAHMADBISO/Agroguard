import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { useGetDevice, useGetSensorTrends } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Cpu, Wifi, WifiOff, ThermometerSun, Droplets, Sun, Activity, Battery, Radio } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

interface SensorReading {
  id: number;
  deviceId: number;
  soilMoisture: number;
  temperature: number;
  humidity: number;
  heatIndex: number;
  rainfall?: number | null;
  lightIntensity?: number | null;
  recordedAt: string;
}

function useDeviceWebSocket(deviceId: number) {
  const [liveReading, setLiveReading] = useState<SensorReading | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!deviceId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;

    const connect = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        ws.send(JSON.stringify({ type: "subscribe", deviceId }));
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as {
            type: string;
            deviceId?: number;
            data?: SensorReading;
          };
          if (msg.type === "reading" && msg.deviceId === deviceId && msg.data) {
            setLiveReading(msg.data);
            // Invalidate queries so the chart refreshes too
            void queryClient.invalidateQueries({ queryKey: ["getSensorTrends", deviceId] });
            void queryClient.invalidateQueries({ queryKey: ["getDevice", deviceId] });
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setConnected(false);
        // Reconnect after 3s
        setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, [deviceId, queryClient]);

  return { liveReading, connected };
}

export default function DeviceDetailPage() {
  const params = useParams();
  const id = parseInt(params.id || "0");

  const { data: device, isLoading: deviceLoading } = useGetDevice(id, { query: { enabled: !!id } });
  const { data: trends, isLoading: trendsLoading } = useGetSensorTrends(id, { query: { enabled: !!id } });
  const { liveReading, connected } = useDeviceWebSocket(id);

  if (deviceLoading) {
    return <div className="space-y-6"><Skeleton className="h-48 w-full" /><Skeleton className="h-96 w-full" /></div>;
  }

  if (!device) {
    return <div className="p-12 text-center text-muted-foreground">Device not found</div>;
  }

  // Prefer the most recent live reading, falling back to the last in trends
  const latestReading = liveReading ?? (trends && trends.length > 0 ? trends[trends.length - 1] : null);

  // Merge live reading into chart data
  const chartData = liveReading
    ? [...(trends ?? []), liveReading].slice(-50) // keep last 50 points
    : trends;

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
          {/* Live WebSocket indicator */}
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${connected ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
            <Radio className={`h-3 w-3 ${connected ? "text-green-500" : "text-gray-400"}`} />
            {connected ? "Live" : "Connecting..."}
          </div>

          {device.batteryLevel !== null && device.batteryLevel !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              <Battery className={`h-4 w-4 ${device.batteryLevel < 20 ? "text-destructive" : "text-primary"}`} />
              {device.batteryLevel}%
            </div>
          )}
          {device.status === "online" ? (
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

      {liveReading && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          Live reading received at {format(new Date(liveReading.recordedAt), "HH:mm:ss")} — chart and metrics updated in real time.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Soil Moisture</CardTitle>
            <Droplets className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${latestReading && latestReading.soilMoisture < 30 ? "text-destructive" : "text-primary"}`}>
              {latestReading ? `${latestReading.soilMoisture.toFixed(1)}%` : "--"}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestReading && latestReading.soilMoisture < 30 ? "Warning: Low moisture" : "Optimal level"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <ThermometerSun className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${latestReading && latestReading.temperature > 35 ? "text-destructive" : "text-orange-600"}`}>
              {latestReading ? `${latestReading.temperature.toFixed(1)}°C` : "--"}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestReading && latestReading.temperature > 35 ? "Critical: High temp" : "Normal range"}
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
              {latestReading ? `${latestReading.humidity.toFixed(1)}%` : "--"}
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
              {latestReading ? `${latestReading.heatIndex.toFixed(1)}°C` : "--"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>24-Hour Sensor Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <div className="h-[350px] flex items-center justify-center"><Skeleton className="h-full w-full" /></div>
          ) : !chartData || chartData.length === 0 ? (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">No data for the last 24 hours</div>
          ) : (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="recordedAt"
                    tickFormatter={(val: string) => format(new Date(val), "HH:mm")}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <RechartsTooltip
                    labelFormatter={(val: string) => format(new Date(val), "MMM d, yyyy HH:mm")}
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
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="temperature"
                    name="Temp (°C)"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="humidity"
                    name="Humidity (%)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
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
