import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Bug, Leaf, Lightbulb, PlayCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useListKnowledge } from "@workspace/api-client-react";
import type { KnowledgeArticle } from "@workspace/api-zod";

export default function KnowledgeCentre() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);

  const { data: articles, isLoading } = useListKnowledge();

  const categories = ["All", "Pest", "Disease", "Best Practices", "Guides"];

  const filteredArticles = (articles || []).filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(search.toLowerCase()) || article.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || article.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getIconForCategory = (category: string) => {
    switch (category) {
      case "Pest": return Bug;
      case "Disease": return Leaf;
      case "Best Practices": return Lightbulb;
      case "Guides": return PlayCircle;
      default: return BookOpen;
    }
  };



  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Knowledge Centre</h2>
        <p className="text-muted-foreground mt-0.5">
          Educational resources, farming guides, and best practices.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles, pests, or diseases..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No resources found</h3>
          <p className="text-muted-foreground">Try adjusting your search query or category filter.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredArticles.map((article) => {
            const Icon = getIconForCategory(article.category);
            return (
              <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer flex flex-col">
                <CardHeader className="pb-3 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {article.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
                  <CardDescription className="line-clamp-3 mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                    {article.content}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="ghost" className="w-full justify-start text-primary -ml-4" size="sm" onClick={() => setSelectedArticle(article)}>
                    {article.videoUrl ? "Watch Video →" : "Read Article →"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedArticle && (
        <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{selectedArticle.category}</Badge>
              </div>
              <DialogTitle className="text-2xl">{selectedArticle.title}</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              {selectedArticle.videoUrl && (
                <div className="aspect-video w-full rounded-md overflow-hidden bg-black/5">
                  <iframe 
                    src={selectedArticle.videoUrl.replace("watch?v=", "embed/")} 
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-muted-foreground">
                {selectedArticle.content}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
