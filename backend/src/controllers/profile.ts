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
} from "../types/User.js";

//services & utils
import { GeocodeResult } from "../types/Utils.js";
import { geocodeAddress } from "../utils/geo.js";

//models
import {
  FindExistingOtherUser,
  FindHostProfile,
  updateUserAndHostProfile,
  updateUserAndHelperProfile,
  FindUserById,
  FindHelperProfile,
} from "../models/UserModel.js";

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
        const existingUser = await FindExistingOtherUser(
          userId,
          email,
          username
        );
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
      const existProfileData = await FindHostProfile(userId);
      if (!existProfileData) {
        return void res.status(409).json({
          success: false,
          message: "查無 profile 可更新",
        });
      }

      //transaction 確保兩個資料表更新
      const { updatedUser, updatedHostProfile } =
        await updateUserAndHostProfile(
          userId,
          userDataToUpdate,
          hostProfileToUpdate,
          true
        );
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
        const existingUser = await FindExistingOtherUser(
          userId,
          email,
          username
        );
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
      const existProfileData = await FindHelperProfile(userId);

      if (!existProfileData) {
        return void res.status(409).json({
          success: false,
          message: "查無 profile 可更新",
        });
      }

      //transaction 確保兩個資料表更新
      const { updatedUser, updatedHelperProfile } =
        await updateUserAndHelperProfile(
          userId,
          userDataToUpdate,
          helperProfileToUpdate,
          true
        );

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

    const profileData = await FindHostProfile(userId);
    const userData = await FindUserById(userId);

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

    const profileData = await FindHelperProfile(userId);
    const userData = await FindUserById(userId);

    res.status(200).json({
      user: userData,
      helperProfile: profileData,
    });
  }
);

export default router;
