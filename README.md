# Bus Fleet Management System

This is a full-stack application designed to streamline student transportation management for educational institution. It provides a secure, real-time, and responsive platform for administrators and bus drivers to manage routes, students, and fee payments efficiently.

## Problem Statement

Educational institutions often rely on manual, paper-based systems or fragmented spreadsheets to manage student transportation. This approach is inefficient, prone to human error, and lacks real-time visibility. Key challenges include:

- **Data In-sync:** Difficulty in keeping student lists, route assignments, and fee statuses up-to-date for all stakeholders.
- **Accessibility:** Lack of a centralized system accessible to drivers on the go, leading to communication gaps.
- **Administrative Overhead:** A significant amount of time is spent on manually tracking payments, updating records, and generating reports.
- **Security:** Sensitive student data is often not stored securely, posing a privacy risk.

## Solution Overview

The Bus Fleet Management System is a web-based solution that digitizes and centralizes all aspects of student transportation management. It offers two primary user roles with dedicated dashboards:

- **Admin Dashboard:** Provides a high-level, global view of the entire system. Administrators can oversee all drivers, manage their routes, view all students, and monitor the overall status of fee collections. The dashboard is designed to be the central hub for administrative tasks.

- **Driver Dashboard:** A mobile-friendly interface for bus drivers to manage their day-to-day operations. Drivers can log in to view their assigned routes, access the list of students for each route, and perform CRUD (Create, Read, Update, Delete) operations on student data. They can also update fee payment statuses in real-time.

The application is built to be fully responsive, ensuring a seamless experience on both desktop and mobile devices.

## Key Features

- **Secure Authentication:** JWT-based authentication with password hashing (bcrypt) ensures that user data is secure.
- **Role-Based Access Control:** Distinct dashboards and permissions for Admins and Drivers.
- **Responsive Design:** Mobile-first design ensures usability on any device, from desktops to smartphones.
- **Comprehensive Dashboards:** Centralized views for both admins and drivers to manage their tasks effectively.
- **Route Management:** Drivers can view, create, and manage their assigned bus routes.
- **Student Management:** Drivers can add, edit, and delete student profiles for each route.
- **Fee Tracking:** Real-time tracking and updating of student fee payment status (Paid/Not Paid).
- **Data Export:** Export student lists to CSV and PDF formats for reporting and offline use.
- **Real-time Updates:** Utilizes Socket.IO for instant data synchronization across all connected clients.

## Tech Stack

This project is built on the MERN stack with a focus on modern development practices.

- **Frontend:**
  - **React:** A JavaScript library for building user interfaces.
  - **React Router:** For declarative routing in the application.
  - **Axios:** For making promise-based HTTP requests.
  - **React Icons:** A library of popular icon packs.
  - **React Toastify:** For displaying non-intrusive notifications.
  - **CSS:** Custom CSS with media queries for responsive design.

- **Backend:**
  - **Node.js:** A JavaScript runtime for the server-side.
  - **Express:** A minimal and flexible Node.js web application framework.
  - **MongoDB:** A NoSQL database for storing application data.
  - **Mongoose:** An ODM library for MongoDB and Node.js.
  - **JSON Web Token (JWT):** For implementing secure authentication.
  - **Bcrypt.js:** For hashing passwords.
  - **Socket.IO:** For enabling real-time, bidirectional communication.

## Getting Started

### Prerequisites

- Node.js and npm (or yarn)
- MongoDB (local or a cloud instance like MongoDB Atlas)

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd bus-driver-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `config/config.env` file and add the following environment variables:

```
NODE_ENV=development
PORT=5000
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
JWT_EXPIRE=30d
```

Start the backend server:

```bash
npm run dev
```

The server will be running on `http://localhost:5000`.

### 3. Frontend Setup

Open a new terminal:

```bash
cd ../frontend
npm install
npm start
```

The React application will open in your browser at `http://localhost:3000`.

## API Endpoints

### Auth

- `POST /api/v1/auth/register` - Register a new user (admin/driver).
- `POST /api/v1/auth/login` - Login a user.

### Routes

- `GET /api/v1/routes` - Get all routes for the logged-in driver.
- `POST /api/v1/routes` - Create a new route.
- `PUT /api/v1/routes/:id` - Update a route.
- `DELETE /api/v1/routes/:id` - Delete a route.

### Students

- `GET /api/v1/routes/:routeId/students` - Get all students for a specific route.
- `POST /api/v1/routes/:routeId/students` - Add a student to a route.
- `PUT /api/v1/students/:id` - Update a student's details.
- `DELETE /api/v1/students/:id` - Delete a student.

### Admin

- `GET /api/v1/users` - Get all users (for admin).
- `GET /api/v1/users/drivers-with-routes` - Get all drivers with their routes and students (for admin).
- `DELETE /api/v1/users/:id` - Delete a user (for admin).
