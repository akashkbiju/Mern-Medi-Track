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
| **Authentication** | `/api/auth` | *Foundation Ready (Step 4)* | Register, Login, Token generation & session |
| **User Management** | `/api/users` | *Foundation Ready* | User profile retrieval and management |
| **Medicines** | `/api/medicines` | *Foundation Ready* | Medication schedule CRUD and active prescriptions |
| **Reminders** | `/api/reminders` | *Foundation Ready* | Reminder scheduling and dose status logging |
| **Health Records** | `/api/health-records`| *Foundation Ready* | Tracking vitals (BP, glucose, heart rate, weight) |
| **Analytics** | `/api/analytics` | *Foundation Ready* | Adherence percentage and health metric trends |
| **Reports** | `/api/reports` | *Foundation Ready* | Automated health summary PDF generation |
| **Doctors** | `/api/doctors` | *Foundation Ready* | Doctor discovery, verification, and patient sharing |

*Note: All placeholder endpoints return HTTP `501 Not Implemented` with standardized JSON error envelopes until their designated implementation step.*

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
