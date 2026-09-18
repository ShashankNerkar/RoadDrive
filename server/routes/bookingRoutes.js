// server/routes/bookingRoutes.js
import express from 'express';
import {
  createBooking,
  getMyBookings,
  updateBookingStatus,
  getAllBookings,
} from '../controllers/bookingController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All booking routes require authentication

router.post('/', authorizeRoles('student'), createBooking);
router.get('/my', getMyBookings);
router.put('/:id/status', authorizeRoles('instructor', 'admin'), updateBookingStatus);
router.get('/', authorizeRoles('admin'), getAllBookings);

export default router;
