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

## Folder Structure
```
meditrack-plus/
├── client/         # Frontend React/Vite application
│   ├── public/
│   └── src/        # React components, pages, and services
└── server/         # Backend Express/Node application
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
   cd client
   npm install
   ```
4. Install backend dependencies:
   ```bash
   cd ../server
   npm install
   ```

## Environment Variables
Create a `.env` file in the `server` directory by copying `.env.example`:
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
- **Frontend**: `cd client && npm run dev`
- **Backend**: `cd server && npm run dev`

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
