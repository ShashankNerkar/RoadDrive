// server/routes/lessonRoutes.js
import express from 'express';
import {
  getLessonsByCourse,
  createLesson,
  updateLesson,
  deleteLesson,
} from '../controllers/lessonController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/course/:courseId', getLessonsByCourse);

// Admin only actions
router.post('/', protect, authorizeRoles('admin'), createLesson);
router.put('/:id', protect, authorizeRoles('admin'), updateLesson);
router.delete('/:id', protect, authorizeRoles('admin'), deleteLesson);

export default router;
