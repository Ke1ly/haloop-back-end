import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/database";
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UserType,
} from "../types/User";
import { AuthenticatedRequest } from "../middlewares/auth";

export class AuthController {
  // 註冊用戶
  // static async register(req: Request, res: Response): Promise<void> {
  //   try {
  //     const { email, realname, username, password, userType }: RegisterRequest =
  //       req.body;

  //     // 檢查用戶是否已存在
  //     const existingUser = await prisma.user.findFirst({
  //       where: {
  //         OR: [{ email }, { username }],
  //       },
  //     });

  //     if (existingUser) {
  //       res.status(409).json({
  //         success: false,
  //         message:
  //           existingUser.email === email
  //             ? "該電子郵件已被註冊"
  //             : "該用戶名已被使用",
  //       } as AuthResponse);
  //       return;
  //     }

  //     // 加密密碼
  //     const saltRounds = 12;
  //     const hashedPassword = await bcrypt.hash(password, saltRounds);
  //     if (!userType) {
  //       res.status(400).json({ error: "User type is required" });
  //       return;
  //     }
  //     // 創建用戶
  //     const newUser = await prisma.user.create({
  //       data: {
  //         email,
  //         username,
  //         realname,
  //         password: hashedPassword,
  //         // userType,
  //         isVerified: false,
  //         lastLoginAt: null,
  //       },
  //       select: {
  //         id: true,
  //         email: true,
  //         realname: true,
  //         username: true,
  //         userType: true,
  //         createdAt: true,
  //         updatedAt: true,
  //         lastLoginAt: true,
  //       },
  //     });

  //     // 生成 JWT
  //     const token = jwt.sign(
  //       {
  //         userId: newUser.id,
  //         email: newUser.email,
  //         username: newUser.username,
  //         userType: newUser.userType,
  //       },
  //       process.env.JWT_SECRET as string,
  //       { expiresIn: "24h" } as jwt.SignOptions
  //     );

  //     res.status(201).json({
  //       success: true,
  //       message: "註冊成功",
  //       token,
  //       user: newUser,
  //       isVerified: false,
  //     } as AuthResponse);
  //   } catch (error) {
  //     console.error("註冊時發生錯誤:", error);
  //     res.status(500).json({
  //       success: false,
  //       message: "伺服器內部錯誤",
  //     } as AuthResponse);
  //   }
  // }

  // 用戶登入
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      // 查找用戶
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: "電子郵件或密碼錯誤",
        } as AuthResponse);
        return;
      }

      // 驗證密碼
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: "電子郵件或密碼錯誤",
        } as AuthResponse);
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
        data: { updatedAt: new Date() },
      });

      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        message: "登入成功",
        token,
        user: userWithoutPassword,
      } as AuthResponse);
    } catch (error) {
      console.error("登入錯誤:", error);
      res.status(500).json({
        success: false,
        message: "伺服器內部錯誤",
      } as AuthResponse);
    }
  }

  // 獲取用戶資料
  static async getProfile(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "未授權訪問",
        } as AuthResponse);
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          realname: true,
          username: true,
          userType: true,
          isVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: "用戶不存在",
        } as AuthResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: "獲取用戶資料成功",
        user,
      } as AuthResponse);
    } catch (error) {
      console.error("獲取用戶資料錯誤:", error);
      res.status(500).json({
        success: false,
        message: "伺服器內部錯誤",
      } as AuthResponse);
    }
  }

  // 更新用戶資料
  // static async updateProfile(
  //   req: AuthenticatedRequest,
  //   res: Response
  // ): Promise<void> {
  //   try {
  //     const userId = req.user?.userId;
  //     const { username } = req.body;

  //     if (!userId) {
  //       res.status(401).json({
  //         success: false,
  //         message: "未授權訪問",
  //       } as AuthResponse);
  //       return;
  //     }

  //     // 檢查用戶名是否已被使用
  //     if (username) {
  //       const existingUser = await prisma.user.findFirst({
  //         where: {
  //           username,
  //           NOT: { id: userId },
  //         },
  //       });

  //       if (existingUser) {
  //         res.status(409).json({
  //           success: false,
  //           message: "該用戶名已被使用",
  //         } as AuthResponse);
  //         return;
  //       }
  //     }

  //     // 更新用戶資料
  //     const updatedUser = await prisma.user.update({
  //       where: { id: userId },
  //       data: {
  //         ...(username && { username }),
  //         updatedAt: new Date(),
  //       },
  //       select: {
  //         id: true,
  //         email: true,
  //         username: true,
  //         isActive: true,
  //         createdAt: true,
  //         updatedAt: true,
  //       },
  //     });

  //     res.status(200).json({
  //       success: true,
  //       message: "用戶資料更新成功",
  //       user: updatedUser,
  //     } as AuthResponse);
  //   } catch (error) {
  //     console.error("更新用戶資料錯誤:", error);
  //     res.status(500).json({
  //       success: false,
  //       message: "服務器內部錯誤",
  //     } as AuthResponse);
  //   }
  // }

  // 修改密碼
  // static async changePassword(
  //   req: AuthenticatedRequest,
  //   res: Response
  // ): Promise<void> {
  //   try {
  //     const userId = req.user?.userId;
  //     const { currentPassword, newPassword } = req.body;

  //     if (!userId) {
  //       res.status(401).json({
  //         success: false,
  //         message: "未授權訪問",
  //       } as AuthResponse);
  //       return;
  //     }

  //     // 獲取用戶當前密碼
  //     const user = await prisma.user.findUnique({
  //       where: { id: userId },
  //     });

  //     if (!user) {
  //       res.status(404).json({
  //         success: false,
  //         message: "用戶不存在",
  //       } as AuthResponse);
  //       return;
  //     }

  //     // 驗證當前密碼
  //     const isCurrentPasswordValid = await bcrypt.compare(
  //       currentPassword,
  //       user.password
  //     );

  //     if (!isCurrentPasswordValid) {
  //       res.status(401).json({
  //         success: false,
  //         message: "當前密碼錯誤",
  //       } as AuthResponse);
  //       return;
  //     }

  //     // 加密新密碼
  //     const saltRounds = 12;
  //     const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  //     // 更新密碼
  //     await prisma.user.update({
  //       where: { id: userId },
  //       data: {
  //         password: hashedNewPassword,
  //         updatedAt: new Date(),
  //       },
  //     });

  //     res.status(200).json({
  //       success: true,
  //       message: "密碼修改成功",
  //     } as AuthResponse);
  //   } catch (error) {
  //     console.error("修改密碼錯誤:", error);
  //     res.status(500).json({
  //       success: false,
  //       message: "服務器內部錯誤",
  //     } as AuthResponse);
  //   }
  // }
}
