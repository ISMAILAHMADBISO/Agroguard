/**
 * Farmers management page.
 *
 * Features:
 *  - List farmers (RBAC-scoped: field officers see only their assignments)
 *  - Add farmer (admin/agronomist only)
 *  - Edit farmer — including assigning a field officer (admin only)
 *  - Delete farmer (admin only)
 *  - Search by name or location
 */
import { useState } from "react";
import { Link } from "wouter";
import {
  useListFarmers,
  useCreateFarmer,
  useUpdateFarmer,
  useDeleteFarmer,
  useResetFarmerPassword,
  useListStaff,
  getListFarmersQueryKey,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, Plus, MapPin, Phone, MoreHorizontal, Loader2, UserCheck, Pencil, KeyRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth";

// ── Form schemas ────────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Phone is required"),
  location: z.string().min(2, "Location is required"),
  farmName: z.string().optional(),
  farmSizeHectares: z.coerce.number().optional(),
  cropTypes: z.string().optional(),
  whatsappNumber: z.string().optional(),
});

const editSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  location: z.string().min(2),
  farmName: z.string().optional(),
  farmSizeHectares: z.coerce.number().optional(),
  cropTypes: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]),
  whatsappNumber: z.string().optional(),
  /** null = unassign; empty string = no change */
  fieldOfficerId: z.coerce.number().nullable().optional(),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

// ── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  inactive: "bg-gray-50 text-gray-600 border-gray-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

// ── Component ────────────────────────────────────────────────────────────────

export default function FarmersPage() {
  const { user } = useAuth();
  const { data: farmers, isLoading } = useListFarmers();
  const { data: staffList } = useListStaff();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; email: string; tempPassword: string } | null>(null);
  const [resetCredentials, setResetCredentials] = useState<{ name: string; email: string; tempPassword: string } | null>(null);
  const [editingFarmer, setEditingFarmer] = useState<NonNullable<typeof farmers>[number] | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isAdmin = user?.role === "super_admin" || user?.role === "admin";
  // All internal staff roles may manage farmers (create / edit / delete / reset password).
  const canWrite =
    isAdmin || user?.role === "agronomist" || user?.role === "staff";

  // Staff members available for field assignment (admin only feature)
  const fieldOfficers = staffList?.filter((s) => s.role === "staff" && s.status === "active") ?? [];

  // Mutations
  const createFarmer = useCreateFarmer();
  const updateFarmer = useUpdateFarmer();
  const deleteFarmer = useDeleteFarmer();
  const resetFarmerPassword = useResetFarmerPassword();

  // ── Create form ──────────────────────────────────────────────────────────
  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", email: "", phone: "", location: "", farmName: "", farmSizeHectares: 0, cropTypes: "", whatsappNumber: "" },
  });

  const onCreateSubmit = (data: CreateValues) => {
    createFarmer.mutate(
      { data },
      {
        onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: getListFarmersQueryKey() });
          setIsCreateOpen(false);
          createForm.reset();
          if (result?.tempPassword) {
            setCreatedCredentials({
              name: result.name,
              email: result.email,
              tempPassword: result.tempPassword,
            });
          }
          toast({ title: "Farmer created successfully" });
        },
        onError: () => toast({ title: "Failed to create farmer", variant: "destructive" }),
      }
    );
  };

  // ── Edit form ────────────────────────────────────────────────────────────
  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  const openEdit = (farmer: NonNullable<typeof farmers>[number]) => {
    setEditingFarmer(farmer);
    editForm.reset({
      name: farmer.name,
      phone: farmer.phone,
      location: farmer.location,
      farmName: farmer.farmName ?? "",
      farmSizeHectares: farmer.farmSizeHectares ?? 0,
      cropTypes: farmer.cropTypes ?? "",
      status: (farmer.status as EditValues["status"]) ?? "active",
      whatsappNumber: farmer.whatsappNumber ?? "",
      fieldOfficerId: farmer.fieldOfficerId ?? null,
    });
  };

  const onEditSubmit = (data: EditValues) => {
    if (!editingFarmer) return;
    updateFarmer.mutate(
      {
        id: editingFarmer.id,
        data: {
          ...data,
          fieldOfficerId: data.fieldOfficerId ?? null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFarmersQueryKey() });
          setEditingFarmer(null);
          toast({ title: "Farmer updated" });
        },
        onError: () => toast({ title: "Failed to update farmer", variant: "destructive" }),
      }
    );
  };

  // ── Reset password ─────────────────────────────────────────────────────────
  const handleReset = (farmer: NonNullable<typeof farmers>[number]) => {
    if (!confirm(`Reset password for ${farmer.name}? Their current password will stop working.`)) return;
    resetFarmerPassword.mutate(
      { id: farmer.id },
      {
        onSuccess: (result) => {
          if (result?.tempPassword) {
            setResetCredentials({ name: result.name, email: result.email, tempPassword: result.tempPassword });
          }
        },
        onError: () => toast({ title: "Failed to reset password", variant: "destructive" }),
      }
    );
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this farmer?")) return;
    deleteFarmer.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFarmersQueryKey() });
          toast({ title: "Farmer deleted" });
        },
        onError: () => toast({ title: "Failed to delete farmer", variant: "destructive" }),
      }
    );
  };

  const filteredFarmers = farmers?.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.location.toLowerCase().includes(search.toLowerCase())
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Farmers</h2>
          <p className="text-muted-foreground mt-0.5">Manage your network of smallholder farmers.</p>
        </div>

        {canWrite && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Farmer</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Register New Farmer</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField control={createForm.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="John Adeyemi" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={createForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={createForm.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input placeholder="+2348..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={createForm.control} name="location" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl><Input placeholder="Kano State" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={createForm.control} name="whatsappNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number</FormLabel>
                        <FormControl><Input placeholder="+2348..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={createForm.control} name="farmName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Farm Name</FormLabel>
                        <FormControl><Input placeholder="Green Acres" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={createForm.control} name="farmSizeHectares" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size (Ha)</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={createForm.control} name="cropTypes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crop Types</FormLabel>
                      <FormControl><Input placeholder="Maize, Tomatoes, Cowpea" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={createFarmer.isPending}>
                      {createFarmer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Farmer
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or location..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Farmer</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Farm Details</TableHead>
              <TableHead>Field Officer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading farmers...</TableCell></TableRow>
            ) : filteredFarmers?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No farmers found.</TableCell></TableRow>
            ) : (
              filteredFarmers?.map((farmer) => {
                const assignedOfficer = staffList?.find((s) => s.id === farmer.fieldOfficerId);
                return (
                  <TableRow key={farmer.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-medium">
                        <Link href={`/farmers/${farmer.id}`} className="text-primary hover:underline">
                          {farmer.name}
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                        <Phone className="h-3 w-3 mr-1" /> {farmer.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-3 w-3 mr-1 text-muted-foreground shrink-0" />
                        {farmer.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{farmer.farmName || "Unnamed Farm"}</div>
                      <div className="text-xs text-muted-foreground">
                        {farmer.farmSizeHectares ? `${farmer.farmSizeHectares} Ha` : "—"}
                        {farmer.cropTypes ? ` · ${farmer.cropTypes}` : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignedOfficer ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{assignedOfficer.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[farmer.status] ?? ""}>
                        {farmer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/farmers/${farmer.id}`}>View Profile</Link>
                          </DropdownMenuItem>
                          {canWrite && (
                            <DropdownMenuItem onClick={() => openEdit(farmer)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                            </DropdownMenuItem>
                          )}
                          {canWrite && (
                            <DropdownMenuItem onClick={() => handleReset(farmer)}>
                              <KeyRound className="mr-2 h-3.5 w-3.5" /> Reset Password
                            </DropdownMenuItem>
                          )}
                          {canWrite && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(farmer.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit farmer dialog */}
      <Dialog open={!!editingFarmer} onOpenChange={(open) => { if (!open) setEditingFarmer(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Farmer — {editingFarmer?.name}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField control={editForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="farmName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Farm Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="farmSizeHectares" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size (Ha)</FormLabel>
                    <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="whatsappNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl><Input placeholder="+2348..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Field officer assignment — admin only */}
              {isAdmin && (
                <FormField
                  control={editForm.control}
                  name="fieldOfficerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-primary" />
                        Assigned Field Officer
                      </FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "none" ? null : Number(val))}
                        value={field.value != null ? String(field.value) : "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="No field officer assigned" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground">Unassigned</span>
                          </SelectItem>
                          {fieldOfficers.map((fo) => (
                            <SelectItem key={fo.id} value={String(fo.id)}>
                              {fo.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        The assigned officer can view this farmer and their devices.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingFarmer(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateFarmer.isPending}>
                  {updateFarmer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!createdCredentials} onOpenChange={(open) => !open && setCreatedCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Farmer Account Created</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share these credentials with {createdCredentials?.name}. The temporary password is shown
              only once and must be changed on first sign-in.
            </p>
            <div className="rounded-md border bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium break-all">{createdCredentials?.email}</span>
              </div>
              <div className="flex justify-between gap-4 border-t pt-2">
                <span className="text-muted-foreground">Temporary Password</span>
                <span className="font-mono font-semibold">{createdCredentials?.tempPassword}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (createdCredentials) {
                    navigator.clipboard?.writeText(
                      `Email: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.tempPassword}`
                    );
                    toast({ title: "Credentials copied to clipboard" });
                  }
                }}
              >
                Copy
              </Button>
              <Button onClick={() => setCreatedCredentials(null)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset password result dialog */}
      <Dialog open={!!resetCredentials} onOpenChange={(open) => !open && setResetCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this new password with {resetCredentials?.name}. It is shown only once and must be
              changed on next sign-in.
            </p>
            <div className="rounded-md border bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium break-all">{resetCredentials?.email}</span>
              </div>
              <div className="flex justify-between gap-4 border-t pt-2">
                <span className="text-muted-foreground">New Password</span>
                <span className="font-mono font-semibold">{resetCredentials?.tempPassword}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (resetCredentials) {
                    navigator.clipboard?.writeText(
                      `Email: ${resetCredentials.email}\nNew Password: ${resetCredentials.tempPassword}`
                    );
                    toast({ title: "Credentials copied to clipboard" });
                  }
                }}
              >
                Copy
              </Button>
              <Button onClick={() => setResetCredentials(null)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
