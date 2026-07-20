import { useState, useMemo } from "react";
import { useListDiseaseReports } from "@workspace/api-client-react";
import { useLanguage } from "@/context/language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, History, Search, Filter, Star, ThumbsUp, ThumbsDown, Download } from "lucide-react";
import { format } from "date-fns";

function SeverityBadge({ severity }: { severity: string }) {
  switch (severity) {
    case "critical": return <Badge className="bg-red-700 text-white">Critical</Badge>;
    case "high": return <Badge variant="destructive">High</Badge>;
    case "medium": return <Badge className="bg-orange-500 text-white">Medium</Badge>;
    default: return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Low</Badge>;
  }
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  if (status === "solved")
    return <Badge variant="outline" className="border-green-400 text-green-700 bg-green-50">✓ Solved</Badge>;
  if (status === "in_progress")
    return <Badge variant="outline" className="border-blue-400 text-blue-700 bg-blue-50">⟳ In Progress</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">○ Untreated</Badge>;
}

function exportData(data: any[], formatType: "csv" | "json") {
  if (data.length === 0) return;
  
  let blob: Blob;
  let filename = `analysis-history-${format(new Date(), "yyyyMMdd")}.${formatType}`;
  
  if (formatType === "csv") {
    const headers = ["ID", "Diagnosis", "Crop", "Confidence", "Severity", "Status", "Date", "Treatment"];
    const rows = data.map((r) => [
      r.id, 
      `"${r.diagnosis}"`, 
      r.cropType || "", 
      r.confidence, 
      r.severity, 
      r.status || "untreated", 
      format(new Date(r.createdAt), "yyyy-MM-dd HH:mm"),
      `"${(r.treatment || "").replace(/"/g, "\"\"")}"`
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    blob = new Blob([csv], { type: "text/csv" });
  } else {
    blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  }
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalysisHistoryPage() {
  const { t } = useLanguage();
  const { data: reports, isLoading } = useListDiseaseReports();

  const [search, setSearch] = useState("");
  const [filterCrop, setFilterCrop] = useState("all");
  const [filterDisease, setFilterDisease] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const uniqueCrops = useMemo(() => {
    if (!reports) return [];
    return [...new Set(reports.map((r) => r.cropType).filter(Boolean) as string[])];
  }, [reports]);

  const uniqueDiseases = useMemo(() => {
    if (!reports) return [];
    return [...new Set(reports.map((r) => r.diagnosis).filter(Boolean) as string[])];
  }, [reports]);

  const filtered = useMemo(() => {
    if (!reports) return [];
    return reports
      .filter((r) => {
        const q = search.toLowerCase();
        if (q && !r.diagnosis.toLowerCase().includes(q) && !(r.cropType ?? "").toLowerCase().includes(q)) return false;
        if (filterCrop !== "all" && r.cropType !== filterCrop) return false;
        if (filterDisease !== "all" && r.diagnosis !== filterDisease) return false;
        if (filterStatus !== "all" && (r.status ?? "untreated") !== filterStatus) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reports, search, filterCrop, filterDisease, filterStatus]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-6 w-6 text-primary" /> {t("history.title")}
          </h2>
          <p className="text-muted-foreground">A complete record of all your crop diagnoses.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportData(filtered, "csv")} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData(filtered, "json")} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-1.5" /> Export JSON
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("history.search")}
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterCrop} onValueChange={setFilterCrop}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder={t("history.filter-crop")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All crops</SelectItem>
                {uniqueCrops.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterDisease} onValueChange={setFilterDisease}>
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder={t("history.filter-disease")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All diseases</SelectItem>
                {uniqueDiseases.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="solved">{t("history.status.solved")}</SelectItem>
                <SelectItem value="in_progress">{t("history.status.in_progress")}</SelectItem>
                <SelectItem value="untreated">{t("history.status.untreated")}</SelectItem>
              </SelectContent>
            </Select>
            {(search || filterCrop !== "all" || filterDisease !== "all" || filterStatus !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterCrop("all"); setFilterDisease("all"); setFilterStatus("all"); }}>
                <Filter className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Analyses", value: reports?.length ?? 0, color: "text-foreground" },
          { label: t("history.status.solved"), value: reports?.filter((r) => r.status === "solved").length ?? 0, color: "text-green-600" },
          { label: t("history.status.in_progress"), value: reports?.filter((r) => r.status === "in_progress").length ?? 0, color: "text-blue-600" },
          { label: t("history.status.untreated"), value: reports?.filter((r) => !r.status || r.status === "untreated").length ?? 0, color: "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-lg bg-card">
          <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{t("no-data")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-0">
                  {/* Severity indicator */}
                  <div className={`w-full sm:w-1 sm:self-stretch h-1 sm:h-auto ${
                    r.severity === "critical" ? "bg-red-700" :
                    r.severity === "high" ? "bg-red-500" :
                    r.severity === "medium" ? "bg-orange-500" : "bg-green-500"
                  }`} />
                  <div className="flex-1 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{r.diagnosis}</h3>
                          {r.cropType && (
                            <Badge variant="secondary" className="text-xs capitalize">{r.cropType}</Badge>
                          )}
                          <SeverityBadge severity={r.severity} />
                          <StatusBadge status={r.status} />
                        </div>
                        {r.treatment && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{r.treatment}</p>
                        )}
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 text-xs text-muted-foreground shrink-0">
                        <span className="font-medium">{r.confidence}% confidence</span>
                        <span>{format(new Date(r.createdAt), "dd MMM yyyy")}</span>
                        <div className="flex items-center gap-2">
                          {r.treatmentFeedback === true && <ThumbsUp className="h-3.5 w-3.5 text-green-500" />}
                          {r.treatmentFeedback === false && <ThumbsDown className="h-3.5 w-3.5 text-red-500" />}
                          {r.aiAccuracyRating && (
                            <span className="flex items-center gap-0.5">
                              <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                              {r.aiAccuracyRating}/5
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {r.preventionTips && (
                      <p className="mt-1.5 text-xs text-green-700 bg-green-50 rounded px-2 py-1 line-clamp-1">
                        💡 {r.preventionTips}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <p className="text-center text-xs text-muted-foreground pt-2">
            Showing {filtered.length} of {reports?.length ?? 0} diagnoses
          </p>
        </div>
      )}
    </div>
  );
}
