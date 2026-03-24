import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { T__2 } from "../backend";
import { useActor } from "../hooks/useActor";
import { useGetAllEmployees } from "../hooks/useQueries";

function formatTime(ts: bigint | undefined) {
  if (!ts) return "—";
  return new Date(Number(ts) / 1_000_000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AttendanceRow({
  emp,
  date,
  idx,
}: {
  emp: { name: string; id: bigint; department: string };
  date: string;
  idx: number;
}) {
  const { actor, isFetching } = useActor();
  const { data: attendance, isLoading } = useQuery({
    queryKey: ["attendance", emp.id.toString()],
    queryFn: async (): Promise<Array<[string, T__2]>> => {
      if (!actor) return [];
      return actor.getAttendance(emp.id);
    },
    enabled: !!actor && !isFetching,
  });

  const todayRecord = attendance?.find(([d]) => d === date);
  const record = todayRecord ? todayRecord[1] : null;

  return (
    <TableRow
      className={idx % 2 === 0 ? "bg-card" : "bg-muted/20"}
      data-ocid={`attendance.table.item.${idx + 1}`}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-primary">
              {emp.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium">{emp.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {emp.department}
      </TableCell>
      <TableCell className="text-sm">
        {isLoading ? (
          <Skeleton className="h-4 w-16" />
        ) : (
          formatTime(record?.checkIn)
        )}
      </TableCell>
      <TableCell className="text-sm">
        {isLoading ? (
          <Skeleton className="h-4 w-16" />
        ) : (
          formatTime(record?.checkOut)
        )}
      </TableCell>
      <TableCell>
        {isLoading ? (
          <Skeleton className="h-5 w-16" />
        ) : (
          <Badge
            className={
              record?.checkIn
                ? record?.checkOut
                  ? "bg-success/15 text-success border-success/30 text-xs"
                  : "bg-warning/15 text-warning border-warning/30 text-xs"
                : "bg-muted text-muted-foreground border-border text-xs"
            }
          >
            {record?.checkIn
              ? record?.checkOut
                ? "Complete"
                : "Present"
              : "Absent"}
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function AttendancePage() {
  const { data: employees, isLoading } = useGetAllEmployees();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Attendance
            </h1>
            <p className="text-sm text-muted-foreground">
              Daily check-in and check-out records
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
              data-ocid="attendance.date.input"
            />
          </div>
        </div>
      </motion.div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !employees || employees.length === 0 ? (
            <div
              className="py-16 text-center"
              data-ocid="attendance.table.empty_state"
            >
              <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">
                No employees found
              </p>
            </div>
          ) : (
            <Table data-ocid="attendance.table">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp, idx) => (
                  <AttendanceRow
                    key={emp.id.toString()}
                    emp={emp}
                    date={selectedDate}
                    idx={idx}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
