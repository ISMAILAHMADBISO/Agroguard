import { useListRecommendations, useApplyRecommendation, getListRecommendationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Droplets, Bug, Sprout, CloudRain, Sun, Check, Loader2, AlertTriangle } from "lucide-react";

export default function RecommendationsPage() {
  const { data: recommendations, isLoading } = useListRecommendations();
  const applyRecommendation = useApplyRecommendation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleApply = (id: number) => {
    applyRecommendation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRecommendationsQueryKey() });
          toast({ title: "Recommendation applied" });
        },
      }
    );
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'irrigation': return <Droplets className="h-5 w-5 text-blue-500" />;
      case 'pest': return <Bug className="h-5 w-5 text-red-500" />;
      case 'disease': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'climate': return <CloudRain className="h-5 w-5 text-slate-500" />;
      case 'fertilizer': return <Sprout className="h-5 w-5 text-green-500" />;
      default: return <Sun className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Recommendations</h2>
        <p className="text-muted-foreground">Actionable insights generated from field data.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : recommendations?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-card">No pending recommendations.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recommendations?.map((rec) => (
            <Card key={rec.id} className={rec.status === 'applied' ? 'opacity-60 bg-muted/50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="bg-primary/10 p-2 rounded-md">
                    {getIcon(rec.category)}
                  </div>
                  {rec.status === 'applied' ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700">Applied</Badge>
                  ) : (
                    <Badge variant={rec.priority === 'high' ? 'destructive' : 'default'} className={rec.priority === 'medium' ? 'bg-orange-500' : ''}>
                      {rec.priority} Priority
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-4">{rec.title}</CardTitle>
                <CardDescription className="capitalize font-medium text-primary/80">{rec.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80 leading-relaxed">{rec.description}</p>
                <div className="mt-4 text-xs text-muted-foreground">
                  Farmer ID: {rec.farmerId}
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                {rec.status !== 'applied' && (
                  <Button className="w-full" onClick={() => handleApply(rec.id)} disabled={applyRecommendation.isPending}>
                    <Check className="mr-2 h-4 w-4" /> Mark as Applied
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}