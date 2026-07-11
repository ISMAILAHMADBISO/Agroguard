import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useListDevices, useListFarmers, useListStaff } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Wifi, WifiOff, Battery, AlertTriangle, UserCheck, Settings2, Cpu, Signal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminDevicesPage() {
  const { data: devices, isLoading: isDevicesLoading } = useListDevices();
  const { data: farmers, isLoading: isFarmersLoading } = useListFarmers();
  const { data: staffList } = useListStaff();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");

  const isLoading = isDevicesLoading || isFarmersLoading;

  // Filter the devices
  const filteredDevices = useMemo(() => {
    if (!devices) return [];
    return devices.filter((d) => {
      const farmer = farmers?.find(f => f.id === d.farmerId);
      
      // Search text (device name, ID, farmer name)
      const matchesSearch = search === "" || 
        d.name.toLowerCase().includes(search.toLowerCase()) || 
        d.deviceId.toLowerCase().includes(search.toLowerCase()) ||
        farmer?.name.toLowerCase().includes(search.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;

      // State filter (placeholder logic for now, usually would pull from farmer.state)
      const matchesState = stateFilter === "all" || farmer?.location.toLowerCase().includes(stateFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesState;
    });
  }, [devices, farmers, search, statusFilter, stateFilter]);

  const onlineCount = devices?.filter(d => d.status === "online").length || 0;
  const offlineCount = devices?.filter(d => d.status === "offline").length || 0;
  const criticalCount = devices?.filter(d => d.batteryLevel && d.batteryLevel < 20).length || 0;

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enterprise Device Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage all AgroGuard devices deployed across the network.
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Settings2 className="h-4 w-4" /> Export Report
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card className="border-l-4 border-l-primary/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Devices</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{devices?.length || 0}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Online Active</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{onlineCount}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-gray-400">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Offline</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-gray-500">{offlineCount}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Critical Alerts</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-red-600">{criticalCount}</div></CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by device ID, name, or farmer..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger><SelectValue placeholder="State / Region" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="kano">Kano State</SelectItem>
                  <SelectItem value="kaduna">Kaduna State</SelectItem>
                  <SelectItem value="abuja">FCT Abuja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Hardware</TableHead>
              <TableHead>Status & Signal</TableHead>
              <TableHead>Farmer & Location</TableHead>
              <TableHead>Battery / Power</TableHead>
              <TableHead>Firmware</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDevices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No devices match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredDevices.map(device => {
                const farmer = farmers?.find(f => f.id === device.farmerId);
                const isCritical = device.batteryLevel && device.batteryLevel < 20;

                return (
                  <TableRow key={device.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-medium flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-primary" />
                        <Link href={`/devices/${device.id}`} className="hover:underline">{device.name}</Link>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground mt-1 bg-muted/50 px-1.5 py-0.5 rounded inline-block">
                        {device.deviceId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5 items-start">
                        {device.status === "online" ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Wifi className="h-3 w-3 mr-1" /> Online
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <WifiOff className="h-3 w-3 mr-1" /> Offline
                          </Badge>
                        )}
                        {device.status === "online" && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Signal className="h-3 w-3 mr-1 text-green-500" /> -65 dBm (Good)
                          </div>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          Seen {device.lastSeenAt ? formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true }) : 'never'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {farmer ? (
                        <>
                          <div className="font-medium flex items-center gap-1.5">
                            <UserCheck className="h-3.5 w-3.5 text-primary" />
                            {farmer.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                            {farmer.location}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm italic text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Battery className={`h-4 w-4 ${isCritical ? 'text-red-500' : 'text-green-500'}`} />
                        <span className={isCritical ? 'text-red-600 font-medium' : ''}>
                          {device.batteryLevel ? `${device.batteryLevel}%` : 'N/A'}
                        </span>
                      </div>
                      {isCritical && (
                        <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Needs charge
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">v1.2.4</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/devices/${device.id}`}>View Dashboard</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
