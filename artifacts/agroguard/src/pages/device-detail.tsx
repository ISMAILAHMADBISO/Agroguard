/**
 * Device Detail page — live sensor monitoring with WebSocket real-time updates.
 *
 * Sensor cards displayed:
 *   Core: Soil Moisture · Temperature · Humidity · Heat Index
 *   7-in-1 extra: EC · pH · Nitrogen · Phosphorus · Potassium
 *
 * WebSocket behaviour:
 *   - Connects to /api/ws and subscribes to the specific deviceId.
 *   - On new reading: updates the live cards and pushes a point onto the chart.
 *   - Auto-reconnects every 3 seconds on disconnect.
 */
import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { useGetDevice, useGetSensorTrends } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Cpu, Wifi, WifiOff, ThermometerSun, Droplets, Sun, Activity,
  Battery, Radio, Zap, FlaskConical, Leaf, ArrowLeft, Copy, Check,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend,
} from "recharts";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SensorReading {
  id: number;
  deviceId: number;
  soilMoisture: number;
  temperature: number;
  humidity: number;
  heatIndex: number;
  electricalConductivity?: number | null;
  ph?: number | null;
  nitrogen?: number | null;
  phosphorus?: number | null;
  potassium?: number | null;
  rainfall?: number | null;
  lightIntensity?: number | null;
  recordedAt: string;
}

// ── WebSocket hook ────────────────────────────────────────────────────────────

/**
 * Subscribes to live sensor readings over WebSocket for a given device.
 * Handles reconnection automatically.
 */
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
        // Tell the server we want readings for this device
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
            // Refresh chart and device status card
            void queryClient.invalidateQueries({ queryKey: ["getSensorTrends", deviceId] });
            void queryClient.invalidateQueries({ queryKey: ["getDevice", deviceId] });
          }
        } catch {
          // Silently ignore malformed messages
        }
      };

      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 3000); // reconnect after 3 s
      };

      ws.onerror = () => ws.close();
    };

    connect();
    return () => wsRef.current?.close();
  }, [deviceId, queryClient]);

  return { liveReading, connected };
}

// ── Metric card ───────────────────────────────────────────────────────────────

interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  sub?: string;
  icon: React.ReactNode;
  warning?: boolean;
}

function MetricCard({ title, value, sub, icon, warning }: MetricCardProps) {
  return (
    <Card className={warning ? "border-destructive/40 bg-destructive/5" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${warning ? "text-destructive" : ""}`}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DeviceDetailPage() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const [copied, setCopied] = useState(false);

  const { data: device, isLoading: deviceLoading } = useGetDevice(id);
  const { data: trends, isLoading: trendsLoading } = useGetSensorTrends(id);
  const { liveReading, connected } = useDeviceWebSocket(id);

  const copyId = () => {
    if (!device) return;
    void navigator.clipboard.writeText(device.deviceId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (deviceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="p-12 text-center space-y-3">
        <p className="text-muted-foreground">Device not found.</p>
        <Link href="/devices"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Back to Devices</Button></Link>
      </div>
    );
  }

  // Use live reading if available, otherwise fall back to last chart point
  const latestReading = liveReading ?? (trends && trends.length > 0 ? trends[trends.length - 1] : null);

  // Merge live reading into chart data (keep max 50 points)
  const chartData = liveReading ? [...(trends ?? []), liveReading].slice(-50) : trends;

  // 7-in-1 data only arrives via live WebSocket readings (SensorTrendPoint doesn't carry those fields)
  const has7in1 = liveReading &&
    (liveReading.electricalConductivity != null ||
     liveReading.ph != null ||
     liveReading.nitrogen != null);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/devices" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h2 className="text-2xl font-bold tracking-tight truncate">{device.name}</h2>
          </div>
          {/* Hardware ID with copy */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cpu className="h-4 w-4 shrink-0" />
            <code className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{device.deviceId}</code>
            <button onClick={copyId} title="Copy hardware ID" className="hover:text-foreground transition-colors">
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            {device.firmwareVersion && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">fw {device.firmwareVersion}</span>
            )}
          </div>
        </div>

        {/* Status strip */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {/* WebSocket connection indicator */}
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
            connected
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-gray-50 text-gray-500 border-gray-200"
          }`}>
            <Radio className={`h-3 w-3 ${connected ? "text-green-500 animate-pulse" : "text-gray-400"}`} />
            {connected ? "Live" : "Connecting..."}
          </div>

          {device.batteryLevel != null && (
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

      {/* Live reading banner */}
      {liveReading && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <Radio className="h-3.5 w-3.5 animate-pulse shrink-0" />
          Live reading received at {format(new Date(liveReading.recordedAt), "HH:mm:ss")} — dashboard updated in real time.
        </div>
      )}

      {/* Core sensor metrics */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Core Readings</h3>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Soil Moisture"
            value={latestReading ? `${latestReading.soilMoisture.toFixed(1)}%` : "—"}
            sub={latestReading && latestReading.soilMoisture < 30 ? "Low — irrigation needed" : "Optimal level"}
            icon={<Droplets className="h-4 w-4 text-blue-500" />}
            warning={!!latestReading && latestReading.soilMoisture < 30}
          />
          <MetricCard
            title="Temperature"
            value={latestReading ? `${latestReading.temperature.toFixed(1)}°C` : "—"}
            sub={latestReading && latestReading.temperature > 35 ? "Critical: heat stress" : "Normal range"}
            icon={<ThermometerSun className="h-4 w-4 text-orange-500" />}
            warning={!!latestReading && latestReading.temperature > 35}
          />
          <MetricCard
            title="Humidity"
            value={latestReading ? `${latestReading.humidity.toFixed(1)}%` : "—"}
            sub="Relative air humidity"
            icon={<Activity className="h-4 w-4 text-cyan-500" />}
          />
          <MetricCard
            title="Heat Index"
            value={latestReading ? `${latestReading.heatIndex.toFixed(1)}°C` : "—"}
            sub="Feels-like temperature"
            icon={<Sun className="h-4 w-4 text-yellow-500" />}
          />
        </div>
      </div>

      {/* 7-in-1 soil sensor metrics (shown only when data exists) */}
      {/* 7-in-1 readings come only from live WebSocket data — shown when present */}
      {has7in1 && liveReading && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            7-in-1 Soil Analysis
          </h3>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            <MetricCard
              title="Soil EC"
              value={liveReading.electricalConductivity != null
                ? `${liveReading.electricalConductivity.toFixed(1)}`
                : "—"}
              sub="mS/m — salinity"
              icon={<Zap className="h-4 w-4 text-yellow-600" />}
              warning={liveReading.electricalConductivity != null && liveReading.electricalConductivity > 400}
            />
            <MetricCard
              title="Soil pH"
              value={liveReading.ph != null ? liveReading.ph.toFixed(1) : "—"}
              sub={
                liveReading.ph != null
                  ? liveReading.ph < 5.5 ? "Acidic — add lime"
                  : liveReading.ph > 7.5 ? "Alkaline — add sulfur"
                  : "Optimal (6.0–7.0)"
                  : "0–14 scale"
              }
              icon={<FlaskConical className="h-4 w-4 text-purple-500" />}
              warning={liveReading.ph != null && (liveReading.ph < 5.5 || liveReading.ph > 7.5)}
            />
            <MetricCard
              title="Nitrogen (N)"
              value={liveReading.nitrogen != null ? `${liveReading.nitrogen.toFixed(0)}` : "—"}
              sub="mg/kg"
              icon={<Leaf className="h-4 w-4 text-green-600" />}
              warning={liveReading.nitrogen != null && liveReading.nitrogen < 50}
            />
            <MetricCard
              title="Phosphorus (P)"
              value={liveReading.phosphorus != null ? `${liveReading.phosphorus.toFixed(0)}` : "—"}
              sub="mg/kg"
              icon={<Leaf className="h-4 w-4 text-emerald-500" />}
              warning={liveReading.phosphorus != null && liveReading.phosphorus < 20}
            />
            <MetricCard
              title="Potassium (K)"
              value={liveReading.potassium != null ? `${liveReading.potassium.toFixed(0)}` : "—"}
              sub="mg/kg"
              icon={<Leaf className="h-4 w-4 text-teal-500" />}
              warning={liveReading.potassium != null && liveReading.potassium < 100}
            />
          </div>
        </div>
      )}

      {/* 24h trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>24-Hour Sensor Trends</span>
            {liveReading && (
              <span className="text-xs font-normal text-green-600 flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse" /> Live
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : !chartData || chartData.length === 0 ? (
            <div className="h-[350px] flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Activity className="h-8 w-8 opacity-30" />
              <p>No readings in the last 24 hours.</p>
              <p className="text-xs">Data will appear once the device starts sending.</p>
            </div>
          ) : (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="recordedAt"
                    tickFormatter={(val: string) => format(new Date(val), "HH:mm")}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                  />
                  <YAxis yAxisId="pct" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis yAxisId="temp" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <RechartsTooltip
                    labelFormatter={(val: string) => format(new Date(val), "MMM d HH:mm")}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line yAxisId="pct" type="monotone" dataKey="soilMoisture" name="Moisture (%)" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line yAxisId="temp" type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line yAxisId="pct" type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device info card */}
      <Card>
        <CardHeader><CardTitle>Device Information</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Location</dt>
              <dd className="mt-1 font-medium">{device.location || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Firmware</dt>
              <dd className="mt-1 font-mono">{device.firmwareVersion || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Registered</dt>
              <dd className="mt-1">{format(new Date(device.createdAt), "MMM d, yyyy")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Last Seen</dt>
              <dd className="mt-1">
                {device.lastSeenAt
                  ? format(new Date(device.lastSeenAt), "MMM d, HH:mm")
                  : "Never"}
              </dd>
            </div>
          </dl>
          {device.notes && (
            <div className="mt-4 text-sm text-muted-foreground border-t pt-4">
              <span className="font-medium text-foreground">Notes:</span> {device.notes}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
