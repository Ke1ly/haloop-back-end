// import type { WorkPost } from "./Work";

export enum UserType {
  HELPER = "HELPER",
  HOST = "HOST",
}

export interface User {
  id: string;
  email: string;
  realname: string;
  username: string;
  password: string;
  userType: UserType;
  isVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // 關聯（可選，取決於是否需要 populate）
  helperProfile?: HelperProfile | null;
  hostProfile?: HostProfile | null;
}

export interface HelperProfile {
  id: string;
  userId: string;
  favorites: Favorite[];
  Subscriptions: FilterSubscription[];
  createdAt: Date;
  updatedAt: Date;
}

//這個用於 profile.ts，建立 HostProfile時
export interface HostProfile {
  // id: string;
  userId: string;
  unitName: string;
  unitDescription: string | null;
  address: string;
  city: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  // workPost?: WorkPost[];
  // createdAt?: Date;
  // updatedAt?: Date;
}

export interface FilterSubscription {
  id: string;
  userId: string;
  name: string;
  filters: JSON;
  notifyEmail: Boolean;
  notifyPush: Boolean;
}

export interface Favorite {
  id: string;
  helperProfileId: string;
  workPostId: string;
}

export interface RegisterRequest {
  email: string;
  realname: string;
  username: string;
  password: string;
  // confirmPassword: string;
  userType: UserType;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: Omit<User, "password" | "realname">;
}

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  userType: UserType;
  iat?: number;
  exp?: number;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface Notification {
  title: string;
  message: string;
  unitName: string;
  positionName: string;
  timestamp?: Date;
  isRead?: boolean;
}
