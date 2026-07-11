/**
 * IoT Devices management page.
 *
 * Features:
 *  - List devices (RBAC-scoped: field officers see only their assigned farmers' devices)
 *  - Register new device (auto-generates a unique AGR-XXXX-XXXX hardware ID)
 *  - Copy device ID to clipboard
 *  - Assign / Transfer / Unassign device to a farmer (no firmware re-flash needed)
 *  - Delete device (admin only)
 *  - Connection status (online/offline) with last-seen time
 */
import { useState } from "react";
import { Link } from "wouter";
import {
  useListDevices,
  useCreateDevice,
  useUpdateDevice,
  useDeleteDevice,
  useListFarmers,
  getListDevicesQueryKey,
  getGetDeviceQueryKey,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Search, Plus, Cpu, Wifi, WifiOff, Battery, MoreHorizontal,
  Loader2, Copy, Check, RefreshCw, UserCheck, UserX, ArrowRightLeft,
  ExternalLink,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
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

// ── Form schemas ──────────────────────────────────────────────────────────────

const registerFormSchema = z.object({
  deviceId: z.string().min(2, "Device ID is required"),
  name: z.string().min(2, "Name is required"),
  farmerId: z.coerce.number().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const assignFormSchema = z.object({
  farmerId: z.string().optional(), // "none" = unassign, otherwise farmer id string
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;
type AssignFormValues = z.infer<typeof assignFormSchema>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function DevicesPage() {
  const { user } = useAuth();
  const { data: devices, isLoading } = useListDevices();
  const { data: farmers } = useListFarmers();
  const [search, setSearch] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registeredDevice, setRegisteredDevice] = useState<{ id: number; deviceId: string; name: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<{ id: number; deviceId: string; name: string; farmerId?: number | null } | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isAdmin = user?.role === "super_admin" || user?.role === "admin";
  const canWrite = isAdmin || user?.role === "agronomist";

  // Mutations
  const createDevice = useCreateDevice();
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();

  // ── Register form ────────────────────────────────────────────────────────
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      deviceId: generateDeviceId(),
      name: "",
      location: "",
      notes: "",
    },
  });

  const regenerateId = () => registerForm.setValue("deviceId", generateDeviceId());

  const onRegisterSubmit = (data: RegisterFormValues) => {
    createDevice.mutate(
      { data },
      {
        onSuccess: (created) => {
          queryClient.invalidateQueries({ queryKey: getListDevicesQueryKey() });
          setIsRegisterOpen(false);
          registerForm.reset({ deviceId: generateDeviceId(), name: "", location: "", notes: "" });
          // Show the "program this ID" confirmation dialog
          setRegisteredDevice({ id: (created as any).id, deviceId: data.deviceId, name: data.name });
          toast({ title: "Device registered successfully" });
        },
        onError: (err) => {
          const message = err instanceof Error ? err.message : "Failed to register device";
          toast({ title: message, variant: "destructive" });
        },
      }
    );
  };

  // ── Assign / Transfer / Unassign form ────────────────────────────────────
  const assignForm = useForm<AssignFormValues>({
    resolver: zodResolver(assignFormSchema),
    defaultValues: { farmerId: "none" },
  });

  const openAssignDialog = (device: { id: number; deviceId: string; name: string; farmerId?: number | null }) => {
    setAssignTarget(device);
    assignForm.reset({ farmerId: device.farmerId ? device.farmerId.toString() : "none" });
  };

  const onAssignSubmit = (data: AssignFormValues) => {
    if (!assignTarget) return;
    const newFarmerId = !data.farmerId || data.farmerId === "none" ? null : parseInt(data.farmerId, 10);
    updateDevice.mutate(
      { id: assignTarget.id, data: { farmerId: newFarmerId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDevicesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDeviceQueryKey(assignTarget.id) });
          setAssignTarget(null);
          const msg = newFarmerId === null
            ? `${assignTarget.name} unassigned successfully`
            : `${assignTarget.name} assigned successfully`;
          toast({ title: msg });
        },
        onError: () => toast({ title: "Failed to update assignment", variant: "destructive" }),
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
  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Remove "${name}"? All associated readings will remain in the database.`)) return;
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
          <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Register Device</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Register New IoT Device</DialogTitle>
                <DialogDescription>
                  Generate a unique hardware ID and assign the device to a farmer immediately, or leave unassigned and transfer later.
                </DialogDescription>
              </DialogHeader>
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">

                  {/* Device ID — auto-generated, user can regenerate */}
                  <FormField
                    control={registerForm.control}
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
                          ⚡ Copy this ID — you will need to program it into your ESP32 sketch as the <code className="font-mono">DEVICE_ID</code> constant.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField control={registerForm.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Name</FormLabel>
                      <FormControl><Input placeholder="Node 1 — North Field" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={registerForm.control} name="farmerId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Farmer <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unassigned — assign later" />
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
                      <FormDescription>You can reassign or transfer the device later without re-flashing firmware.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={registerForm.control} name="location" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Installation Location / Zone</FormLabel>
                      <FormControl><Input placeholder="North Field, Zone A" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={registerForm.control} name="notes" render={({ field }) => (
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

      {/* ── Post-registration Device ID banner ─────────────────────────────── */}
      {registeredDevice && (
        <Dialog open={!!registeredDevice} onOpenChange={() => setRegisteredDevice(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                Device Registered — Program Your ESP32
              </DialogTitle>
              <DialogDescription>
                Copy the hardware ID below and paste it into your receiver firmware before flashing.
              </DialogDescription>
            </DialogHeader>

            <Alert className="bg-primary/5 border-primary/20">
              <AlertDescription>
                <div className="space-y-3">
                  <p className="text-sm font-medium">Device: <span className="text-muted-foreground font-normal">{registeredDevice.name}</span></p>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Hardware ID to program into your ESP32:</p>
                    <div className="flex items-center gap-2 bg-background border rounded-md px-3 py-2">
                      <code className="font-mono text-lg tracking-widest font-bold text-primary flex-1">
                        {registeredDevice.deviceId}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(registeredDevice.deviceId)}
                      >
                        {copiedId === registeredDevice.deviceId ? (
                          <><Check className="h-3.5 w-3.5 text-green-600 mr-1" /> Copied!</>
                        ) : (
                          <><Copy className="h-3.5 w-3.5 mr-1" /> Copy</>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 border-t pt-2">
                    <p>In your <code className="font-mono bg-muted px-1 rounded">Receiver.ino</code> sketch, set:</p>
                    <code className="block bg-muted px-2 py-1 rounded font-mono text-xs">
                      const char* deviceId = "{registeredDevice.deviceId}";
                    </code>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="outline" asChild>
                <Link href={`/devices/${registeredDevice.id}`}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View Device
                </Link>
              </Button>
              <Button onClick={() => setRegisteredDevice(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Assign / Transfer / Unassign dialog ─────────────────────────────── */}
      <Dialog open={!!assignTarget} onOpenChange={(open) => !open && setAssignTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              Assign / Transfer Device
            </DialogTitle>
            <DialogDescription>
              Select a new farmer to assign <strong>{assignTarget?.name}</strong> ({assignTarget?.deviceId}) to, or choose "Unassigned" to remove the current assignment. No firmware re-flash needed.
            </DialogDescription>
          </DialogHeader>

          <Form {...assignForm}>
            <form onSubmit={assignForm.handleSubmit(onAssignSubmit)} className="space-y-4">
              <FormField control={assignForm.control} name="farmerId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Farmer</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select farmer..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <UserX className="h-3.5 w-3.5" /> Unassigned
                        </span>
                      </SelectItem>
                      {farmers?.map((f) => (
                        <SelectItem key={f.id} value={f.id.toString()}>
                          <span className="flex items-center gap-2">
                            <UserCheck className="h-3.5 w-3.5 text-primary" />
                            {f.name} — {f.location}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The device will immediately appear on the new farmer's dashboard.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAssignTarget(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateDevice.isPending}>
                  {updateDevice.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Assignment
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Empty state for Farmers */}
      {user?.userType === "farmer" && devices?.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
          <Cpu className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-bold mb-2">You don't have any active devices yet</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Unlock the full potential of your farm by installing AgroGuard smart sensors. Monitor soil moisture, temperature, and receive AI-driven alerts in real-time.
          </p>
          <Button asChild size="lg">
            <Link href="/shop">Buy Hardware</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="relative max-w-sm mb-4">
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
                      No devices found matching your search.
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
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                        <Link
                          href={`/farmers/${device.farmerId}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {farmers?.find((f) => f.id === device.farmerId)?.name ?? "Unknown"}
                        </Link>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <UserX className="h-3.5 w-3.5" /> Unassigned
                      </span>
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
                          <Link href={`/devices/${device.id}`}>
                            <ExternalLink className="mr-2 h-3.5 w-3.5" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyToClipboard(device.deviceId)}>
                          <Copy className="mr-2 h-3.5 w-3.5" /> Copy Hardware ID
                        </DropdownMenuItem>
                        {canWrite && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openAssignDialog(device)}
                            >
                              <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />
                              {device.farmerId ? "Transfer / Unassign" : "Assign to Farmer"}
                            </DropdownMenuItem>
                          </>
                        )}
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(device.id, device.name)}
                              className="text-destructive focus:text-destructive"
                            >
                              Remove Device
                            </DropdownMenuItem>
                          </>
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
      </>
      )}
    </div>
  );
}
