import { useGetWeather, useGetAiSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bot, CloudRain, Sun, ThermometerSun, Leaf, ListTodo, AlertTriangle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function FarmerCommandCenter() {
  const { user } = useAuth();
  const { data: weather, isLoading: loadingWeather } = useGetWeather();
  const { data: aiSummary, isLoading: loadingSummary } = useGetAiSummary();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Farm Command Center</h2>
        <p className="text-muted-foreground mt-0.5">
          Your personalized, intelligent assistant for farm management.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* AI Summary Card */}
        <Card className="md:col-span-2 lg:col-span-3 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Bot className="h-5 w-5" />
              AI Farm Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <p className="text-lg leading-relaxed">{aiSummary?.summary || "Unable to generate summary at this time."}</p>
            )}
          </CardContent>
        </Card>

        {/* Farm Health Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              Overall Farm Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-green-600">{aiSummary?.farmHealthScore || 0}</span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">Based on current sensor data</p>
          </CardContent>
        </Card>

        {/* Weather Intelligence */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CloudRain className="h-4 w-4" />
              Weather Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingWeather ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {weather?.condition?.includes("Rain") ? <CloudRain className="h-6 w-6 text-blue-500" /> : <Sun className="h-6 w-6 text-orange-500" />}
                    <span className="text-2xl font-bold">{weather?.temperature}°C</span>
                  </div>
                  <span className="text-sm font-medium">{weather?.condition}</span>
                </div>
                <div className="text-xs font-medium text-primary bg-primary/10 p-2 rounded-md">
                  {weather?.recommendation}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks Due Today */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ListTodo className="h-4 w-4" />
              Tasks Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <div>
                <span className="text-4xl font-bold">{aiSummary?.tasksDueToday || 0}</span>
                <p className="text-xs text-muted-foreground mt-2">
                  {aiSummary?.tasksDueToday === 0 ? "You're all caught up!" : "Check your task manager to complete them."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
