import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Search, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAddEmployee, useGetAllEmployees } from "../hooks/useQueries";

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { data: employees, isLoading } = useGetAllEmployees();
  const addEmployee = useAddEmployee();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    position: "",
    department: "",
    email: "",
    isActive: true,
  });

  const filtered =
    employees?.filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.department.toLowerCase().includes(search.toLowerCase()) ||
        e.position.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addEmployee.mutateAsync({
        name: form.name.trim(),
        position: form.position.trim(),
        department: form.department.trim(),
        email: form.email.trim(),
        isActive: form.isActive,
        hireDate: BigInt(Date.now()) * 1_000_000n,
      });
      toast.success(`${form.name} added successfully`);
      setDialogOpen(false);
      setForm({
        name: "",
        position: "",
        department: "",
        email: "",
        isActive: true,
      });
    } catch {
      toast.error("Failed to add employee");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">
            Employees
          </h1>
          <p className="text-sm text-muted-foreground">
            {employees?.length ?? 0} total employees
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          data-ocid="employees.add.open_modal_button"
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Add Employee
        </Button>
      </motion.div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-ocid="employees.search_input"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="py-16 text-center"
              data-ocid="employees.table.empty_state"
            >
              <UserPlus className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">
                No employees found
              </p>
            </div>
          ) : (
            <Table data-ocid="employees.table">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp) => (
                  <TableRow
                    key={emp.id.toString()}
                    onClick={() =>
                      navigate({
                        to: "/employees/$id",
                        params: { id: emp.id.toString() },
                      })
                    }
                    className="cursor-pointer hover:bg-accent/50 transition-colors odd:bg-card even:bg-muted/20"
                    data-ocid="employees.table.item.1"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-primary">
                            {emp.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-sm">{emp.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {emp.position}
                    </TableCell>
                    <TableCell className="text-sm">{emp.department}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {emp.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          emp.isActive
                            ? "bg-success/15 text-success border-success/30 text-xs"
                            : "bg-destructive/15 text-destructive border-destructive/30 text-xs"
                        }
                      >
                        {emp.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" data-ocid="employees.add.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Add New Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="emp-name">Full Name *</Label>
                <Input
                  id="emp-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                  data-ocid="employees.add.name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emp-email">Email *</Label>
                <Input
                  id="emp-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  required
                  data-ocid="employees.add.email.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emp-position">Position *</Label>
                <Input
                  id="emp-position"
                  value={form.position}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, position: e.target.value }))
                  }
                  required
                  data-ocid="employees.add.position.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emp-department">Department *</Label>
                <Input
                  id="emp-department"
                  value={form.department}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, department: e.target.value }))
                  }
                  required
                  data-ocid="employees.add.department.input"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
                id="emp-active"
                data-ocid="employees.add.active.switch"
              />
              <Label htmlFor="emp-active">Active Employee</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="employees.add.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addEmployee.isPending}
                data-ocid="employees.add.submit_button"
              >
                {addEmployee.isPending ? "Adding..." : "Add Employee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
