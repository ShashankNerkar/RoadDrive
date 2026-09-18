// server/routes/reviewRoutes.js
import express from 'express';
import { createReview, getInstructorReviews } from '../controllers/reviewController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/instructor/:instructorId', getInstructorReviews);
router.post('/', protect, authorizeRoles('student'), createReview);

export default router;
