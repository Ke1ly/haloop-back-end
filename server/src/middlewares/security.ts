import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { Request, Response, NextFunction } from "express";

// 速率限制中間件
export const createRateLimit = (
  windowMs: number,
  max: number,
  message: string
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// 認證相關的速率限制
export const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 分鐘
  5, // 最多 5 次嘗試
  "請求過於頻繁，請稍後再試"
);

// 一般 API 速率限制
export const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 分鐘
  100, // 最多 100 次請求
  "請求過於頻繁，請稍後再試"
);

// 安全頭部中間件
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
});

// 錯誤處理中間件
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("服務器錯誤:", error);

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production" ? "內部服務器錯誤" : error.message,
  });
};
