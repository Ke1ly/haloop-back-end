import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { UserType } from "@prisma/client";

export const validateRegister = [
  body("email").isEmail().withMessage("請輸入有效的電子郵件").normalizeEmail(),

  body("realname")
    .trim()
    .isLength({ min: 2, max: 15 })
    .withMessage("真實姓名長度必須在 2-15 字之間")
    .matches(/^[\u4e00-\u9fa5\s]{2,}$|^[a-zA-Z\s]{2,}$/)
    .withMessage("請輸入有效的中文姓名或英文姓名")
    .custom((value) => {
      const trimmed = value.trim();
      if (/[\d!@#$%^&*(),.?":{}|<>]/.test(trimmed)) {
        throw new Error("真實姓名不應包含數字或特殊符號");
      }
      return true;
    }),

  body("username")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("用戶名稱必須為 3-20 個字符")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("用戶名只能包含字母、數字和下底線"),

  body("password")
    .trim()
    .isLength({ min: 6 })
    .withMessage("密碼至少需要 6 個字符")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("密碼必須包含至少一個大寫字母、一個小寫字母和一個數字"),

  body("userType")
    .isIn([UserType.HELPER, UserType.HOST])
    .withMessage("角色必須為「店家」或「幫手」"),

  // 根據 userType 檢查專屬欄位
  body().custom((value, { req }) => {
    const userType = req.body.userType;
    if (userType === UserType.HOST) {
      if (!req.body.unitName) throw new Error("店家必須提供單位名稱");
      if (!req.body.unitDescription) throw new Error("店家必須提供單位介紹");
      if (!req.body.address) throw new Error("店家必須提供地址");
      if (!req.body.city) throw new Error("店家必須提供縣市");
      if (!VALID_CITIES.includes(req.body.city)) {
        throw new Error("請選擇有效的縣市");
      }
      ["unitName", "unitDescription", "address"].forEach((key) => {
        if (/<[a-z][\s\S]*>/i.test(req.body[key])) {
          throw new Error(`${key} 不允許包含 HTML 標籤`);
        }
      });
    } else if (userType === UserType.HELPER) {
      if (!req.body.bio) throw new Error("幫手必須提供自我介紹");
      if (req.body.bio.length < 20) throw new Error("自我介紹至少 20 字");
      if (/<[a-z][\s\S]*>/i.test(req.body.bio)) {
        throw new Error("自我介紹不允許包含 HTML 標籤");
      }
    }
    return true;
  }),
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
    console.error("驗證錯誤:", errors.array());
    res.status(400).json({
      success: false,
      message: "驗證失敗",
      errors: errors.array().map((err) => err.msg),
    });
    return;
  }

  next();
};

const VALID_CITIES = [
  "臺北市",
  "新北市",
  "桃園市",
  "臺中市",
  "臺南市",
  "高雄市",
  "基隆市",
  "新竹市",
  "嘉義市",
  "宜蘭縣",
  "新竹縣",
  "苗栗縣",
  "彰化縣",
  "南投縣",
  "雲林縣",
  "嘉義縣",
  "屏東縣",
  "花蓮縣",
  "臺東縣",
  "澎湖縣",
  "金門縣",
  "連江縣",
] as const;

const emailValidation = body("email")
  .optional()
  .isEmail()
  .withMessage("請輸入有效的電子郵件")
  .normalizeEmail();

const realnameValidation = body("realname")
  .optional()
  .isLength({ min: 2, max: 15 })
  .withMessage("真實姓名長度必須在 2-15 字之間")
  .matches(/^[\u4e00-\u9fa5]{2,}$|^[a-zA-Z\s]{2,}$/)
  .withMessage("請輸入有效的中文姓名或英文姓名")
  .custom((value) => {
    const trimmed = value.trim();
    if (/[\d!@#$%^&*(),.?":{}|<>]/.test(trimmed)) {
      throw new Error("真實姓名不應包含數字或特殊符號");
    }
    return true;
  });

const usernameValidation = body("username")
  .optional()
  .trim()
  .isLength({ min: 3, max: 20 })
  .withMessage("用戶名稱必須為 3-20 個字符")
  .matches(/^[a-zA-Z0-9_]+$/)
  .withMessage("用戶名只能包含字母、數字和下底線");

const unitNameValidation = body("unitName")
  .optional()
  .notEmpty()
  .withMessage("單位名稱為必填")
  .custom((value) => {
    if (/<[a-z][\s\S]*>/i.test(value)) {
      throw new Error("不允許包含 HTML 標籤");
    }
    return true;
  });

const addressValidation = body("address")
  .optional()
  .notEmpty()
  .withMessage("地址為必填")
  .custom((value) => {
    if (/<[a-z][\s\S]*>/i.test(value)) {
      throw new Error("不允許包含 HTML 標籤");
    }
    return true;
  });
const cityValidation = body("city")
  .optional()
  .notEmpty()
  .withMessage("縣市為必填")
  .custom((value) => {
    if (!VALID_CITIES.includes(value)) {
      throw new Error("請選擇有效的縣市");
    }
    return true;
  })
  .trim();

const unitDescriptionValidation = body("unitDescription")
  .optional()
  .notEmpty()
  .withMessage("單位介紹為必填")
  .custom((value) => {
    if (/<[a-z][\s\S]*>/i.test(value)) {
      throw new Error("不允許包含 HTML 標籤");
    }
    return true;
  });

const bioValidation = body("bio")
  .trim()
  .optional()
  .isLength({ min: 20 })
  .withMessage("自我介紹至少 20 字")
  .custom((value) => {
    if (/<[a-z][\s\S]*>/i.test(value)) {
      throw new Error("不允許包含 HTML 標籤");
    }
    return true;
  });

// PATCH 專用的驗證函式
export const validatePatchProfile = (role: "HOST" | "HELPER") => {
  const validations = [emailValidation, realnameValidation, usernameValidation];

  if (role === "HOST") {
    validations.push(
      unitNameValidation,
      addressValidation,
      cityValidation,
      unitDescriptionValidation
    );
  } else if (role === "HELPER") {
    validations.push(bioValidation);
  }

  return validations;
};
