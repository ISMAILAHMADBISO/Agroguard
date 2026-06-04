import { useState } from "react";
import { useListStaff, useCreateStaff, useUpdateStaff, useDeleteStaff, getListStaffQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, MoreHorizontal, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["super_admin", "admin", "agronomist", "staff"]),
  department: z.string().optional(),
});

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Administrator" },
  { value: "agronomist", label: "Agronomist" },
  { value: "staff", label: "Staff" },
];

export default function StaffPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";
  // Non-admin staff may only create agronomist / staff accounts (no escalation).
  const roleOptions = isAdmin
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((o) => o.value === "agronomist" || o.value === "staff");
  const { data: staff, isLoading } = useListStaff();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; email: string; tempPassword: string } | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createStaff = useCreateStaff();
  const deleteStaff = useDeleteStaff();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "staff",
      department: "",
      phone: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createStaff.mutate(
      { data },
      {
        onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: getListStaffQueryKey() });
          setIsDialogOpen(false);
          form.reset();
          if (result?.tempPassword) {
            setCreatedCredentials({
              name: result.name,
              email: result.email,
              tempPassword: result.tempPassword,
            });
          } else {
            toast({ title: "Staff member added successfully" });
          }
        },
        onError: () => {
          toast({ title: "Failed to add staff member", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to remove this staff member?")) {
      deleteStaff.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListStaffQueryKey() });
            toast({ title: "Staff member removed" });
          },
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff Management</h2>
          <p className="text-muted-foreground">Manage your organization's team members.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Staff</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl><Input type="email" placeholder="jane@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roleOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl><Input placeholder="Operations" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createStaff.isPending}>
                    {createStaff.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Member
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
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : staff?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No staff members found.</TableCell></TableRow>
            ) : (
              staff?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {ROLE_OPTIONS.find((o) => o.value === member.role)?.label ?? member.role.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{member.department || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className={member.status === 'active' ? 'bg-primary' : ''}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDelete(member.id)} className="text-destructive">Remove</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!createdCredentials} onOpenChange={(open) => !open && setCreatedCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Staff Member Created</DialogTitle>
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
    </div>
  );
}
