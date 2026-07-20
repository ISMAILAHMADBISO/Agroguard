import { useRef, useState } from "react";
import {
  useDetectDisease,
  useListDiseaseReports,
  useDeleteDiseaseReport,
  getListDiseaseReportsQueryKey,
  useGetFarmer,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/auth";
import { useLanguage } from "@/context/language";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apiErrorMessage } from "@/lib/api-error";
import { apiRequest } from "@workspace/api-client-react";
import {
  Upload, Loader2, Leaf, ScanLine, ShieldAlert, Stethoscope, Star,
  Trash2, CheckCircle2, XCircle, Clock, Shield, AlertTriangle, Zap,
  ThumbsUp, ThumbsDown, History,
} from "lucide-react";
import { openPricingModal } from "@/components/pricing-modal";
import { Link } from "wouter";

const MAX_BYTES = 20 * 1024 * 1024;
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

function SeverityBadge({ severity }: { severity: string }) {
  switch (severity) {
    case "critical":
      return <Badge className="bg-red-700 hover:bg-red-700/90 text-white">Critical</Badge>;
    case "high":
      return <Badge variant="destructive">High</Badge>;
    case "medium":
      return <Badge className="bg-orange-500 hover:bg-orange-500/90 text-white">Medium</Badge>;
    default:
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Low</Badge>;
  }
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "critical") return <Zap className="h-4 w-4 text-red-700" />;
  if (severity === "high") return <AlertTriangle className="h-4 w-4 text-red-500" />;
  if (severity === "medium") return <AlertTriangle className="h-4 w-4 text-orange-500" />;
  return <CheckCircle2 className="h-4 w-4 text-green-600" />;
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-125"
          aria-label={`Rate ${n} stars`}
        >
          <Star
            className="h-6 w-6"
            fill={(hovered || value) >= n ? "rgb(234,179,8)" : "transparent"}
            stroke={(hovered || value) >= n ? "rgb(234,179,8)" : "currentColor"}
          />
        </button>
      ))}
    </div>
  );
}

function DiagnosisResultCard({ report, onRefresh }: { report: any; onRefresh: () => void }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [feedbackState, setFeedbackState] = useState<"idle" | "no-comment" | "submitted">(
    report.treatmentFeedback != null ? "submitted" : "idle"
  );
  const [feedbackComment, setFeedbackComment] = useState("");
  const [ratingState, setRatingState] = useState<"idle" | "rating" | "submitted">(
    report.aiAccuracyRating != null ? "submitted" : "idle"
  );
  const [rating, setRating] = useState(report.aiAccuracyRating ?? 0);
  const [ratingComment, setRatingComment] = useState(report.aiAccuracyComment ?? "");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const submitFeedback = async (solved: boolean) => {
    if (!solved) { setFeedbackState("no-comment"); return; }
    setIsSubmittingFeedback(true);
    try {
      await apiRequest("PATCH", `/api/ai/disease-reports/${report.id}/feedback`, { solved: true });
      toast({ title: "Feedback saved!", description: "Thank you for letting us know." });
      setFeedbackState("submitted");
      onRefresh();
    } catch {
      toast({ title: "Failed to save feedback", variant: "destructive" });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const submitNegativeFeedback = async () => {
    setIsSubmittingFeedback(true);
    try {
      await apiRequest("PATCH", `/api/ai/disease-reports/${report.id}/feedback`, { solved: false, comment: feedbackComment });
      toast({ title: "Feedback saved!", description: "Thank you for the details." });
      setFeedbackState("submitted");
      onRefresh();
    } catch {
      toast({ title: "Failed to save feedback", variant: "destructive" });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const submitRating = async () => {
    if (!rating) { toast({ title: "Please select a star rating", variant: "destructive" }); return; }
    setIsSubmittingRating(true);
    try {
      await apiRequest("PATCH", `/api/ai/disease-reports/${report.id}/accuracy`, { rating, comment: ratingComment });
      toast({ title: "Rating submitted!", description: "Thank you for improving our AI." });
      setRatingState("submitted");
      onRefresh();
    } catch {
      toast({ title: "Failed to submit rating", variant: "destructive" });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{report.diagnosis}</h3>
          {report.cropType && <p className="text-sm text-muted-foreground capitalize">{report.cropType}</p>}
        </div>
        <SeverityBadge severity={report.severity} />
      </div>

      {/* Confidence bar */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground shrink-0">{t("diagnosis.confidence")}</span>
        <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${report.confidence}%` }} />
        </div>
        <span className="font-semibold">{report.confidence}%</span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
            <SeverityIcon severity={report.severity} />
            {t("diagnosis.severity")}
          </p>
          <p className="text-sm font-semibold capitalize">{t(`diagnosis.severity.${report.severity}`)}</p>
        </div>
        {report.recoveryTime && (
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
              <Clock className="h-4 w-4 text-blue-500" />
              {t("diagnosis.recovery")}
            </p>
            <p className="text-sm font-semibold">{report.recoveryTime}</p>
          </div>
        )}
      </div>

      {/* Summary */}
      {report.summary && (
        <p className="text-sm text-foreground/80 leading-relaxed">{report.summary}</p>
      )}

      {/* Treatment */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-primary" /> {t("diagnosis.recommended-action")}
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{report.treatment}</p>
      </div>

      {/* Prevention tips */}
      {report.preventionTips && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-green-800 mb-1.5">
            <Shield className="h-3.5 w-3.5 text-green-600" /> {t("diagnosis.prevention")}
          </p>
          <p className="text-sm text-green-800/80 leading-relaxed">{report.preventionTips}</p>
        </div>
      )}

      {/* Treatment Feedback */}
      <div className="rounded-lg border p-3 bg-card">
        {feedbackState === "idle" && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("feedback.title")}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-green-500 text-green-700 hover:bg-green-50"
                onClick={() => submitFeedback(true)}
                disabled={isSubmittingFeedback}
              >
                <ThumbsUp className="h-4 w-4 mr-1.5" /> {t("feedback.yes")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-red-400 text-red-600 hover:bg-red-50"
                onClick={() => submitFeedback(false)}
              >
                <ThumbsDown className="h-4 w-4 mr-1.5" /> {t("feedback.no")}
              </Button>
            </div>
          </div>
        )}
        {feedbackState === "no-comment" && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("feedback.whathappened")}</p>
            <Textarea
              placeholder={t("feedback.comment-placeholder")}
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              className="text-sm"
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={submitNegativeFeedback} disabled={isSubmittingFeedback}>
                {isSubmittingFeedback ? <Loader2 className="h-4 w-4 animate-spin" /> : t("feedback.submit")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setFeedbackState("idle")}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        )}
        {feedbackState === "submitted" && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-500" /> Feedback submitted. Thank you!
          </p>
        )}
      </div>

      {/* AI Accuracy Rating */}
      <div className="rounded-lg border p-3 bg-card">
        {ratingState === "idle" && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("rating.title")}</p>
            <StarRating value={rating} onChange={(v) => { setRating(v); setRatingState("rating"); }} />
          </div>
        )}
        {ratingState === "rating" && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("rating.title")}</p>
            <StarRating value={rating} onChange={setRating} />
            <Textarea
              placeholder={t("rating.comment-placeholder")}
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              className="text-sm"
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={submitRating} disabled={isSubmittingRating}>
                {isSubmittingRating ? <Loader2 className="h-4 w-4 animate-spin" /> : t("rating.submit")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRatingState("idle")}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        )}
        {ratingState === "submitted" && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            Rating submitted ({report.aiAccuracyRating ?? rating}/5). Thank you!
          </p>
        )}
      </div>
    </div>
  );
}

export default function CropDiagnosisPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [cropType, setCropType] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const detect = useDetectDisease();
  const { data: reports, isLoading, refetch } = useListDiseaseReports();
  const deleteMutation = useDeleteDiseaseReport();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: farmer } = useGetFarmer(user?.id ?? 0, { query: { enabled: user?.userType === "farmer" } });

  const remainingDetections = farmer && farmer.subscriptionPlan === "free"
    ? Math.max(0, 5 - (farmer.aiDiseaseUsageCount ?? 0))
    : null;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please choose an image file", variant: "destructive" }); return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: "Image too large", description: "Please use an image under 20MB.", variant: "destructive" }); return;
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
          setPreview(null); setImageBase64(null); setCropType("");
          if (fileRef.current) fileRef.current.value = "";
        },
        onError: (err) => {
          const msg = apiErrorMessage(err, "Diagnosis failed. Please try again.");
          const isLimitHit = msg.includes("upgrade to AgroGuard Premium");
          toast({
            title: "Analysis Failed", description: msg, variant: "destructive",
            action: isLimitHit ? (
              <ToastAction altText="View Plans" onClick={openPricingModal} className="bg-amber-500 hover:bg-amber-600 text-white border-none mt-2 sm:mt-0">
                <Star className="h-4 w-4 mr-2" /> View Plans
              </ToastAction>
            ) : undefined,
          });
        },
      },
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this diagnosis?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Successfully deleted diagnosis" });
          queryClient.invalidateQueries({ queryKey: getListDiseaseReportsQueryKey() });
        },
      });
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
        <div className="flex items-center gap-3">
          <Link href="/analysis-history">
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-1.5" /> {t("analysis-history")}
            </Button>
          </Link>
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
                  <p className="text-sm text-muted-foreground">Click to upload or drag and drop a crop photo</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
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
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analysing...</>
              ) : (
                <><Stethoscope className="mr-2 h-4 w-4" /> Diagnose crop</>
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
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 shrink-0 h-8 w-8 -mt-1"
                onClick={() => handleDelete(latest.id)}
              >
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
              <DiagnosisResultCard
                report={latest}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: getListDiseaseReportsQueryKey() })}
              />
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Diagnosis history</h3>
          <Link href="/analysis-history">
            <Button variant="ghost" size="sm" className="text-primary">View full history →</Button>
          </Link>
        </div>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : reports && reports.length > 1 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.slice(1, 7).map((r) => (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{r.diagnosis}</CardTitle>
                      {r.cropType && <CardDescription className="capitalize mt-1">{r.cropType}</CardDescription>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <SeverityBadge severity={r.severity} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">{r.summary}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Confidence: {r.confidence}%</span>
                    {r.status && (
                      <Badge variant="outline" className={
                        r.status === "solved" ? "border-green-400 text-green-700 bg-green-50" :
                        r.status === "in_progress" ? "border-blue-400 text-blue-700 bg-blue-50" :
                        "border-muted text-muted-foreground"
                      }>
                        {r.status === "solved" ? "Solved" : r.status === "in_progress" ? "In Progress" : "Untreated"}
                      </Badge>
                    )}
                  </div>
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
