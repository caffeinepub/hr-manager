import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { T, T__1, UserProfile, UserRole } from "../backend";
import { useActor } from "./useActor";

export function useGetStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      if (!actor) return { totalEmployees: 0n, todaysAttendanceCount: 0n };
      return actor.getStats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useGetAllEmployees() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      if (!actor) return [];
      const employees = await actor.getAllEmployees();
      return employees.map((emp, index) => ({ ...emp, id: BigInt(index) }));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetEmployee(employeeId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["employee", employeeId?.toString()],
    queryFn: async () => {
      if (!actor || employeeId === null) return null;
      return actor.getEmployee(employeeId);
    },
    enabled: !!actor && !isFetching && employeeId !== null,
  });
}

export function useGetAttendance(employeeId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["attendance", employeeId?.toString()],
    queryFn: async () => {
      if (!actor || employeeId === null) return [];
      return actor.getAttendance(employeeId);
    },
    enabled: !!actor && !isFetching && employeeId !== null,
  });
}

export function useGetPerformanceReviews(employeeId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["performance", employeeId?.toString()],
    queryFn: async () => {
      if (!actor || employeeId === null) return [];
      return actor.getPerformanceReviews(employeeId);
    },
    enabled: !!actor && !isFetching && employeeId !== null,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetCallerRole() {
  const { actor, isFetching } = useActor();
  return useQuery<UserRole>({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddEmployee() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employee: T) => {
      if (!actor) throw new Error("No actor");
      return actor.addEmployee(employee);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUpdateEmployee() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, employee }: { id: bigint; employee: T }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateEmployee(id, employee);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", id.toString()] });
    },
  });
}

export function useDeleteEmployee() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteEmployee(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useCheckIn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employeeId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.checkIn(employeeId);
    },
    onSuccess: (_, employeeId) => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", employeeId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useCheckOut() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employeeId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.checkOut(employeeId);
    },
    onSuccess: (_, employeeId) => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", employeeId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useAddPerformanceReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      review,
    }: { employeeId: bigint; review: T__1 }) => {
      if (!actor) throw new Error("No actor");
      return actor.addPerformanceReview(employeeId, review);
    },
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({
        queryKey: ["performance", employeeId.toString()],
      });
    },
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("No actor");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}
