// server/controllers/bookingController.js
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { isMongoConnected } from '../config/db.js';
import { memoryDb, generateId } from '../config/mockStore.js';
import { sendBookingConfirmationEmail } from '../utils/emailService.js';

// @desc    Create a new booking (Student)
// @route   POST /api/bookings
// @access  Private/Student
export const createBooking = async (req, res) => {
  try {
    const studentId = req.user._id || req.user.id;
    const { instructorId, date, time, notes } = req.body;

    if (!instructorId || !date || !time) {
      return res.status(400).json({ success: false, message: 'Instructor, date, and time are required' });
    }

    if (isMongoConnected()) {
      const instructor = await User.findById(instructorId);
      if (!instructor || instructor.role !== 'instructor') {
        return res.status(404).json({ success: false, message: 'Instructor not found' });
      }

      // Mark slot as booked if it exists
      const slot = instructor.availableSlots.find((s) => s.date === date && s.time === time);
      if (slot) {
        slot.isBooked = true;
        await instructor.save();
      }

      const booking = await Booking.create({
        student: studentId,
        instructor: instructorId,
        date,
        time,
        notes: notes || '',
        status: 'pending',
      });

      const populated = await Booking.findById(booking._id)
        .populate('instructor', 'name email phone bio hourlyRate')
        .populate('student', 'name email phone');

      // Send email confirmation to student and notify instructor
      const studentUser = populated.student;
      const instructorUser = populated.instructor;
      if (studentUser && studentUser.email) {
        sendBookingConfirmationEmail({
          to: studentUser.email,
          studentName: studentUser.name,
          instructorName: instructorUser?.name || 'Your Certified Instructor',
          instructorEmail: instructorUser?.email,
          date,
          time,
          notes,
        }).catch((err) => console.error('Booking email error:', err.message));
      }

      return res.status(201).json({ success: true, booking: populated });
    } else {
      const instructor = memoryDb.users.find((u) => u._id === instructorId);
      if (!instructor || instructor.role !== 'instructor') {
        return res.status(404).json({ success: false, message: 'Instructor not found' });
      }

      const slot = instructor.availableSlots?.find((s) => s.date === date && s.time === time);
      if (slot) {
        slot.isBooked = true;
      }

      const student = memoryDb.users.find((u) => u._id === studentId);

      const booking = {
        _id: generateId('bkg'),
        student: studentId,
        instructor: instructorId,
        date,
        time,
        notes: notes || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        studentObj: { _id: student?._id, name: student?.name, email: student?.email, phone: student?.phone },
        instructorObj: { _id: instructor._id, name: instructor.name, email: instructor.email, phone: instructor.phone, hourlyRate: instructor.hourlyRate },
      };

      memoryDb.bookings.unshift(booking);

      // Send email confirmation to student and notify instructor
      if (student && student.email) {
        sendBookingConfirmationEmail({
          to: student.email,
          studentName: student.name,
          instructorName: instructor.name,
          instructorEmail: instructor.email,
          date,
          time,
          notes,
        }).catch((err) => console.error('Booking email error:', err.message));
      }

      return res.status(201).json({ success: true, booking });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user bookings (Student or Instructor)
// @route   GET /api/bookings/my
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const role = req.user.role;

    if (isMongoConnected()) {
      let query = {};
      if (role === 'student') query.student = userId;
      else if (role === 'instructor') query.instructor = userId;

      const bookings = await Booking.find(query)
        .populate('instructor', 'name email phone bio hourlyRate')
        .populate('student', 'name email phone')
        .sort({ createdAt: -1 });

      return res.json({ success: true, count: bookings.length, bookings });
    } else {
      let bookings = memoryDb.bookings.filter((b) => {
        if (role === 'student') return b.student === userId;
        if (role === 'instructor') return b.instructor === userId;
        return true;
      });

      // Hydrate objects
      const formatted = bookings.map((b) => {
        const student = memoryDb.users.find((u) => u._id === b.student);
        const instructor = memoryDb.users.find((u) => u._id === b.instructor);
        return {
          ...b,
          student: student ? { _id: student._id, name: student.name, email: student.email, phone: student.phone } : b.student,
          instructor: instructor ? { _id: instructor._id, name: instructor.name, email: instructor.email, phone: instructor.phone, hourlyRate: instructor.hourlyRate } : b.instructor,
        };
      });

      return res.json({ success: true, count: formatted.length, bookings: formatted });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update booking status (Instructor or Admin)
// @route   PUT /api/bookings/:id/status
// @access  Private/Instructor or Admin
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted', 'rejected', 'completed'

    if (!['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    if (isMongoConnected()) {
      const booking = await Booking.findById(id);
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

      booking.status = status;
      await booking.save();

      // If rejected, free up the slot on instructor
      if (status === 'rejected') {
        const instructor = await User.findById(booking.instructor);
        if (instructor) {
          const slot = instructor.availableSlots.find((s) => s.date === booking.date && s.time === booking.time);
          if (slot) {
            slot.isBooked = false;
            await instructor.save();
          }
        }
      }

      const updated = await Booking.findById(id)
        .populate('instructor', 'name email phone')
        .populate('student', 'name email phone');

      return res.json({ success: true, booking: updated });
    } else {
      const idx = memoryDb.bookings.findIndex((b) => b._id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Booking not found' });

      memoryDb.bookings[idx].status = status;
      const booking = memoryDb.bookings[idx];

      if (status === 'rejected') {
        const instructor = memoryDb.users.find((u) => u._id === booking.instructor);
        if (instructor) {
          const slot = instructor.availableSlots?.find((s) => s.date === booking.date && s.time === booking.time);
          if (slot) slot.isBooked = false;
        }
      }

      const student = memoryDb.users.find((u) => u._id === booking.student);
      const instructor = memoryDb.users.find((u) => u._id === booking.instructor);

      return res.json({
        success: true,
        booking: {
          ...booking,
          student: student ? { _id: student._id, name: student.name, email: student.email, phone: student.phone } : booking.student,
          instructor: instructor ? { _id: instructor._id, name: instructor.name, email: instructor.email, phone: instructor.phone } : booking.instructor,
        },
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings
// @access  Private/Admin
export const getAllBookings = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const bookings = await Booking.find()
        .populate('instructor', 'name email phone')
        .populate('student', 'name email phone')
        .sort({ createdAt: -1 });
      return res.json({ success: true, count: bookings.length, bookings });
    } else {
      const formatted = memoryDb.bookings.map((b) => {
        const student = memoryDb.users.find((u) => u._id === b.student);
        const instructor = memoryDb.users.find((u) => u._id === b.instructor);
        return {
          ...b,
          student: student ? { _id: student._id, name: student.name, email: student.email, phone: student.phone } : b.student,
          instructor: instructor ? { _id: instructor._id, name: instructor.name, email: instructor.email, phone: instructor.phone } : b.instructor,
        };
      });
      return res.json({ success: true, count: formatted.length, bookings: formatted });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
