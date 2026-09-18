// server/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { isMongoConnected } from '../config/db.js';
import { memoryDb } from '../config/mockStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'roaddrive_super_secret_jwt_key_2026';

// Middleware to verify JWT from httpOnly cookie or Authorization header
export const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    // Fallback check in Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, please log in' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    let user;
    if (isMongoConnected()) {
      user = await User.findById(decoded.id).select('-password');
    } else {
      const found = memoryDb.users.find((u) => u._id === decoded.id);
      if (found) {
        const { password, ...userWithoutPassword } = found;
        user = userWithoutPassword;
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error in protect middleware:', error.message);
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

// Role-based access control middleware
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user?.role || 'Guest'}) is not authorized to access this resource`,
      });
    }
    next();
  };
};
