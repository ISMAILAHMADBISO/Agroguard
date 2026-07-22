import { useState, useRef } from "react";
import { useAuth } from "@/context/auth";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apiErrorMessage } from "@/lib/api-error";
import { apiRequest, useGetFarmer } from "@workspace/api-client-react";
import { DiseaseForecast } from "@/types/disease-forecast";
import {
  CloudRain, Droplets, ThermometerSun, Leaf, Activity, ChevronRight, ChevronLeft, Calendar, Loader2, Printer, MapPin, History, Star, AlertTriangle, ShieldCheck
} from "lucide-react";
import { openPricingModal } from "@/components/pricing-modal";
import { Link } from "wouter";

const COMMON_CROPS = [
  "Maize", "Rice", "Tomato", "Pepper", "Beans", 
  "Groundnut", "Millet", "Sorghum", "Soybean", "Wheat", "Cassava", "Onion"
];

function RiskBadge({ risk }: { risk: string }) {
  switch (risk) {
    case "Low": return <Badge className="bg-green-600 hover:bg-green-700">{risk} Risk</Badge>;
    case "Moderate": return <Badge className="bg-amber-500 hover:bg-amber-600">{risk} Risk</Badge>;
    case "High": return <Badge className="bg-orange-600 hover:bg-orange-700">{risk} Risk</Badge>;
    case "Critical": return <Badge variant="destructive" className="animate-pulse">{risk} Risk</Badge>;
    default: return <Badge variant="outline">{risk} Risk</Badge>;
  }
}

export default function DiseaseForecastPage() {
  const [step, setStep] = useState(1);
  const [cropType, setCropType] = useState("");
  const [plantingDate, setPlantingDate] = useState("");
  const [growthStage, setGrowthStage] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [forecast, setForecast] = useState<DiseaseForecast | null>(null);
  
  const printRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: farmer } = useGetFarmer(user?.id ?? 0, { query: { enabled: user?.userType === "farmer" } });

  const remainingForecasts = farmer && farmer.subscriptionPlan === "free"
    ? Math.max(0, 5 - (farmer.aiDiseaseUsageCount ?? 0)) // Just reusing disease usage limit for now, backend uses custom limit or shared limit
    : null;

  const forecastMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/ai/disease-forecast", data) as Promise<DiseaseForecast>;
    }
  });

  const handleGenerate = () => {
    if (!cropType) {
      toast({ title: "Crop Type required", description: "Please enter the crop type.", variant: "destructive" });
      return;
    }
    
    setStep(3);
    forecastMutation.mutate({ 
      cropType, 
      plantingDate, 
      growthStage, 
      farmSize,
      farmerId: user?.userType === "farmer" ? user.id : undefined 
    }, {
      onSuccess: (data) => {
        setForecast(data);
        toast({ title: "Forecast generated successfully" });
      },
      onError: (err) => {
        const msg = apiErrorMessage(err, "Forecast generation failed. Please try again.");
        const isLimitHit = msg.includes("upgrade to AgroGuard Premium");
        toast({
          title: "Forecast Failed", description: msg, variant: "destructive",
          action: isLimitHit ? (
            <ToastAction altText="View Plans" onClick={openPricingModal} className="bg-amber-500 hover:bg-amber-600 text-white border-none mt-2 sm:mt-0">
              <Star className="h-4 w-4 mr-2" /> View Plans
            </ToastAction>
          ) : undefined,
        });
        setStep(2); // Go back to details step if failed
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const resetForm = () => {
    setStep(1);
    setCropType("");
    setPlantingDate("");
    setGrowthStage("");
    setFarmSize("");
    setForecast(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto printable-area">
      {/* Screen Header */}
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CloudRain className="h-6 w-6 text-blue-500" /> AI Disease Forecast
          </h2>
          <p className="text-muted-foreground">
            Predict crop disease likelihood using weather models and farm data before symptoms appear.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/disease-forecast-history">
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-1.5" /> Forecast History
            </Button>
          </Link>
          {remainingForecasts !== null && (
            <div className="bg-blue-500/10 border border-blue-200 text-blue-800 rounded-lg px-4 py-2 flex items-center gap-3 text-sm shrink-0">
              <div>
                <span className="font-bold">{remainingForecasts} of 5</span> free forecasts today
              </div>
              <Button size="sm" className="h-8 bg-amber-500 hover:bg-amber-600 text-white" onClick={openPricingModal}>
                <Star className="h-3.5 w-3.5 mr-1.5" /> Upgrade
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Wizard Steps indicator */}
      {!forecast && (
        <div className="print:hidden flex items-center justify-center my-8">
          <div className="flex items-center max-w-2xl w-full">
            <div className={`flex flex-col items-center w-1/3 relative z-10 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`}>1</div>
              <span className="text-xs font-medium mt-2">Crop Info</span>
            </div>
            <div className={`h-1 w-full -mx-8 relative z-0 transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex flex-col items-center w-1/3 relative z-10 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}>2</div>
              <span className="text-xs font-medium mt-2">Farm Details</span>
            </div>
            <div className={`h-1 w-full -mx-8 relative z-0 transition-colors ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex flex-col items-center w-1/3 relative z-10 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}>3</div>
              <span className="text-xs font-medium mt-2">Generate</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Crop Info */}
      {step === 1 && (
        <Card className="max-w-2xl mx-auto shadow-sm border-primary/20 print:hidden">
          <CardHeader>
            <CardTitle>What crop are you forecasting?</CardTitle>
            <CardDescription>Select the target crop for disease forecasting.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {COMMON_CROPS.map(crop => (
                <Button 
                  key={crop} 
                  variant={cropType === crop ? "default" : "outline"}
                  className={`h-12 ${cropType === crop ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  onClick={() => setCropType(crop)}
                >
                  {crop}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Other Crop</Label>
              <Input 
                placeholder="Type crop name..." 
                value={COMMON_CROPS.includes(cropType) ? "" : cropType}
                onChange={(e) => setCropType(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t bg-muted/20 p-4">
            <Button onClick={() => setStep(2)} disabled={!cropType.trim()}>
              Next Step <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Farm Details */}
      {step === 2 && (
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto print:hidden">
          <Card className="md:col-span-2 shadow-sm border-primary/20">
            <CardHeader>
              <CardTitle>Farm & Environmental Details</CardTitle>
              <CardDescription>Providing more details improves the accuracy of the disease forecast.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Planting Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="date"
                      className="pl-9"
                      value={plantingDate}
                      onChange={(e) => setPlantingDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Growth Stage (Optional)</Label>
                  <Input 
                    placeholder="e.g. Seedling, Vegetative, Flowering" 
                    value={growthStage}
                    onChange={(e) => setGrowthStage(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Farm Size (Optional)</Label>
                  <Input 
                    placeholder="e.g. 2 Hectares" 
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/20 p-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={handleGenerate}>
                Generate Forecast <CloudRain className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>

          {/* Environmental Insight Sidebar */}
          <Card className="bg-blue-50/50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-800 flex items-center text-lg">
                <Activity className="w-5 h-5 mr-2 text-blue-500" /> How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-blue-900/80">
              <p>AgroGuard's AI continuously monitors regional environmental conditions.</p>
              <div className="flex gap-3 items-center">
                <ThermometerSun className="w-5 h-5 shrink-0 text-blue-600" />
                <p><strong>Temperature:</strong> Fungal diseases thrive in specific heat ranges.</p>
              </div>
              <div className="flex gap-3 items-center">
                <Droplets className="w-5 h-5 shrink-0 text-blue-600" />
                <p><strong>Humidity & Rain:</strong> Excess moisture is a primary driver for blight and rust.</p>
              </div>
              <div className="flex gap-3 items-center">
                <MapPin className="w-5 h-5 shrink-0 text-blue-600" />
                <p><strong>Regional Data:</strong> The AI references historical disease outbreaks in nearby areas.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Loading & Forecast Results */}
      {step === 3 && (
        <div className="space-y-6" ref={printRef}>
          {forecastMutation.isPending && !forecast ? (
            <Card className="max-w-md mx-auto text-center p-12 shadow-md print:hidden">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                  <Loader2 className="h-16 w-16 animate-spin text-blue-600 relative z-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Analyzing Risk Factors...</h3>
                  <p className="text-muted-foreground text-sm">
                    Processing weather models and historical pathogen data for {cropType}.
                  </p>
                </div>
              </div>
            </Card>
          ) : forecast ? (
            <>
              {/* Report Actions */}
              <div className="flex justify-between items-center print:hidden">
                <h3 className="text-xl font-bold">Forecast Complete</h3>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={resetForm}>
                    New Forecast
                  </Button>
                  <Button className="bg-slate-800 hover:bg-slate-900" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" /> Download PDF
                  </Button>
                </div>
              </div>

              {/* Main Report Card */}
              <Card className={`shadow-md border-t-4 print:shadow-none print:border-none print:p-0 ${
                forecast.riskLevel === 'Critical' ? 'border-t-destructive' : 
                forecast.riskLevel === 'High' ? 'border-t-orange-500' :
                forecast.riskLevel === 'Moderate' ? 'border-t-amber-500' : 'border-t-green-500'
              }`}>
                <CardHeader className="border-b bg-muted/10 pb-6 print:bg-transparent print:border-b-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        {cropType} Disease Forecast
                      </CardTitle>
                      <CardDescription className="mt-2 text-base">
                        Early warning prediction for potential outbreaks.
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <RiskBadge risk={forecast.riskLevel} />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-8">
                  {/* Highlight Row */}
                  <div className="grid md:grid-cols-3 gap-6 mb-10 pb-10 border-b text-center">
                    <div>
                      <p className="text-sm text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Predicted Disease</p>
                      <p className="text-2xl font-bold text-foreground">{forecast.predictedDisease}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Probability</p>
                      <p className="text-3xl font-bold text-blue-600">{forecast.probability}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Timeline Window</p>
                      <p className="text-2xl font-bold text-foreground">{forecast.expectedTimeWindow}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-6">
                      <h4 className="font-semibold text-lg flex items-center border-b pb-2">
                        <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" /> Forecast Drivers
                      </h4>
                      <ul className="space-y-3">
                        {forecast.forecastDrivers.map((driver, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold mr-3 mt-0.5 shrink-0">{idx + 1}</span>
                            <span className="text-foreground/90">{driver}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="bg-muted/30 rounded-lg p-4 mt-4">
                        <p className="text-sm font-semibold mb-1 flex items-center"><CloudRain className="w-4 h-4 mr-2" /> Weather Summary</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{forecast.weatherSummary}</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="font-semibold text-lg flex items-center border-b pb-2">
                        <ShieldCheck className="w-5 h-5 mr-2 text-green-600" /> Recommended Preventive Actions
                      </h4>
                      <ul className="space-y-4">
                        {forecast.recommendedActions.map((action, idx) => (
                          <li key={idx} className="flex items-start bg-green-50/50 rounded-lg p-3 border border-green-100">
                            <Leaf className="w-5 h-5 text-green-600 mr-3 mt-0.5 shrink-0" />
                            <span className="text-foreground/90 font-medium">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 text-xs text-muted-foreground text-center border-t pt-4">
                    Disclaimer: This forecast is generated using AI analysis of simulated and historical environmental data. It is an early warning tool and should be used alongside regular manual farm inspections.
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
