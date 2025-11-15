import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import {
  RegisterDTO,
  LoginDTO,
  UserProfile,
  JWTPayload,
  RefreshTokenPayload,
  TokenPair,
} from '../types/auth.types.js';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../utils/errors.js';
import { authLogger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 12;

/**
 * User registration
 */
export async function register(data: RegisterDTO): Promise<{ user: UserProfile; tokens: TokenPair }> {
  authLogger.info('Registration attempt', { email: data.email });

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    authLogger.warn('Registration failed: email already exists', { email: data.email });
    throw new ConflictError('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
    },
  });

  // Initialize token usage for the current month
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  await prisma.tokenUsage.create({
    data: {
      userId: user.id,
      monthYear,
      tokensUsed: 0,
      tokensLimit: 10000, // FREE tier default
      resetDate: nextMonth,
    },
  });

  authLogger.info('User registered successfully', { userId: user.id, email: user.email });

  // Generate tokens for auto-login after registration
  const tokens = await generateTokenPair(user);

  return { user: formatUserProfile(user), tokens };
}

/**
 * User login
 */
export async function login(data: LoginDTO): Promise<{ user: UserProfile; tokens: TokenPair }> {
  authLogger.info('Login attempt', { email: data.email });

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (!user) {
    authLogger.warn('Login failed: user not found', { email: data.email });
    throw new UnauthorizedError('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

  if (!isPasswordValid) {
    authLogger.warn('Login failed: invalid password', { userId: user.id });
    throw new UnauthorizedError('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    authLogger.warn('Login failed: user inactive', { userId: user.id });
    throw new UnauthorizedError('Account is inactive');
  }

  // Generate tokens
  const tokens = await generateTokenPair(user);

  authLogger.info('Login successful', { userId: user.id });

  return { user: formatUserProfile(user), tokens };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as RefreshTokenPayload;

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session) {
      authLogger.warn('Refresh failed: session not found');
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if session expired
    if (session.expiresAt < new Date()) {
      authLogger.warn('Refresh failed: session expired', { userId: session.userId });
      await prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedError('Refresh token expired');
    }

    // Generate new token pair
    const tokens = await generateTokenPair(session.user);

    // Delete old session
    await prisma.session.delete({ where: { id: session.id } });

    authLogger.info('Token refreshed successfully', { userId: session.userId });

    return tokens;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      authLogger.warn('Refresh failed: invalid token');
      throw new UnauthorizedError('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Logout (invalidate refresh token)
 */
export async function logout(refreshToken: string): Promise<void> {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
  });

  if (session) {
    await prisma.session.delete({ where: { id: session.id } });
    authLogger.info('Logout successful', { userId: session.userId });
  }
}

/**
 * Verify access token
 */
export async function verifyAccessToken(token: string): Promise<User> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid token');
    }

    return user;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    throw error;
  }
}

/**
 * Generate JWT token pair
 */
async function generateTokenPair(user: User): Promise<TokenPair> {
  // Generate access token
  const accessTokenPayload: JWTPayload = {
    userId: user.id,
    email: user.email,
    plan: user.plan,
    type: 'access',
  };

  const accessToken = jwt.sign(accessTokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  // Generate refresh token
  const sessionId = crypto.randomUUID();
  const refreshTokenPayload: RefreshTokenPayload = {
    userId: user.id,
    tokenId: sessionId,
    type: 'refresh',
  };

  const refreshToken = jwt.sign(refreshTokenPayload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });

  // Store session in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      refreshToken,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

/**
 * Format user profile for API response
 */
function formatUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id: userId } });
}
