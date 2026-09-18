
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { isMongoConnected } from '../config/db.js';
import { memoryDb, generateId } from '../config/mockStore.js';
import { generateToken, clearToken } from '../utils/generateToken.js';
import { sendPasswordResetEmail } from '../utils/emailService.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, bio, experienceYears, hourlyRate } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const assignedRole = role === 'instructor' ? 'instructor' : 'student';

    if (isMongoConnected()) {
      const userExists = await User.findOne({ email: email.toLowerCase() });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: assignedRole,
        phone: phone || '',
        bio: bio || '',
        experienceYears: experienceYears ? Number(experienceYears) : 2,
        hourlyRate: hourlyRate ? Number(hourlyRate) : 40,
        availableSlots: assignedRole === 'instructor' ? [
          { date: '2026-09-22', time: '10:00 AM', isBooked: false },
          { date: '2026-09-23', time: '02:00 PM', isBooked: false },
        ] : [],
        enrolledCourses: [],
      });

      const token = generateToken(res, newUser._id);
      const userRes = newUser.toObject();
      delete userRes.password;

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        user: userRes,
        token,
      });
    } else {

      const userExists = memoryDb.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists' });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const newUserId = generateId('usr');
      const newUser = {
        _id: newUserId,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: assignedRole,
        phone: phone || '',
        bio: bio || '',
        experienceYears: experienceYears ? Number(experienceYears) : 2,
        hourlyRate: hourlyRate ? Number(hourlyRate) : 40,
        availableSlots: assignedRole === 'instructor' ? [
          { _id: generateId('slot'), date: '2026-09-22', time: '10:00 AM', isBooked: false },
          { _id: generateId('slot'), date: '2026-09-23', time: '02:00 PM', isBooked: false },
        ] : [],
        enrolledCourses: [],
        createdAt: new Date().toISOString(),
      };

      memoryDb.users.push(newUser);
      const token = generateToken(res, newUserId);
      const { password: _, ...userSafe } = newUser;

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        user: userSafe,
        token,
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    let user;
    if (isMongoConnected()) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const token = generateToken(res, user._id);
      const userRes = user.toObject();
      delete userRes.password;

      return res.json({
        success: true,
        message: 'Logged in successfully',
        user: userRes,
        token,
      });
    } else {

      user = memoryDb.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const token = generateToken(res, user._id);
      const { password: _, ...userSafe } = user;

      return res.json({
        success: true,
        message: 'Logged in successfully',
        user: userSafe,
        token,
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during login' });
  }
};

export const logout = (req, res) => {
  clearToken(res);
  return res.json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
  try {
    return res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch current user' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const resetToken = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const resetExpire = Date.now() + 60 * 60 * 1000;

    let user;
    if (isMongoConnected()) {
      user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(404).json({ success: false, message: 'No account registered with this email address' });
      }

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpire = resetExpire;
      await user.save({ validateBeforeSave: false });
    } else {
      user = memoryDb.users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (!user) {
        return res.status(404).json({ success: false, message: 'No account registered with this email address' });
      }

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpire = resetExpire;
    }

    const host = req.get('host');
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = process.env.CLIENT_URL || (process.env.APP_URL && !process.env.APP_URL.includes('MY_APP_URL')
      ? process.env.APP_URL.replace(/\/$/, '')
      : `${protocol}://${host}`);

    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
      expiresInMinutes: 60,
    });

    return res.json({
      success: true,
      message: `Password reset link has been dispatched to ${user.email}. Please check your inbox or spam folder.`,
      demoResetUrl: resetUrl,
      resetToken,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during password reset request' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Please provide a new password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    let user;
    if (isMongoConnected()) {
      user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Password reset link is invalid or has expired. Please request a new link.',
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
    } else {
      user = memoryDb.users.find(
        (u) => u.resetPasswordToken === hashedToken && u.resetPasswordExpire > Date.now()
      );

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Password reset link is invalid or has expired. Please request a new link.',
        });
      }

      user.password = bcrypt.hashSync(password, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
    }

    return res.json({
      success: true,
      message: 'Your password has been successfully reset! You can now log in with your new credentials.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error while resetting password' });
  }
};

