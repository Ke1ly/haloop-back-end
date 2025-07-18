import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { UserType } from "../types/User.js";

export const validateRegister = [
  body("email").isEmail().withMessage("請輸入有效的電子郵件").normalizeEmail(),

  body("realname")
    .isLength({ min: 2, max: 10 })
    .withMessage("真實姓名長度必須在 2-10 字之間")
    .matches(/^[\u4e00-\u9fa5]{2,}$|^[a-zA-Z\s]{2,}$/)
    .withMessage("請輸入有效的中文姓名（至少 2 字）或英文姓名")
    .custom((value) => {
      const trimmed = value.trim();
      if (/[\d!@#$%^&*(),.?":{}|<>]/.test(trimmed)) {
        throw new Error("真實姓名不應包含數字或特殊符號");
      }
      return true;
    }),

  body("username")
    .isLength({ min: 3, max: 20 })
    .withMessage("用戶名稱必須為 3-20 個字符")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("用戶名只能包含字母、數字和下底線"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("密碼至少需要 6 個字符")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("密碼必須包含至少一個大寫字母、一個小寫字母和一個數字"),

  // body("confirmPassword").custom((value, { req }) => {
  //   if (value !== req.body.password) {
  //     throw new Error("確認密碼輸入錯誤，請重新確認密碼");
  //   }
  //   return true;
  // }),

  body("userType")
    .isIn([UserType.HELPER, UserType.HOST])
    .withMessage("角色必須為 HELPER 或 HOST"),
];
export const validateLogin = [
  body("email").isEmail().withMessage("請輸入有效的電子郵件").normalizeEmail(),
  body("password").notEmpty().withMessage("密碼不能為空"),
];

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "驗證失敗",
      errors: errors.array(),
    });
    return;
  }

  next();
};
