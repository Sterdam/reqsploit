import { Plan } from '@prisma/client';

/**
 * Authentication Types
 */

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: true;
  data: {
    accessToken: string;
    refreshToken: string;
    user: UserProfile;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: Plan;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  plan: Plan;
  type: 'access';
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
