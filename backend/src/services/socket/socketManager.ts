import prisma from "../../config/database.js";
import { Redis } from "ioredis";

import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";

//services & utils
import { createAdapter } from "@socket.io/redis-adapter";
import jwt from "jsonwebtoken";

//handlers
import { chatHandlers } from "./chatHandlers.js";
import { notificationHandlers } from "./notificationHandlers.js";
import { connectionHandlers } from "./connectionHandlers.js";

//types
import { JwtPayload } from "../../types/User.js";

export interface CustomSocket extends Socket {
  userId: string;
  userType?: "HELPER" | "HOST";
  helperProfileId?: string;
}
// declare module "socket.io" {
//   interface Socket {
//     userId: string;
//     userType?: "HELPER" | "HOST";
//     helperProfileId?: string;
//   }
// }

// 全域用戶連線映射
export const userSocketMap = new Map<string, Set<string>>(); // userId -> Set of socketIds

// Socket 管理器初始化
export const initializeSocket = async (
  httpServer: HttpServer
): Promise<SocketIOServer> => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"], // 支援多種傳輸方式  // MPA 下的連線設定
    allowEIO3: true, // 向下相容
  });

  if (process.env.NODE_ENV === "production") {
    console.log(" 初始化 Redis Adapter...");
    const pubClient = new Redis({
      host: process.env.REDIS_HOST,
      port: 6379,
      username: "default",
      password: process.env.REDIS_PASSWORD || "",
      tls: process.env.NODE_ENV === "production" ? {} : undefined,
      maxRetriesPerRequest: null,
    });
    const subClient = pubClient.duplicate();

    // 錯誤處理
    pubClient.on("error", (err) =>
      console.error("Redis pubClient error:", err)
    );
    subClient.on("error", (err) =>
      console.error("Redis subClient error:", err)
    );
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Socket.IO 使用 Redis Adapter");

    process.on("SIGTERM", async () => {
      await pubClient.quit();
      await subClient.quit();
      io.close();
    });
  } else {
    console.log("Socket.IO 使用本地記憶體模式");
  }

  // JWT 認證中介軟體
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("請提供 token"));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
      const customSocket = socket as CustomSocket; // 型別斷言
      customSocket.userId = decoded.userId;
      customSocket.userType = decoded.userType;

      // 查詢 helperProfileId（僅對 HELPER）
      if (decoded.userType === "HELPER") {
        const helperProfile: { id: string } | null =
          await prisma.helperProfile.findFirst({
            where: { userId: decoded.userId },
            select: { id: true },
          });
        if (helperProfile) {
          customSocket.helperProfileId = helperProfile.id;
        } else {
          return next(
            new Error(`未找到對應的 helperProfile，userId: ${decoded.userId}`)
          );
        }
      }

      next();
    } catch (err) {
      next(new Error("無效的 token"));
    }
  });

  // 主要連線處理
  io.on("connection", (socket: Socket) => {
    const customSocket = socket as CustomSocket; // 型別斷言
    const userId = customSocket.userId;
    const userType = customSocket.userType;

    console.log(
      `用戶連線 - ID: ${userId}, 類型: ${userType}, Socket: ${
        socket.id
      }, 頁面: ${socket.handshake.query.page || "unknown"}`
    );

    socket.join(`user_${userId}`);
    console.log(`用戶 ${userId} 已加入房間 user_${userId}`);

    // 註冊所有事件處理器
    connectionHandlers(customSocket, io, userSocketMap);
    chatHandlers(customSocket, io);
    notificationHandlers(customSocket, io);

    // 斷線處理
    socket.on("disconnect", (reason) => {
      console.log(`用戶 ${userId} 斷線，原因: ${reason}`);
      removeUserSocket(userId, socket.id);
    });
  });

  return io;
};

// 用戶連線管理輔助函數
export const addUserSocket = (userId: string, socketId: string): void => {
  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());
  }
  userSocketMap.get(userId)!.add(socketId);
};

export const removeUserSocket = (userId: string, socketId: string): void => {
  const userSockets = userSocketMap.get(userId);
  if (userSockets) {
    userSockets.delete(socketId);
    if (userSockets.size === 0) {
      userSocketMap.delete(userId);
    }
  }
};

export const getUserSockets = (userId: string): string[] => {
  const userSockets = userSocketMap.get(userId);
  return userSockets ? Array.from(userSockets) : [];
};

export const isUserOnline = (userId: string): boolean => {
  return userSocketMap.has(userId);
};
