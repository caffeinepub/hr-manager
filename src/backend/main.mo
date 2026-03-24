import Set "mo:core/Set";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Types
  module PerformanceReview {
    public type T = {
      rating : Nat;
      notes : Text;
      reviewDate : Time.Time;
    };

    public func compare(r1 : T, r2 : T) : Order.Order {
      Int.compare(r1.reviewDate, r2.reviewDate);
    };
  };

  module AttendanceDay {
    public type T = {
      checkIn : ?Time.Time;
      checkOut : ?Time.Time;
    };

    public func compare(d1 : T, d2 : T) : Order.Order {
      switch (d1.checkIn, d2.checkIn) {
        case (?t1, ?t2) { Int.compare(t1, t2) };
        case (null, ?_) { #less };
        case (?_, null) { #greater };
        case (null, null) { #equal };
      };
    };
  };

  module Employee {
    public type T = {
      name : Text;
      position : Text;
      department : Text;
      email : Text;
      hireDate : Time.Time;
      isActive : Bool;
    };

    public func compare(e1 : T, e2 : T) : Order.Order {
      Text.compare(e1.name, e2.name);
    };
  };

  public type UserProfile = {
    name : Text;
    employeeId : ?Nat;
  };

  // State
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var nextEmployeeId = 1;

  let employees = Map.empty<Nat, Employee.T>();
  let attendance = Map.empty<Nat, Map.Map<Text, AttendanceDay.T>>();
  let reviews = Map.empty<Nat, List.List<PerformanceReview.T>>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Helper functions
  func getEmployeeInternal(employeeId : Nat) : Employee.T {
    switch (employees.get(employeeId)) {
      case (null) {
        Runtime.trap("Employee not found");
      };
      case (?employee) { employee };
    };
  };

  func getEmployeeIdForUser(caller : Principal) : ?Nat {
    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?profile) { profile.employeeId };
    };
  };

  func stubGetTodayText() : Text {
    "2024-06-29"
  };

  // Employee Management (Admin only)
  public query ({ caller }) func getEmployee(employeeId : Nat) : async Employee.T {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view employees");
    };
    getEmployeeInternal(employeeId);
  };

  public shared ({ caller }) func addEmployee(employee : Employee.T) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add employees");
    };
    let newId = nextEmployeeId;
    nextEmployeeId += 1;
    employees.add(newId, employee);
    attendance.add(newId, Map.empty<Text, AttendanceDay.T>());
    reviews.add(newId, List.empty<PerformanceReview.T>());
    newId;
  };

  public shared ({ caller }) func updateEmployee(employeeId : Nat, employee : Employee.T) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update employees");
    };
    ignore getEmployeeInternal(employeeId);
    employees.add(employeeId, employee);
  };

  public shared ({ caller }) func deleteEmployee(employeeId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete employees");
    };
    employees.remove(employeeId);
    attendance.remove(employeeId);
    reviews.remove(employeeId);
  };

  // Attendance Management
  public shared ({ caller }) func checkIn(employeeId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check in");
    };

    // Users can only check in for themselves (based on their profile's employeeId)
    // Admins can check in anyone
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (getEmployeeIdForUser(caller)) {
        case (null) {
          Runtime.trap("Unauthorized: No employee record associated with your account");
        };
        case (?userEmployeeId) {
          if (userEmployeeId != employeeId) {
            Runtime.trap("Unauthorized: Can only check in for yourself");
          };
        };
      };
    };

    ignore getEmployeeInternal(employeeId);
    let today = stubGetTodayText();
    let employeeAttendance = switch (attendance.get(employeeId)) {
      case (null) { Map.empty<Text, AttendanceDay.T>() };
      case (?a) { a };
    };

    let dayRecord = switch (employeeAttendance.get(today)) {
      case (null) {
        {
          checkIn = ?Time.now();
          checkOut = null;
        };
      };
      case (?record) {
        {
          checkIn = ?Time.now();
          checkOut = record.checkOut;
        };
      };
    };

    employeeAttendance.add(today, dayRecord);
    attendance.add(employeeId, employeeAttendance);
  };

  public shared ({ caller }) func checkOut(employeeId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check out");
    };

    // Users can only check out for themselves (based on their profile's employeeId)
    // Admins can check out anyone
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (getEmployeeIdForUser(caller)) {
        case (null) {
          Runtime.trap("Unauthorized: No employee record associated with your account");
        };
        case (?userEmployeeId) {
          if (userEmployeeId != employeeId) {
            Runtime.trap("Unauthorized: Can only check out for yourself");
          };
        };
      };
    };

    ignore getEmployeeInternal(employeeId);
    let today = stubGetTodayText();
    let employeeAttendance = switch (attendance.get(employeeId)) {
      case (null) { Map.empty<Text, AttendanceDay.T>() };
      case (?a) { a };
    };

    let dayRecord = switch (employeeAttendance.get(today)) {
      case (null) {
        {
          checkIn = null;
          checkOut = ?Time.now();
        };
      };
      case (?record) {
        {
          checkIn = record.checkIn;
          checkOut = ?Time.now();
        };
      };
    };

    employeeAttendance.add(today, dayRecord);
    attendance.add(employeeId, employeeAttendance);
  };

  // Performance Reviews (Admin only to create)
  public shared ({ caller }) func addPerformanceReview(employeeId : Nat, review : PerformanceReview.T) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add performance reviews");
    };

    // Validate rating is between 1–5
    if (review.rating < 1 or review.rating > 5) {
      Runtime.trap("Invalid rating: must be between 1 and 5");
    };

    ignore getEmployeeInternal(employeeId);
    let employeeReviews = switch (reviews.get(employeeId)) {
      case (null) { List.empty<PerformanceReview.T>() };
      case (?r) { r };
    };
    employeeReviews.add(review);
    reviews.add(employeeId, employeeReviews);
  };

  // Query functions
  public query ({ caller }) func getAllEmployees() : async [Employee.T] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view employees");
    };
    employees.values().toArray().sort();
  };

  public query ({ caller }) func getAttendance(employeeId : Nat) : async [(Text, AttendanceDay.T)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view attendance");
    };

    // Users can only view their own attendance, admins can view all
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (getEmployeeIdForUser(caller)) {
        case (null) {
          Runtime.trap("Unauthorized: No employee record associated with your account");
        };
        case (?userEmployeeId) {
          if (userEmployeeId != employeeId) {
            Runtime.trap("Unauthorized: Can only view your own attendance");
          };
        };
      };
    };

    let employeeAttendance = switch (attendance.get(employeeId)) {
      case (null) { Runtime.trap("No attendance records found") };
      case (?a) { a };
    };
    employeeAttendance.entries().toArray();
  };

  public query ({ caller }) func getPerformanceReviews(employeeId : Nat) : async [PerformanceReview.T] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view performance reviews");
    };

    // Users can only view their own reviews, admins can view all
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (getEmployeeIdForUser(caller)) {
        case (null) {
          Runtime.trap("Unauthorized: No employee record associated with your account");
        };
        case (?userEmployeeId) {
          if (userEmployeeId != employeeId) {
            Runtime.trap("Unauthorized: Can only view your own performance reviews");
          };
        };
      };
    };

    let employeeReviews = switch (reviews.get(employeeId)) {
      case (null) { Runtime.trap("No reviews found") };
      case (?r) { r };
    };
    employeeReviews.toArray().sort();
  };

  public query ({ caller }) func getStats() : async {
    totalEmployees : Nat;
    todaysAttendanceCount : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stats");
    };

    let today = stubGetTodayText();
    var count = 0;
    for ((_, records) in attendance.entries()) {
      switch (records.get(today)) {
        case (?record) {
          if (record.checkIn != null or record.checkOut != null) {
            count += 1;
          };
        };
        case (null) {};
      };
    };

    {
      totalEmployees = employees.size();
      todaysAttendanceCount = count;
    };
  };
};
