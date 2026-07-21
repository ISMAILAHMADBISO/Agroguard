import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@workspace/api-client-react";
import { useLanguage } from "@/context/language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, Search, Filter, Download, User, Clock } from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: number;
  level: string;
  action: string;
  description: string;
  actorId: number | null;
  targetResource: string | null;
  ipAddress: string | null;
  device: string | null;
  createdAt: string;
}

function LevelBadge({ level }: { level: string }) {
  switch (level) {
    case "error": return <Badge variant="destructive">Error</Badge>;
    case "warning": return <Badge className="bg-orange-500 text-white">Warning</Badge>;
    case "critical": return <Badge className="bg-red-700 text-white">Critical</Badge>;
    default: return <Badge variant="outline">Info</Badge>;
  }
}

function ActionIcon({ action }: { action: string | null }) {
  const a = (action || "").toLowerCase();
  if (a.includes("login")) return <Shield className="h-4 w-4 text-green-500" />;
  if (a.includes("logout")) return <Shield className="h-4 w-4 text-muted-foreground" />;
  if (a.includes("delete")) return <Shield className="h-4 w-4 text-red-500" />;
  if (a.includes("create") || a.includes("add")) return <Shield className="h-4 w-4 text-blue-500" />;
  if (a.includes("export")) return <Shield className="h-4 w-4 text-purple-500" />;
  return <Shield className="h-4 w-4 text-primary" />;
}

function exportLogsCSV(logs: AuditLog[]) {
  const headers = ["ID", "Level", "Action", "Description", "Actor ID", "Target", "IP Address", "Device", "Date"];
  const rows = logs.map((l) => [
    l.id, l.level, l.action, `"${l.description.replace(/"/g, "\"\"")}"`,
    l.actorId ?? "", l.targetResource ?? "", l.ipAddress ?? "",
    `"${(l.device ?? "").replace(/"/g, "\"\"")}"`,
    format(new Date(l.createdAt), "yyyy-MM-dd HH:mm:ss"),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `agroguard-audit-logs-${format(new Date(), "yyyyMMdd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAuditLogsPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: logs = [], isLoading, refetch } = useQuery<AuditLog[]>({
    queryKey: ["audit-logs", search, from, to],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      return apiRequest("GET", `/api/system-logs${params.toString() ? `?${params}` : ""}`);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> {t("admin-audit-logs")}
          </h2>
          <p className="text-muted-foreground">
            Complete record of admin actions, logins, and system events.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => exportLogsCSV(logs)}
          disabled={logs.length === 0}
        >
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search actions, descriptions..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs shrink-0 text-muted-foreground">From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs shrink-0 text-muted-foreground">To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36" />
            </div>
            {(search || from || to) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFrom(""); setTo(""); }}>
                <Filter className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: logs.length },
          { label: "Login Events", value: logs.filter((l) => (l.action || "").toLowerCase().includes("login")).length },
          { label: "Errors", value: logs.filter((l) => l.level === "error" || l.level === "critical").length },
          { label: "User Actions", value: logs.filter((l) => l.actorId != null).length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Log list */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-lg bg-card">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No audit logs found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-0">
                  <div className={`w-1 shrink-0 ${
                    log.level === "critical" ? "bg-red-700" :
                    log.level === "error" ? "bg-red-500" :
                    log.level === "warning" ? "bg-orange-500" : "bg-green-500"
                  }`} />
                  <div className="flex-1 p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <ActionIcon action={log.action} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-sm capitalize">{(log.action || "unknown").replace(/_/g, " ")}</span>
                            <LevelBadge level={log.level} />
                            {log.targetResource && (
                              <Badge variant="secondary" className="text-xs font-mono">{log.targetResource}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1 text-xs text-muted-foreground shrink-0">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.createdAt), "dd MMM yyyy HH:mm")}
                        </span>
                        {log.actorId && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            User #{log.actorId}
                          </span>
                        )}
                        {log.ipAddress && (
                          <span className="font-mono">{log.ipAddress}</span>
                        )}
                      </div>
                    </div>
                    {log.device && (
                      <p className="mt-1 text-xs text-muted-foreground/70 truncate font-mono bg-muted/40 px-2 py-0.5 rounded">
                        {log.device}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <p className="text-center text-xs text-muted-foreground pt-2">
            Showing {logs.length} audit log entries
          </p>
        </div>
      )}
    </div>
  );
}
