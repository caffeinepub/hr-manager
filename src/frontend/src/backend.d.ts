import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface T {
    hireDate: Time;
    name: string;
    isActive: boolean;
    email: string;
    department: string;
    position: string;
}
export type Time = bigint;
export interface T__2 {
    checkIn?: Time;
    checkOut?: Time;
}
export interface UserProfile {
    name: string;
    employeeId?: bigint;
}
export interface T__1 {
    reviewDate: Time;
    notes: string;
    rating: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addEmployee(employee: T): Promise<bigint>;
    addPerformanceReview(employeeId: bigint, review: T__1): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkIn(employeeId: bigint): Promise<void>;
    checkOut(employeeId: bigint): Promise<void>;
    deleteEmployee(employeeId: bigint): Promise<void>;
    getAllEmployees(): Promise<Array<T>>;
    getAttendance(employeeId: bigint): Promise<Array<[string, T__2]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEmployee(employeeId: bigint): Promise<T>;
    getPerformanceReviews(employeeId: bigint): Promise<Array<T__1>>;
    getStats(): Promise<{
        totalEmployees: bigint;
        todaysAttendanceCount: bigint;
    }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateEmployee(employeeId: bigint, employee: T): Promise<void>;
}
