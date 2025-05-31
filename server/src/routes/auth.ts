import express, { Request, Response } from "express";
import { AuthController } from "../controllers/authController";
import { authorizeRole, AuthenticatedRequest } from "../middlewares/auth";
import {
  validateRegister,
  validateLogin,
  handleValidationErrors,
} from "../middlewares/validation";
import { body } from "express-validator";

import { RegisterRequest, LoginRequest } from "../types/User";
import prisma from "../config/database";
import bcrypt from "bcryptjs";
import { UserType } from "@prisma/client";
import jwt from "jsonwebtoken";

const router = express.Router();

// 註冊路由
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, realname, username, password, userType }: RegisterRequest =
      req.body;

    // 檢查是否已註冊
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message:
          existingUser.email === email
            ? "該電子郵件已被註冊"
            : "該用戶名已被使用",
      });
      return;
    }

    //  檢查 UserType 的值是否為 Enum 選項
    if (!Object.values(UserType).includes(userType as UserType)) {
      return void res
        .status(400)
        .json({ success: false, message: "無效的用戶類型" });
    }

    // 加密密碼
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 創建用戶
    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        realname,
        password: hashedPassword,
        userType: userType as UserType,
        isVerified: false,
        lastLoginAt: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        userType: true,
      },
    });

    if (userType == "HELPER") {
      const newHelperProfile = await prisma.helperProfile.create({
        data: {
          userId: newUser.id,
        },
      });
    }
    // else if (userType == "HOST") {
    //   const newHostProfile = await prisma.hostProfile.create({
    //     data: {
    //       userId: newUser.id,
    //       address: "eee",
    //       unitName: "ee",
    //     },
    //   });
    // }

    // 生成 JWT
    // const token = jwt.sign(
    //   {
    //     userId: newUser.id,
    //     email: newUser.email,
    //     username: newUser.username,
    //     userType: newUser.userType,
    //   },
    //   process.env.JWT_SECRET as string,
    //   { expiresIn: "24h" } as jwt.SignOptions
    // );

    return void res.status(201).json({
      success: true,
      message: "註冊成功",
      // token,
      user: newUser,
      isVerified: false,
    });
  } catch (error) {
    console.error("註冊時發生錯誤:", error);
    res.status(500).json({
      success: false,
      message: "伺服器內部錯誤",
    });
  }
});

router.post("/login", async (req: Request, res: Response) => {
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
      data: { updatedAt: new Date() },
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
});

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

// 註冊路由
// router.post(
//   "/register",
//   validateRegister,
//   handleValidationErrors
//   // AuthController.register
// );

// 登入路由
// router.post(
//   "/login",
//   validateLogin,
//   handleValidationErrors,
//   AuthController.login
// );

// 獲取用戶資料路由（需要認證）
// router.get("/profile", authenticateToken, AuthController.getProfile);

// 更新用戶資料路由（需要認證）
// router.put(
//   "/profile",
//   authenticateToken,
//   [
//     body("username")
//       .optional()
//       .isLength({ min: 3, max: 20 })
//       .withMessage("用戶名必須為 3-20 個字符")
//       .matches(/^[a-zA-Z0-9_]+$/)
//       .withMessage("用戶名只能包含字母、數字和下劃線"),
//   ],
//   handleValidationErrors,
//   AuthController.updateProfile
// );

// 修改密碼路由（需要認證）
// router.put(
//   "/change-password",
//   authenticateToken,
//   [
//     body("currentPassword").notEmpty().withMessage("請輸入當前密碼"),

//     body("newPassword")
//       .isLength({ min: 6 })
//       .withMessage("新密碼至少需要 6 個字符")
//       .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
//       .withMessage("新密碼必須包含至少一個大寫字母、一個小寫字母和一個數字"),
//   ],
//   handleValidationErrors,
//   AuthController.changePassword
// );

export default router;
