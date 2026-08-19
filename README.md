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
| **Health Check** | `/api/health` | **Implemented** | Live uptime, environment, and DB connectivity status |
| **Authentication** | `/api/auth` | **Registration Implemented** | Register (Step 4), Login & JWT (Step 5) |
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
