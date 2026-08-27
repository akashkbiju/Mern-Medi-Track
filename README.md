# MediTrack+

## Description
MediTrack+ is a "Smart Medication and Health Management System". It is a healthcare management web application designed to help users manage their medicines, receive reminders, track adherence, record health parameters, and connect securely with healthcare professionals.

## Problem Statement
Managing medications and monitoring personal health metrics can be challenging for many individuals, particularly those with chronic conditions or complex medication schedules. Non-adherence to medication regimens can lead to poor health outcomes.

## Objectives
- Simplify medication management and scheduling.
- Improve medication adherence through smart reminders and tracking.
- Provide a unified dashboard for tracking essential health parameters.
- Enable users to visualize their health and medication data securely.
- Facilitate communication between patients and healthcare professionals.

## Core Features
*(Note: Some features are planned for future implementation and are not yet fully integrated)*
- Smart medication reminders
- Medication adherence score
- Health analytics dashboard
- Automatic health reports
- Doctor connectivity

## Technology Stack
- **Frontend**: React.js, Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide React
- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose
- **Security & Reliability**: Helmet, Express Rate Limit, Express Validator, CORS
- **Authentication**: JWT, bcrypt *(Future implementation in Step 4)*
- **Configuration**: dotenv

## Backend Architecture
The backend follows an enterprise layered architecture with strict separation of concerns:

```
Client (Browser / React)
  ↓
Routes (/api/*)
  ↓
Middleware (Security headers, CORS, Rate Limit, Input Validation, Auth Foundation)
  ↓
Controllers (HTTP parsing, validation inspection, response formatting)
  ↓
Services (Business logic, orchestration, calculations)
  ↓
Models (Mongoose Schemas & DB validation constraints)
  ↓
MongoDB Database
```

### Response Flow:
```
MongoDB Database → Models → Services → Controllers → Standardized ApiResponse → Client
```

## API Structure

| Endpoint Group | Route Base | Current Status | Description |
| :--- | :--- | :--- | :--- |
| **Authentication** | `/api/auth` | **Implemented** | Register (Step 4), Login & JWT Auth (Step 5) |
| **User Management** | `/api/users` | *Foundation Ready* | User profile retrieval and management |
| **Medicines** | `/api/medicines` | *Foundation Ready* | Medication schedule CRUD and active prescriptions |
| **Reminders** | `/api/reminders` | *Foundation Ready* | Reminder scheduling and dose status logging |
| **Health Records** | `/api/health-records`| *Foundation Ready* | Tracking vitals (BP, glucose, heart rate, weight) |
| **Analytics** | `/api/analytics` | *Foundation Ready* | Adherence percentage and health metric trends |
| **Reports** | `/api/reports` | *Foundation Ready* | Automated health summary PDF generation |
| **Doctors** | `/api/doctors` | *Foundation Ready* | Doctor discovery, verification, and patient sharing |

*Note: Endpoints not yet built return HTTP `501 Not Implemented` with standardized JSON error envelopes.*

## User Registration (`POST /api/auth/register`)

MediTrack+ enforces a strict, multi-layered security model for user onboarding:
- **Role Control**: Public registration strictly creates accounts with `role: "patient"`. Doctor and admin privileges cannot be granted through public registration and are sanitized on the server.
- **Password Security**: Passwords must meet policy criteria (8+ characters, uppercase, lowercase, numeric digit, special character). Passwords are hashed with `bcryptjs` (salt work factor: 12) prior to storage in MongoDB.
- **Privacy by Default**: The `password` field in `User` schema has `select: false`. Passwords and password hashes are never returned in API responses or written to logs.
- **Duplicate Protection**: Email addresses are normalized (trimmed and lowercased). The system checks for existing accounts before saving and returns HTTP 409 Conflict if duplicate.
- **Rate Limiting**: Protected by dedicated `authLimiter` allowing 20 requests / 15 minutes to prevent automated abuse.

### Request Body
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePassword@123",
  "confirmPassword": "SecurePassword@123",
  "phone": "+1234567890"
}
```

### Successful Response (`HTTP 201 Created`)
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "664b1f48c3f4e2401f7...",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "role": "patient",
      "phone": "+1234567890",
      "createdAt": "2026-09-06T00:00:00.000Z"
    }
  }
}
```

### Possible Errors
- **`HTTP 400 Bad Request`**: Validation failure (missing fields, weak password, password mismatch, invalid email format).
- **`HTTP 409 Conflict`**: Account with the specified email already exists.
- **`HTTP 429 Too Many Requests`**: Rate limit exceeded (20 requests / 15 min).
- **`HTTP 503 Service Unavailable`**: MongoDB service temporarily unreachable.

## User Authentication & JWT Login

MediTrack+ uses JSON Web Tokens (JWT) and bcrypt password verification:
- **Stateless Tokens**: The backend signs standard JWTs containing minimal payload (`id`, `role`) with an expiration defined by `JWT_EXPIRES_IN` (e.g., `1d`).
- **Secure Password Verification**: Passwords are authenticated with `bcrypt.compare()`.
- **Enumeration Prevention**: Generic error message `"Invalid email or password"` (HTTP 401) is returned whether the email is unrecognized or password is wrong.
- **Account State Verification**: Inactive accounts (`isActive: false`) are denied access with HTTP 403.
- **Dual Token Transmission**: Supports both `Authorization: Bearer <token>` headers and secure httpOnly cookies.
- **Session Restoration (`GET /api/auth/me`)**: Validates active JWT and returns the authenticated user profile.
- **Logout (`POST /api/auth/logout`)**: Clears authentication cookies and terminates client session.

### Login Request (`POST /api/auth/login`)
```json
{
  "email": "jane@example.com",
  "password": "SecurePassword@123"
}
```

### Successful Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "664b1f48c3f4e2401f7...",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "role": "patient",
      "phone": "+1234567890",
      "createdAt": "2026-09-06T00:00:00.000Z"
    }
  }
}
```

### Environment Variables
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_long_random_secret_key
JWT_EXPIRES_IN=1d
```

## Authentication & Authorization (RBAC)

MediTrack+ enforces a layered access control architecture on both frontend and backend:

### 1. Verification vs Authorization (HTTP 401 vs 403)
- **`HTTP 401 Unauthorized`**: Request is missing a token, has an expired token, or token signature is invalid. Means: *You are not authenticated.*
- **`HTTP 403 Forbidden`**: User is authenticated and active, but does not have the required role to access the resource, or account is disabled (`isActive: false`). Means: *Authenticated, but not permitted.*

### 2. Backend Middleware Flow
```text
Request → protect (verify JWT & fetch user from DB) → authorizeRoles(...roles) → Controller
```
- **`protect`**: Reads Bearer token from header or cookie, verifies signature, confirms active user in DB, and populates `req.user`.
- **`authorizeRoles('patient', 'doctor', 'admin')`**: Reusable role guard verifying `req.user.role`.

### 3. Resource Ownership Principle
User-specific data operations strictly bind to `req.user.id` extracted from the cryptographically verified JWT payload. Roles cannot be modified via client request bodies.

### 4. Frontend Route Protection
- **`ProtectedRoute`**: Blocks unauthenticated visitors, checks initialization state, and redirects to `/login`.
- **`RoleRoute`**: Verifies role permissions for authenticated users and navigates unauthorized users to the `/unauthorized` access denied screen.

## User Profile Management

MediTrack+ provides a protected user profile management system adhering to strict resource ownership principles:

### 1. Ownership & Security Foundation
- **Verified Identity**: Profile operations are bound to `req.user.id` derived from the cryptographically verified JWT. Client-supplied IDs are never trusted.
- **Immutable Account Fields**: The user's registered `email`, `role`, and `isActive` status cannot be updated via the profile endpoint (`PUT /api/users/profile`), preventing privilege escalation.
- **Operator Injection Protection**: MongoDB update operators (`$set`, `$unset`, etc.) passed in request payloads are completely ignored. Updates are explicitly whitelisted and mapped.
- **Data Sanitization**: Internal security fields (`password`, password hashes, MongoDB internal versioning) are systematically stripped via `sanitizeUser.js`.

### 2. Supported Profile Fields
- **`fullName`**: String (2–100 chars, trimmed).
- **`phone`**: String (international phone format).
- **`dateOfBirth`**: ISO8601 Date (must not be a future date).
- **`gender`**: Enum (`'male'`, `'female'`, `'other'`, `'prefer_not_to_say'`).
- **`emergencyContact`**: Subdocument:
  - `name`: String (max 100 chars).
  - `relationship`: String (max 50 chars).
  - `phone`: String (valid phone format).
- **`profileImage`**: String avatar URL or placeholder reference.

### 3. Profile Endpoints
- **`GET /api/users/profile`**: Returns current authenticated user's profile.
- **`PUT /api/users/profile`**: Validates input and updates current user's personal info and emergency contact.

## Medicine Data Architecture

MediTrack+ features a production-ready Medicine data architecture designed to support medication tracking, smart reminders, adherence scores, and health analytics.

### 1. Data Model Structure & Ownership
Every medication schedule belongs strictly to an authenticated user (`user: ObjectId -> User`). Medicines cannot exist without a valid user reference, and ownership is securely resolved on the server using `req.user.id`.

```text
User (Authenticated)
│
└── Medicine
    ├── Name (e.g. Paracetamol)
    ├── Generic Name (e.g. Acetaminophen)
    ├── Dosage (Numeric: 500)
    ├── Dosage Unit (Enum: mg, g, mcg, ml, tablet, capsule, drop, puff, unit)
    ├── Frequency (Enum: once_daily, twice_daily, three_times_daily, four_times_daily, custom)
    ├── Times (Array of 24-hour HH:mm strings, e.g. ["08:00", "20:00"])
    ├── Start Date (ISO8601 Date)
    ├── End Date (ISO8601 Date or null for ongoing prescriptions)
    ├── Instructions (e.g. "Take after food")
    ├── Notes (Personal patient remarks)
    └── Active Status (isActive: Boolean for soft archiving)
```

### 2. Validation & Schedule Rules
- **Dosage**: Enforced as a positive numeric value (`min: 0.001`, `max: 100000`). Stored independently from unit for precise analytics.
- **Dosage Units**: Validated against supported medical units: `mg`, `g`, `mcg`, `ml`, `tablet`, `capsule`, `drop`, `puff`, `unit`.
- **Frequency & Times Correlation**:
  - `once_daily` requires exactly 1 time.
  - `twice_daily` requires exactly 2 times.
  - `three_times_daily` requires exactly 3 times.
  - `four_times_daily` requires exactly 4 times.
  - `custom` supports 1 to 12 user-defined times.
  - Times must follow 24-hour `HH:mm` format with duplicate prevention.
- **Date Boundaries**: `startDate` is required; `endDate` is optional and validated to ensure `endDate >= startDate`.
- **Anti-Mass Assignment**: Rejects or ignores client tampering on `user`, `_id`, `createdAt`, and `updatedAt`.

### 3. Database Indexes
Optimized for high-frequency user-scoped queries:
- `{ user: 1, isActive: 1 }`: Fast retrieval of active/inactive medicines.
- `{ user: 1, startDate: 1 }`: Chronological prescription timeline queries.
- `{ user: 1, endDate: 1 }`: Expiration and renewal tracking.
- `{ user: 1, name: 1 }`: Scoped medicine lookup without global uniqueness collisions.

## Medicine Management API

The Medicine Management module provides complete CRUD functionality for authenticated patients:

### 1. Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **`GET`** | `/api/medicines` | List user medications with search (`?search=`) and status (`?status=active\|inactive\|all`) |
| **`POST`** | `/api/medicines` | Create a new medication schedule |
| **`GET`** | `/api/medicines/:id` | Retrieve medication details by ID (verified ownership) |
| **`PUT`** | `/api/medicines/:id` | Update medication schedule and details |
| **`PATCH`** | `/api/medicines/:id/deactivate` | Soft-deactivate a medication (maintains history) |
| **`PATCH`** | `/api/medicines/:id/activate` | Reactivate an inactive medication |

### 2. Strict Resource Isolation
Every operation strictly filters by `{ user: req.user.id }`. Attempting to access or mutate another user's medicine returns `HTTP 404 Not Found` without disclosing record existence.

### 3. Creation Payload Example (`POST /api/medicines`)
```json
{
  "name": "Paracetamol",
  "genericName": "Acetaminophen",
  "dosage": 500,
  "dosageUnit": "mg",
  "frequency": "twice_daily",
  "times": ["08:00", "20:00"],
  "startDate": "2026-09-06",
  "endDate": "2026-09-20",
  "instructions": "Take after food with water",
  "notes": "Mild fever and pain management"
}
```

### 4. Successful Response (`HTTP 201 Created`)
```json
{
  "success": true,
  "message": "Medicine created successfully",
  "data": {
    "medicine": {
      "id": "664b1f48c3f4e2401f7...",
      "user": "664b1e38c3f4e2401f1...",
      "name": "Paracetamol",
      "genericName": "Acetaminophen",
      "dosage": 500,
      "dosageUnit": "mg",
      "frequency": "twice_daily",
      "times": ["08:00", "20:00"],
      "startDate": "2026-09-06T00:00:00.000Z",
      "endDate": "2026-09-20T00:00:00.000Z",
      "instructions": "Take after food with water",
      "notes": "Mild fever and pain management",
      "isActive": true,
      "createdAt": "2026-09-06T00:00:00.000Z"
    }
  }
}
```

## Medication Scheduling System

MediTrack+ features a high-performance, dynamic medication scheduling engine. Instead of generating redundant pre-allocated database entries for every future dose, daily and upcoming schedules are calculated dynamically on demand directly from the `Medicine` model parameters (`frequency`, `times`, `startDate`, `endDate`, and `isActive`).

### Core Features
- **Dynamic On-Demand Calculation**: Schedules are generated algorithmically at query time, ensuring that any edit to dosage, timing, frequency, or deactivation instantly updates schedules without data inconsistencies.
- **Date Range Accuracy**: Compares target dates against medication `startDate` and optional `endDate` (supporting indefinite prescriptions).
- **Chronological Dose Sorting**: Daily doses are ordered chronologically by scheduled time (24h format), with secondary alphabetical ordering by medicine name.
- **Strict Date Validation**: Validates `YYYY-MM-DD` calendar parameters strictly, catching invalid leap years, out-of-bounds months, and malformed inputs.

### Schedule Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/medicines/schedule/today` | Today's complete medication schedule for authenticated user |
| `GET` | `/api/medicines/schedule/daily?date=YYYY-MM-DD` | Medication schedule for any specific valid date |
| `GET` | `/api/medicines/schedule/upcoming` | Rolling 24-hour upcoming medication doses |
| `GET` | `/api/medicines/:id/schedule?date=YYYY-MM-DD` | Scheduled times for a specific medicine on a given date |

### Sample Daily Schedule Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Daily medication schedule retrieved successfully",
  "data": {
    "date": "2026-09-06",
    "count": 2,
    "schedule": [
      {
        "medicineId": "66db6bfae8020a40d5bb96fa",
        "medicineName": "Metformin",
        "genericName": "Metformin HCl",
        "dosage": 500,
        "dosageUnit": "mg",
        "frequency": "twice_daily",
        "scheduledDate": "2026-09-06",
        "scheduledTime": "08:00",
        "scheduledTime12h": "08:00 AM",
        "instructions": "Take after meals",
        "status": "Scheduled",
        "isActive": true
      },
      {
        "medicineId": "66db6bfae8020a40d5bb96fa",
        "medicineName": "Metformin",
        "genericName": "Metformin HCl",
        "dosage": 500,
        "dosageUnit": "mg",
        "frequency": "twice_daily",
        "scheduledDate": "2026-09-06",
        "scheduledTime": "20:00",
        "scheduledTime12h": "08:00 PM",
        "instructions": "Take after meals",
        "status": "Scheduled",
        "isActive": true
      }
    ]
  }
}
```

## Smart Medication Reminder Engine

MediTrack+ includes an automated, timezone-aware medication reminder engine. Building upon Step 10's schedule service, the reminder engine generates and manages persistent notification events (`type: "medication_reminder"`) with guaranteed database-level idempotency, server restart recovery, and configurable lookahead windows.

### Architecture Flow
```
User
  ↓
Medicine Configuration (frequency, times, start/end date)
  ↓
Step 10 Schedule Service (dynamic on-demand schedule calculation)
  ↓
Step 11 Reminder Engine (idempotent notification event generation)
  ↓
Notification Record (MongoDB 'Notification' collection)
  ↓
Step 12 Medication Tracking (taken/missed dose logs - upcoming)
  ↓
Step 18 Notification Delivery Layer (email/push delivery - upcoming)
```

### Key Capabilities
- **Guaranteed Idempotency & Duplicate Prevention**: Backed by a compound unique partial MongoDB index on `{ user: 1, relatedMedicine: 1, type: 1, scheduledFor: 1 }`. Multiple scheduler executions, server restarts, or concurrent requests cannot produce duplicate reminders.
- **Timezone Awareness**: Respects each user's configured IANA timezone (defaults to `"Asia/Kolkata"`), calculating exact UTC timestamps for `scheduledFor` to prevent timezone shift errors.
- **Background Cron Processing**: Periodically generates reminder events via a lightweight background worker powered by `node-cron` (`REMINDER_CRON_SCHEDULE="* * * * *"`).
- **Server Restart Recovery**: On startup, an immediate recovery pass catches any reminders that were due during recent server downtime within a controlled window (`REMINDER_RECOVERY_MINUTES=15`), avoiding sudden notification storms.
- **Strict Separation of Concerns**: Reminder generation only indicates that a reminder was calculated and queued. It does **NOT** mark the dose as taken or missed. *Step 12 will implement medication taken/missed tracking.*

### Reminder Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/reminders/today` | Today's medication reminders for authenticated user |
| `GET` | `/api/reminders/upcoming?hours=24` | Upcoming reminders within configurable lookahead window |
| `GET` | `/api/reminders` | Query reminder history (filters: `date`, `isRead`, `medicineId`, pagination) |
| `PATCH` | `/api/reminders/:id/read` | Mark a reminder notification as read |
| `POST` | `/api/reminders/process` | Trigger reminder synchronization / processing cycle |

### Sample Reminder Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Today's medication reminders retrieved successfully",
  "data": {
    "count": 2,
    "reminders": [
      {
        "_id": "66db7015a892b130e90c88bc",
        "user": "66db6bfae8020a40d5bb96f9",
        "type": "medication_reminder",
        "title": "Medication Reminder: Metformin",
        "message": "It's time to take Metformin (500 mg) at 08:00 AM • Take after meals.",
        "relatedMedicine": {
          "_id": "66db6bfae8020a40d5bb96fa",
          "name": "Metformin",
          "dosage": 500,
          "dosageUnit": "mg",
          "instructions": "Take after meals"
        },
        "scheduledFor": "2026-09-06T02:30:00.000Z",
        "isRead": false,
        "sentAt": null,
        "createdAt": "2026-09-06T02:00:00.000Z"
      }
    ]
  }
}
```

## Medication Taken & Missed Tracking

MediTrack+ allows patients to track actual medication adherence by recording whether each scheduled dose was **Pending**, **Taken**, **Missed**, or **Skipped**. The system cleanly separates scheduled dose calculations (Step 10) and reminder alerts (Step 11) from actual dose consumption events.

### Architecture Flow
```
User
  ↓
Medicine
  ↓
Step 10 Schedule Service (dynamic on-demand schedule)
  ↓
Step 11 Reminder Engine (alert notification records)
  ↓
Step 12 MedicationLog Engine
  ├── Pending (initial scheduled state)
  ├── Taken (actual takenAt timestamp + optional patient note)
  ├── Skipped (patient skipped with reason note)
  └── Missed (automated after REMINDER_GRACE_MINUTES expiration)
  ↓
Step 13 Adherence Analytics (upcoming)
```

### Key Capabilities
- **Lazy On-Demand Generation**: Medication logs are generated lazily when accessing daily schedules rather than creating redundant database entries years in advance.
- **Idempotency & Duplicate Prevention**: Backed by a compound unique MongoDB index on `{ user: 1, medicine: 1, scheduledDate: 1, scheduledTime: 1 }`. Repeated calls or concurrent requests preserve existing log status.
- **Status State Machine**:
  - `pending → taken`: Sets `takenAt = new Date()`. Idempotent if re-invoked.
  - `pending → skipped`: Allows patients to record a reason note without counting as a missed dose.
  - `pending → missed`: Automated by background scheduler when `Date.now() > scheduledTime + REMINDER_GRACE_MINUTES` (default 60 mins).
  - `missed → taken`: Supported for late medication taking; records exact `takenAt` while preserving original scheduled time.
  - `taken` and `skipped` are immutable to automated missed transitions.
- **Timezone Awareness**: Interprets daily schedules using each user's configured IANA timezone (default `Asia/Kolkata`).

### Medication Log Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/medication-logs/today` | Today's medication dose checklist and progress statistics |
| `GET` | `/api/medication-logs` | Query dose logs history (filters: `date`, `startDate`, `endDate`, `status`, `medicineId`) |
| `GET` | `/api/medication-logs/:id` | Retrieve a single medication log |
| `PATCH` | `/api/medication-logs/:id/taken` | Mark a scheduled dose as taken (optional `{ notes }`) |
| `PATCH` | `/api/medication-logs/:id/skipped` | Mark a scheduled dose as skipped (optional `{ notes }`) |
| `POST` | `/api/medication-logs/process-missed`| Trigger automated missed dose check |

### Sample Today's Log Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Today's medication schedule retrieved successfully",
  "data": {
    "date": "2026-09-06",
    "timezone": "Asia/Kolkata",
    "stats": {
      "total": 3,
      "taken": 1,
      "pending": 1,
      "missed": 0,
      "skipped": 1,
      "completionRate": 33
    },
    "medications": [
      {
        "_id": "66db7015a892b130e90c88bc",
        "user": "66db6bfae8020a40d5bb96f9",
        "medicine": {
          "_id": "66db6bfae8020a40d5bb96fa",
          "name": "Paracetamol",
          "dosage": 500,
          "dosageUnit": "mg"
        },
        "scheduledDate": "2026-09-06T00:00:00.000Z",
        "scheduledTime": "08:00",
        "scheduledTime12h": "08:00 AM",
        "status": "taken",
        "takenAt": "2026-09-06T02:35:12.000Z",
        "notes": "Taken after breakfast"
      }
    ]
  }
}
```

## Error Handling & Response Format

The backend enforces a consistent JSON response envelope for all API endpoints.

### Success Response Envelope (`ApiResponse.js`)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response Envelope (`ApiError.js` & `errorMiddleware.js`)
```json
{
  "success": false,
  "message": "Error description message",
  "errors": [ ... ]
}
```

The global error handling middleware automatically intercepts:
- **`ApiError`**: Operational errors with specific HTTP status codes
- **Mongoose `ValidationError`**: Formats readable schema validation errors
- **Mongoose `CastError`**: Converts malformed MongoDB IDs into clean 404 responses
- **Mongoose Duplicate Key (`11000`)**: Converts duplicate unique fields into clean 409 Conflict responses
- **Malformed JSON**: Catches invalid payload syntax with 400 Bad Request
- **Production Guard**: Suppresses internal stack traces and database credentials in production environments

## Database Architecture
MongoDB is used as the primary database. Mongoose is used for schema modeling, relationship mapping, and strict data validation.

### Main Collections / Models
- **User**: Stores patient, doctor, and admin accounts.
- **Medicine**: Stores medication schedules and details for users.
- **MedicationLog**: Tracks every individual scheduled dose (taken, missed, pending).
- **HealthRecord**: Stores daily health measurements like weight, BP, and blood sugar.
- **DoctorProfile**: Stores verified public information for doctors.
- **DoctorPatientConnection**: Manages access permissions between doctors and patients.
- **HealthReport**: Tracks generated PDF health reports.
- **Notification**: Stores system and medication alerts.

### Important Relationships
```text
User
├── Medicines
├── Medication Logs
├── Health Records
├── Notifications
├── Health Reports
└── Doctor Connections

Medicine
└── Medication Logs

Doctor
└── Doctor-Patient Connections
```

## Folder Structure
```
meditrack-plus/
├── frontend/                     # Frontend React/Vite application
│   ├── public/
│   └── src/
│       ├── components/           # Reusable UI components
│       ├── layouts/              # Dashboard layout shells
│       ├── pages/                # LandingPage, Login, Register, Dashboard
│       └── services/             # Axios API client (with dev health check)
└── backend/                      # Backend Express/Node application
    ├── config/                   # env.js, db.js
    ├── controllers/              # HTTP handling (health, auth, medicine, etc.)
    ├── middleware/               # error, notFound, rateLimit, validate, auth
    ├── models/                   # 8 Mongoose schemas from Step 2
    ├── routes/                   # Express routers (/api/health, /api/auth, etc.)
    ├── services/                 # Business logic foundation layer
    ├── utils/                    # ApiResponse, ApiError, asyncHandler, logger
    ├── validators/               # Request validation schemas (express-validator)
    ├── app.js                    # Express app configuration & middleware pipeline
    ├── server.js                 # HTTP listener & startup orchestrator
    ├── .env                      # Environment configuration
    └── package.json
```

## Installation & Running

1. **Install Root & Subproject Dependencies**:
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Environment Variables**:
   Verify `backend/.env` is configured:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   CLIENT_URL=http://localhost:5173
   JWT_SECRET=your_jwt_secret
   ```

3. **Running the Project**:
   From the root directory:
   ```bash
   npm run dev
   ```
   Or independently:
   - Backend: `cd backend && npm run dev`
   - Frontend: `cd frontend && npm run dev`

4. **API Health Check**:
   Navigate to or curl:
   ```bash
   curl http://localhost:5000/api/health
   ```

## Step 13 — Medication Adherence Score & Analytics

MediTrack+ includes a clinical-grade Medication Adherence Score engine designed to accurately measure how consistently a patient adheres to their prescribed medication schedules.

### Core Formula
$$\text{Adherence Score} = \left( \frac{\text{Taken Eligible Doses}}{\text{Total Eligible Doses}} \right) \times 100$$

> [!IMPORTANT]
> **Medical Disclaimer**:
> Medication adherence reflects how consistently scheduled doses were recorded as taken. It is not a medical diagnosis or treatment recommendation.

### Eligible Dose Definition
The adherence score is calculated strictly from scheduled doses and their actual recorded status in `MedicationLog`:
- **Taken**: Completed (counted in both numerator and denominator).
- **Missed**: Not completed (counted in denominator only).
- **Skipped**: Not completed (counted in denominator only; treated as non-adherent for tracking).
- **Pending**:
  - Doses scheduled on past calendar dates are considered elapsed and counted in denominator as non-adherent.
  - Doses scheduled for today are checked against the configured grace period (`REMINDER_GRACE_MINUTES`, default: 60 minutes). If `scheduledTime + gracePeriod` has passed, it is evaluated as missed. If still within the grace period, it is **excluded from eligible doses**.
- **Future Doses**: Doses scheduled for later today or future calendar dates are strictly **excluded from eligible doses** and never penalize or reduce the patient's score.

### Score Categories
- **`Excellent`**: 90% – 100%
- **`Good`**: 75% – 89.99%
- **`Needs Improvement`**: 50% – 74.99%
- **`Low`**: 0% – 49.99%
- **`No Data`**: When `totalEligible === 0` (score returns `null` and `hasData: false`, clearly distinguishing an empty period from a 0% failure score).

### Adherence Streak
- Evaluates consecutive days meeting the threshold ($\ge 100\%$ adherence).
- Days with zero scheduled doses (e.g. rest days or before prescription start) do not automatically break the streak.
- Today is counted if all scheduled doses are completed at 100%, or bypassed if still in progress without missed doses.

### API Endpoints
- `GET /api/analytics/adherence?period=today`: Today's adherence score and completed dose ratio.
- `GET /api/analytics/adherence?period=7d`: Last 7 calendar days aggregate and daily breakdown.
- `GET /api/analytics/adherence?period=30d`: Last 30 calendar days aggregate and daily breakdown.
- `GET /api/analytics/adherence?period=custom&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`: Custom date range (up to 366 days).

#### Example Response (`GET /api/analytics/adherence?period=7d`)
```json
{
  "success": true,
  "message": "Medication adherence calculated successfully",
  "data": {
    "period": "7d",
    "startDate": "2026-08-31",
    "endDate": "2026-09-06",
    "timezone": "Asia/Kolkata",
    "totalEligible": 21,
    "taken": 18,
    "missed": 2,
    "skipped": 1,
    "pending": 0,
    "adherenceScore": 85.71,
    "category": "Good",
    "hasData": true,
    "currentStreak": 3,
    "daily": [
      {
        "date": "2026-08-31",
        "eligible": 3,
        "taken": 3,
        "missed": 0,
        "skipped": 0,
        "pending": 0,
        "score": 100,
        "category": "Excellent",
        "hasData": true
      }
    ],
    "disclaimer": "Medication adherence reflects how consistently scheduled doses were recorded as taken. It is not a medical diagnosis."
  }
}
```

## Step 14 — Health Records Database & Data Architecture

MediTrack+ includes a robust, validated, and scalable data architecture for tracking vital patient health parameters over time.

### Supported Health Measurements & Standard Units
- **Weight**: `kg` (Valid physiological range: 1 – 500 kg)
- **Blood Pressure**: `mmHg` (Systolic: 40 – 300, Diastolic: 30 – 200; Systolic must be strictly greater than Diastolic; both required if blood pressure is supplied)
- **Blood Sugar**: `mg/dL` (Valid physiological range: 20 – 1000 mg/dL)
- **Heart Rate**: `BPM` (Valid physiological range: 20 – 300 BPM)
- **Temperature**: `°C` (Valid physiological range: 25 – 45 °C)
- **Notes**: Text (Max 1000 characters, trimmed)

### Partial Record & Future Date Rules
- **Partial Record Flexibility**: A patient is never required to submit all measurements simultaneously. Any combination is valid (e.g. only weight, or only blood pressure, or blood sugar and heart rate).
- **Measurement Presence Requirement**: At least one valid health measurement must be present. Submitting an empty record with only a timestamp or notes is rejected.
- **Future Date Prevention**: The `recordDate` cannot be in the future (allowing at most a 5-minute clock-skew tolerance).

> [!IMPORTANT]
> **Medical Safety Disclaimer**:
> Health records are stored as tracking data and are not medical diagnoses. They do not replace professional medical advice.
> 
> *Note: Step 15 will implement the Health Tracking UI and CRUD workflow.*

### Ownership & Security
- All health records are strictly scoped to the authenticated patient (`user = req.user.id`).
- Attempting to pass or override `userId` in `req.body` or queries is discarded.
- Cross-user queries and mutations return HTTP 404 to avoid leaking record existence.
- Doctor access is segregated and will be implemented in later steps.

### API Endpoints (`/api/health-records`)
- `POST /api/health-records`: Create a new health record.
- `GET /api/health-records?page=1&limit=20&date=YYYY-MM-DD`: Retrieve paginated records (newest first) with optional date or measurement type filtering.
- `GET /api/health-records/:id`: Fetch a single health record verifying user ownership.
- `PATCH /api/health-records/:id`: Update allowed measurement fields (rejects mutation of `user`, `_id`, or `createdAt`).
- `DELETE /api/health-records/:id`: Hard-delete a patient's own record.

