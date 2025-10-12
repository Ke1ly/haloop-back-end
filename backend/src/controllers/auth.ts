import express, { Request, Response } from "express";

//middlewares
import { authorizeRole, AuthenticatedRequest } from "../middlewares/auth.js";
import {
  validateRegister,
  validateLogin,
  handleValidationErrors,
} from "../middlewares/validation.js";
import rateLimit from "express-rate-limit";

//types
import { RegisterRequest, LoginRequest } from "../types/User.js";
import { GeocodeResult } from "../types/Utils.js";

//services & utils
import { geocodeAddress } from "../utils/geo.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/Error.js";

//models
import {
  FindExistingUser,
  CreateUser,
  FindUserByEamil,
  updateLoginTime,
  FindUserById,
} from "../models/UserModel.js";

const router = express.Router();

router.post(
  "/register",
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: "Too many register attempts.",
  }),
  validateRegister,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    // const {
    //   email,
    //   realname,
    //   username,
    //   password,
    //   userType,
    //   unitName,
    //   unitDescription,
    //   address,
    //   city,
    //   bio,
    // } = req.body as RegisterRequest;

    const { email, realname, username, password, userType } =
      req.body as RegisterRequest;

    let unitName: string | undefined;
    let unitDescription: string | undefined;
    let address: string | undefined;
    let city: string | undefined;
    let bio: string | undefined;

    if (userType === "HOST") {
      ({ unitName, unitDescription, address, city } = req.body);
    } else if (userType === "HELPER") {
      ({ bio } = req.body);
    } else {
      return res
        .status(400)
        .json({ success: false, message: "無效的 userType" });
    }

    // 檢查是否已註冊
    const existingUser = await FindExistingUser(email, username);
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

    //地址轉經緯度
    let geo: GeocodeResult;
    let latitude, longitude, district;
    if (userType === "HOST") {
      if (!unitName || !address || !city) {
        return res.status(400).json({
          success: false,
          message: "店家註冊需填寫單位名稱、地址與縣市",
        });
      }
      geo = await geocodeAddress(address);
      latitude = geo.latitude;
      longitude = geo.longitude;
      district = geo.district;
    }

    //創建 user 與 profile
    try {
      const newUser = await CreateUser({
        email,
        username,
        realname,
        hashedPassword,
        userType,
        bio: userType === "HELPER" ? bio : undefined,
        unitName: userType === "HOST" ? unitName : undefined,
        unitDescription: userType === "HOST" ? unitDescription : undefined,
        address: userType === "HOST" ? address : undefined,
        city: userType === "HOST" ? city : undefined,
        latitude,
        longitude,
        district,
      });

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
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: "Too many register attempts.",
  }),
  validateLogin,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { email, password }: LoginRequest = req.body;

      // 查找用戶
      const user = await FindUserByEamil(email);

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
        { expiresIn: "1h" } as jwt.SignOptions
      );

      // 更新最後登入時間
      await updateLoginTime(user.id);

      res.cookie("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // dev 時不在 HTTPS 下傳送，設 false
        // sameSite: process.env.NODE_ENV === "production" ? "lax" : "none",
        sameSite: "lax",
        domain: ".haloop.yunn.space",
        maxAge: 1000 * 60 * 60,
        path: "/",
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
      if (!userId) {
        res.status(404).json({
          success: false,
          message: "用戶不存在",
        });
        return;
      }

      const user = await FindUserById(userId);

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

router.post(
  "/logout",
  authorizeRole(),
  (req: AuthenticatedRequest, res: Response) => {
    res.clearCookie("session_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    res.json({ success: true, message: "Logged out" });
  }
);

export default router;
