import { useState } from "react";
import { useAuth } from "@/context/auth";
import { useLanguage } from "@/context/language";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@workspace/api-client-react";
import { SeedAssessment } from "@/types/seed-assessment";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Trash2, Search, History, ChevronRight, Eye, Printer, Download, Star, Leaf, Activity, Droplets, Info } from "lucide-react";
import { Link } from "wouter";

function QualityBadge({ quality }: { quality: string }) {
  switch (quality) {
    case "Excellent": return <Badge className="bg-green-600">Excellent</Badge>;
    case "Good": return <Badge className="bg-blue-500">Good</Badge>;
    case "Fair": return <Badge className="bg-amber-500">Fair</Badge>;
    case "Poor": return <Badge variant="destructive">Poor</Badge>;
    default: return <Badge variant="outline">{quality}</Badge>;
  }
}

function ProgressCircle({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center w-24 h-24">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className={`transition-all duration-1000 ease-out ${color}`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{value}%</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-center text-muted-foreground">{label}</span>
    </div>
  );
}

export default function SeedAnalysisHistoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState<SeedAssessment | null>(null);
  
  const { data: assessments, isLoading } = useQuery<SeedAssessment[]>({
    queryKey: ["seed-assessments"],
    queryFn: async () => {
      return apiRequest("GET", "/api/ai/seed-assessments");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/ai/seed-assessments/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Analysis deleted" });
      queryClient.invalidateQueries({ queryKey: ["seed-assessments"] });
    },
    onError: () => {
      toast({ title: "Failed to delete analysis", variant: "destructive" });
    }
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this seed analysis record?")) {
      deleteMutation.mutate(id);
    }
  };

  const filtered = (assessments || []).filter(a => 
    a.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.overallQuality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Seed Analysis History</h2>
          <p className="text-muted-foreground">
            Review your past AI seed quality assessments and recommendations.
          </p>
        </div>
        <Link href="/seed-quality-assessment">
          <Button>New Assessment <ChevronRight className="w-4 h-4 ml-1" /></Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle className="text-lg">All Records</CardTitle>
              <CardDescription>View, search and manage your history.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search crops or quality..."
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
                    <TableHead>Images</TableHead>
                    <TableHead>Quality Score</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Germination</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell className="font-medium">
                        {new Date(assessment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="capitalize">{assessment.cropType}</TableCell>
                      <TableCell>
                        <div className="flex -space-x-2">
                          {assessment.images.slice(0, 3).map((img, i) => (
                            <img key={i} src={img} alt="Seed" className="w-8 h-8 rounded-full border-2 border-background object-cover bg-muted" />
                          ))}
                          {assessment.images.length > 3 && (
                            <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium z-10">
                              +{assessment.images.length - 3}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{assessment.qualityScore}%</span>
                          <QualityBadge quality={assessment.overallQuality} />
                        </div>
                      </TableCell>
                      <TableCell>{assessment.physicalCondition}</TableCell>
                      <TableCell>{assessment.germinationProbability}%</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost" size="icon"
                          className="text-primary hover:bg-primary/10 mr-2"
                          onClick={() => setSelectedReport(assessment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(assessment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No seed analyses found.</p>
              {searchTerm && <p className="text-sm mt-1">Try adjusting your search filters.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:w-full print:h-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0">
          {selectedReport && (
            <div className="space-y-6 printable-area">
              <div className="flex justify-between items-start border-b pb-4 print:border-b-2 print:border-black">
                <div>
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    {selectedReport.cropType} Seed Quality Report
                  </DialogTitle>
                  <p className="mt-2 text-muted-foreground">
                    Date: {new Date(selectedReport.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <QualityBadge quality={selectedReport.overallQuality} />
                  <Button className="bg-blue-600 hover:bg-blue-700 print:hidden" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" /> Download PDF
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap justify-around gap-6 mb-8 pb-8 border-b print:border-b-2 print:border-black">
                <ProgressCircle value={selectedReport.qualityScore} label="Quality Score" color="text-primary" />
                <ProgressCircle value={selectedReport.germinationProbability} label="Est. Germination" color="text-green-500" />
                <ProgressCircle value={selectedReport.confidence} label="AI Confidence" color="text-blue-500" />
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <h4 className="font-semibold text-lg flex items-center border-b pb-2">
                    <Activity className="w-5 h-5 mr-2 text-primary" /> Physical Assessment
                  </h4>
                  <div className="grid grid-cols-2 gap-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">Physical Condition</p>
                      <p className="font-medium">{selectedReport.physicalCondition}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">Seed Uniformity</p>
                      <p className="font-medium">{selectedReport.seedUniformity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">Yield Potential</p>
                      <Badge variant="outline" className={selectedReport.expectedYieldPotential === 'High' ? 'text-green-700 bg-green-50' : ''}>
                        {selectedReport.expectedYieldPotential}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="font-semibold text-lg flex items-center border-b pb-2">
                    <Leaf className="w-5 h-5 mr-2 text-green-600" /> Planting Guidelines
                  </h4>
                  <div className="grid grid-cols-1 gap-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center">
                        <Droplets className="w-4 h-4 mr-1 text-blue-500" /> Recommended Soil Type
                      </p>
                      <p className="font-medium">{selectedReport.recommendedSoilType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center">
                        <Info className="w-4 h-4 mr-1 text-amber-500" /> Planting Conditions
                      </p>
                      <p className="font-medium">{selectedReport.recommendedPlantingConditions}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8">
                <h4 className="font-bold text-primary mb-3 flex items-center">
                  <Star className="w-5 h-5 mr-2" /> AI Recommendation
                </h4>
                <p className="text-foreground/80 leading-relaxed text-base">
                  {selectedReport.recommendation}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-lg border-b pb-2 mb-4">Analyzed Images</h4>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {selectedReport.images.map((img, idx) => (
                    <div key={idx} className="shrink-0 relative w-32 h-32 md:w-48 md:h-48 rounded-lg border overflow-hidden">
                      <img src={img} alt={`Analyzed Seed ${idx+1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
