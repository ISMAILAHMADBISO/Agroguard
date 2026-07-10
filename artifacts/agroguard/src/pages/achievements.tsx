import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, MoreHorizontal, Loader2, Pencil, Trash } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const formSchema = z.object({
  slug: z.string().min(2, "Slug is required (e.g. some-event-2025)"),
  title: z.string().min(2, "Title is required"),
  excerpt: z.string().min(10, "Excerpt must be at least 10 chars"),
  content: z.string().min(10, "Content must be at least 10 chars (Use double newlines for paragraphs)"),
  category: z.string().min(2, "Category is required"),
  date: z.string().min(2, "Date is required (e.g. October, 2025)"),
  imageUrl: z.string().min(5, "Image URL/Base64 is required"),
});
type FormValues = z.infer<typeof formSchema>;

const ACH_QUERY_KEY = ["achievements"];

export default function AchievementsAdminPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: achievements, isLoading } = useQuery({
    queryKey: ACH_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/achievements");
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create achievement");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACH_QUERY_KEY });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Achievement added successfully" });
    },
    onError: (err: any) => toast({ title: "Failed to add achievement", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormValues }) => {
      const res = await fetch(`/api/achievements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update achievement");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACH_QUERY_KEY });
      setEditingItem(null);
      toast({ title: "Achievement updated successfully" });
    },
    onError: (err: any) => toast({ title: "Failed to update achievement", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/achievements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete achievement");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACH_QUERY_KEY });
      toast({ title: "Achievement removed" });
    },
    onError: (err: any) => toast({ title: "Failed to delete achievement", description: err.message, variant: "destructive" }),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { slug: "", title: "", excerpt: "", content: "", category: "", date: "", imageUrl: "" },
  });

  const editForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: FormValues) => {
    if (!editingItem) return;
    updateMutation.mutate({ id: editingItem.id, data });
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    editForm.reset({
      slug: item.slug, title: item.title, excerpt: item.excerpt,
      content: item.content, category: item.category, date: item.date, imageUrl: item.imageUrl,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to remove this achievement?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, formInstance: any, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        formInstance.setValue(fieldName, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Achievements Management</h2>
          <p className="text-muted-foreground">Manage achievements displayed on the landing page.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Achievement</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Achievement</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl><Input placeholder="Achievement Title" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (URL friendly)</FormLabel>
                      <FormControl><Input placeholder="achievement-2025" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl><Input placeholder="AgroGuard Achievement" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date/Year</FormLabel>
                      <FormControl><Input placeholder="October, 2025" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                
                <FormField control={form.control} name="excerpt" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excerpt (Short Description)</FormLabel>
                    <FormControl><Textarea placeholder="Short summary..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="content" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content (Paragraphs separated by blank lines)</FormLabel>
                    <FormControl><Textarea className="min-h-[150px]" placeholder="Full details..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image Upload</FormLabel>
                    <div className="flex gap-4 items-center">
                      <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, form, "imageUrl")} />
                    </div>
                    {field.value && <img src={field.value} alt="Preview" className="h-20 object-contain mt-2 rounded" />}
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Achievement
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : achievements?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No achievements found.</TableCell></TableRow>
            ) : (
              achievements?.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <img src={item.imageUrl} alt={item.title} className="w-16 h-12 object-cover rounded" />
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(item)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive focus:text-destructive">
                          <Trash className="mr-2 h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Achievement</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="slug" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date/Year</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <FormField control={editForm.control} name="excerpt" render={({ field }) => (
                <FormItem>
                  <FormLabel>Excerpt</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={editForm.control} name="content" render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={editForm.control} name="imageUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Image Upload</FormLabel>
                  <div className="flex gap-4 items-center">
                    <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, editForm, "imageUrl")} />
                  </div>
                  {field.value && <img src={field.value} alt="Preview" className="h-20 object-contain mt-2 rounded" />}
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
