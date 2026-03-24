# HR Manager

## Current State
Backend generated with employee records, attendance (checkIn/checkOut), performance reviews, and authorization. Backend APIs available.

## Requested Changes (Diff)

### Add
- QR code scanner page: when a QR code is scanned, it reads the encoded employee ID and immediately auto-records check-in or check-out time (whichever is next for that employee that day)
- Each employee has a QR code that encodes their employee ID
- Admin can view/print each employee's QR code
- Scan page is accessible without deep login so staff at an entrance can scan easily

### Modify
- Attendance flow: instead of manual button, primary method is QR scan -> instant time lock

### Remove
- N/A

## Implementation Plan
1. Frontend: QR Scanner page using qr-code component - decodes employee ID from scanned QR, calls checkIn or checkOut backend, shows confirmation with locked timestamp
2. Frontend: Employee detail/profile page shows their QR code (encoded with employeeId)
3. Frontend: Admin dashboard, employees list, attendance view, performance metrics pages
4. Frontend: Sidebar navigation
