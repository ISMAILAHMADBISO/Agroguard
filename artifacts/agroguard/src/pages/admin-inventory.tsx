import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useListInventory } from "@workspace/api-client-react";
import { getAuthToken } from "@/context/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, Package } from "lucide-react";

export default function AdminInventoryPage() {
  const { data: inventory, isLoading } = useListInventory();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [serialNumber, setSerialNumber] = useState("");
  const [productType, setProductType] = useState("standard");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addInventory = async () => {
    if (!serialNumber) {
      toast({ variant: "destructive", title: "Required", description: "Please enter a serial number" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/inventory/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ serialNumber: serialNumber.toUpperCase(), productType }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add inventory");
      }

      toast({ title: "Success", description: "Hardware added to inventory." });
      setSerialNumber("");
      queryClient.invalidateQueries({ queryKey: ["listInventory"] });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>;
  }

  const filteredInventory = inventory?.filter((item) => 
    item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableCount = inventory?.filter(i => i.status === "available").length || 0;
  const installedCount = inventory?.filter(i => i.status === "installed").length || 0;
  const repairCount = inventory?.filter(i => i.status === "repair").length || 0;

  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Hardware Inventory</h1>
        <p className="text-muted-foreground">Manage and track all physical AgroGuard devices.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Stock</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{inventory?.length || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Available (Ready to Deploy)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{availableCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Installed Active</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{installedCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Needs Repair</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-500">{repairCount}</div></CardContent>
        </Card>
      </div>

      <Card className="mb-8 bg-slate-50 dark:bg-slate-900 border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium mb-1 block">Scan / Enter Serial Number</label>
              <Input 
                placeholder="AG-2026-..." 
                value={serialNumber} 
                onChange={(e) => setSerialNumber(e.target.value)} 
                className="uppercase"
              />
            </div>
            <div className="w-full md:w-64">
              <label className="text-sm font-medium mb-1 block">Product Type</label>
              <Select value={productType} onValueChange={setProductType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Edition</SelectItem>
                  <SelectItem value="premium">Premium Edition</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addInventory} disabled={isSubmitting}>
              <Plus className="h-4 w-4 mr-2" /> Add to Inventory
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Inventory List</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search serial or status..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono font-medium">{item.serialNumber}</TableCell>
                  <TableCell className="capitalize">{item.productType}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "available" ? "default" : item.status === "installed" ? "secondary" : "outline"} className="capitalize">
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Details</Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredInventory?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No inventory found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
