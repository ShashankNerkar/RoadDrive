# RoadDrive - MERN Driving School Management System

"RoadDrive is a MERN-based driving school management system where students can enroll in courses and book driving sessions, instructors manage slots and bookings, and admins manage the overall system."

---

## 1. Project Folder Structure

```text
roaddrive/
├── client/                     # Frontend (React + Vite + Normal CSS)
│   ├── api/
│   │   └── axios.js            # Axios client with withCredentials: true
│   ├── context/
│   │   └── AuthContext.jsx     # User authentication state & methods
│   ├── components/
│   │   ├── Navbar.jsx          # Role-based navigation header
│   │   ├── ProtectedRoute.jsx  # Role-Based Access Control (RBAC) guard
│   │   ├── BookingModal.jsx    # Student session reservation dialog
│   │   └── ReviewModal.jsx     # Instructor review & rating dialog
│   ├── pages/
│   │   ├── Home.jsx            # Landing page with hero, courses & tutors
│   │   ├── Courses.jsx         # Course catalog with level filter
│   │   ├── CourseDetails.jsx   # Syllabus, lessons, and enrollment
│   │   ├── Instructors.jsx     # Instructor list with slots & reviews
│   │   ├── Login.jsx           # Sign in with quick 1-click demo buttons
│   │   ├── Register.jsx        # Sign up (Student or Instructor)
│   │   ├── StudentDashboard.jsx# Lesson progress & booking tracker
│   │   ├── InstructorDashboard.jsx# Slot scheduler & booking requests
│   │   └── AdminDashboard.jsx  # Analytics, course/lesson CRUD & users
│   └── styles/
│       └── main.css            # Clean, modern, responsive pure CSS
│
└── server/                     # Backend (Node.js + Express + MongoDB)
    ├── config/
    │   ├── db.js               # Mongoose connection to local MongoDB
    │   └── mockStore.js        # Built-in seed store fallback
    ├── models/
    │   ├── User.js             # Student, Instructor, Admin schema
    │   ├── Course.js           # Driving course schema
    │   ├── Lesson.js           # Lesson module schema
    │   ├── Booking.js          # In-car session reservation schema
    │   └── Review.js           # Student review schema
    ├── middleware/
    │   └── authMiddleware.js   # JWT verification & RBAC authorization
    ├── controllers/
    │   ├── authController.js   # Register, login, logout, me
    │   ├── courseController.js # Course CRUD & enrollment
    │   ├── lessonController.js # Lesson CRUD
    │   ├── bookingController.js# Session reservations & status transitions
    │   ├── reviewController.js # Instructor ratings
    │   └── userController.js   # Instructors, students, slots, stats
    ├── routes/
    │   ├── authRoutes.js       # /api/auth
    │   ├── courseRoutes.js     # /api/courses
    │   ├── lessonRoutes.js     # /api/lessons
    │   ├── bookingRoutes.js    # /api/bookings
    │   ├── reviewRoutes.js     # /api/reviews
    │   └── userRoutes.js       # /api/users
    ├── utils/
    │   └── generateToken.js    # JWT generation with httpOnly cookie
    └── server.js               # Standalone backend server (Port 5000)
```

---

## 2. MongoDB Mongoose Models

### **User Model (`server/models/User.js`)**
- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (hashed with bcrypt)
- `role`: Enum `['student', 'instructor', 'admin']` (default: `'student'`)
- `phone`: String
- `bio`: String (Instructor bio)
- `experienceYears`: Number (Instructor)
- `hourlyRate`: Number (Instructor)
- `availableSlots`: Array of `{ date, time, isBooked }` (Instructor)
- `enrolledCourses`: Array of `{ course, enrolledAt, completedLessons: [ref Lesson] }` (Student)

### **Course Model (`server/models/Course.js`)**
- `name`: String (required)
- `description`: String (required)
- `price`: Number (required)
- `duration`: String (e.g., `"4 Weeks (20 Hours)"`)
- `level`: Enum `['Beginner', 'Intermediate', 'Advanced']`
- `thumbnail`: String (Image URL)

### **Lesson Model (`server/models/Lesson.js`)**
- `title`: String (required)
- `description`: String
- `resourceUrl`: String (Video URL)
- `course`: ObjectId (ref: `Course`)
- `order`: Number (default: 1)

### **Booking Model (`server/models/Booking.js`)**
- `student`: ObjectId (ref: `User`)
- `instructor`: ObjectId (ref: `User`)
- `date`: String (YYYY-MM-DD)
- `time`: String (e.g., "10:00 AM")
- `status`: Enum `['pending', 'accepted', 'rejected', 'completed']`
- `notes`: String

### **Review Model (`server/models/Review.js`)**
- `student`: ObjectId (ref: `User`)
- `instructor`: ObjectId (ref: `User`)
- `rating`: Number (1 to 5)
- `comment`: String

---

## 3. REST API Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| **POST** | `/api/auth/register` | Public | Register student or instructor |
| **POST** | `/api/auth/login` | Public | Authenticate and set httpOnly cookie |
| **POST** | `/api/auth/logout` | Public | Clear auth cookie |
| **GET** | `/api/auth/me` | Private | Get authenticated user profile |
| **GET** | `/api/courses` | Public | Get all driving courses |
| **GET** | `/api/courses/:id` | Public | Get single course with lessons |
| **POST** | `/api/courses` | Admin | Create course |
| **PUT** | `/api/courses/:id` | Admin | Update course |
| **DELETE**| `/api/courses/:id` | Admin | Delete course & lessons |
| **POST** | `/api/courses/:id/enroll` | Student | Enroll in course |
| **POST** | `/api/courses/:courseId/lessons/:lessonId/toggle` | Student | Mark lesson complete / incomplete |
| **GET** | `/api/lessons/course/:courseId` | Public | Get lessons for a course |
| **POST** | `/api/lessons` | Admin | Create lesson |
| **PUT** | `/api/lessons/:id` | Admin | Update lesson |
| **DELETE**| `/api/lessons/:id` | Admin | Delete lesson |
| **POST** | `/api/bookings` | Student | Book session with instructor |
| **GET** | `/api/bookings/my` | Private | Get student or instructor bookings |
| **PUT** | `/api/bookings/:id/status` | Instructor/Admin | Accept, reject, or complete session |
| **GET** | `/api/bookings` | Admin | View all school bookings |
| **POST** | `/api/reviews` | Student | Review instructor |
| **GET** | `/api/reviews/instructor/:id` | Public | Get instructor reviews |
| **GET** | `/api/users/instructors` | Public | Get all instructors with slots |
| **GET** | `/api/users/students` | Admin/Instructor | Get student list |
| **PUT** | `/api/users/profile` | Private | Update profile & bio |
| **POST** | `/api/users/instructor/slots` | Instructor | Add available date/time slot |
| **DELETE**| `/api/users/instructor/slots/:id` | Instructor | Delete available slot |
| **GET** | `/api/users/admin/stats` | Admin | Overall statistics count |

---

## 4. Running Locally

### Prerequisites:
- Node.js (v18+)
- MongoDB running locally: `mongodb://127.0.0.1:27017/roaddrive`

### Terminal 1 - Backend Server (Port 5000):
```bash
npm run server
```

### Terminal 2 - Frontend Client (Port 5173):
```bash
npm run client
```

### Quick Demo Credentials:
- **Student**: `student@roaddrive.com` / `student123`
- **Instructor**: `john.instructor@roaddrive.com` / `instructor123`
- **Admin**: `admin@roaddrive.com` / `admin123`
