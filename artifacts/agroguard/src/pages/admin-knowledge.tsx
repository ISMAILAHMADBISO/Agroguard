import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListKnowledge, useCreateKnowledge, useDeleteKnowledge } from "@workspace/api-client-react";
import { Trash2, Plus, Loader2 } from "lucide-react";

export default function AdminKnowledge() {
  const queryClient = useQueryClient();
  const { data: articles, isLoading } = useListKnowledge();
  const { mutate: createKnowledge, isPending: isCreating } = useCreateKnowledge();
  const { mutate: deleteKnowledge, isPending: isDeleting } = useDeleteKnowledge();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Best Practices");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    
    createKnowledge({ data: { title, category, content, videoUrl: videoUrl || undefined } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["knowledge"] });
        setTitle("");
        setContent("");
        setVideoUrl("");
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this article?")) {
      deleteKnowledge({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["knowledge"] });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Manage Knowledge Centre</h2>
        <p className="text-muted-foreground mt-0.5">
          Create and manage educational articles and videos.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Add New Article</CardTitle>
            <CardDescription>Publish a new guide or pest alert.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Treating Cassava Mosaic" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pest">Pest</SelectItem>
                    <SelectItem value="Disease">Disease</SelectItem>
                    <SelectItem value="Best Practices">Best Practices</SelectItem>
                    <SelectItem value="Guides">Guides</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} required placeholder="Article body..." rows={5} />
              </div>
              <div className="space-y-2">
                <Label>Video URL (Optional)</Label>
                <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." />
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Publish Article
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Published Articles</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : articles?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No articles published yet.
              </div>
            ) : (
              <div className="space-y-4">
                {articles?.map((article) => (
                  <div key={article.id} className="flex justify-between items-start p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{article.title}</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{article.category}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{article.content}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)} disabled={isDeleting} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
