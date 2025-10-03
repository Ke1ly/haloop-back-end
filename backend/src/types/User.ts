// validation.ts
export enum UserType {
  HELPER = "HELPER",
  HOST = "HOST",
}
//routers/auth.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface BaseRegisterRequest {
  email: string;
  realname: string;
  username: string;
  password: string;
  userType: UserType;
}
export type RegisterRequest = BaseRegisterRequest &
  (
    | (BaseRegisterRequest & {
        userType: "HOST";
        unitName: string;
        unitDescription: string;
        address: string;
        city: string;
      })
    | (BaseRegisterRequest & {
        userType: "HELPER";
        bio: string;
      })
  );

// export interface HostRegisterRequest extends BaseRegisterRequest {
//   unitName: string;
//   unitDescription: string;
//   address: string;
//   city: string;
// }
// export interface HelperRegisterRequest extends BaseRegisterRequest {
//   bio: string;
// }

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

export interface User {
  id: string;
  email: string;
  realname: string;
  username: string;
  password: string;
  userType: UserType;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserUpdateData {
  email?: string;
  realname?: string;
  username?: string;
}

//用於 profile.ts，建立 HostProfile時
export interface HostProfile {
  id: string;
  userId: string;
  unitName: string;
  unitDescription: string;
  address: string;
  city: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface HostProfileUpdateData {
  unitName?: string;
  unitDescription?: string;
  address?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  district?: string | null;
}

export interface HelperProfileUpdateData {
  bio?: string;
}
