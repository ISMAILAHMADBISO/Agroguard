import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useListMaintenance, useListStaff } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, AlertCircle } from "lucide-react";

export default function AdminMaintenancePage() {
  const { data: maintenanceLogs, isLoading } = useListMaintenance();
  const { data: staffList } = useListStaff();

  if (isLoading) {
    return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>;
  }

  const scheduled = maintenanceLogs?.filter(m => m.status === "scheduled") || [];
  const inProgress = maintenanceLogs?.filter(m => m.status === "in_progress") || [];

  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Maintenance Schedule</h1>
        <p className="text-muted-foreground">Track and assign routine maintenance and repairs.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" /> Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{scheduled.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Jobs awaiting assignment</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" /> In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inProgress.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Currently being worked on</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Maintenance Logs</CardTitle>
          <Button variant="outline" size="sm">Schedule New Task</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task ID</TableHead>
                <TableHead>Device ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceLogs?.map((log) => {
                const assignee = staffList?.find(s => s.id === log.staffId);
                
                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">MNT-{log.id}</TableCell>
                    <TableCell>DEV-{log.deviceId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {log.type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="capitalize">{log.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      {assignee ? assignee.name : <span className="italic text-muted-foreground">Unassigned</span>}
                    </TableCell>
                    <TableCell>
                      {log.scheduledDate ? new Date(log.scheduledDate).toLocaleDateString() : "Unscheduled"}
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {maintenanceLogs?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No maintenance records found.
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
