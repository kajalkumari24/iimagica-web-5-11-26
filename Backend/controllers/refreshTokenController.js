import jwt from 'jsonwebtoken';
import RefreshToken from '../models/RefreshToken.js';
import User from '../models/User.js';
import crypto from 'crypto';
import { createHash } from 'crypto';
import { parseDurationToMs } from '../utils/parseDuration.js';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_COOKIE_MAXAGE_MS = parseDurationToMs(JWT_EXPIRES_IN, 15 * 60 * 1000);
const REFRESH_TOKEN_DAYS = parseInt(process.env.REFRESH_TOKEN_DAYS || '7', 10);
const REFRESH_TOKEN_MS = REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const presentedHash = createHash('sha256').update(String(refreshToken)).digest('hex');
    const tokenDoc = await RefreshToken.findOne({ tokenHash: presentedHash });

    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      if (tokenDoc) await RefreshToken.deleteOne({ _id: tokenDoc._id });
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newAccessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    
    // rotate: replace hash + expiry
    const newHash = createHash('sha256').update(newRefreshToken).digest('hex');
    tokenDoc.tokenHash = newHash;
    tokenDoc.expiresAt = new Date(Date.now() + REFRESH_TOKEN_MS);
    await tokenDoc.save();

    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    };

    res.cookie('userToken', newAccessToken, { ...cookieOptions, maxAge: JWT_COOKIE_MAXAGE_MS });
    res.cookie('refreshToken', newRefreshToken, { ...cookieOptions, maxAge: REFRESH_TOKEN_MS });

    return res.json({ 
      success: true, 
      token: newAccessToken,
      refreshToken: newRefreshToken 
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
