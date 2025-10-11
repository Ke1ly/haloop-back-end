import prisma from "../config/database.js";
import { UserType } from "@prisma/client";

import { AppError } from "../utils/Error.js";

import { HostProfile, User, HelperProfile } from "../types/User.js";

//註冊時使用，卻保欲註冊的 email 或 username 目前沒人使用
export async function FindExistingUser(
  email: string,
  username: string
): Promise<{ email: string; username: string } | null> {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
    select: { email: true, username: true },
  });
  return existingUser || null;
}

//更改會員資料時使用，確保欲更改的 email 或 username 目前沒人使用
export async function FindExistingOtherUser(
  userId: string,
  email?: string,
  username?: string
): Promise<{ email: string; username: string } | null> {
  return await prisma.user.findFirst({
    where: {
      OR: [
        email ? { email, id: { not: userId } } : {},
        username ? { username, id: { not: userId } } : {},
      ],
    },
    select: { email: true, username: true },
  });
}

export async function CreateUser(data: {
  email: string;
  username: string;
  realname: string;
  hashedPassword: string;
  userType: UserType;
  bio?: string;
  unitName?: string;
  unitDescription?: string;
  address?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  district?: string | null;
}): Promise<{
  id: string;
  email: string;
  username: string;
  userType: UserType;
}> {
  return prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: data.email,
        username: data.username,
        realname: data.realname,
        password: data.hashedPassword,
        userType: data.userType,
        lastLoginAt: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        userType: true,
      },
    });

    // 根據 userType 創建 Profile
    if (data.userType === "HELPER") {
      if (data.bio === undefined) {
        throw new AppError(400, "HELPER 需註冊填寫自我介紹", "MISSING_BIO");
      }
      await tx.helperProfile.create({
        data: { userId: createdUser.id, bio: data.bio },
      });
    } else if (data.userType === "HOST") {
      if (
        !data.unitName ||
        !data.address ||
        !data.city ||
        !data.unitDescription
      ) {
        throw new AppError(
          400,
          "HOST 註冊需填寫單位名稱、地址、縣市與單位簡介",
          "MISSING_BIO"
        );
      }
      await tx.hostProfile.create({
        data: {
          userId: createdUser.id,
          unitName: data.unitName,
          unitDescription: data.unitDescription,
          address: data.address,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          district: data.district,
        },
      });
    }
    return createdUser;
  });
}

export async function FindUserByEamil(email: string): Promise<{
  id: string;
  email: string;
  password: string;
  username: string;
  userType: UserType;
  lastLoginAt: Date | null;
} | null> {
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      username: true,
      userType: true,
      lastLoginAt: true,
    },
  });
}

export async function updateLoginTime(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

export async function FindUserById(userId: string): Promise<{
  id: string;
  email: string;
  realname: string;
  username: string;
  userType: UserType;
} | null> {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      realname: true,
      username: true,
      userType: true,
    },
  });
}

export async function FindHelperProfile(userId: string) {
  return await prisma.helperProfile.findUnique({
    where: { userId: userId },
    select: {
      id: true,
      bio: true,
    },
  });
}

export async function FindHelperProfiles(
  helperIds: string[]
): Promise<{ id: string; userId: string }[]> {
  return await prisma.helperProfile.findMany({
    where: { id: { in: helperIds } },
    select: { id: true, userId: true },
  });
}
export async function GetAllHelperProfiles(): Promise<{ id: string }[]> {
  return await prisma.helperProfile.findMany({
    select: {
      id: true,
    },
  });
}

export async function FindHostProfile(userId: string) {
  return await prisma.hostProfile.findUnique({
    where: { userId: userId },
    select: {
      id: true,
      unitName: true,
      address: true,
      city: true,
      unitDescription: true,
    },
  });
}

export async function updateUserAndHostProfile(
  userId: string,
  userDataToUpdate: Partial<User>,
  hostProfileToUpdate: Partial<HostProfile>,
  existProfileData: boolean
): Promise<{
  updatedUser: User | null;
  updatedHostProfile: HostProfile | null;
}> {
  const { updatedUser, updatedHostProfile } = await prisma.$transaction(
    async (tx) => {
      let newUpdatedUser: User | null = null;
      if (Object.keys(userDataToUpdate).length > 0) {
        newUpdatedUser = await tx.user.update({
          where: { id: userId },
          data: userDataToUpdate,
        });
      }

      let newUpdatedHostProfile: HostProfile | null = null;
      if (existProfileData && Object.keys(hostProfileToUpdate).length > 0) {
        newUpdatedHostProfile = await tx.hostProfile.update({
          where: { userId },
          data: hostProfileToUpdate,
        });
      }

      return {
        updatedUser: newUpdatedUser,
        updatedHostProfile: newUpdatedHostProfile,
      };
    }
  );

  return { updatedUser, updatedHostProfile };
}

export async function updateUserAndHelperProfile(
  userId: string,
  userDataToUpdate: Partial<User>,
  helperProfileToUpdate: Partial<HelperProfile>,
  existProfileData: boolean
): Promise<{
  updatedUser: User | null;
  updatedHelperProfile: HelperProfile | null;
}> {
  const { updatedUser, updatedHelperProfile } = await prisma.$transaction(
    async (
      tx
    ): Promise<{
      updatedUser: User | null;
      updatedHelperProfile: HelperProfile | null;
    }> => {
      let newUpdatedUser: User | null = null;
      if (Object.keys(userDataToUpdate).length) {
        newUpdatedUser = await tx.user.update({
          where: { id: userId },
          data: userDataToUpdate,
        });
      }

      let newupdatedHelperProfile: HelperProfile | null = null;
      if (existProfileData && Object.keys(helperProfileToUpdate).length) {
        newupdatedHelperProfile = await tx.helperProfile.update({
          where: { userId },
          data: helperProfileToUpdate,
        });
      }
      return {
        updatedUser: newUpdatedUser,
        updatedHelperProfile: newupdatedHelperProfile,
      };
    }
  );
  return { updatedUser, updatedHelperProfile };
}
