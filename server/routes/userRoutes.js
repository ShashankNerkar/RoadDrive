// server/routes/userRoutes.js
import express from 'express';
import {
  getInstructors,
  getStudents,
  updateProfile,
  addInstructorSlot,
  deleteInstructorSlot,
  getAdminStats,
  deleteUser,
} from '../controllers/userController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/instructors', getInstructors);

// Protected routes
router.use(protect);

router.put('/profile', updateProfile);

// Instructor slot management
router.post('/instructor/slots', authorizeRoles('instructor'), addInstructorSlot);
router.delete('/instructor/slots/:slotId', authorizeRoles('instructor'), deleteInstructorSlot);

// Admin / Instructor management
router.get('/students', authorizeRoles('admin', 'instructor'), getStudents);
router.get('/admin/stats', authorizeRoles('admin'), getAdminStats);
router.delete('/:id', authorizeRoles('admin'), deleteUser);

export default router;
