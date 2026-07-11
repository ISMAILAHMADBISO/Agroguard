import { useRef, useState } from "react";
import {
  useDetectDisease,
  useListDiseaseReports,
  useDeleteDiseaseReport,
  getListDiseaseReportsQueryKey,
  useGetFarmer,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apiErrorMessage } from "@/lib/api-error";
import { Upload, Loader2, Leaf, ScanLine, ShieldAlert, Stethoscope, Star, Trash2 } from "lucide-react";
import { openPricingModal } from "@/components/pricing-modal";

// Accept large originals; we downscale before upload so the request stays small.
const MAX_BYTES = 20 * 1024 * 1024;
// Longest edge after downscaling — keeps the base64 payload well under Vercel's
// ~4.5MB request-body limit while preserving enough detail for diagnosis.
const MAX_IMAGE_DIM = 1280;
const JPEG_QUALITY = 0.82;

/**
 * Downscale an image file in the browser and return a JPEG data URL.
 * Large phone photos (often >5MB) would otherwise exceed the serverless body
 * limit, so we resize the longest edge to MAX_IMAGE_DIM and re-encode as JPEG.
 */
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
      if (!ctx) {
        reject(new Error("Could not process image"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

function severityBadge(severity: string) {
  switch (severity) {
    case "high":
      return <Badge variant="destructive">High severity</Badge>;
    case "medium":
      return <Badge className="bg-orange-500 hover:bg-orange-500/90">Medium severity</Badge>;
    default:
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Low severity</Badge>;
  }
}

export default function CropDiagnosisPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [cropType, setCropType] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const detect = useDetectDisease();
  const { data: reports, isLoading } = useListDiseaseReports();
  const deleteMutation = useDeleteDiseaseReport();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: farmer } = useGetFarmer(user?.id ?? 0, { query: { enabled: user?.userType === "farmer" } });
  
  const remainingDetections = farmer && farmer.subscriptionPlan === "free" ? Math.max(0, 5 - (farmer.aiDiseaseUsageCount ?? 0)) : null;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please choose an image file", variant: "destructive" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: "Image too large", description: "Please use an image under 20MB.", variant: "destructive" });
      return;
    }
    try {
      const dataUrl = await downscaleImage(file);
      setPreview(dataUrl);
      setImageBase64(dataUrl);
    } catch {
      toast({ title: "Could not process image", description: "Please try a different photo.", variant: "destructive" });
    }
  };

  const handleAnalyze = () => {
    if (!imageBase64) return;
    detect.mutate(
      { data: { imageBase64, cropType: cropType.trim() || null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDiseaseReportsQueryKey() });
          toast({ title: "Analysis complete" });
          setPreview(null);
          setImageBase64(null);
          setCropType("");
          if (fileRef.current) fileRef.current.value = "";
        },
        onError: (err) => {
          const msg = apiErrorMessage(err, "Diagnosis failed. Please try again.");
          const isLimitHit = msg.includes("upgrade to AgroGuard Premium");
          toast({
            title: "Analysis Failed",
            description: msg,
            variant: "destructive",
            action: isLimitHit ? (
              <ToastAction 
                altText="View Plans" 
                onClick={openPricingModal}
                className="bg-amber-500 hover:bg-amber-600 text-white border-none mt-2 sm:mt-0"
              >
                <Star className="h-4 w-4 mr-2" /> View Plans
              </ToastAction>
            ) : undefined
          });
        },
      },
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this diagnosis?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Successfully deleted diagnosis" });
            alert("Successfully deleted diagnosis");
            queryClient.invalidateQueries({ queryKey: getListDiseaseReportsQueryKey() });
          }
        }
      );
    }
  };

  const latest = reports?.[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Crop Disease Detection</h2>
          <p className="text-muted-foreground">
            Upload a clear photo of a crop leaf or plant and get an instant AI diagnosis with treatment guidance.
          </p>
        </div>
        {remainingDetections !== null && (
          <div className="bg-amber-500/10 border border-amber-200 text-amber-800 rounded-lg px-4 py-2 flex items-center gap-3 text-sm shrink-0">
            <div>
              <span className="font-bold">{remainingDetections} of 5</span> free scans remaining today
            </div>
            <Button size="sm" className="h-8 bg-amber-500 hover:bg-amber-600 text-white" onClick={openPricingModal}>
              <Star className="h-3.5 w-3.5 mr-1.5" /> Upgrade
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-primary" /> Analyse a photo
            </CardTitle>
            <CardDescription>JPEG, PNG or WebP, up to 8MB.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
            >
              {preview ? (
                <img src={preview} alt="Selected crop" className="max-h-56 rounded-md object-contain" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop a crop photo
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            <div className="space-y-1.5">
              <Label htmlFor="cropType">Crop type (optional)</Label>
              <Input
                id="cropType"
                placeholder="e.g. maize, tomato, cassava"
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={handleAnalyze} disabled={!imageBase64 || detect.isPending}>
              {detect.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analysing...
                </>
              ) : (
                <>
                  <Stethoscope className="mr-2 h-4 w-4" /> Diagnose crop
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Latest result card */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" /> Latest diagnosis
              </CardTitle>
              <CardDescription className="mt-1">The most recent analysis result.</CardDescription>
            </div>
            {latest && !detect.isPending && (
              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 shrink-0 h-8 w-8 -mt-1" onClick={() => handleDelete(latest.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {detect.isPending ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : latest ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{latest.diagnosis}</h3>
                    {latest.cropType && (
                      <p className="text-sm text-muted-foreground capitalize">{latest.cropType}</p>
                    )}
                  </div>
                  {severityBadge(latest.severity)}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Confidence</span>
                  <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${latest.confidence}%` }} />
                  </div>
                  <span className="font-medium">{latest.confidence}%</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{latest.summary}</p>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-primary" /> Recommended treatment
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{latest.treatment}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No diagnoses yet. Upload a photo to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Diagnosis history</h3>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : reports && reports.length > 1 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.slice(1).map((r) => (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{r.diagnosis}</CardTitle>
                      {r.cropType && (
                        <CardDescription className="capitalize mt-1">{r.cropType}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {severityBadge(r.severity)}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">{r.summary}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Confidence: {r.confidence}%</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg bg-card">
            Past diagnoses will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
