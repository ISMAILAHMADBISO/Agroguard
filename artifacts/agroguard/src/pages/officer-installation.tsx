import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useListDeployments, useListOrders, getAuthToken } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, QrCode, Power, Wifi, Droplets } from "lucide-react";

export default function OfficerInstallationPage() {
  const [match, params] = useRoute("/officer/installation/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deploymentId = params?.id ? parseInt(params.id) : 0;
  
  const { data: deployments, isLoading: loadingDeployments } = useListDeployments();
  const { data: orders } = useListOrders();

  const deployment = deployments?.find(d => d.id === deploymentId);
  const order = orders?.find(o => o.id === deployment?.orderId);

  // Local state for the checklist
  const [powerTested, setPowerTested] = useState(false);
  const [networkTested, setNetworkTested] = useState(false);
  const [sensorsTested, setSensorsTested] = useState(false);
  const [notes, setNotes] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (deployment) {
      setPowerTested(deployment.powerTested);
      setNetworkTested(deployment.networkTested);
      setSensorsTested(deployment.sensorsTested);
      setNotes(deployment.installationNotes || "");
    }
  }, [deployment]);

  const updateStatus = async (status: string) => {
    setIsUpdating(true);
    try {
      const token = getAuthToken();
      // 1. Update deployment checklist
      const res = await fetch(`/api/deployments/${deploymentId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status,
          powerTested,
          networkTested,
          sensorsTested,
          installationNotes: notes,
          installedLat: "", // Could get from device GPS
          installedLng: "",
        }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      // 2. If completed, activate the device
      if (status === "completed") {
        if (!serialNumber) throw new Error("Serial number is required to complete installation");
        
        const actRes = await fetch(`/api/devices/activate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            deploymentId,
            serialNumber,
          }),
        });
        
        if (!actRes.ok) throw new Error("Failed to activate device in system");
        
        toast({ title: "Installation Complete! 🎉", description: "Device is now transmitting data." });
        setLocation("/officer/dashboard");
      } else {
        toast({ title: "Status Updated", description: `Deployment marked as ${status.replace("_", " ")}` });
        queryClient.invalidateQueries({ queryKey: ["listDeployments"] });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!match || loadingDeployments) return <div className="p-8">Loading...</div>;
  if (!deployment || !order) return <div className="p-8">Deployment not found.</div>;

  const allChecked = powerTested && networkTested && sensorsTested;

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Execute Installation</h1>
        <p className="text-muted-foreground">Order #{order.id} • {order.farmAddress}</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" /> Hardware Linking
            </CardTitle>
            <CardDescription>Scan or enter the AgroGuard device serial number.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input 
                placeholder="e.g. AG-2026-XYZ123" 
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                className="font-mono text-lg uppercase"
              />
              <Button variant="outline"><QrCode className="h-4 w-4 mr-2" /> Scan</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Checklist</CardTitle>
            <CardDescription>Perform on-site validation before activating the device.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="flex items-start space-x-4">
              <Checkbox id="power" checked={powerTested} onCheckedChange={(c) => setPowerTested(c as boolean)} className="mt-1" />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="power" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                  <Power className="h-4 w-4 text-amber-500" /> Power & Battery Test
                </label>
                <p className="text-sm text-muted-foreground">Device powers on successfully and solar panel is receiving sunlight.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Checkbox id="network" checked={networkTested} onCheckedChange={(c) => setNetworkTested(c as boolean)} className="mt-1" />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="network" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-blue-500" /> GSM/Network Connectivity
                </label>
                <p className="text-sm text-muted-foreground">Sim card is active and device has successfully pinged the AgroGuard servers.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Checkbox id="sensors" checked={sensorsTested} onCheckedChange={(c) => setSensorsTested(c as boolean)} className="mt-1" />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="sensors" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-emerald-500" /> Sensor Calibration
                </label>
                <p className="text-sm text-muted-foreground">Probes are securely inserted into the soil and reading accurate baseline data.</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label htmlFor="notes">Installation Notes (Optional)</Label>
              <Textarea 
                id="notes" 
                placeholder="Any issues encountered or specific placement details..." 
                className="mt-2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

          </CardContent>
          <CardFooter className="flex justify-between border-t bg-slate-50 dark:bg-slate-900 pt-6">
            <Button variant="outline" onClick={() => updateStatus("installing")} disabled={isUpdating}>
              Save Progress
            </Button>
            <Button 
              onClick={() => updateStatus("completed")} 
              disabled={!allChecked || !serialNumber || isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" /> Complete Installation
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
