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
import { Loader2, Trash2, Search, Filter, History, ChevronRight } from "lucide-react";
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

export default function SeedAnalysisHistoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  
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
    </div>
  );
}
