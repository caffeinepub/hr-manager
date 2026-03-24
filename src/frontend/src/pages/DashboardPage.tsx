import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, UserCheck, Users } from "lucide-react";
import { motion } from "motion/react";
import { useGetAllEmployees, useGetStats } from "../hooks/useQueries";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: employees, isLoading: empLoading } = useGetAllEmployees();

  const presentCount = Number(stats?.todaysAttendanceCount ?? 0n);
  const totalCount = Number(stats?.totalEmployees ?? 0n);
  const attendanceRate =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            title: "Total Employees",
            value: statsLoading ? null : totalCount,
            icon: Users,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            title: "Present Today",
            value: statsLoading ? null : presentCount,
            icon: UserCheck,
            color: "text-success",
            bg: "bg-success/10",
          },
          {
            title: "Attendance Rate",
            value: statsLoading ? null : `${attendanceRate}%`,
            icon: TrendingUp,
            color: "text-chart-3",
            bg: "bg-chart-3/10",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
          >
            <Card className="shadow-card border-border">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      {stat.title}
                    </p>
                    {stat.value === null ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-3xl font-bold text-foreground">
                        {stat.value}
                      </p>
                    )}
                  </div>
                  <div
                    className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}
                  >
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent employees */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            Employee Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {empLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : employees && employees.length > 0 ? (
            <div className="divide-y divide-border">
              {employees.slice(0, 8).map((emp) => (
                <div
                  key={emp.id.toString()}
                  className="flex items-center justify-between px-4 py-3 odd:bg-card even:bg-muted/30"
                  data-ocid="dashboard.employee.item.1"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {emp.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {emp.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {emp.position} · {emp.department}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={
                      emp.isActive
                        ? "bg-success/15 text-success border-success/30 text-xs"
                        : "bg-destructive/15 text-destructive border-destructive/30 text-xs"
                    }
                  >
                    {emp.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="py-12 text-center text-muted-foreground"
              data-ocid="dashboard.employees.empty_state"
            >
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No employees yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
