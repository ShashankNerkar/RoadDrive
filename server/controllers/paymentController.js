// server/controllers/paymentController.js
import Course from '../models/Course.js';
import User from '../models/User.js';
import { isMongoConnected } from '../config/db.js';
import { memoryDb } from '../config/mockStore.js';
import { getRazorpayConfig, createOrder, verifySignature } from '../utils/razorpayClient.js';
import { sendCourseEnrollmentEmail } from '../utils/emailService.js';

// @desc    Get Razorpay public configuration
// @route   GET /api/payment/config
// @access  Public
export const getPaymentConfig = async (req, res) => {
  try {
    const config = getRazorpayConfig();
    return res.json({ success: true, ...config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Razorpay Order for paid course
// @route   POST /api/payment/create-order
// @access  Private/Student
export const createPaymentOrder = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id || req.user.id;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }

    let course;
    let user;

    if (isMongoConnected()) {
      course = await Course.findById(courseId);
      user = await User.findById(userId);
    } else {
      course = memoryDb.courses.find((c) => c._id === courseId);
      user = memoryDb.users.find((u) => u._id === userId);
    }

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    // Check if already enrolled
    const alreadyEnrolled = (user.enrolledCourses || []).some(
      (e) => (typeof e.course === 'object' ? e.course?._id?.toString() : e.course?.toString()) === courseId
    );

    if (alreadyEnrolled) {
      return res.status(400).json({ success: false, message: 'You are already enrolled in this course' });
    }

    // Check if course is free
    if (course.price <= 0) {
      return res.status(400).json({
        success: false,
        isFree: true,
        message: 'This course is free. Please proceed with direct enrollment.',
      });
    }

    // Razorpay amounts are in smallest currency units (paise)
    const amountInPaise = Math.round(course.price * 100);
    const receipt = `rcpt_${courseId.substring(0, 8)}_${Date.now()}`;

    const orderResult = await createOrder({
      amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        courseId: course._id.toString(),
        courseName: course.name,
        userId: userId.toString(),
        studentName: user.name,
      },
    });

    const { keyId, isConfigured } = getRazorpayConfig();

    return res.json({
      success: true,
      order: orderResult.order,
      keyId,
      isConfigured,
      isSimulated: orderResult.isSimulated,
      course: {
        _id: course._id,
        name: course.name,
        price: course.price,
      },
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Payment order creation failed' });
  }
};

// @desc    Verify Razorpay payment signature & enroll student
// @route   POST /api/payment/verify
// @access  Private/Student
export const verifyPayment = async (req, res) => {
  try {
    const { courseId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user._id || req.user.id;

    if (!courseId || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification parameters (order ID, payment ID, course ID)',
      });
    }

    // Verify cryptographic signature
    const isValid = verifySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: invalid digital signature',
      });
    }

    let course;
    let user;

    if (isMongoConnected()) {
      course = await Course.findById(courseId);
      user = await User.findById(userId);

      if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      // Check already enrolled
      const alreadyEnrolled = user.enrolledCourses.some(
        (e) => (typeof e.course === 'object' ? e.course?._id?.toString() : e.course?.toString()) === courseId
      );

      if (!alreadyEnrolled) {
        user.enrolledCourses.push({
          course: courseId,
          enrolledAt: new Date(),
          completedLessons: [],
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          paymentStatus: 'paid',
        });
        await user.save();
      }

      // Send email confirmation asynchronously
      sendCourseEnrollmentEmail({
        to: user.email,
        studentName: user.name,
        courseName: course.name,
        price: course.price,
        paymentId: razorpay_payment_id,
        isPaid: true,
      }).catch((err) => console.error('Enrollment email error:', err.message));

      return res.json({
        success: true,
        message: `Payment successful! You are now enrolled in ${course.name}.`,
        paymentId: razorpay_payment_id,
        enrolledCourses: user.enrolledCourses,
      });
    } else {
      course = memoryDb.courses.find((c) => c._id === courseId);
      user = memoryDb.users.find((u) => u._id === userId);

      if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      if (!user.enrolledCourses) user.enrolledCourses = [];
      const alreadyEnrolled = user.enrolledCourses.some((e) => e.course === courseId);

      if (!alreadyEnrolled) {
        user.enrolledCourses.push({
          course: courseId,
          enrolledAt: new Date().toISOString(),
          completedLessons: [],
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          paymentStatus: 'paid',
        });
      }

      // Send email confirmation
      sendCourseEnrollmentEmail({
        to: user.email,
        studentName: user.name,
        courseName: course.name,
        price: course.price,
        paymentId: razorpay_payment_id,
        isPaid: true,
      }).catch((err) => console.error('Enrollment email error:', err.message));

      return res.json({
        success: true,
        message: `Payment successful! You are now enrolled in ${course.name}.`,
        paymentId: razorpay_payment_id,
        enrolledCourses: user.enrolledCourses,
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error verifying payment' });
  }
};
