import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types/User";

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// export const authenticateToken = (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ): void => {
//   //從 Header 取得 token
//   const authHeader = req.headers["authorization"];
//   const token = authHeader && authHeader.split(" ")[1];

//   // 如果沒 token，return
//   if (!token) {
//     res.status(401).json({
//       success: false,
//       message: "未帶token，無權訪問",
//     });
//     return;
//   }

//   // 如果有 token，解析並回傳 paylload
//   try {
//     const decoded = jwt.verify(
//       token,
//       process.env.JWT_SECRET as string
//     ) as JwtPayload;
//     req.user = decoded;
//     next();
//   } catch (error) {
//     res.status(403).json({
//       success: false,
//       message: "無效的 token",
//     });
//   }
// };

export function authorizeRole(requiredRole?: "HOST" | "HELPER") {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    //從 Header 取得 token
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    // 如果沒 token，return
    if (!token) {
      res.status(401).json({
        success: false,
        message: "未帶token，無權訪問",
      });
      return;
    }

    // 如果有 token，解析並回傳 payload
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
      req.user = decoded;

      // 如果有 requiredRole， 檢查 payload 中的 userType
      if (requiredRole) {
        if (decoded.userType !== requiredRole) {
          return void res
            .status(403)
            .json({ success: false, message: "Forbidden: insufficient role" });
        }
      }
      next();
    } catch (err) {
      return void res
        .status(403)
        .json({ success: false, message: "Invalid token" });
    }
  };
}

export type { AuthenticatedRequest };
