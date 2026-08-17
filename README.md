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
- **Authentication**: JWT, bcrypt *(Future implementation)*
- **Configuration**: dotenv, CORS

## UI/UX Design
The interface is built with a modern, clean, and professional healthcare SaaS aesthetic. It uses a consistent color system prioritizing deep navy, teal, and functional feedback colors (green/amber/red).

## Project Architecture
This project follows a Monorepo-like structure containing both the frontend and backend in separate folders.

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

### Privacy Considerations
- **Password Security**: Passwords are required but will be encrypted with bcrypt (never stored in plaintext).
- **Access Control**: Health records and medications are strictly referenced by the user ID. They are not publicly exposed. Doctor-patient connections use explicit permission structures to grant access.
- **Data Integrity**: Measurement fields are strictly typed to prevent negative values, and role-based structures prevent arbitrary privilege escalation.

## Folder Structure
```
meditrack-plus/
├── frontend/       # Frontend React/Vite application
│   ├── public/
│   └── src/        # React components, pages, and services
└── backend/        # Backend Express/Node application
    ├── config/     # Database and other configuration
    ├── controllers/# API logic
    ├── middleware/ # Express middlewares
    ├── models/     # Mongoose schemas
    └── routes/     # API endpoints
```

## Installation
1. Clone the repository
2. Install root dependencies:
   ```bash
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
4. Install backend dependencies:
   ```bash
   cd ../backend
   npm install
   ```

## Environment Variables
Create a `.env` file in the `backend` directory by copying `.env.example`:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
```

## Running the Project
From the root directory, you can run both frontend and backend concurrently:
```bash
npm run dev
```

Alternatively, run them separately:
- **Frontend**: `cd frontend && npm run dev`
- **Backend**: `cd backend && npm run dev`

## API Health Check
You can test if the backend server is running correctly by navigating to:
`http://localhost:5000/api/health`

## GitHub Workflow
The project is maintained on GitHub. Frontend and backend may have separate development branches as needed.

## Future Enhancements
- User Authentication & Authorization (JWT)
- Real database integration and dynamic medicine CRUD
- Intelligent medication reminder engine
- Dynamic adherence calculation based on tracked data
- Doctor connectivity features
- Health reports PDF generation
- AI-based health trend insights
- Prescription OCR
