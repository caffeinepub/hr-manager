import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Edit, Plus, Star, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useAddPerformanceReview,
  useDeleteEmployee,
  useGetAttendance,
  useGetEmployee,
  useGetPerformanceReviews,
  useIsAdmin,
  useUpdateEmployee,
} from "../hooks/useQueries";

function formatTime(ts: bigint | undefined) {
  if (!ts) return "—";
  return new Date(Number(ts) / 1_000_000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams({ from: "/employees/$id" });
  const navigate = useNavigate();
  const employeeId = BigInt(id);

  const { data: employee, isLoading } = useGetEmployee(employeeId);
  const { data: attendance } = useGetAttendance(employeeId);
  const { data: reviews } = useGetPerformanceReviews(employeeId);
  const { data: isAdmin } = useIsAdmin();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const addReview = useAddPerformanceReview();

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    position: "",
    department: "",
    email: "",
    isActive: true,
  });
  const [reviewForm, setReviewForm] = useState({ rating: 3, notes: "" });

  useEffect(() => {
    QRCode.toDataURL(id, { width: 200, margin: 2 }).then(setQrDataUrl);
  }, [id]);

  useEffect(() => {
    if (employee) {
      setEditForm({
        name: employee.name,
        position: employee.position,
        department: employee.department,
        email: employee.email,
        isActive: employee.isActive,
      });
    }
  }, [employee]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    try {
      await updateEmployee.mutateAsync({
        id: employeeId,
        employee: { ...employee, ...editForm },
      });
      toast.success("Employee updated");
      setEditOpen(false);
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEmployee.mutateAsync(employeeId);
      toast.success("Employee deleted");
      navigate({ to: "/employees" });
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addReview.mutateAsync({
        employeeId,
        review: {
          rating: BigInt(reviewForm.rating),
          notes: reviewForm.notes,
          reviewDate: BigInt(Date.now()) * 1_000_000n,
        },
      });
      toast.success("Review added");
      setReviewOpen(false);
      setReviewForm({ rating: 3, notes: "" });
    } catch {
      toast.error("Failed to add review");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Employee not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/employees" })}
          className="gap-2 mb-4 -ml-2 text-muted-foreground"
          data-ocid="employee_detail.back.button"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Employees
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">
                      {employee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h1 className="font-display text-xl font-bold text-foreground">
                      {employee.name}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      {employee.position} · {employee.department}
                    </p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {employee.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      employee.isActive
                        ? "bg-success/15 text-success border-success/30"
                        : "bg-destructive/15 text-destructive border-destructive/30"
                    }
                  >
                    {employee.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setEditOpen(true)}
                        data-ocid="employee_detail.edit_button"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeleteOpen(true)}
                        className="text-destructive hover:bg-destructive/10"
                        data-ocid="employee_detail.delete_button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Hire Date
                  </p>
                  <p className="text-sm font-medium">
                    {new Date(
                      Number(employee.hireDate) / 1_000_000,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Employee ID
                  </p>
                  <p className="text-sm font-medium font-mono">
                    #{id.padStart(4, "0")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">
                Attendance History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!attendance || attendance.length === 0 ? (
                <p
                  className="text-sm text-muted-foreground p-4"
                  data-ocid="employee_detail.attendance.empty_state"
                >
                  No attendance records yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance
                      .slice()
                      .reverse()
                      .slice(0, 20)
                      .map(([date, record]) => (
                        <TableRow
                          key={date}
                          className="odd:bg-card even:bg-muted/20"
                        >
                          <TableCell className="text-sm">{date}</TableCell>
                          <TableCell className="text-sm">
                            {formatTime(record.checkIn)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatTime(record.checkOut)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                record.checkIn
                                  ? record.checkOut
                                    ? "bg-success/15 text-success border-success/30 text-xs"
                                    : "bg-warning/15 text-warning border-warning/30 text-xs"
                                  : "bg-destructive/15 text-destructive border-destructive/30 text-xs"
                              }
                            >
                              {record.checkIn
                                ? record.checkOut
                                  ? "Complete"
                                  : "In Progress"
                                : "Absent"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Performance Reviews */}
          <Card className="shadow-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="font-display text-base">
                Performance Reviews
              </CardTitle>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReviewOpen(true)}
                  data-ocid="employee_detail.review.open_modal_button"
                  className="gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Review
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {!reviews || reviews.length === 0 ? (
                <p
                  className="text-sm text-muted-foreground"
                  data-ocid="employee_detail.reviews.empty_state"
                >
                  No reviews yet.
                </p>
              ) : (
                reviews
                  .slice()
                  .reverse()
                  .map((review, idx) => (
                    <div
                      key={`${Number(review.reviewDate)}-${idx}`}
                      className="p-3 rounded-lg bg-muted/30 border border-border"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <StarRating rating={Number(review.rating)} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(
                            Number(review.reviewDate) / 1_000_000,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      {review.notes && (
                        <p className="text-sm text-foreground/80">
                          {review.notes}
                        </p>
                      )}
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* QR Code */}
        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">
                Check-in QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {qrDataUrl ? (
                <>
                  <img
                    src={qrDataUrl}
                    alt="Employee QR Code"
                    className="w-48 h-48 rounded-lg border border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Scan to check in/out employee #{id.padStart(4, "0")}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {employee.name}
                  </p>
                </>
              ) : (
                <Skeleton className="w-48 h-48" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          className="sm:max-w-lg"
          data-ocid="employee_detail.edit.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Edit Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                  data-ocid="employee_detail.edit.name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, email: e.target.value }))
                  }
                  required
                  data-ocid="employee_detail.edit.email.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Input
                  value={editForm.position}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, position: e.target.value }))
                  }
                  required
                  data-ocid="employee_detail.edit.position.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input
                  value={editForm.department}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, department: e.target.value }))
                  }
                  required
                  data-ocid="employee_detail.edit.department.input"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={editForm.isActive}
                onCheckedChange={(v) =>
                  setEditForm((p) => ({ ...p, isActive: v }))
                }
                id="edit-active"
                data-ocid="employee_detail.edit.active.switch"
              />
              <Label htmlFor="edit-active">Active Employee</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                data-ocid="employee_detail.edit.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateEmployee.isPending}
                data-ocid="employee_detail.edit.save_button"
              >
                {updateEmployee.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent data-ocid="employee_detail.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {employee.name} from the system. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="employee_detail.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              data-ocid="employee_detail.delete.confirm_button"
            >
              Delete Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent
          className="sm:max-w-md"
          data-ocid="employee_detail.review.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              Add Performance Review
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddReview} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewForm((p) => ({ ...p, rating: s }))}
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        s <= reviewForm.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30 hover:text-amber-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={reviewForm.notes}
                onChange={(e) =>
                  setReviewForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Add review notes..."
                rows={3}
                data-ocid="employee_detail.review.textarea"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReviewOpen(false)}
                data-ocid="employee_detail.review.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addReview.isPending}
                data-ocid="employee_detail.review.submit_button"
              >
                {addReview.isPending ? "Saving..." : "Save Review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
