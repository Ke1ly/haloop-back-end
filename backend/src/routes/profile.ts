import prisma from "../config/database.js";
import express, { Request, Response } from "express";

const router = express.Router();

//middlewares
import { authorizeRole, AuthenticatedRequest } from "../middlewares/auth.js";
import {
  validatePatchProfile,
  handleValidationErrors,
} from "../middlewares/validation.js";

//types
import {
  UserUpdateData,
  HostProfileUpdateData,
  HelperProfileUpdateData,
  HostProfile,
  User,
  UserType,
} from "../types/User.js";
import { GeocodeResult } from "../types/Utils.js";
import { geocodeAddress } from "../utils/geo.js";

router.patch(
  "/host",
  authorizeRole("HOST"),
  validatePatchProfile("HOST"),
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return void res.status(401).json({ message: "Unauthorized" });

    try {
      const {
        email,
        realname,
        username,
        unitName,
        unitDescription,
        address,
        city,
      } = req.body;

      // 建立要更新的 user 資料
      const userDataToUpdate: UserUpdateData = {};
      if (email !== undefined) userDataToUpdate.email = email;
      if (realname !== undefined) userDataToUpdate.realname = realname;
      if (username !== undefined) userDataToUpdate.username = username;

      // 檢查 email ,username 是否已被其他用戶使用
      if (email || username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              email ? { email, id: { not: userId } } : {},
              username ? { username, id: { not: userId } } : {},
            ],
          },
        });
        if (existingUser) {
          return void res.status(409).json({
            success: false,
            message:
              existingUser.email === email
                ? "這個電子郵件已經被使用"
                : "此用戶名已經有人使用",
          });
        }
      }

      // 建立要更新的 hostProfile 資料
      const hostProfileToUpdate: HostProfileUpdateData = {};
      if (unitName !== undefined) hostProfileToUpdate.unitName = unitName;
      if (unitDescription !== undefined)
        hostProfileToUpdate.unitDescription = unitDescription;
      if (address !== undefined) {
        hostProfileToUpdate.address = address;
        const geo: GeocodeResult = await geocodeAddress(address);
        hostProfileToUpdate.latitude = geo.latitude;
        hostProfileToUpdate.longitude = geo.longitude;
        hostProfileToUpdate.district = geo.district;
        hostProfileToUpdate.city = city || geo.city;
      } else if (city !== undefined) {
        hostProfileToUpdate.city = city;
      }

      //確認有已存在的 hostprofile 可做後續更新
      const existProfileData = await prisma.hostProfile.findUnique({
        where: { userId: userId },
      });

      //transaction 確保兩個資料表更新
      const { updatedUser, updatedHostProfile } = await prisma.$transaction(
        async (
          tx
        ): Promise<{
          updatedUser: any;
          updatedHostProfile: any;
        }> => {
          let newUpdatedUser: any = null;
          if (Object.keys(userDataToUpdate).length) {
            newUpdatedUser = await tx.user.update({
              where: { id: userId },
              data: userDataToUpdate,
            });
          }
          let newUpdatedHostProfile: any = null;
          if (existProfileData && Object.keys(hostProfileToUpdate).length) {
            newUpdatedHostProfile = await tx.hostProfile.update({
              where: { userId },
              data: hostProfileToUpdate,
            });
          }
          // else if (Object.keys(hostProfileToUpdate).length) {
          //   newUpdatedHostProfile = await tx.hostProfile.create({
          //     data: { userId, ...hostProfileToUpdate },
          //   });
          // }
          return {
            updatedUser: newUpdatedUser,
            updatedHostProfile: newUpdatedHostProfile,
          };
        }
      );

      // if (existProfileData) {
      //   if (Object.keys(hostProfileToUpdate).length) {
      //     updatedHostProfile = await prisma.hostProfile.update({
      //       where: { userId: userId },
      //       data: hostProfileToUpdate,
      //     });
      //   }
      // } else {
      //   if (Object.keys(hostProfileToUpdate).length) {
      //     updatedHostProfile = await prisma.hostProfile.create({
      //       data: {
      //         userId: userId,
      //         ...hostProfileToUpdate,
      //       },
      //     });
      //   }
      // }

      return void res.status(200).json({
        success: true,
        message: "帳號資料變更成功",
        user: updatedUser,
        hostProfile: updatedHostProfile,
      });
    } catch (error) {
      console.error("儲存profile時發生錯誤:", error);
      res.status(500).json({
        success: false,
        message: "伺服器內部錯誤",
        error: process.env.NODE_ENV === "development",
      });
    }
  }
);

router.patch(
  "/helper",
  authorizeRole("HELPER"),
  validatePatchProfile("HELPER"),
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return void res.status(401).json({ message: "Unauthorized" });
    try {
      const { email, realname, username, bio } = req.body;

      const userDataToUpdate: UserUpdateData = {};
      if (email !== undefined) userDataToUpdate.email = email;
      if (realname !== undefined) userDataToUpdate.realname = realname;
      if (username !== undefined) userDataToUpdate.username = username;

      // 檢查 email 或 username 是否已被其他用戶使用
      if (email || username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              email ? { email, id: { not: userId } } : {},
              username ? { username, id: { not: userId } } : {},
            ],
          },
        });
        if (existingUser) {
          return void res.status(409).json({
            success: false,
            message:
              existingUser.email === email
                ? "這個電子郵件已經被使用"
                : "此用戶名已經有人使用",
          });
        }
      }

      // 建立要更新的 hostProfile 資料
      const helperProfileToUpdate: HelperProfileUpdateData = {};
      if (bio !== undefined) helperProfileToUpdate.bio = bio;

      //確認有已存在的 hostprofile 可做後續更新
      const existProfileData = await prisma.helperProfile.findUnique({
        where: { userId: userId },
      });

      //transaction 確保兩個資料表更新
      const { updatedUser, updatedHelperProfile } = await prisma.$transaction(
        async (
          tx
        ): Promise<{
          updatedUser: any;
          updatedHelperProfile: any;
        }> => {
          let newUpdatedUser: any = null;
          if (Object.keys(userDataToUpdate).length) {
            newUpdatedUser = await tx.user.update({
              where: { id: userId },
              data: userDataToUpdate,
            });
          }

          let newupdatedHelperProfile: any = null;
          if (existProfileData && Object.keys(helperProfileToUpdate).length) {
            newupdatedHelperProfile = await tx.helperProfile.update({
              where: { userId },
              data: helperProfileToUpdate,
            });
          }
          // else if (Object.keys(helperProfileToUpdate).length) {
          //   newupdatedHelperProfile = await tx.hostProfile.create({
          //     data: { userId, ...helperProfileToUpdate },
          //   });
          // }
          return {
            updatedUser: newUpdatedUser,
            updatedHelperProfile: newupdatedHelperProfile,
          };
        }
      );

      // const updatedUser = Object.keys(userDataToUpdate).length
      //   ? await prisma.user.update({
      //       where: { id: userId },
      //       data: userDataToUpdate,
      //     })
      //   : null;

      // const helperProfileToUpdate: any = {};
      // if (bio !== undefined) helperProfileToUpdate.bio = bio;

      // const updatedHelperProfile = Object.keys(helperProfileToUpdate).length
      //   ? await prisma.helperProfile.update({
      //       where: { userId },
      //       data: helperProfileToUpdate,
      //     })
      //   : null;

      return void res.status(200).json({
        success: true,
        message: "帳號資料變更成功",
        user: updatedUser,
        helperProfile: updatedHelperProfile,
      });
    } catch (error) {
      console.error("儲存profile時發生錯誤:", error);
      res.status(500).json({
        success: false,
        message: "伺服器內部錯誤",
        error: process.env.NODE_ENV === "development",
      });
    }
  }
);

router.get(
  "/host",
  authorizeRole("HOST"),
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return void res.status(401).json({ message: "Unauthorized" });

    const profileData = await prisma.hostProfile.findUnique({
      where: { userId: userId },
      select: {
        unitName: true,
        address: true,
        city: true,
        unitDescription: true,
      },
    });
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        realname: true,
        email: true,
      },
    });
    res.status(200).json({
      user: userData,
      hostProfile: profileData,
    });
  }
);

router.get(
  "/helper",
  authorizeRole("HELPER"),
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return void res.status(401).json({ message: "Unauthorized" });

    const profileData = await prisma.helperProfile.findUnique({
      where: { userId: userId },
      select: {
        bio: true,
      },
    });
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        realname: true,
        email: true,
      },
    });
    res.status(200).json({
      user: userData,
      helperProfile: profileData,
    });
  }
);

export default router;
