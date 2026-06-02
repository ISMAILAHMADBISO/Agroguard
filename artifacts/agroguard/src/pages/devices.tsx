/**
 * IoT Devices management page.
 *
 * Features:
 *  - List devices (RBAC-scoped: field officers see only their assigned farmers' devices)
 *  - Register new device (auto-generates a unique AGR-XXXX-XXXX hardware ID)
 *  - Copy device ID to clipboard
 *  - Assign device to a farmer
 *  - Delete device (admin only)
 *  - Connection status (online/offline) with last-seen time
 */
import { useState } from "react";
import { Link } from "wouter";
import {
  useListDevices,
  useCreateDevice,
  useDeleteDevice,
  useListFarmers,
  getListDevicesQueryKey,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, Plus, Cpu, Wifi, WifiOff, Battery, MoreHorizontal, Loader2, Copy, Check, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/context/auth";

// ── Utility: generate a unique device ID ─────────────────────────────────────

/**
 * Generates a unique hardware-style device ID in the format AGR-XXXX-XXXX.
 * This is used as the default when registering a new device from the UI.
 * The ESP32 firmware can also send its own chip ID instead.
 */
function generateDeviceId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I)
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `AGR-${segment()}-${segment()}`;
}

// ── Form schema ───────────────────────────────────────────────────────────────

const formSchema = z.object({
  deviceId: z.string().min(2, "Device ID is required"),
  name: z.string().min(2, "Name is required"),
  farmerId: z.coerce.number().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function DevicesPage() {
  const { user } = useAuth();
  const { data: devices, isLoading } = useListDevices();
  const { data: farmers } = useListFarmers();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isAdmin = user?.role === "super_admin" || user?.role === "admin";
  const canWrite = isAdmin || user?.role === "agronomist";

  // Mutations
  const createDevice = useCreateDevice();
  const deleteDevice = useDeleteDevice();

  // ── Form ────────────────────────────────────────────────────────────────
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deviceId: generateDeviceId(),
      name: "",
      location: "",
      notes: "",
    },
  });

  const regenerateId = () => form.setValue("deviceId", generateDeviceId());

  const onSubmit = (data: FormValues) => {
    createDevice.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDevicesQueryKey() });
          setIsDialogOpen(false);
          form.reset({ deviceId: generateDeviceId(), name: "", location: "", notes: "" });
          toast({ title: "Device registered successfully" });
        },
        onError: (err) => {
          const message = err instanceof Error ? err.message : "Failed to register device";
          toast({ title: message, variant: "destructive" });
        },
      }
    );
  };

  // ── Copy device ID ───────────────────────────────────────────────────────
  const copyToClipboard = (id: string) => {
    void navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = (id: number) => {
    if (!confirm("Remove this device? All associated readings will remain in the database.")) return;
    deleteDevice.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDevicesQueryKey() });
          toast({ title: "Device removed" });
        },
        onError: () => toast({ title: "Failed to remove device", variant: "destructive" }),
      }
    );
  };

  const filteredDevices = devices?.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.deviceId.toLowerCase().includes(search.toLowerCase())
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">IoT Devices</h2>
          <p className="text-muted-foreground mt-0.5">
            Manage your ESP32 sensor nodes. Each device has a globally unique hardware ID.
          </p>
        </div>

        {canWrite && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Register Device</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Register New IoT Device</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                  {/* Device ID — auto-generated, user can regenerate */}
                  <FormField
                    control={form.control}
                    name="deviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hardware Device ID</FormLabel>
                        <FormDescription>
                          Auto-generated unique ID. You can also paste the ESP32 chip ID / MAC address.
                        </FormDescription>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              className="font-mono tracking-wider"
                              placeholder="AGR-XXXX-XXXX"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={regenerateId}
                            title="Generate new ID"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(field.value)}
                            title="Copy ID"
                          >
                            {copiedId === field.value ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Program this exact ID into your ESP32 sketch as the <code className="font-mono">DEVICE_ID</code> constant.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Name</FormLabel>
                      <FormControl><Input placeholder="Node 1 — North Field" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="farmerId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Farmer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unassigned (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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

                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Installation Location / Zone</FormLabel>
                      <FormControl><Input placeholder="North Field, Zone A" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl><Input placeholder="Any setup notes..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={createDevice.isPending}>
                      {createDevice.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Register Device
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or device ID..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Device</TableHead>
              <TableHead>Hardware ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Battery</TableHead>
              <TableHead>Assigned Farmer</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Loading devices...
                </TableCell>
              </TableRow>
            ) : filteredDevices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No devices found. Register your first ESP32 sensor.
                </TableCell>
              </TableRow>
            ) : (
              filteredDevices?.map((device) => (
                <TableRow key={device.id} className="hover:bg-muted/30 transition-colors">
                  {/* Device name */}
                  <TableCell>
                    <div className="font-medium">
                      <Link href={`/devices/${device.id}`} className="text-primary hover:underline">
                        {device.name}
                      </Link>
                    </div>
                    {device.location && (
                      <div className="text-xs text-muted-foreground mt-0.5">{device.location}</div>
                    )}
                  </TableCell>

                  {/* Unique hardware ID with copy button */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Cpu className="h-3 w-3 text-muted-foreground shrink-0" />
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                        {device.deviceId}
                      </code>
                      <button
                        onClick={() => copyToClipboard(device.deviceId)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy hardware ID"
                      >
                        {copiedId === device.deviceId ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </TableCell>

                  {/* Connection status */}
                  <TableCell>
                    {device.status === "online" ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                        <Wifi className="h-3 w-3" /> Online
                      </Badge>
                    ) : device.status === "maintenance" ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                        Maintenance
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                        <WifiOff className="h-3 w-3" /> Offline
                      </Badge>
                    )}
                  </TableCell>

                  {/* Battery level */}
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Battery
                        className={`h-4 w-4 ${
                          device.batteryLevel && device.batteryLevel < 20
                            ? "text-destructive"
                            : "text-primary"
                        }`}
                      />
                      {device.batteryLevel != null ? `${device.batteryLevel}%` : "N/A"}
                    </div>
                  </TableCell>

                  {/* Assigned farmer */}
                  <TableCell>
                    {device.farmerId ? (
                      <Link
                        href={`/farmers/${device.farmerId}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {farmers?.find((f) => f.id === device.farmerId)?.name ?? "Unknown"}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>

                  {/* Last seen */}
                  <TableCell className="text-sm text-muted-foreground">
                    {device.lastSeenAt
                      ? formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true })
                      : "Never"}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/devices/${device.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyToClipboard(device.deviceId)}>
                          <Copy className="mr-2 h-3.5 w-3.5" /> Copy Hardware ID
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem
                            onClick={() => handleDelete(device.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            Remove Device
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
