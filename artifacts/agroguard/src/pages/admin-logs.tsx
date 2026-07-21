import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { customFetch } from "@workspace/api-client-react";

// Temporary type since codegen might still be running
interface SystemLog {
  id: number;
  level: string;
  action: string;
  description: string;
  actorId: number | null;
  targetResource: string | null;
  ipAddress: string | null;
  createdAt: string;
}

function useSystemLogs() {
  return useQuery<SystemLog[]>({
    queryKey: ["system-logs"],
    queryFn: () => customFetch({ url: "/system-logs", method: "GET" })
  });
}

export default function AdminLogsPage() {
  const { data: logs, isLoading } = useSystemLogs();
  const [search, setSearch] = useState("");

  const filteredLogs = logs?.filter(log => 
    search === "" || 
    (log.action || "").toLowerCase().includes(search.toLowerCase()) || 
    (log.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (log.targetResource && log.targetResource.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
        <p className="text-muted-foreground mt-1">
          Security and audit logs for all administrative actions across the platform.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center bg-muted/30 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Audit Trail
            </CardTitle>
            <CardDescription>Most recent system actions and events</CardDescription>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10">
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Actor IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No logs found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.level === 'error' ? 'destructive' : log.level === 'warning' ? 'default' : 'secondary'}
                        className={log.level === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : ''}>
                        {log.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{log.action}</TableCell>
                    <TableCell className="text-sm">{log.description}</TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {log.targetResource || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.ipAddress || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
