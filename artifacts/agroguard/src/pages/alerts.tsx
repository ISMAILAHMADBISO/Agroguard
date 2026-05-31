import { useListAlerts, useResolveAlert, getListAlertsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

export default function AlertsPage() {
  const { data: alerts, isLoading } = useListAlerts();
  const resolveAlert = useResolveAlert();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleResolve = (id: number) => {
    resolveAlert.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
          toast({ title: "Alert resolved" });
        },
      }
    );
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">High</Badge>;
      case 'medium': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      default: return <Badge variant="outline">Low</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Alert Center</h2>
        <p className="text-muted-foreground">Monitor and manage farm anomalies.</p>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Severity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : alerts?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No alerts found.</TableCell></TableRow>
            ) : (
              alerts?.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                  <TableCell className="capitalize">{alert.type.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                      {alert.farmerId && <Link href={`/farmers/${alert.farmerId}`} className="hover:underline">Farmer #{alert.farmerId}</Link>}
                      {alert.deviceId && <Link href={`/devices/${alert.deviceId}`} className="hover:underline">Device #{alert.deviceId}</Link>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    {alert.status === 'resolved' ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Resolved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {alert.status === 'active' && (
                      <Button size="sm" variant="outline" onClick={() => handleResolve(alert.id)}>
                        Resolve
                      </Button>
                    )}
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
