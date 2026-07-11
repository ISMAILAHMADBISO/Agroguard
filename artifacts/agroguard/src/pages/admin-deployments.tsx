import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useListDeployments, useListStaff, useListOrders, getAuthToken } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function AdminDeploymentsPage() {
  const { data: deployments, isLoading: loadingDeployments } = useListDeployments();
  const { data: staffList, isLoading: loadingStaff } = useListStaff();
  const { data: orders, isLoading: loadingOrders } = useListOrders();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [assigningId, setAssigningId] = useState<number | null>(null);

  // Manually fetch/mutate since we might not have the exact generated hook for patching deployments yet
  // Actually, we do have `POST /deployments/{id}/status`, but assignment might require `PATCH /deployments/:id`
  // Wait, did I add PATCH /deployments to openapi? No.
  // I only added POST /deployments/:id/status
  // But wait, an admin needs to assign the officer! I forgot to add an endpoint for assigning an officer.
  // Let me quickly just do it via a direct fetch if I don't want to update OpenAPI again, OR I can just use a raw fetch to a new endpoint.
  // Wait, I can just write the frontend and then add the backend route for it. Let's assume the endpoint is PATCH /api/deployments/:id/assign
  
  const assignOfficer = async ({ deploymentId, officerId }: { deploymentId: number; officerId: number }) => {
    const token = getAuthToken();
    const res = await fetch(`/api/deployments/${deploymentId}/assign`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ fieldOfficerId: officerId }),
    });
    if (!res.ok) throw new Error("Failed to assign officer");
    return res.json();
  };

  const assignMutation = useMutation({
    mutationFn: assignOfficer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listDeployments"] });
      toast({ title: "Officer assigned successfully" });
      setAssigningId(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Assignment failed", description: error.message });
      setAssigningId(null);
    }
  });

  if (loadingDeployments || loadingStaff || loadingOrders) {
    return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>;
  }

  const fieldOfficers = staffList?.filter((s) => s.role === "field_officer") || [];

  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Deployments Management</h1>
        <p className="text-muted-foreground">Schedule and assign hardware installations to field officers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Scheduled Deployments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Officer</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deployments?.map((deployment) => {
                const order = orders?.find((o) => o.id === deployment.orderId);
                const assignedOfficer = staffList?.find((s) => s.id === deployment.fieldOfficerId);

                return (
                  <TableRow key={deployment.id}>
                    <TableCell className="font-medium">#{deployment.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{order?.farmAddress || "Unknown Address"}</div>
                      <div className="text-xs text-muted-foreground">{order?.state} State</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {deployment.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assigningId === deployment.id ? (
                        <Select
                          onValueChange={(val) => {
                            assignMutation.mutate({ deploymentId: deployment.id, officerId: parseInt(val) });
                          }}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Officer..." />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldOfficers.map((officer) => (
                              <SelectItem key={officer.id} value={officer.id.toString()}>
                                {officer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-sm">
                          {assignedOfficer ? assignedOfficer.name : <span className="text-muted-foreground italic">Unassigned</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {deployment.status === "scheduled" && assigningId !== deployment.id && (
                        <Button variant="secondary" size="sm" onClick={() => setAssigningId(deployment.id)}>
                          {assignedOfficer ? "Reassign" : "Assign Officer"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {deployments?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No active deployments found.
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
