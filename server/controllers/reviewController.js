// server/controllers/reviewController.js
import Review from '../models/Review.js';
import { isMongoConnected } from '../config/db.js';
import { memoryDb, generateId } from '../config/mockStore.js';

// @desc    Add review for an instructor (Student)
// @route   POST /api/reviews
// @access  Private/Student
export const createReview = async (req, res) => {
  try {
    const studentId = req.user._id || req.user.id;
    const { instructorId, rating, comment } = req.body;

    if (!instructorId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Instructor, rating, and comment are required' });
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    if (isMongoConnected()) {
      const review = await Review.create({
        student: studentId,
        instructor: instructorId,
        rating: Number(rating),
        comment,
      });

      const populated = await Review.findById(review._id)
        .populate('student', 'name email');

      return res.status(201).json({ success: true, review: populated });
    } else {
      const student = memoryDb.users.find((u) => u._id === studentId);
      const review = {
        _id: generateId('rev'),
        student: studentId,
        instructor: instructorId,
        rating: Number(rating),
        comment,
        createdAt: new Date().toISOString(),
        studentObj: { _id: student?._id, name: student?.name },
      };

      memoryDb.reviews.unshift(review);
      return res.status(201).json({
        success: true,
        review: {
          ...review,
          student: { _id: student?._id, name: student?.name },
        },
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reviews for an instructor
// @route   GET /api/reviews/instructor/:instructorId
// @access  Public
export const getInstructorReviews = async (req, res) => {
  try {
    const { instructorId } = req.params;

    if (isMongoConnected()) {
      const reviews = await Review.find({ instructor: instructorId })
        .populate('student', 'name')
        .sort({ createdAt: -1 });

      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      return res.json({ success: true, count: reviews.length, averageRating: avgRating.toFixed(1), reviews });
    } else {
      const reviews = memoryDb.reviews
        .filter((r) => r.instructor === instructorId)
        .map((r) => {
          const student = memoryDb.users.find((u) => u._id === r.student);
          return {
            ...r,
            student: student ? { _id: student._id, name: student.name } : r.student,
          };
        });

      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      return res.json({ success: true, count: reviews.length, averageRating: avgRating.toFixed(1), reviews });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
