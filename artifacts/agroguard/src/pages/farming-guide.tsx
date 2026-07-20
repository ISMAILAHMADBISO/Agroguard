import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@workspace/api-client-react";
import { useLanguage } from "@/context/language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Search, BookOpen, Sprout, FlaskConical, Droplets,
  Bug, Apple, Archive, Lightbulb, Microscope,
} from "lucide-react";

const CROP_ICONS: Record<string, string> = {
  rice: "🌾", maize: "🌽", tomato: "🍅", pepper: "🌶️",
  beans: "🫘", groundnut: "🥜", millet: "🌾", sorghum: "🌾",
};

const DEFAULT_CROPS = ["rice", "maize", "tomato", "pepper", "beans", "groundnut", "millet", "sorghum"];

interface FarmingGuide {
  id: number;
  crop: string;
  plantingGuide: string;
  fertilizerGuide: string;
  irrigation: string;
  diseases: string;
  pests: string;
  harvesting: string;
  storage: string;
  bestPractices: string;
}

function GuideSection({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
  if (!content || content.trim() === "-") return null;
  return (
    <div className="rounded-lg border bg-card p-4">
      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
        {icon}
        {title}
      </h4>
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}

function GuideDetail({ guide }: { guide: FarmingGuide }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("planting");

  const sections = [
    { key: "planting", label: t("guide.planting"), icon: <Sprout className="h-4 w-4 text-green-500" />, content: guide.plantingGuide },
    { key: "fertilizer", label: t("guide.fertilizer"), icon: <FlaskConical className="h-4 w-4 text-blue-500" />, content: guide.fertilizerGuide },
    { key: "irrigation", label: t("guide.irrigation"), icon: <Droplets className="h-4 w-4 text-blue-400" />, content: guide.irrigation },
    { key: "diseases", label: t("guide.diseases"), icon: <Microscope className="h-4 w-4 text-red-500" />, content: guide.diseases },
    { key: "pests", label: t("guide.pests"), icon: <Bug className="h-4 w-4 text-orange-500" />, content: guide.pests },
    { key: "harvesting", label: t("guide.harvesting"), icon: <Apple className="h-4 w-4 text-yellow-500" />, content: guide.harvesting },
    { key: "storage", label: t("guide.storage"), icon: <Archive className="h-4 w-4 text-purple-500" />, content: guide.storage },
    { key: "bestPractices", label: t("guide.best-practices"), icon: <Lightbulb className="h-4 w-4 text-amber-500" />, content: guide.bestPractices },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{CROP_ICONS[guide.crop.toLowerCase()] ?? "🌱"}</span>
        <div>
          <h3 className="text-xl font-bold capitalize">{guide.crop}</h3>
          <p className="text-sm text-muted-foreground">Complete cultivation guide</p>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {sections.map((s) => (
            <TabsTrigger key={s.key} value={s.key} className="text-xs">
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {sections.map((s) => (
          <TabsContent key={s.key} value={s.key} className="mt-4">
            <GuideSection icon={s.icon} title={s.label} content={s.content} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default function FarmingGuidePage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);

  const { data: guides = [], isLoading } = useQuery<FarmingGuide[]>({
    queryKey: ["farming-guides", search],
    queryFn: () => apiRequest("GET", `/api/farming-guides${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  });

  const { data: selectedGuide, isLoading: isLoadingDetail } = useQuery<FarmingGuide>({
    queryKey: ["farming-guide", selectedCrop],
    queryFn: () => apiRequest("GET", `/api/farming-guides/${selectedCrop}`),
    enabled: !!selectedCrop,
  });

  // Show crop list from DB or default list
  const cropList = guides.length > 0
    ? guides.map((g) => g.crop)
    : DEFAULT_CROPS.filter((c) => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> {t("guide.title")}
        </h2>
        <p className="text-muted-foreground">
          Detailed cultivation, disease, and best practice guides for major crops.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar crop list */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("guide.search")}
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-1">
              {cropList.map((crop) => (
                <button
                  key={crop}
                  onClick={() => setSelectedCrop(crop)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-colors ${
                    selectedCrop === crop
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="text-xl">{CROP_ICONS[crop.toLowerCase()] ?? "🌱"}</span>
                  <span className="font-medium capitalize">{crop}</span>
                </button>
              ))}
              {cropList.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">{t("no-data")}</p>
              )}
            </div>
          )}
        </div>

        {/* Guide detail */}
        <Card>
          <CardContent className="pt-6">
            {!selectedCrop ? (
              <div className="text-center py-20 text-muted-foreground">
                <BookOpen className="h-14 w-14 mx-auto mb-4 opacity-25" />
                <p className="font-medium">Select a crop from the list to view its complete guide.</p>
                <p className="text-sm mt-1">Guides include planting, diseases, pests, and best practices.</p>
              </div>
            ) : isLoadingDetail ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : selectedGuide ? (
              <GuideDetail guide={selectedGuide} />
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <p className="font-medium capitalize">{selectedCrop} guide</p>
                <p className="text-sm mt-2 max-w-md mx-auto">
                  Guide content for <span className="capitalize font-medium">{selectedCrop}</span> is not yet available.
                  Please check back later or contact your agronomist.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
