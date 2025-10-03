import express, { Request, Response } from "express";
import { authorizeRole, AuthenticatedRequest } from "../middlewares/auth.js";
import {
  validateRegister,
  validateLogin,
  handleValidationErrors,
} from "../middlewares/validation.js";

import { RegisterRequest, LoginRequest } from "../types/User.js";
import { GeocodeResult } from "../types/Utils.js";
import { geocodeAddress } from "../utils/geo.js";
import prisma from "../config/database.js";
import bcrypt from "bcryptjs";
import { UserType } from "@prisma/client";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post(
  "/register",
  validateRegister,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const {
        email,
        realname,
        username,
        password,
        userType,
        unitName,
        unitDescription,
        address,
        city,
        bio,
      }: RegisterRequest = req.body;

      // 檢查是否已註冊
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
        select: { email: true, username: true },
      });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message:
            existingUser.email.toLowerCase() === (email as string).toLowerCase()
              ? "這個電子郵件已經註冊過"
              : "此用戶名已經有人使用",
        });
        return;
      }

      // 加密密碼
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      let geo: GeocodeResult;
      if (userType === "HOST") {
        if (!unitName || !address || !city) {
          return res.status(400).json({
            success: false,
            message: "店家註冊需填寫單位名稱、地址與縣市",
          });
        }
        geo = await geocodeAddress(address);
      }

      // 創建 newUser
      const newUser = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email,
            username,
            realname,
            password: hashedPassword,
            userType: userType as UserType,
            lastLoginAt: null,
          },
          select: {
            id: true,
            email: true,
            username: true,
            userType: true,
          },
        });

        if (userType === "HELPER") {
          await tx.helperProfile.create({
            data: { userId: createdUser.id, bio },
          });
        } else if (userType === "HOST") {
          if (!unitName || !address || !city) {
            return res.status(400).json({
              success: false,
              message: "店家註冊需填寫單位名稱、地址與縣市",
            });
          }
          await tx.hostProfile.create({
            data: {
              userId: createdUser.id,
              unitName,
              unitDescription,
              address,
              city,
              latitude: geo.latitude,
              longitude: geo.longitude,
              district: geo.district,
            },
          });
        }
        return createdUser;
      });

      // 創建 newUser
      // const newUser = await prisma.user.create({
      //   data: {
      //     email,
      //     username,
      //     realname,
      //     password: hashedPassword,
      //     userType: userType as UserType,
      //     isVerified: false,
      //     lastLoginAt: null,
      //   },
      //   select: {
      //     id: true,
      //     email: true,
      //     username: true,
      //     userType: true,
      //   },
      // });

      // if (userType === "HELPER") {
      //   const newHelperProfile = await prisma.helperProfile.create({
      //     data: {
      //       userId: newUser.id,
      //       bio,
      //     },
      //   });
      // } else if (userType === "HOST") {
      //   if (!unitName || !address || !city) {
      //     return res.status(400).json({
      //       success: false,
      //       message: "店家註冊需填寫單位名稱、地址與縣市",
      //     });
      //   }

      //   const geo = await geocodeAddress(address);
      //   let latitude = geo.latitude;
      //   let longitude = geo.longitude;
      //   let district = geo.district;

      //   const newHostProfile = await prisma.hostProfile.create({
      //     data: {
      //       userId: newUser.id,
      //       unitName,
      //       unitDescription,
      //       address,
      //       city,
      //       latitude,
      //       longitude,
      //       district,
      //     },
      //   });
      // }

      return void res.status(201).json({
        success: true,
        message: "註冊成功",
        user: newUser,
      });
    } catch (error) {
      console.error("註冊時發生錯誤:", error);
      res.status(500).json({
        success: false,
        message: "伺服器內部錯誤",
        error: process.env.NODE_ENV === "development",
      });
    }
  }
);

router.post(
  "/login",
  validateLogin,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { email, password }: LoginRequest = req.body;

      // 查找用戶
      const user = await prisma.user.findUnique({
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

      if (!user) {
        res.status(401).json({
          success: false,
          message: "電子郵件或密碼錯誤",
        });
        return;
      }

      // 驗證密碼
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: "電子郵件或密碼錯誤",
        });
        return;
      }

      // 生成 JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          username: user.username,
          userType: user.userType,
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "24h" } as jwt.SignOptions
      );

      // 更新最後登入時間
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const { password: _, ...userWithoutPassword } = user;

      return void res.status(200).json({
        success: true,
        message: "登入成功",
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("登入錯誤:", error);
      res.status(500).json({
        success: false,
        message: "伺服器內部錯誤",
      });
    }
  }
);

router.get(
  "/me",
  authorizeRole(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          realname: true,
          username: true,
          userType: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: "用戶不存在",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "獲取用戶資料成功",
        user,
      });
    } catch (error) {
      console.error("獲取用戶資料錯誤:", error);
      res.status(500).json({
        success: false,
        message: "伺服器內部錯誤",
      });
    }
  }
);

export default router;
