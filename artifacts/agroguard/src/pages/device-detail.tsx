import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetDevice,
  useGetSensorTrends,
  useGetDeviceReadings,
  useUpdateDevice,
  useListFarmers,
  getGetDeviceQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Cpu, Wifi, WifiOff, ThermometerSun, Droplets, Sun, Activity,
  Battery, Radio, Zap, FlaskConical, Leaf, ArrowLeft, Copy, Check, ExternalLink,
  ArrowRightLeft, UserCheck, UserX, Loader2, Signal, AlertTriangle, Phone, MessageSquare
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend,
} from "recharts";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth";

const assignSchema = z.object({ farmerId: z.string().optional() });
type AssignValues = z.infer<typeof assignSchema>;

export default function DeviceDetail() {
  const { id } = useParams();
  const deviceId = Number(id);
  
  const { data: device, isLoading: deviceLoading } = useGetDevice(deviceId);
  const { data: trends, isLoading: trendsLoading } = useGetSensorTrends(deviceId);
  const { data: latestReading, isLoading: readingLoading } = useGetDeviceReadings(deviceId);
  const { data: farmers } = useListFarmers();
  
  const updateDevice = useUpdateDevice();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";
  const canWrite = isAdmin || user?.role === "agronomist";
  const farmer = farmers?.find(f => f.id === device?.farmerId);

  const [assignOpen, setAssignOpen] = useState(false);
  const assignForm = useForm<AssignValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: { farmerId: device?.farmerId ? device.farmerId.toString() : "none" },
  });

  const openAssign = () => {
    assignForm.reset({ farmerId: device?.farmerId ? device.farmerId.toString() : "none" });
    setAssignOpen(true);
  };

  const onAssignSubmit = (data: AssignValues) => {
    const newFarmerId = !data.farmerId || data.farmerId === "none" ? null : parseInt(data.farmerId, 10);
    updateDevice.mutate(
      { id: deviceId, data: { farmerId: newFarmerId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDeviceQueryKey(deviceId) });
          toast({ title: newFarmerId ? "Device assigned" : "Device unassigned" });
          setAssignOpen(false);
        },
        onError: () => toast({ title: "Failed to update assignment", variant: "destructive" }),
      }
    );
  };

  const isLive = latestReading?.[0] && Date.now() - new Date(latestReading[0].recordedAt).getTime() < 5 * 60 * 1000;
  const current = latestReading?.[0];

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  // Mock Health Score out of 100
  const healthScore = device?.status === 'online' && current ? 98 : 45;
  const signalStrength = device?.status === 'online' ? -65 : -110;

  if (deviceLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;
  if (!device) return <div className="p-8 text-center text-red-500">Device not found</div>;

  return (
    <div className="space-y-6 container py-6 max-w-7xl">
      {/* Header section */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="icon" asChild>
              <Link href={isAdmin ? "/admin/devices" : "/devices"}><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h2 className="text-2xl font-bold tracking-tight">{device.name}</h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-10">
            <Cpu className="h-4 w-4 shrink-0" />
            <code className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{device.deviceId}</code>
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(device.deviceId)}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        {canWrite && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={openAssign}>
              <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Device
            </Button>
          </div>
        )}
      </div>

      {/* Connection & Health Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Status & Signal</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Radio className={`h-5 w-5 ${isLive ? "text-green-500 animate-pulse" : "text-gray-400"}`} />
              <span className="font-bold text-xl">{isLive ? "Online" : "Offline"}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <Signal className={`h-4 w-4 ${signalStrength > -80 ? 'text-green-500' : 'text-red-500'}`} />
              {signalStrength} dBm
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Device Health Score</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Activity className={`h-5 w-5 ${healthScore > 80 ? 'text-green-500' : 'text-amber-500'}`} />
              <span className={`font-bold text-xl ${healthScore > 80 ? 'text-green-600' : 'text-amber-600'}`}>
                {healthScore}/100
              </span>
            </div>
            <div className="text-sm text-muted-foreground">Firmware: v1.2.4 (Up to date)</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Power Status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Battery className={`h-5 w-5 ${device.batteryLevel && device.batteryLevel < 20 ? 'text-red-500' : 'text-green-500'}`} />
              <span className="font-bold text-xl">{device.batteryLevel ? `${device.batteryLevel}%` : 'N/A'}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <Zap className="h-4 w-4 text-amber-500" /> Solar Charging Active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Farmer Communication Hub</CardTitle></CardHeader>
          <CardContent>
            {farmer ? (
              <>
                <div className="font-medium flex items-center gap-1.5 mb-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  {farmer.name}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="w-full flex-1">
                    <Phone className="h-3 w-3 mr-1" /> Call
                  </Button>
                  <Button size="sm" variant="outline" className="w-full flex-1">
                    <MessageSquare className="h-3 w-3 mr-1" /> SMS
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <UserX className="h-6 w-6 mb-1" />
                <span className="text-sm">Unassigned</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Sensor Readings */}
      <h3 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" /> Live 7-in-1 Sensor Data
        <span className="text-xs font-normal text-muted-foreground ml-auto">
          Last updated: {current ? formatDistanceToNow(new Date(current.recordedAt), { addSuffix: true }) : 'Never'}
        </span>
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: "Moisture", value: current?.moisture, unit: "%", icon: Droplets, color: "text-blue-500" },
          { label: "Temperature", value: current?.temperature, unit: "°C", icon: ThermometerSun, color: "text-red-500" },
          { label: "Humidity", value: current?.humidity, unit: "%", icon: Sun, color: "text-amber-500" },
          { label: "pH Level", value: current?.ph, unit: "", icon: FlaskConical, color: "text-purple-500" },
          { label: "Nitrogen", value: current?.nitrogen, unit: "mg/kg", icon: Leaf, color: "text-green-500" },
          { label: "Phosphorus", value: current?.phosphorus, unit: "mg/kg", icon: Leaf, color: "text-emerald-500" },
          { label: "Potassium", value: current?.potassium, unit: "mg/kg", icon: Leaf, color: "text-teal-500" },
        ].map((sensor, i) => (
          <Card key={i} className="flex flex-col items-center justify-center p-4 text-center">
            <sensor.icon className={`h-8 w-8 mb-2 ${sensor.color}`} />
            <div className="text-sm font-medium text-muted-foreground mb-1">{sensor.label}</div>
            <div className="text-xl font-bold">
              {sensor.value != null ? `${sensor.value}${sensor.unit}` : '--'}
            </div>
          </Card>
        ))}
      </div>

      {/* Historical Charts */}
      <h3 className="text-xl font-semibold mt-8 mb-4">Historical Trends (24h)</h3>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Soil Moisture Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {trendsLoading ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(val) => format(new Date(val), "HH:mm")}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <RechartsTooltip labelFormatter={(val) => format(new Date(val), "MMM d, HH:mm")} />
                  <Area 
                    type="monotone" 
                    dataKey="avgMoisture" 
                    name="Moisture %" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorMoisture)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Temperature & Humidity</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {trendsLoading ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(val) => format(new Date(val), "HH:mm")}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip labelFormatter={(val) => format(new Date(val), "MMM d, HH:mm")} />
                  <Legend iconType="circle" />
                  <Area 
                    type="monotone" 
                    dataKey="avgTemperature" 
                    name="Temp °C" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorTemp)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="avgHumidity" 
                    name="Humidity %" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorHum)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transfer Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              Transfer Device
            </DialogTitle>
            <DialogDescription>
              Assign <strong>{device.name}</strong> to a new farmer without reflashing firmware.
            </DialogDescription>
          </DialogHeader>

          <Form {...assignForm}>
            <form onSubmit={assignForm.handleSubmit(onAssignSubmit)} className="space-y-4">
              <FormField control={assignForm.control} name="farmerId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Farmer</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select farmer..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <UserX className="h-3.5 w-3.5" /> Unassigned
                        </span>
                      </SelectItem>
                      {farmers?.map((f) => (
                         <SelectItem key={f.id} value={f.id.toString()}>
                           {f.name} — {f.location}
                         </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateDevice.isPending}>
                  {updateDevice.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Transfer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
