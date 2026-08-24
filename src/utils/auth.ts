import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'amk_erp_secret_key_2026';

export function generateToken(payload: { id: string; email: string; name: string; role?: string; permissions?: string[] }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
