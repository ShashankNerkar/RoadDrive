import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

import User from './models/User.js';
import Course from './models/Course.js';
import Lesson from './models/Lesson.js';
import Booking from './models/Booking.js';
import Review from './models/Review.js';

dotenv.config();

export const seedUsers = [
  {
    refId: 'usr_admin_1',
    name: 'Shashank Nerkar',
    email: 'shashanknerkar21@gmail.com',
    rawPassword: 'admin123',
    role: 'admin',
    phone: '+91 9028267274',
    bio: 'Managing Director & Chief Operations Head, RoadDrive Driving Academy. Oversees RTO licensing partnerships and accredited instructor standards.',
    location: 'Nashik, Maharashtra',
    availableSlots: [],
  },
  {
    refId: 'usr_admin_alias',
    name: 'RoadDrive Admin',
    email: 'admin@roaddrive.com',
    rawPassword: 'admin123',
    role: 'admin',
    phone: '+91 9028267274',
    bio: 'Managing Director & Chief Operations Head, RoadDrive Driving Academy.',
    location: 'Nashik, Maharashtra',
    availableSlots: [],
  },
  {
    refId: 'usr_inst_1',
    name: 'Surya Dada',
    email: 'surya.instructor@roaddrive.com',
    rawPassword: 'instructor123',
    role: 'instructor',
    phone: '+91 9028267274',
    bio: 'Senior Driving Instructor with 8+ years experience specializing in Mumbai traffic, clutch control on flyovers, and advanced road safety.',
    experienceYears: 8,
    hourlyRate: 45,
    location: 'Mumbai, Maharashtra',
    availableSlots: [
      { date: '2026-09-22', time: '09:00 AM', isBooked: true },
      { date: '2026-09-22', time: '11:00 AM', isBooked: false },
      { date: '2026-09-23', time: '02:00 PM', isBooked: false },
      { date: '2026-09-24', time: '10:00 AM', isBooked: false },
      { date: '2026-09-25', time: '04:00 PM', isBooked: false },
    ],
  },
  {
    refId: 'usr_inst_2',
    name: 'Rahul Jadhav',
    email: 'rahul.instructor@roaddrive.com',
    rawPassword: 'instructor123',
    role: 'instructor',
    phone: '+91 9028267274',
    bio: 'Certified Driving Instructor with 5+ years experience teaching highway merging, roundabouts, and RTO track testing in Nashik.',
    experienceYears: 5,
    hourlyRate: 40,
    location: 'Nashik, Maharashtra',
    availableSlots: [
      { date: '2026-09-22', time: '10:00 AM', isBooked: false },
      { date: '2026-09-23', time: '01:00 PM', isBooked: false },
      { date: '2026-09-24', time: '03:00 PM', isBooked: false },
    ],
  },
  {
    refId: 'usr_inst_3',
    name: 'Priya Deshmukh',
    email: 'priya.instructor@roaddrive.com',
    rawPassword: 'instructor123',
    role: 'instructor',
    phone: '+91 9028267274',
    bio: 'Patient driving instructor specializing in city traffic, parallel parking in tight spaces, and defensive driving techniques across Pune.',
    experienceYears: 6,
    hourlyRate: 50,
    location: 'Pune, Maharashtra',
    availableSlots: [
      { date: '2026-09-22', time: '08:00 AM', isBooked: false },
      { date: '2026-09-23', time: '11:00 AM', isBooked: false },
      { date: '2026-09-25', time: '02:00 PM', isBooked: false },
    ],
  },
  {
    refId: 'usr_stud_1',
    name: 'Rohit Shinde',
    email: 'student@roaddrive.com',
    rawPassword: 'student123',
    role: 'student',
    phone: '+91 9028267274',
    bio: 'Student driver preparing for Maharashtra RTO permanent light motor vehicle (LMV) driving licence exam.',
    location: 'Mumbai, Maharashtra',
    availableSlots: [],
  },
  {
    refId: 'usr_stud_2',
    name: 'Neha Patil',
    email: 'neha.patil@roaddrive.com',
    rawPassword: 'student123',
    role: 'student',
    phone: '+91 9028267274',
    bio: 'Learning defensive driving and parking techniques for Pune city commute.',
    location: 'Pune, Maharashtra',
    availableSlots: [],
  },
  {
    refId: 'usr_stud_3',
    name: 'Amit Kulkarni',
    email: 'amit.kulkarni@roaddrive.com',
    rawPassword: 'student123',
    role: 'student',
    phone: '+91 9028267274',
    bio: 'Preparing for RTO driving test at Nashik RTO track.',
    location: 'Nashik, Maharashtra',
    availableSlots: [],
  },
];

export const seedCourses = [
  {
    refId: 'crs_0',
    name: 'Road Signs & Traffic Rules Orientation',
    description: 'Essential free curriculum covering Indian traffic signs, mandatory hand signals, zebra crossings, and RTO road rules.',
    price: 0,
    duration: '1 Week (4 Hours)',
    level: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=600&auto=format&fit=crop&q=80',
  },
  {
    refId: 'crs_1',
    name: 'Beginner Driving Course',
    description: 'Comprehensive driving fundamentals covering cockpit drill, clutch biting point, gear shifting, U-turns, and safe stopping.',
    price: 1,
    duration: '4 Weeks (20 Hours)',
    level: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80',
  },
  {
    refId: 'crs_2',
    name: 'City Driving Course',
    description: 'Navigate heavy Indian traffic, bumper-to-bumper crawling, flyover merges, junction discipline, and pedestrian awareness.',
    price: 2,
    duration: '3 Weeks (15 Hours)',
    level: 'Intermediate',
    thumbnail: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600&auto=format&fit=crop&q=80',
  },
  {
    refId: 'crs_3',
    name: 'Parking & Reverse Practice',
    description: 'Master parallel parking in tight spaces, 45-degree angle reverse bay parking, and reversing on gradients without rolling.',
    price: 3,
    duration: '1 Week (8 Hours)',
    level: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
  },
  {
    refId: 'crs_4',
    name: 'Highway Driving Course',
    description: 'Expressway driving mastery, high-speed lane discipline, blind spot checks, 3-second rule, and night driving safety.',
    price: 4,
    duration: '2 Weeks (12 Hours)',
    level: 'Advanced',
    thumbnail: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&auto=format&fit=crop&q=80',
  },
  {
    refId: 'crs_5',
    name: 'RTO Test Preparation',
    description: 'Dedicated preparation for the official RTO track test: H-track reverse, 8-track maneuvers, gradient start, and mock evaluation.',
    price: 5,
    duration: '1 Week (6 Hours)',
    level: 'Advanced',
    thumbnail: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80',
  },
];

export const seedLessons = [
  {
    refId: 'lsn_0_1',
    courseRef: 'crs_0',
    title: 'Mandatory Regulatory & Cautionary Road Signs (Stop, Give Way, Speed Limit)',
    description: 'Comprehensive walkthrough of mandatory circular signs, triangular warnings, and priority right-of-way markings.',
    order: 1,
  },
  {
    refId: 'lsn_0_2',
    courseRef: 'crs_0',
    title: 'Traffic Signals, Zebra Crossings & Junction Priority',
    description: 'Understanding zebra crossings, traffic signal cycles, amber lights, and free left-turn regulations.',
    order: 2,
  },
  {
    refId: 'lsn_1_1',
    courseRef: 'crs_1',
    title: 'Cockpit Drill & Vehicle Ergonomics (Seat, Mirror, Seatbelt)',
    description: 'Learn the DSSSM routine (Doors, Seat, Steering, Seatbelt, Mirrors) and understanding dashboard indicators.',
    order: 1,
  },
  {
    refId: 'lsn_1_2',
    courseRef: 'crs_1',
    title: 'Clutch Biting Point, Gear Shifting & Smooth Braking',
    description: 'Mastering clutch biting point, blind spot observations, and progressive braking without engine stall.',
    order: 2,
  },
  {
    refId: 'lsn_1_3',
    courseRef: 'crs_1',
    title: 'Steering Discipline & Lane Alignment',
    description: 'Pull-push steering method, proper hand positioning, and staying centered in urban lanes.',
    order: 3,
  },
  {
    refId: 'lsn_1_4',
    courseRef: 'crs_1',
    title: 'T-Junctions, Crossings & Mirror-Signal-Manoeuvre',
    description: 'MSPSL routine (Mirrors, Signal, Position, Speed, Look) at busy T-junctions and crossroads.',
    order: 4,
  },
  {
    refId: 'lsn_2_1',
    courseRef: 'crs_2',
    title: 'Navigating Heavy City Traffic & Stop-and-Go Crawling',
    description: 'Bumper-to-bumper traffic management, preventing rollback on inclines, and maintaining calm focus.',
    order: 1,
  },
  {
    refId: 'lsn_2_2',
    courseRef: 'crs_2',
    title: 'Roundabout Rules, Flyover Merges & Lane Etiquette',
    description: 'Flyover approaches, merging with fast traffic, and lane discipline through multi-lane roundabouts.',
    order: 2,
  },
  {
    refId: 'lsn_2_3',
    courseRef: 'crs_2',
    title: 'Hazard Perception & Pedestrian Awareness',
    description: 'Anticipating auto-rickshaws, two-wheelers, crossing pedestrians, and sudden road obstacles.',
    order: 3,
  },
  {
    refId: 'lsn_3_1',
    courseRef: 'crs_3',
    title: '45-Degree Angle Reverse Bay Parking',
    description: 'Clear reference point technique using rear quarter glass and side mirrors for perfect slot entry.',
    order: 1,
  },
  {
    refId: 'lsn_3_2',
    courseRef: 'crs_3',
    title: 'Parallel Parking Technique with Curb Alignment',
    description: 'Aligning with neighboring vehicles, full-lock reverse turn, and counter-steering within 6 inches of the curb.',
    order: 2,
  },
  {
    refId: 'lsn_3_3',
    courseRef: 'crs_3',
    title: 'Reversing on Slopes & Tight Alley Navigation',
    description: 'Using the handbrake and clutch balance to reverse uphill without rolling forward.',
    order: 3,
  },
  {
    refId: 'lsn_4_1',
    courseRef: 'crs_4',
    title: 'Expressway Acceleration Lane Entry & Safe Merging',
    description: 'Using acceleration lanes, blind spot shoulder checks, and matching expressway traffic speeds safely.',
    order: 1,
  },
  {
    refId: 'lsn_4_2',
    courseRef: 'crs_4',
    title: 'High-Speed Overtaking, Blind Spot Checks & 3-Second Rule',
    description: 'Safe overtaking protocol on expressways, mirror checks, maintaining 3-second buffer distance.',
    order: 2,
  },
  {
    refId: 'lsn_4_3',
    courseRef: 'crs_4',
    title: 'Adverse Weather & Night Highway Driving Precautions',
    description: 'Monsoon driving, aquaplaning prevention, low-beam headlight etiquette, and highway emergency stops.',
    order: 3,
  },
  {
    refId: 'lsn_5_1',
    courseRef: 'crs_5',
    title: 'RTO 8-Shape Track & H-Track Reverse Test Mastery',
    description: 'Mastering the 8-track turning radius without touching poles, and completing the H-track reverse maneuver.',
    order: 1,
  },
  {
    refId: 'lsn_5_2',
    courseRef: 'crs_5',
    title: 'Gradient / Slope Stop-and-Go without Rollback',
    description: 'The mandatory RTO slope test: stopping on the ramp and pulling away cleanly without rolling backward.',
    order: 2,
  },
  {
    refId: 'lsn_5_3',
    courseRef: 'crs_5',
    title: 'RTO Learner Licence Form 2 & Motor Vehicles Act Essentials',
    description: 'Understanding legal requirements, documents to carry, mandatory L-board rules, and examiner expectations.',
    order: 3,
  },
];

export const seedBookings = [
  {
    studentRef: 'usr_stud_1',
    instructorRef: 'usr_inst_1',
    date: '2026-09-22',
    time: '09:00 AM',
    status: 'accepted',
    notes: 'City traffic navigation and clutch control on Mumbai flyovers.',
  },
  {
    studentRef: 'usr_stud_1',
    instructorRef: 'usr_inst_2',
    date: '2026-09-25',
    time: '11:00 AM',
    status: 'pending',
    notes: 'RTO 8-track turning and reverse bay parking practice in Nashik.',
  },
];

export const seedReviews = [
  {
    studentRef: 'usr_stud_1',
    instructorRef: 'usr_inst_1',
    rating: 5,
    comment: 'Surya Dada is an outstanding instructor. He explains clutch control in Mumbai traffic so calmly that all my initial fear vanished. Highly recommend!',
  },
  {
    studentRef: 'usr_stud_2',
    instructorRef: 'usr_inst_3',
    rating: 5,
    comment: 'Priya maam made parallel parking and slope stops so simple with clear reference points in Pune city.',
  },
  {
    studentRef: 'usr_stud_3',
    instructorRef: 'usr_inst_2',
    rating: 5,
    comment: 'Cleared my RTO driving test on the first attempt in Nashik thanks to Rahul sirs rigorous track preparation!',
  },
];

/**
 * Idempotent seed function.
 * Safe for production: never deletes existing records, only inserts missing entities.
 */
export const seedDatabase = async (options = {}) => {
  const { silent = false, closeConnection = false } = options;
  const log = (...args) => {
    if (!silent) console.log(...args);
  };

  log('[Seed] Beginning idempotent RoadDrive database seed...');

  const userIdMap = new Map();
  let createdUsers = 0;
  let existingUsers = 0;

  // 1. Seed Users
  for (const u of seedUsers) {
    const cleanEmail = u.email.toLowerCase().trim();
    let userDoc = await User.findOne({ email: cleanEmail });

    if (!userDoc) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(u.rawPassword, salt);

      userDoc = await User.create({
        name: u.name,
        email: cleanEmail,
        password: hashedPassword,
        role: u.role,
        phone: u.phone || '',
        bio: u.bio || '',
        experienceYears: u.experienceYears || 3,
        hourlyRate: u.hourlyRate || 40,
        availableSlots: u.availableSlots || [],
        enrolledCourses: [],
      });
      createdUsers++;
      log(`[Seed] + Created user: ${cleanEmail} (${u.role})`);
    } else {
      existingUsers++;
      log(`[Seed] = User already present: ${cleanEmail}`);
    }
    userIdMap.set(u.refId, userDoc._id);
    userIdMap.set(cleanEmail, userDoc._id);
  }

  // 2. Seed Courses
  const courseIdMap = new Map();
  let createdCourses = 0;
  let existingCourses = 0;

  for (const c of seedCourses) {
    let courseDoc = await Course.findOne({ name: c.name.trim() });

    if (!courseDoc) {
      courseDoc = await Course.create({
        name: c.name.trim(),
        description: c.description,
        price: Number(c.price),
        duration: c.duration,
        level: c.level,
        thumbnail: c.thumbnail,
      });
      createdCourses++;
      log(`[Seed] + Created course: "${c.name}"`);
    } else {
      existingCourses++;
      log(`[Seed] = Course already present: "${c.name}"`);
    }
    courseIdMap.set(c.refId, courseDoc._id);
    courseIdMap.set(c.name, courseDoc._id);
  }

  // 3. Seed Lessons
  const lessonIdMap = new Map();
  let createdLessons = 0;
  let existingLessons = 0;

  for (const l of seedLessons) {
    const courseId = courseIdMap.get(l.courseRef);
    if (!courseId) continue;

    let lessonDoc = await Lesson.findOne({ course: courseId, title: l.title.trim() });

    if (!lessonDoc) {
      lessonDoc = await Lesson.create({
        title: l.title.trim(),
        description: l.description,
        course: courseId,
        order: l.order,
      });
      createdLessons++;
      log(`[Seed] + Created lesson: "${l.title}"`);
    } else {
      existingLessons++;
    }
    lessonIdMap.set(l.refId, lessonDoc._id);
  }

  // 4. Enroll demo student if not yet enrolled
  const studentId = userIdMap.get('usr_stud_1');
  if (studentId) {
    const studentDoc = await User.findById(studentId);
    if (studentDoc && (!studentDoc.enrolledCourses || studentDoc.enrolledCourses.length === 0)) {
      const crs1Id = courseIdMap.get('crs_1');
      const lsn1 = lessonIdMap.get('lsn_1_1');
      const lsn2 = lessonIdMap.get('lsn_1_2');

      if (crs1Id) {
        studentDoc.enrolledCourses = [
          {
            course: crs1Id,
            enrolledAt: new Date(Date.now() - 7 * 86400000),
            completedLessons: [lsn1, lsn2].filter(Boolean),
            paymentStatus: 'paid',
            paymentId: 'pay_demo_seed_init',
          },
        ];
        await studentDoc.save();
        log(`[Seed] + Initialized enrolled course for demo student: ${studentDoc.email}`);
      }
    }
  }

  // 5. Seed Bookings
  let createdBookings = 0;
  for (const b of seedBookings) {
    const sId = userIdMap.get(b.studentRef);
    const iId = userIdMap.get(b.instructorRef);

    if (sId && iId) {
      const existingBooking = await Booking.findOne({
        student: sId,
        instructor: iId,
        date: b.date,
        time: b.time,
      });

      if (!existingBooking) {
        await Booking.create({
          student: sId,
          instructor: iId,
          date: b.date,
          time: b.time,
          status: b.status,
          notes: b.notes,
        });
        createdBookings++;
        log(`[Seed] + Created booking: ${b.date} ${b.time}`);
      }
    }
  }

  // 6. Seed Reviews
  let createdReviews = 0;
  for (const r of seedReviews) {
    const sId = userIdMap.get(r.studentRef);
    const iId = userIdMap.get(r.instructorRef);

    if (sId && iId) {
      const existingReview = await Review.findOne({
        student: sId,
        instructor: iId,
      });

      if (!existingReview) {
        await Review.create({
          student: sId,
          instructor: iId,
          rating: r.rating,
          comment: r.comment,
        });
        createdReviews++;
        log(`[Seed] + Created review for instructor`);
      }
    }
  }

  const summary = {
    users: { created: createdUsers, existing: existingUsers },
    courses: { created: createdCourses, existing: existingCourses },
    lessons: { created: createdLessons, existing: existingLessons },
    bookings: { created: createdBookings },
    reviews: { created: createdReviews },
  };

  log('[Seed] Database seed completed successfully!');
  log('[Seed] Summary:', JSON.stringify(summary, null, 2));

  if (closeConnection) {
    await mongoose.disconnect();
    log('[Seed] MongoDB connection closed.');
  }

  return summary;
};

// If executed directly from command line (e.g., node server/seed.js)
const isMain = () => {
  if (!process.argv[1]) return false;
  return fileURLToPath(import.meta.url) === process.argv[1];
};

if (isMain()) {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('[Seed Error] MONGODB_URI (or MONGO_URI) environment variable is not defined.');
    console.error('[Seed Help] To seed your MongoDB Atlas production database safely:');
    console.error('             MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/roaddrive?retryWrites=true&w=majority" node server/seed.js');
    process.exit(1);
  }

  console.log('[Seed] Connecting to MongoDB...');
  mongoose.set('strictQuery', false);

  mongoose
    .connect(mongoUri, { serverSelectionTimeoutMS: 10000 })
    .then(async (conn) => {
      console.log(`[Seed] Connected successfully to database: "${conn.connection.name}"`);
      await seedDatabase({ silent: false, closeConnection: true });
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Error] Connection failed:', err.message);
      process.exit(1);
    });
}
