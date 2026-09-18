
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'roaddrive_super_secret_jwt_key_2026';

export const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: '7d',
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = isProduction && process.env.CLIENT_URL ? 'none' : 'lax';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

export const clearToken = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = isProduction && process.env.CLIENT_URL ? 'none' : 'lax';

  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    expires: new Date(0),
  });
};

