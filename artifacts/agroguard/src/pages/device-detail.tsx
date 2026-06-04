/**
 * Device Detail page — live sensor monitoring via polling.
 *
 * Sensor cards displayed:
 *   Core: Soil Moisture · Temperature · Humidity · Heat Index
 *   7-in-1 extra: EC · pH · Nitrogen · Phosphorus · Potassium
 *
 * Live updates:
 *   - Polls GET /devices/:id/readings every 5s (React Query refetchInterval)
 *     for the latest reading (drives the live cards + 7-in-1 panel).
 *   - Polls the device + 24h trends every 15s for status and the chart.
 *   This works on any serverless host (Vercel) — no WebSocket required.
 */
import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetDevice,
  useGetSensorTrends,
  useGetDeviceReadings,
  getGetDeviceQueryKey,
  getGetSensorTrendsQueryKey,
  getGetDeviceReadingsQueryKey,
} from "@workspace/api-client-react";
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
import { Button } from "@/components/ui/button";

// How often we poll for fresh data.
const READINGS_POLL_MS = 5000;
const META_POLL_MS = 15000;
// A reading newer than this is considered "live".
const LIVE_WINDOW_MS = 2 * 60 * 1000;

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

  const { data: device, isLoading: deviceLoading } = useGetDevice(id, {
    query: { queryKey: getGetDeviceQueryKey(id), refetchInterval: META_POLL_MS },
  });
  const { data: trends, isLoading: trendsLoading } = useGetSensorTrends(id, {
    query: { queryKey: getGetSensorTrendsQueryKey(id), refetchInterval: META_POLL_MS },
  });
  const { data: readings } = useGetDeviceReadings(id, {
    query: { queryKey: getGetDeviceReadingsQueryKey(id), refetchInterval: READINGS_POLL_MS },
  });

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

  // Latest reading comes from the polled readings endpoint (most recent first).
  // It carries the full 7-in-1 payload when the sensor supports it.
  const latestReading = readings && readings.length > 0 ? readings[0] : null;

  const lastReadingAt = latestReading ? new Date(latestReading.recordedAt) : null;
  const isLive =
    !!lastReadingAt && Date.now() - lastReadingAt.getTime() < LIVE_WINDOW_MS;

  // The chart uses the 24h trend series.
  const chartData = trends;

  // 7-in-1 data only shows when the latest reading carries those channels.
  const has7in1 =
    !!latestReading &&
    (latestReading.electricalConductivity != null ||
      latestReading.ph != null ||
      latestReading.nitrogen != null);

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
          {/* Polling / live-data indicator */}
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
            isLive
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-gray-50 text-gray-500 border-gray-200"
          }`}>
            <Radio className={`h-3 w-3 ${isLive ? "text-green-500 animate-pulse" : "text-gray-400"}`} />
            {isLive ? "Live" : "Auto-refreshing"}
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
      {isLive && lastReadingAt && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <Radio className="h-3.5 w-3.5 animate-pulse shrink-0" />
          Latest reading at {format(lastReadingAt, "HH:mm:ss")} — dashboard auto-refreshes every few seconds.
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
      {has7in1 && latestReading && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            7-in-1 Soil Analysis
          </h3>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            <MetricCard
              title="Soil EC"
              value={latestReading.electricalConductivity != null
                ? `${latestReading.electricalConductivity.toFixed(1)}`
                : "—"}
              sub="mS/m — salinity"
              icon={<Zap className="h-4 w-4 text-yellow-600" />}
              warning={latestReading.electricalConductivity != null && latestReading.electricalConductivity > 400}
            />
            <MetricCard
              title="Soil pH"
              value={latestReading.ph != null ? latestReading.ph.toFixed(1) : "—"}
              sub={
                latestReading.ph != null
                  ? latestReading.ph < 5.5 ? "Acidic — add lime"
                  : latestReading.ph > 7.5 ? "Alkaline — add sulfur"
                  : "Optimal (6.0–7.0)"
                  : "0–14 scale"
              }
              icon={<FlaskConical className="h-4 w-4 text-purple-500" />}
              warning={latestReading.ph != null && (latestReading.ph < 5.5 || latestReading.ph > 7.5)}
            />
            <MetricCard
              title="Nitrogen (N)"
              value={latestReading.nitrogen != null ? `${latestReading.nitrogen.toFixed(0)}` : "—"}
              sub="mg/kg"
              icon={<Leaf className="h-4 w-4 text-green-600" />}
              warning={latestReading.nitrogen != null && latestReading.nitrogen < 50}
            />
            <MetricCard
              title="Phosphorus (P)"
              value={latestReading.phosphorus != null ? `${latestReading.phosphorus.toFixed(0)}` : "—"}
              sub="mg/kg"
              icon={<Leaf className="h-4 w-4 text-emerald-500" />}
              warning={latestReading.phosphorus != null && latestReading.phosphorus < 20}
            />
            <MetricCard
              title="Potassium (K)"
              value={latestReading.potassium != null ? `${latestReading.potassium.toFixed(0)}` : "—"}
              sub="mg/kg"
              icon={<Leaf className="h-4 w-4 text-teal-500" />}
              warning={latestReading.potassium != null && latestReading.potassium < 100}
            />
          </div>
        </div>
      )}

      {/* 24h trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>24-Hour Sensor Trends</span>
            {isLive && (
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
