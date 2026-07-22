import { useState } from "react";
import { useAuth } from "@/context/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@workspace/api-client-react";
import { DiseaseForecast } from "@/types/disease-forecast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Trash2, Search, History, ChevronRight, Eye, CheckCircle2, AlertTriangle, ShieldCheck, CloudRain } from "lucide-react";
import { Link } from "wouter";

function RiskBadge({ risk }: { risk: string }) {
  switch (risk) {
    case "Low": return <Badge className="bg-green-600">Low</Badge>;
    case "Moderate": return <Badge className="bg-amber-500">Moderate</Badge>;
    case "High": return <Badge className="bg-orange-600">High</Badge>;
    case "Critical": return <Badge variant="destructive">Critical</Badge>;
    default: return <Badge variant="outline">{risk}</Badge>;
  }
}

export default function DiseaseForecastHistoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedForecast, setSelectedForecast] = useState<DiseaseForecast | null>(null);
  const [isUpdatingOutcome, setIsUpdatingOutcome] = useState(false);
  
  const { data: forecasts, isLoading } = useQuery<DiseaseForecast[]>({
    queryKey: ["disease-forecasts"],
    queryFn: async () => {
      return apiRequest("GET", "/api/ai/disease-forecasts");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/ai/disease-forecasts/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Forecast deleted" });
      queryClient.invalidateQueries({ queryKey: ["disease-forecasts"] });
      setSelectedForecast(null);
    },
    onError: () => {
      toast({ title: "Failed to delete forecast", variant: "destructive" });
    }
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this forecast record?")) {
      deleteMutation.mutate(id);
    }
  };

  const updateOutcome = async (id: number, occurred: "Yes" | "No" | "Partially") => {
    setIsUpdatingOutcome(true);
    try {
      await apiRequest("PATCH", `/api/ai/disease-forecasts/${id}/outcome`, { occurred });
      toast({ title: "Outcome updated", description: "Thanks for tracking this forecast." });
      queryClient.invalidateQueries({ queryKey: ["disease-forecasts"] });
      
      // Update selected if open
      if (selectedForecast && selectedForecast.id === id) {
        setSelectedForecast({ ...selectedForecast, occurred });
      }
    } catch {
      toast({ title: "Failed to update outcome", variant: "destructive" });
    } finally {
      setIsUpdatingOutcome(false);
    }
  };

  const filtered = (forecasts || []).filter(f => 
    f.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.predictedDisease.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Disease Forecast History</h2>
          <p className="text-muted-foreground">
            Review past predictions and track if the diseases actually occurred.
          </p>
        </div>
        <Link href="/disease-forecast">
          <Button>New Forecast <ChevronRight className="w-4 h-4 ml-1" /></Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle className="text-lg">All Records</CardTitle>
              <CardDescription>View, search and track outcome history.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search crop or disease..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Crop</TableHead>
                    <TableHead>Predicted Disease</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Probability</TableHead>
                    <TableHead>Occurred?</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((forecast) => (
                    <TableRow key={forecast.id}>
                      <TableCell className="font-medium">
                        {new Date(forecast.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="capitalize">{forecast.cropType}</TableCell>
                      <TableCell className="font-medium">{forecast.predictedDisease}</TableCell>
                      <TableCell>
                        <RiskBadge risk={forecast.riskLevel} />
                      </TableCell>
                      <TableCell>{forecast.probability}%</TableCell>
                      <TableCell>
                        {forecast.occurred ? (
                          <Badge variant="outline" className={
                            forecast.occurred === 'Yes' ? 'border-red-200 text-red-700 bg-red-50' :
                            forecast.occurred === 'Partially' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                            'border-green-200 text-green-700 bg-green-50'
                          }>
                            {forecast.occurred}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Pending</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedForecast(forecast)}>
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(forecast.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <History className="mx-auto h-12 w-12 text-muted mb-4" />
              <p>No forecast history found.</p>
              {searchTerm && <p className="text-sm mt-1">Try adjusting your search criteria.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forecast Details Dialog */}
      <Dialog open={!!selectedForecast} onOpenChange={(open) => !open && setSelectedForecast(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center text-xl">
              <span>Forecast Details</span>
              {selectedForecast && <RiskBadge risk={selectedForecast.riskLevel} />}
            </DialogTitle>
          </DialogHeader>

          {selectedForecast && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Date</span>
                  <span className="font-medium">{new Date(selectedForecast.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Crop</span>
                  <span className="font-medium capitalize">{selectedForecast.cropType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Predicted Disease</span>
                  <span className="font-medium">{selectedForecast.predictedDisease}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Probability</span>
                  <span className="font-medium">{selectedForecast.probability}%</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold flex items-center mb-2"><AlertTriangle className="w-4 h-4 mr-2 text-amber-500"/> Forecast Drivers</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm text-foreground/80">
                  {selectedForecast.forecastDrivers.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold flex items-center mb-2"><ShieldCheck className="w-4 h-4 mr-2 text-green-600"/> Recommended Actions</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm text-foreground/80">
                  {selectedForecast.recommendedActions.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-lg">
                <h4 className="font-semibold flex items-center mb-2 text-blue-800"><CloudRain className="w-4 h-4 mr-2"/> Weather Summary</h4>
                <p className="text-sm text-blue-900/80">{selectedForecast.weatherSummary}</p>
              </div>

              {/* Outcome Tracking Section */}
              <div className="border-t pt-6 mt-6">
                <h4 className="font-semibold text-lg mb-2">Track Outcome</h4>
                <p className="text-sm text-muted-foreground mb-4">Did {selectedForecast.predictedDisease} actually occur in your farm?</p>
                
                <div className="flex gap-3">
                  <Button 
                    variant={selectedForecast.occurred === "Yes" ? "default" : "outline"} 
                    className={selectedForecast.occurred === "Yes" ? "bg-red-600 hover:bg-red-700" : ""}
                    onClick={() => updateOutcome(selectedForecast.id, "Yes")}
                    disabled={isUpdatingOutcome}
                  >
                    Yes, it occurred
                  </Button>
                  <Button 
                    variant={selectedForecast.occurred === "Partially" ? "default" : "outline"}
                    className={selectedForecast.occurred === "Partially" ? "bg-amber-500 hover:bg-amber-600" : ""}
                    onClick={() => updateOutcome(selectedForecast.id, "Partially")}
                    disabled={isUpdatingOutcome}
                  >
                    Partially
                  </Button>
                  <Button 
                    variant={selectedForecast.occurred === "No" ? "default" : "outline"}
                    className={selectedForecast.occurred === "No" ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => updateOutcome(selectedForecast.id, "No")}
                    disabled={isUpdatingOutcome}
                  >
                    No, crop is healthy
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
