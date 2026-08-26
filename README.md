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
