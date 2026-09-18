// server/controllers/courseController.js
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';
import { isMongoConnected } from '../config/db.js';
import { memoryDb, generateId } from '../config/mockStore.js';
import { sendCourseEnrollmentEmail } from '../utils/emailService.js';

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
export const getCourses = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const courses = await Course.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: courses.length, courses });
    } else {
      return res.json({ success: true, count: memoryDb.courses.length, courses: memoryDb.courses });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single course with its lessons
// @route   GET /api/courses/:id
// @access  Public
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }
      const lessons = await Lesson.find({ course: id }).sort({ order: 1 });
      return res.json({ success: true, course, lessons });
    } else {
      const course = memoryDb.courses.find((c) => c._id === id);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }
      const lessons = memoryDb.lessons
        .filter((l) => l.course === id)
        .sort((a, b) => a.order - b.order);
      return res.json({ success: true, course, lessons });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create course (Admin)
// @route   POST /api/courses
// @access  Private/Admin
export const createCourse = async (req, res) => {
  try {
    const { name, description, price, duration, level, thumbnail } = req.body;

    if (!name || !description || price === undefined || !duration) {
      return res.status(400).json({ success: false, message: 'Please provide all required course details' });
    }

    if (isMongoConnected()) {
      const newCourse = await Course.create({
        name,
        description,
        price: Number(price),
        duration,
        level: level || 'Beginner',
        thumbnail: thumbnail || 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80',
      });
      return res.status(201).json({ success: true, course: newCourse });
    } else {
      const newCourse = {
        _id: generateId('crs'),
        name,
        description,
        price: Number(price),
        duration,
        level: level || 'Beginner',
        thumbnail: thumbnail || 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      };
      memoryDb.courses.unshift(newCourse);
      return res.status(201).json({ success: true, course: newCourse });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update course (Admin)
// @route   PUT /api/courses/:id
// @access  Private/Admin
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration, level, thumbnail } = req.body;

    if (isMongoConnected()) {
      const updated = await Course.findByIdAndUpdate(
        id,
        { name, description, price: Number(price), duration, level, thumbnail },
        { new: true, runValidators: true }
      );
      if (!updated) return res.status(404).json({ success: false, message: 'Course not found' });
      return res.json({ success: true, course: updated });
    } else {
      const idx = memoryDb.courses.findIndex((c) => c._id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Course not found' });

      memoryDb.courses[idx] = {
        ...memoryDb.courses[idx],
        ...(name && { name }),
        ...(description && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(duration && { duration }),
        ...(level && { level }),
        ...(thumbnail && { thumbnail }),
      };

      return res.json({ success: true, course: memoryDb.courses[idx] });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete course (Admin)
// @route   DELETE /api/courses/:id
// @access  Private/Admin
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      await Course.findByIdAndDelete(id);
      await Lesson.deleteMany({ course: id });
      return res.json({ success: true, message: 'Course and related lessons removed' });
    } else {
      memoryDb.courses = memoryDb.courses.filter((c) => c._id !== id);
      memoryDb.lessons = memoryDb.lessons.filter((l) => l.course !== id);
      return res.json({ success: true, message: 'Course and related lessons removed' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Enroll in course (Student) - Free courses only. Paid courses use /api/payment/verify
// @route   POST /api/courses/:id/enroll
// @access  Private/Student
export const enrollCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user._id || req.user.id;

    if (isMongoConnected()) {
      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

      // If course is paid, require Razorpay payment
      if (course.price > 0) {
        return res.status(400).json({
          success: false,
          isPaid: true,
          price: course.price,
          message: `This course requires a tuition payment of $${course.price}. Please complete payment via Razorpay to enroll.`,
        });
      }

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const alreadyEnrolled = user.enrolledCourses.some(
        (e) => (typeof e.course === 'object' ? e.course?._id?.toString() : e.course?.toString()) === courseId
      );

      if (alreadyEnrolled) {
        return res.status(400).json({ success: false, message: 'You are already enrolled in this course' });
      }

      user.enrolledCourses.push({
        course: courseId,
        enrolledAt: new Date(),
        completedLessons: [],
        paymentId: 'FREE_DIRECT',
        orderId: 'FREE_DIRECT',
        paymentStatus: 'free',
      });
      await user.save();

      // Send email confirmation
      sendCourseEnrollmentEmail({
        to: user.email,
        studentName: user.name,
        courseName: course.name,
        price: 0,
        paymentId: 'FREE_DIRECT',
        isPaid: false,
      }).catch((err) => console.error('Free enrollment email error:', err.message));

      return res.json({ success: true, message: 'Successfully enrolled in course!', enrolledCourses: user.enrolledCourses });
    } else {
      const course = memoryDb.courses.find((c) => c._id === courseId);
      if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

      // If course is paid, require Razorpay payment
      if (course.price > 0) {
        return res.status(400).json({
          success: false,
          isPaid: true,
          price: course.price,
          message: `This course requires a tuition payment of $${course.price}. Please complete payment via Razorpay to enroll.`,
        });
      }

      const user = memoryDb.users.find((u) => u._id === userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      if (!user.enrolledCourses) user.enrolledCourses = [];
      const alreadyEnrolled = user.enrolledCourses.some(
        (e) => (typeof e.course === 'object' ? e.course?._id : e.course) === courseId
      );

      if (alreadyEnrolled) {
        return res.status(400).json({ success: false, message: 'You are already enrolled in this course' });
      }

      user.enrolledCourses.push({
        course: courseId,
        enrolledAt: new Date().toISOString(),
        completedLessons: [],
        paymentId: 'FREE_DIRECT',
        orderId: 'FREE_DIRECT',
        paymentStatus: 'free',
      });

      // Send email confirmation
      sendCourseEnrollmentEmail({
        to: user.email,
        studentName: user.name,
        courseName: course.name,
        price: 0,
        paymentId: 'FREE_DIRECT',
        isPaid: false,
      }).catch((err) => console.error('Free enrollment email error:', err.message));

      return res.json({ success: true, message: 'Successfully enrolled in course!', enrolledCourses: user.enrolledCourses });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle completed status for a lesson (Student)
// @route   POST /api/courses/:courseId/lessons/:lessonId/toggle
// @access  Private/Student
export const toggleLessonProgress = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user._id || req.user.id;

    if (isMongoConnected()) {
      const user = await User.findById(userId);
      const enrollment = user.enrolledCourses.find((e) => e.course.toString() === courseId);
      if (!enrollment) {
        return res.status(400).json({ success: false, message: 'Not enrolled in this course' });
      }

      const lessonIdx = enrollment.completedLessons.findIndex((l) => l.toString() === lessonId);
      let isCompleted = false;

      if (lessonIdx > -1) {
        enrollment.completedLessons.splice(lessonIdx, 1);
        isCompleted = false;
      } else {
        enrollment.completedLessons.push(lessonId);
        isCompleted = true;
      }

      await user.save();
      return res.json({ success: true, isCompleted, completedLessons: enrollment.completedLessons });
    } else {
      const user = memoryDb.users.find((u) => u._id === userId);
      const enrollment = user?.enrolledCourses?.find((e) => e.course === courseId);
      if (!enrollment) {
        return res.status(400).json({ success: false, message: 'Not enrolled in this course' });
      }

      if (!enrollment.completedLessons) enrollment.completedLessons = [];
      const lessonIdx = enrollment.completedLessons.indexOf(lessonId);
      let isCompleted = false;

      if (lessonIdx > -1) {
        enrollment.completedLessons.splice(lessonIdx, 1);
        isCompleted = false;
      } else {
        enrollment.completedLessons.push(lessonId);
        isCompleted = true;
      }

      return res.json({ success: true, isCompleted, completedLessons: enrollment.completedLessons });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
