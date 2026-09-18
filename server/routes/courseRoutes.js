// server/routes/courseRoutes.js
import express from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  toggleLessonProgress,
} from '../controllers/courseController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getCourses);
router.get('/:id', getCourseById);

// Protected routes
router.post('/', protect, authorizeRoles('admin'), createCourse);
router.put('/:id', protect, authorizeRoles('admin'), updateCourse);
router.delete('/:id', protect, authorizeRoles('admin'), deleteCourse);

// Student actions
router.post('/:id/enroll', protect, authorizeRoles('student'), enrollCourse);
router.post('/:courseId/lessons/:lessonId/toggle', protect, authorizeRoles('student'), toggleLessonProgress);

export default router;
