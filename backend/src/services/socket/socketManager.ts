import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import prisma from "../../config/database.js";
import { chatHandlers } from "./chatHandlers.js";
import { notificationHandlers } from "./notificationHandlers.js";
import { connectionHandlers } from "./connectionHandlers.js";

// 全域用戶連線映射
export const userSocketMap = new Map<string, Set<string>>(); // userId -> Set of socketIds

// Socket 管理器初始化
export const initializeSocket = (httpServer: HttpServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"], // 支援多種傳輸方式  // MPA 下的連線設定
    allowEIO3: true, // 向下相容
  });

  // JWT 認證中介軟體
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("請提供 token"));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as any;
      (socket as any).userId = decoded.userId;
      (socket as any).userType = decoded.userType;

      // 查詢 helperProfileId（僅對 HELPER）
      if (decoded.userType === "HELPER") {
        const helperProfile = await prisma.helperProfile.findFirst({
          where: { userId: decoded.userId },
          select: { id: true },
        });
        if (helperProfile) {
          (socket as any).helperProfileId = helperProfile.id;
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
    const userId = (socket as any).userId;
    const userType = (socket as any).userType;

    console.log(
      `用戶連線 - ID: ${userId}, 類型: ${userType}, Socket: ${
        socket.id
      }, 頁面: ${socket.handshake.query.page || "unknown"}`
    );

    // 註冊所有事件處理器
    connectionHandlers(socket, io, userSocketMap);
    chatHandlers(socket, io);
    notificationHandlers(socket, io);

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
