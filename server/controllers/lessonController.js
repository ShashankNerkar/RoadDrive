// server/controllers/lessonController.js
import Lesson from '../models/Lesson.js';
import { isMongoConnected } from '../config/db.js';
import { memoryDb, generateId } from '../config/mockStore.js';

// @desc    Get lessons for a course
// @route   GET /api/lessons/course/:courseId
// @access  Public
export const getLessonsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (isMongoConnected()) {
      const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 });
      return res.json({ success: true, lessons });
    } else {
      const lessons = memoryDb.lessons
        .filter((l) => l.course === courseId)
        .sort((a, b) => a.order - b.order);
      return res.json({ success: true, lessons });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new lesson (Admin)
// @route   POST /api/lessons
// @access  Private/Admin
export const createLesson = async (req, res) => {
  try {
    const { title, description, course, order } = req.body;

    if (!title || !course) {
      return res.status(400).json({ success: false, message: 'Title and Course ID are required' });
    }

    if (isMongoConnected()) {
      const lesson = await Lesson.create({
        title,
        description: description || '',
        course,
        order: Number(order) || 1,
      });
      return res.status(201).json({ success: true, lesson });
    } else {
      const lesson = {
        _id: generateId('lsn'),
        title,
        description: description || '',
        course,
        order: Number(order) || 1,
        createdAt: new Date().toISOString(),
      };
      memoryDb.lessons.push(lesson);
      return res.status(201).json({ success: true, lesson });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update lesson (Admin)
// @route   PUT /api/lessons/:id
// @access  Private/Admin
export const updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, order } = req.body;

    if (isMongoConnected()) {
      const updated = await Lesson.findByIdAndUpdate(
        id,
        { title, description, order: Number(order) },
        { new: true }
      );
      if (!updated) return res.status(404).json({ success: false, message: 'Lesson not found' });
      return res.json({ success: true, lesson: updated });
    } else {
      const idx = memoryDb.lessons.findIndex((l) => l._id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Lesson not found' });

      memoryDb.lessons[idx] = {
        ...memoryDb.lessons[idx],
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(order !== undefined && { order: Number(order) }),
      };

      return res.json({ success: true, lesson: memoryDb.lessons[idx] });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete lesson (Admin)
// @route   DELETE /api/lessons/:id
// @access  Private/Admin
export const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      await Lesson.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Lesson deleted successfully' });
    } else {
      memoryDb.lessons = memoryDb.lessons.filter((l) => l._id !== id);
      return res.json({ success: true, message: 'Lesson deleted successfully' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
