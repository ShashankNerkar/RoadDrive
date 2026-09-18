// server/routes/paymentRoutes.js
import express from 'express';
import { getPaymentConfig, createPaymentOrder, verifyPayment } from '../controllers/paymentController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/config', getPaymentConfig);
router.post('/create-order', protect, authorizeRoles('student'), createPaymentOrder);
router.post('/verify', protect, authorizeRoles('student'), verifyPayment);

export default router;
