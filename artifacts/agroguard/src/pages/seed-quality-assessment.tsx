import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { useLanguage } from "@/context/language";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apiErrorMessage } from "@/lib/api-error";
import { apiRequest, useGetFarmer } from "@workspace/api-client-react";
import { SeedAssessment } from "@/types/seed-assessment";
import {
  Upload, Loader2, Wheat, ChevronRight, ChevronLeft, Lightbulb, Camera, CheckCircle2,
  ImagePlus, X, Printer, Download, Star, History, Info, Leaf, Activity, Droplets
} from "lucide-react";
import { openPricingModal } from "@/components/pricing-modal";
import { Link, useLocation } from "wouter";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_DIM = 1280;
const JPEG_QUALITY = 0.82;

function downscaleImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Could not process image")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
    img.src = url;
  });
}

const COMMON_CROPS = [
  "Maize", "Rice", "Tomato", "Pepper", "Beans", 
  "Groundnut", "Millet", "Sorghum", "Soybean", "Wheat", "Cassava", "Onion"
];

function QualityBadge({ quality }: { quality: string }) {
  switch (quality) {
    case "Excellent": return <Badge className="bg-green-600 hover:bg-green-700">Excellent</Badge>;
    case "Good": return <Badge className="bg-blue-500 hover:bg-blue-600">Good</Badge>;
    case "Fair": return <Badge className="bg-amber-500 hover:bg-amber-600">Fair</Badge>;
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
          <circle
            cx="50" cy="50" r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30"
          />
          <circle
            cx="50" cy="50" r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-1000 ease-out ${color}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{value}%</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-center text-muted-foreground">{label}</span>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n} type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-125"
        >
          <Star className="h-6 w-6" fill={(hovered || value) >= n ? "rgb(234,179,8)" : "transparent"} stroke={(hovered || value) >= n ? "rgb(234,179,8)" : "currentColor"} />
        </button>
      ))}
    </div>
  );
}

export default function SeedQualityAssessmentPage() {
  const [step, setStep] = useState(1);
  const [cropType, setCropType] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [report, setReport] = useState<SeedAssessment | null>(null);
  
  const [ratingState, setRatingState] = useState<"idle" | "rating" | "submitted">("idle");
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  
  const fileRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: farmer } = useGetFarmer(user?.id ?? 0, { query: { enabled: user?.userType === "farmer" } });

  const remainingAssessments = farmer && farmer.subscriptionPlan === "free"
    ? Math.max(0, 5 - (farmer.aiSeedUsageCount ?? 0))
    : null;

  const analyzeMutation = useMutation({
    mutationFn: async (data: { cropType: string; imagesBase64: string[] }) => {
      return apiRequest("POST", "/api/ai/seed-assessment", data) as Promise<SeedAssessment>;
    }
  });

  const handleFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    if (images.length + files.length > 5) {
      toast({ title: "Too many images", description: "You can upload a maximum of 5 images.", variant: "destructive" });
      return;
    }
    
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_BYTES) {
        toast({ title: "Image too large", description: `File ${file.name} is over 10MB.`, variant: "destructive" });
        continue;
      }
      try {
        const dataUrl = await downscaleImage(file);
        newImages.push(dataUrl);
      } catch {
        toast({ title: "Could not process image", description: `File ${file.name} failed to process.`, variant: "destructive" });
      }
    }
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    if (images.length < 1) {
      toast({ title: "Images required", description: "Please upload at least 1 image of your seeds.", variant: "destructive" });
      return;
    }
    
    setStep(4);
    analyzeMutation.mutate({ cropType, imagesBase64: images }, {
      onSuccess: (data) => {
        setReport(data);
        toast({ title: "Analysis complete" });
      },
      onError: (err) => {
        const msg = apiErrorMessage(err, "Analysis failed. Please try again.");
        const isLimitHit = msg.includes("upgrade to AgroGuard Premium");
        toast({
          title: "Analysis Failed", description: msg, variant: "destructive",
          action: isLimitHit ? (
            <ToastAction altText="View Plans" onClick={openPricingModal} className="bg-amber-500 hover:bg-amber-600 text-white border-none mt-2 sm:mt-0">
              <Star className="h-4 w-4 mr-2" /> View Plans
            </ToastAction>
          ) : undefined,
        });
        setStep(2); // Go back to upload step if failed
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const submitRating = async () => {
    if (!rating || !report) return;
    setIsSubmittingRating(true);
    try {
      await apiRequest("PATCH", `/api/ai/seed-assessments/${report.id}/feedback`, { rating, feedback: ratingComment });
      toast({ title: "Rating submitted!", description: "Thank you for your feedback." });
      setRatingState("submitted");
    } catch {
      toast({ title: "Failed to submit rating", variant: "destructive" });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setCropType("");
    setImages([]);
    setReport(null);
    setRatingState("idle");
    setRating(0);
    setRatingComment("");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto printable-area">
      {/* Print-only Logo Header */}
      <div className="hidden print:flex items-center justify-between mb-8 border-b pb-4">
        <div className="flex items-center gap-4">
          <img src="/agroguard-logo.png" alt="AgroGuard Logo" className="h-16 w-16 object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-green-800">AgroGuard</h1>
            <p className="text-muted-foreground text-sm">AI Seed Quality Assessment Report</p>
          </div>
        </div>
        <div className="text-right text-sm">
          <p><strong>Farmer:</strong> {user?.name}</p>
          <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Screen Header */}
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wheat className="h-6 w-6 text-amber-600" /> AI Seed Quality Assessment
          </h2>
          <p className="text-muted-foreground">
            Upload photos of your seeds before planting for a predictive quality analysis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/seed-analysis-history">
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-1.5" /> History
            </Button>
          </Link>
          {remainingAssessments !== null && (
            <div className="bg-amber-500/10 border border-amber-200 text-amber-800 rounded-lg px-4 py-2 flex items-center gap-3 text-sm shrink-0">
              <div>
                <span className="font-bold">{remainingAssessments} of 5</span> free analyses today
              </div>
              <Button size="sm" className="h-8 bg-amber-500 hover:bg-amber-600 text-white" onClick={openPricingModal}>
                <Star className="h-3.5 w-3.5 mr-1.5" /> Upgrade
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Wizard Steps indicator */}
      {!report && (
        <div className="print:hidden flex items-center justify-center my-8">
          <div className="flex items-center max-w-2xl w-full">
            <div className={`flex flex-col items-center w-1/3 relative z-10 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`}>1</div>
              <span className="text-xs font-medium mt-2">Select Crop</span>
            </div>
            <div className={`h-1 w-full -mx-8 relative z-0 transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex flex-col items-center w-1/3 relative z-10 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}>2</div>
              <span className="text-xs font-medium mt-2">Upload Images</span>
            </div>
            <div className={`h-1 w-full -mx-8 relative z-0 transition-colors ${step >= 4 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex flex-col items-center w-1/3 relative z-10 ${step >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors ${step >= 4 ? 'bg-primary' : 'bg-muted'}`}>3</div>
              <span className="text-xs font-medium mt-2">Analyze</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Select Crop */}
      {step === 1 && (
        <Card className="max-w-2xl mx-auto shadow-sm border-primary/20 print:hidden">
          <CardHeader>
            <CardTitle>What seeds are you planting?</CardTitle>
            <CardDescription>Select the crop to help the AI calibrate its analysis.</CardDescription>
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

      {/* Step 2 & 3: Upload and Tips */}
      {step === 2 && (
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto print:hidden">
          <Card className="md:col-span-2 shadow-sm border-primary/20">
            <CardHeader>
              <CardTitle>Upload Seed Photos</CardTitle>
              <CardDescription>Upload 3 to 5 clear photos of your {cropType} seeds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${images.length < 5 ? 'hover:border-primary/50 hover:bg-muted/50 border-muted-foreground/30' : 'opacity-50 cursor-not-allowed bg-muted'}`}
                onClick={() => images.length < 5 && fileRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Camera className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Click to upload photos</p>
                    <p className="text-sm text-muted-foreground mt-1">Select up to 5 images (JPEG, PNG, WebP)</p>
                  </div>
                </div>
                <input
                  ref={fileRef} type="file" multiple accept="image/*" className="hidden"
                  onChange={(e) => handleFile(e.target.files)}
                />
              </div>

              {images.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center justify-between">
                    <span>Selected Images ({images.length}/5)</span>
                    {images.length >= 3 && <Badge className="bg-green-500">Ready to analyze</Badge>}
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg border overflow-hidden group">
                        <img src={img} alt={`Seed ${idx+1}`} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {images.length < 5 && (
                      <div 
                        className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        onClick={() => fileRef.current?.click()}
                      >
                        <ImagePlus className="w-6 h-6 mb-2" />
                        <span className="text-xs font-medium">Add More</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/20 p-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={handleAnalyze} disabled={images.length < 1}>
                Analyze Quality <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>

          {/* Tips Sidebar */}
          <Card className="bg-amber-50/50 border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-amber-800 flex items-center text-lg">
                <Lightbulb className="w-5 h-5 mr-2 text-amber-500" /> Tips for Best Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-amber-900/80">
              <div className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
                <p><strong>Use good lighting.</strong> Natural daylight is best. Avoid harsh shadows.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
                <p><strong>Use a plain background.</strong> Place seeds on a clean white paper or plain cloth.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
                <p><strong>Group them well.</strong> Place a handful of seeds close together, but not in a massive pile.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
                <p><strong>Avoid blurry images.</strong> Ensure your camera focuses clearly on the seed textures.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
                <p><strong>Capture multiple angles.</strong> Take a few photos from slightly different angles or different handfuls.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Analysis Loading & Results */}
      {step === 4 && (
        <div className="space-y-6" ref={printRef}>
          {analyzeMutation.isPending && !report ? (
            <Card className="max-w-md mx-auto text-center p-12 shadow-md print:hidden">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                  <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Analyzing Seed Quality...</h3>
                  <p className="text-muted-foreground text-sm">
                    Our AI is evaluating the physical condition, uniformity, and viability of your {cropType} seeds.
                  </p>
                </div>
              </div>
            </Card>
          ) : report ? (
            <>
              {/* Report Actions */}
              <div className="flex justify-between items-center print:hidden">
                <h3 className="text-xl font-bold">Analysis Complete</h3>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={resetForm}>
                    Assess Another Batch
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" /> Download PDF
                  </Button>
                </div>
              </div>

              {/* Main Report Card */}
              <Card className="shadow-md border-primary/20 print:shadow-none print:border-none print:p-0">
                <CardHeader className="border-b bg-muted/10 pb-6 print:bg-transparent print:border-b-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        {cropType} Seed Quality Report
                      </CardTitle>
                      <CardDescription className="mt-2 text-base">
                        AI prediction based on visible seed characteristics.
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <QualityBadge quality={report.overallQuality} />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-8">
                  {/* Progress Circles Row */}
                  <div className="flex flex-wrap justify-around gap-6 mb-10 pb-10 border-b">
                    <ProgressCircle 
                      value={report.qualityScore} 
                      label="Quality Score" 
                      color="text-primary" 
                    />
                    <ProgressCircle 
                      value={report.germinationProbability} 
                      label="Est. Germination" 
                      color="text-green-500" 
                    />
                    <ProgressCircle 
                      value={report.confidence} 
                      label="AI Confidence" 
                      color="text-blue-500" 
                    />
                  </div>

                  {/* Details Grid */}
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-6">
                      <h4 className="font-semibold text-lg flex items-center border-b pb-2">
                        <Activity className="w-5 h-5 mr-2 text-primary" /> Physical Assessment
                      </h4>
                      <div className="grid grid-cols-2 gap-y-6">
                        <div>
                          <p className="text-sm text-muted-foreground font-medium mb-1">Physical Condition</p>
                          <p className="font-medium">{report.physicalCondition}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground font-medium mb-1">Seed Uniformity</p>
                          <p className="font-medium">{report.seedUniformity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground font-medium mb-1">Yield Potential</p>
                          <Badge variant="outline" className={report.expectedYieldPotential === 'High' ? 'text-green-700 bg-green-50' : ''}>
                            {report.expectedYieldPotential}
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
                          <p className="font-medium">{report.recommendedSoilType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center">
                            <Info className="w-4 h-4 mr-1 text-amber-500" /> Planting Conditions
                          </p>
                          <p className="font-medium">{report.recommendedPlantingConditions}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Recommendation */}
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8">
                    <h4 className="font-bold text-primary mb-3 flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2" /> AI Recommendation
                    </h4>
                    <p className="text-foreground/80 leading-relaxed text-base">
                      {report.recommendation}
                    </p>
                  </div>
                  
                  {/* Uploaded Images Gallery */}
                  <div>
                    <h4 className="font-semibold text-lg border-b pb-2 mb-4">Analyzed Images</h4>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                      {report.images.map((img, idx) => (
                        <div key={idx} className="shrink-0 relative w-32 h-32 md:w-48 md:h-48 rounded-lg border overflow-hidden">
                          <img src={img} alt={`Analyzed Seed ${idx+1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-8 text-xs text-muted-foreground text-center border-t pt-4">
                    Disclaimer: This assessment is an AI prediction based purely on visible characteristics of the uploaded images. 
                    It is not a laboratory DNA or viability test. Always supplement with physical germination tests.
                  </div>
                </CardContent>
              </Card>

              {/* Feedback Section (Hidden in print) */}
              <div className="print:hidden rounded-xl border bg-card p-6 shadow-sm max-w-2xl mx-auto mt-8 text-center">
                <h4 className="font-semibold mb-2">Was this assessment helpful?</h4>
                <p className="text-sm text-muted-foreground mb-4">Your feedback helps improve our seed quality AI.</p>
                
                {ratingState === "idle" && (
                  <div className="flex justify-center">
                    <StarRating value={rating} onChange={(v) => { setRating(v); setRatingState("rating"); }} />
                  </div>
                )}
                
                {ratingState === "rating" && (
                  <div className="space-y-4 max-w-sm mx-auto">
                    <div className="flex justify-center">
                      <StarRating value={rating} onChange={setRating} />
                    </div>
                    <Textarea
                      placeholder="Optional comments about this analysis..."
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      className="text-sm"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={submitRating} disabled={isSubmittingRating}>
                        {isSubmittingRating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Feedback"}
                      </Button>
                      <Button variant="ghost" onClick={() => setRatingState("idle")}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                
                {ratingState === "submitted" && (
                  <div className="flex flex-col items-center justify-center text-green-600 gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} className={`w-5 h-5 ${n <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted"}`} />
                      ))}
                    </div>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Thank you for your feedback!
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
