import { useState } from "react";
import { Link } from "wouter";
import { useListFarmers, useCreateFarmer, useUpdateFarmer, useDeleteFarmer } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, Plus, MapPin, Phone, MoreHorizontal, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListFarmersQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email().or(z.literal("")),
  phone: z.string().min(10, "Phone is required"),
  location: z.string().min(2, "Location is required"),
  farmName: z.string().optional(),
  farmSizeHectares: z.coerce.number().optional(),
});

export default function FarmersPage() {
  const { data: farmers, isLoading } = useListFarmers();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createFarmer = useCreateFarmer();
  const deleteFarmer = useDeleteFarmer();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      location: "",
      farmName: "",
      farmSizeHectares: 0,
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createFarmer.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFarmersQueryKey() });
          setIsDialogOpen(false);
          form.reset();
          toast({ title: "Farmer created successfully" });
        },
        onError: () => {
          toast({ title: "Failed to create farmer", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this farmer?")) {
      deleteFarmer.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListFarmersQueryKey() });
            toast({ title: "Farmer deleted" });
          },
        }
      );
    }
  };

  const filteredFarmers = farmers?.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Farmers</h2>
          <p className="text-muted-foreground">Manage your network of smallholder farmers.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Farmer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Farmer</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input placeholder="+234..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl><Input placeholder="Kano State" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="farmName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Farm Name</FormLabel>
                        <FormControl><Input placeholder="Green Acres" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="farmSizeHectares"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size (Hectares)</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createFarmer.isPending}>
                    {createFarmer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Farmer
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search farmers..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Farmer</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Farm Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : filteredFarmers?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No farmers found.</TableCell></TableRow>
            ) : (
              filteredFarmers?.map((farmer) => (
                <TableRow key={farmer.id}>
                  <TableCell>
                    <div className="font-medium text-primary"><Link href={`/farmers/${farmer.id}`}>{farmer.name}</Link></div>
                    <div className="text-xs text-muted-foreground flex items-center mt-1">
                      <Phone className="h-3 w-3 mr-1" /> {farmer.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-3 w-3 mr-1 text-muted-foreground" /> {farmer.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{farmer.farmName || "Unnamed Farm"}</div>
                    <div className="text-xs text-muted-foreground">{farmer.farmSizeHectares} Hectares</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={farmer.status === 'active' ? 'default' : 'secondary'} className={farmer.status === 'active' ? 'bg-primary' : ''}>
                      {farmer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link href={`/farmers/${farmer.id}`}>View Profile</Link></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(farmer.id)} className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
