import prisma from "../config/database.js";
import express, { Request, Response } from "express";
const router = express.Router();
import { authorizeRole, AuthenticatedRequest } from "../middlewares/auth.js";
import { HostProfile } from "../types/User.js";
import {
  validatePatchProfile,
  handleValidationErrors,
} from "../middlewares/validation.js";

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

      const userDataToUpdate: any = {};
      if (email !== undefined) userDataToUpdate.email = email;
      if (realname !== undefined) userDataToUpdate.realname = realname;
      if (username !== undefined) userDataToUpdate.username = username;

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

      const updatedUser = Object.keys(userDataToUpdate).length
        ? await prisma.user.update({
            where: { id: userId },
            data: userDataToUpdate,
          })
        : null;

      const hostProfileToUpdate: any = {};

      if (unitName !== undefined) hostProfileToUpdate.unitName = unitName;
      if (unitDescription !== undefined)
        hostProfileToUpdate.unitDescription = unitDescription;
      if (address !== undefined) {
        hostProfileToUpdate.address = address;

        const geo = await geocodeAddress(address);
        hostProfileToUpdate.latitude = geo.latitude;
        hostProfileToUpdate.longitude = geo.longitude;
        hostProfileToUpdate.district = geo.district;
        hostProfileToUpdate.city = city || geo.city;
      } else if (city !== undefined) {
        hostProfileToUpdate.city = city;
      }

      const existProfileData = await prisma.hostProfile.findUnique({
        where: { userId: userId },
      });
      let updatedHostProfile = null;

      if (existProfileData) {
        if (Object.keys(hostProfileToUpdate).length) {
          updatedHostProfile = await prisma.hostProfile.update({
            where: { userId: userId },
            data: hostProfileToUpdate,
          });
        }
      } else {
        if (Object.keys(hostProfileToUpdate).length) {
          updatedHostProfile = await prisma.hostProfile.create({
            data: {
              userId: userId,
              ...hostProfileToUpdate,
            },
          });
        }
      }

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

      const userDataToUpdate: any = {};
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

      const updatedUser = Object.keys(userDataToUpdate).length
        ? await prisma.user.update({
            where: { id: userId },
            data: userDataToUpdate,
          })
        : null;

      const helperProfileToUpdate: any = {};
      if (bio !== undefined) helperProfileToUpdate.bio = bio;

      const updatedHelperProfile = Object.keys(helperProfileToUpdate).length
        ? await prisma.helperProfile.update({
            where: { userId },
            data: helperProfileToUpdate,
          })
        : null;

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
    });
    const userData = await prisma.user.findUnique({
      where: { id: userId },
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
    });
    const userData = await prisma.user.findUnique({
      where: { id: userId },
    });
    res.status(200).json({
      user: userData,
      helperProfile: profileData,
    });
  }
);

async function geocodeAddress(address: string) {
  const apiKey = process.env.OPENCAGE_API_KEY;
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
    address
  )}&key=${apiKey}&language=zh-TW`;

  const response = await fetch(url);
  const data = (await response.json()) as { results: any[] };

  if (!data.results || data.results.length === 0) {
    console.warn(`Geocoding failed for: ${address}`);
    return {
      latitude: null,
      longitude: null,
      city: null,
      district: null,
      note: "Geocoding failed",
    };
  }

  const result = data.results[0];

  const lat = result.geometry.lat;
  const lng = result.geometry.lng;
  const components = result.components;

  return {
    latitude: lat,
    longitude: lng,
    city: components.city || components.county || components.town,
    district:
      components.city_district || components.suburb || components.village,
  };
}

export default router;
