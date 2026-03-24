import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { BarChart3, ChevronRight, Plus, Star } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddPerformanceReview,
  useGetAllEmployees,
  useGetPerformanceReviews,
  useIsAdmin,
} from "../hooks/useQueries";

function StarRating({
  rating,
  interactive = false,
  onChange,
}: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(s)}
          className={interactive ? "p-0.5" : ""}
        >
          <Star
            className={`${interactive ? "w-6 h-6" : "w-4 h-4"} ${
              s <= rating
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            } ${interactive ? "hover:text-amber-300 transition-colors" : ""}`}
          />
        </button>
      ))}
    </div>
  );
}

function EmployeeReviewCard({
  emp,
  onAddReview,
  isAdmin,
}: {
  emp: {
    id: bigint;
    name: string;
    position: string;
    department: string;
    isActive: boolean;
  };
  onAddReview: (empId: bigint, empName: string) => void;
  isAdmin: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: reviews, isLoading } = useGetPerformanceReviews(
    expanded ? emp.id : null,
  );

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
      : null;

  return (
    <Card className="shadow-card border-border">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-3 flex-1 text-left cursor-pointer"
            onClick={() => setExpanded((p) => !p)}
          >
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">
                {emp.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm">{emp.name}</p>
              <p className="text-xs text-muted-foreground">
                {emp.position} · {emp.department}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-3">
            {avgRating !== null && (
              <StarRating rating={Math.round(avgRating)} />
            )}
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddReview(emp.id, emp.name)}
                className="gap-1 text-xs"
                data-ocid="performance.review.open_modal_button"
              >
                <Plus className="w-3 h-3" /> Review
              </Button>
            )}
            <button type="button" onClick={() => setExpanded((p) => !p)}>
              <ChevronRight
                className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
              />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : !reviews || reviews.length === 0 ? (
              <p
                className="text-sm text-muted-foreground"
                data-ocid="performance.reviews.empty_state"
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
                    className="flex items-start justify-between p-2.5 rounded-lg bg-muted/30"
                  >
                    <div>
                      <StarRating rating={Number(review.rating)} />
                      {review.notes && (
                        <p className="text-xs text-foreground/70 mt-1">
                          {review.notes}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground ml-4 flex-shrink-0">
                      {new Date(
                        Number(review.reviewDate) / 1_000_000,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PerformancePage() {
  const { data: employees, isLoading } = useGetAllEmployees();
  const { data: isAdmin } = useIsAdmin();
  const addReview = useAddPerformanceReview();

  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    empId: bigint | null;
    empName: string;
  }>({ open: false, empId: null, empName: "" });
  const [reviewForm, setReviewForm] = useState({ rating: 3, notes: "" });

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewDialog.empId) return;
    try {
      await addReview.mutateAsync({
        employeeId: reviewDialog.empId,
        review: {
          rating: BigInt(reviewForm.rating),
          notes: reviewForm.notes,
          reviewDate: BigInt(Date.now()) * 1_000_000n,
        },
      });
      toast.success("Review added");
      setReviewDialog({ open: false, empId: null, empName: "" });
      setReviewForm({ rating: 3, notes: "" });
    } catch {
      toast.error("Failed to add review");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">
          Performance
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Employee performance reviews and ratings
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !employees || employees.length === 0 ? (
        <div
          className="py-16 text-center"
          data-ocid="performance.employees.empty_state"
        >
          <BarChart3 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No employees found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {employees.map((emp) => (
            <motion.div
              key={emp.id.toString()}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <EmployeeReviewCard
                emp={emp}
                isAdmin={!!isAdmin}
                onAddReview={(empId, empName) => {
                  setReviewDialog({ open: true, empId, empName });
                  setReviewForm({ rating: 3, notes: "" });
                }}
              />
            </motion.div>
          ))}
        </div>
      )}

      <Dialog
        open={reviewDialog.open}
        onOpenChange={(o) => setReviewDialog((p) => ({ ...p, open: o }))}
      >
        <DialogContent
          className="sm:max-w-md"
          data-ocid="performance.review.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              Review for {reviewDialog.empName}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddReview} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Rating</Label>
              <StarRating
                rating={reviewForm.rating}
                interactive
                onChange={(r) => setReviewForm((p) => ({ ...p, rating: r }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={reviewForm.notes}
                onChange={(e) =>
                  setReviewForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Performance notes..."
                rows={3}
                data-ocid="performance.review.textarea"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReviewDialog((p) => ({ ...p, open: false }))}
                data-ocid="performance.review.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addReview.isPending}
                data-ocid="performance.review.submit_button"
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
