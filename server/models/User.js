// server/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'],
      default: 'student',
    },
    phone: {
      type: String,
      default: '',
    },
    // Instructor specific fields
    bio: {
      type: String,
      default: '',
    },
    experienceYears: {
      type: Number,
      default: 3,
    },
    hourlyRate: {
      type: Number,
      default: 45,
    },
    availableSlots: [
      {
        date: { type: String, required: true }, // e.g., '2026-09-20'
        time: { type: String, required: true }, // e.g., '10:00 AM'
        isBooked: { type: Boolean, default: false },
      },
    ],
    // Student specific fields
    enrolledCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
        },
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
        completedLessons: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson',
          },
        ],
        paymentId: {
          type: String,
          default: '',
        },
        orderId: {
          type: String,
          default: '',
        },
        paymentStatus: {
          type: String,
          enum: ['free', 'paid'],
          default: 'free',
        },
      },
    ],
    // Forgot Password fields
    resetPasswordToken: {
      type: String,
      default: undefined,
    },
    resetPasswordExpire: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
