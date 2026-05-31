import { useState } from "react";
import { Link } from "wouter";
import { useListDevices, useCreateDevice, useDeleteDevice, useListFarmers } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, Plus, Cpu, Wifi, WifiOff, Battery, MoreHorizontal, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListDevicesQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

const formSchema = z.object({
  deviceId: z.string().min(2, "Device ID is required"),
  name: z.string().min(2, "Name is required"),
  farmerId: z.coerce.number().optional(),
  location: z.string().optional(),
});

export default function DevicesPage() {
  const { data: devices, isLoading } = useListDevices();
  const { data: farmers } = useListFarmers();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createDevice = useCreateDevice();
  const deleteDevice = useDeleteDevice();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deviceId: "",
      name: "",
      location: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createDevice.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDevicesQueryKey() });
          setIsDialogOpen(false);
          form.reset();
          toast({ title: "Device registered successfully" });
        },
        onError: () => {
          toast({ title: "Failed to register device", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to remove this device?")) {
      deleteDevice.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListDevicesQueryKey() });
            toast({ title: "Device removed" });
          },
        }
      );
    }
  };

  const filteredDevices = devices?.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.deviceId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">IoT Devices</h2>
          <p className="text-muted-foreground">Manage your fleet of ESP32 sensor nodes.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Register Device</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Device</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="deviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hardware ID (MAC/UUID)</FormLabel>
                      <FormControl><Input placeholder="ESP-..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Name</FormLabel>
                      <FormControl><Input placeholder="Node 1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="farmerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Farmer (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a farmer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {farmers?.map(f => (
                            <SelectItem key={f.id} value={f.id.toString()}>{f.name} ({f.location})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specific Location/Zone</FormLabel>
                      <FormControl><Input placeholder="North Field, Zone A" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createDevice.isPending}>
                    {createDevice.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Device
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Battery</TableHead>
              <TableHead>Assigned Farmer</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : filteredDevices?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No devices found.</TableCell></TableRow>
            ) : (
              filteredDevices?.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>
                    <div className="font-medium text-primary"><Link href={`/devices/${device.id}`}>{device.name}</Link></div>
                    <div className="text-xs text-muted-foreground flex items-center mt-1">
                      <Cpu className="h-3 w-3 mr-1" /> {device.deviceId}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
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
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Battery className={`h-4 w-4 mr-1 ${device.batteryLevel && device.batteryLevel < 20 ? 'text-destructive' : 'text-primary'}`} /> 
                      {device.batteryLevel ? `${device.batteryLevel}%` : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {device.farmerId ? (
                      <Link href={`/farmers/${device.farmerId}`} className="text-sm hover:underline text-primary">
                        {farmers?.find(f => f.id === device.farmerId)?.name || 'Unknown Farmer'}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {device.lastSeenAt ? formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true }) : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link href={`/devices/${device.id}`}>View Details</Link></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(device.id)} className="text-destructive">Delete</DropdownMenuItem>
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
