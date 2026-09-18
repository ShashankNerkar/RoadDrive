// server/controllers/userController.js
import User from '../models/User.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import { isMongoConnected } from '../config/db.js';
import { memoryDb, generateId } from '../config/mockStore.js';

// @desc    Get all instructors
// @route   GET /api/users/instructors
// @access  Public
export const getInstructors = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const instructors = await User.find({ role: 'instructor' }).select('-password');
      return res.json({ success: true, count: instructors.length, instructors });
    } else {
      const instructors = memoryDb.users
        .filter((u) => u.role === 'instructor')
        .map(({ password, ...rest }) => rest);
      return res.json({ success: true, count: instructors.length, instructors });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all students (Admin or Instructor)
// @route   GET /api/users/students
// @access  Private/Admin or Instructor
export const getStudents = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const students = await User.find({ role: 'student' }).select('-password');
      return res.json({ success: true, count: students.length, students });
    } else {
      const students = memoryDb.users
        .filter((u) => u.role === 'student')
        .map(({ password, ...rest }) => rest);
      return res.json({ success: true, count: students.length, students });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile (Bio, Phone, Rate, Experience)
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { name, phone, bio, experienceYears, hourlyRate } = req.body;

    if (isMongoConnected()) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      if (name) user.name = name;
      if (phone !== undefined) user.phone = phone;
      if (bio !== undefined) user.bio = bio;
      if (experienceYears !== undefined) user.experienceYears = Number(experienceYears);
      if (hourlyRate !== undefined) user.hourlyRate = Number(hourlyRate);

      await user.save();
      const userRes = user.toObject();
      delete userRes.password;

      return res.json({ success: true, message: 'Profile updated successfully', user: userRes });
    } else {
      const idx = memoryDb.users.findIndex((u) => u._id === userId);
      if (idx === -1) return res.status(404).json({ success: false, message: 'User not found' });

      memoryDb.users[idx] = {
        ...memoryDb.users[idx],
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(bio !== undefined && { bio }),
        ...(experienceYears !== undefined && { experienceYears: Number(experienceYears) }),
        ...(hourlyRate !== undefined && { hourlyRate: Number(hourlyRate) }),
      };

      const { password, ...userSafe } = memoryDb.users[idx];
      return res.json({ success: true, message: 'Profile updated successfully', user: userSafe });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add available slot (Instructor)
// @route   POST /api/users/instructor/slots
// @access  Private/Instructor
export const addInstructorSlot = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({ success: false, message: 'Date and time are required' });
    }

    if (isMongoConnected()) {
      const instructor = await User.findById(userId);
      if (!instructor) return res.status(404).json({ success: false, message: 'Instructor not found' });

      instructor.availableSlots.push({ date, time, isBooked: false });
      await instructor.save();

      return res.json({ success: true, availableSlots: instructor.availableSlots });
    } else {
      const instructor = memoryDb.users.find((u) => u._id === userId);
      if (!instructor) return res.status(404).json({ success: false, message: 'Instructor not found' });

      if (!instructor.availableSlots) instructor.availableSlots = [];
      const newSlot = { _id: generateId('slot'), date, time, isBooked: false };
      instructor.availableSlots.push(newSlot);

      return res.json({ success: true, availableSlots: instructor.availableSlots });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete slot (Instructor)
// @route   DELETE /api/users/instructor/slots/:slotId
// @access  Private/Instructor
export const deleteInstructorSlot = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { slotId } = req.params;

    if (isMongoConnected()) {
      const instructor = await User.findById(userId);
      if (!instructor) return res.status(404).json({ success: false, message: 'Instructor not found' });

      instructor.availableSlots = instructor.availableSlots.filter((s) => s._id.toString() !== slotId);
      await instructor.save();

      return res.json({ success: true, availableSlots: instructor.availableSlots });
    } else {
      const instructor = memoryDb.users.find((u) => u._id === userId);
      if (!instructor) return res.status(404).json({ success: false, message: 'Instructor not found' });

      instructor.availableSlots = (instructor.availableSlots || []).filter((s) => s._id !== slotId);
      return res.json({ success: true, availableSlots: instructor.availableSlots });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard statistics (Admin)
// @route   GET /api/users/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const [totalStudents, totalInstructors, totalCourses, totalLessons, totalBookings] = await Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'instructor' }),
        Course.countDocuments(),
        Lesson.countDocuments(),
        Booking.countDocuments(),
      ]);

      const pendingBookings = await Booking.countDocuments({ status: 'pending' });
      const completedBookings = await Booking.countDocuments({ status: 'completed' });

      return res.json({
        success: true,
        stats: {
          totalStudents,
          totalInstructors,
          totalCourses,
          totalLessons,
          totalBookings,
          pendingBookings,
          completedBookings,
        },
      });
    } else {
      const totalStudents = memoryDb.users.filter((u) => u.role === 'student').length;
      const totalInstructors = memoryDb.users.filter((u) => u.role === 'instructor').length;
      const totalCourses = memoryDb.courses.length;
      const totalLessons = memoryDb.lessons.length;
      const totalBookings = memoryDb.bookings.length;
      const pendingBookings = memoryDb.bookings.filter((b) => b.status === 'pending').length;
      const completedBookings = memoryDb.bookings.filter((b) => b.status === 'completed').length;

      return res.json({
        success: true,
        stats: {
          totalStudents,
          totalInstructors,
          totalCourses,
          totalLessons,
          totalBookings,
          pendingBookings,
          completedBookings,
        },
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user (Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      await User.findByIdAndDelete(id);
      return res.json({ success: true, message: 'User deleted successfully' });
    } else {
      memoryDb.users = memoryDb.users.filter((u) => u._id !== id);
      return res.json({ success: true, message: 'User deleted successfully' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
