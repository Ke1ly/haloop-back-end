import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

if (process.env.NODE_ENV !== "production") {
  dotenv.config(); // 預設會讀 .env // 僅在本地時載入 .env 檔案
}

if (process.env.NODE_ENV === "development") {
  console.log(`當前執行環境: ${process.env.NODE_ENV}`);
}

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import prisma from "./config/database.js";
import http from "http";
import { Server, Socket } from "socket.io";

import uploadRouter from "./routes/uploads.js";
import worksRouter from "./routes/works.js";
import subscriptionRouter from "./routes/subscription.js";
import authRouter from "./routes/auth.js";
import profileRouter from "./routes/profile.js";
import notificationRouter from "./routes/notification.js";
import workpostRouter from "./routes/workpost.js";
import chatRouter from "./routes/chat.js";

import "./services/recommendScheduler.js";

const app = express();
const port = 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN, // 前端網址
    methods: ["GET", "POST"],
  },
});

// 中介層 ＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
app.use(express.json());
app.use(
  cors({
    origin: [process.env.CORS_ORIGIN!],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 路由 ＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
app.use("/api/uploads", uploadRouter);
app.use("/api/works", worksRouter);
app.use("/api/subscription", subscriptionRouter);
app.use("/api/auth", authRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/profile", profileRouter);
app.use("/api/workpost", workpostRouter);
app.use("/api/chat", chatRouter);

// 靜態檔案 ＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "dist")));
app.get("/workpost/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "workpost.html"));
});
app.get("/account", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "account.html"));
});

app.get("/works", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "works.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// socket 服務 ＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
declare module "socket.io" {
  interface Socket {
    userId: string;
  }
}

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("請提供 token"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    (socket as any).userId = (decoded as any).userId;
    next();
  } catch (err) {
    next(new Error("無效的 token"));
  }
});

const userSocketMap = new Map<string, string>(); // userId -> socketId

io.on("connection", (socket: Socket) => {
  console.log("使用者已連線，userId:", socket.userId);
  const userId = socket.userId;
  const oldSocketId = userSocketMap.get(userId);
  if (oldSocketId && oldSocketId !== socket.id) {
    io.to(oldSocketId).emit("force_logout", "你已在其他裝置登入");
    io.sockets.sockets.get(oldSocketId)?.disconnect();
  }
  userSocketMap.set(userId, socket.id);

  // 加入特定對話房間
  socket.on("join_conversation", (data: { conversationId: string }) => {
    socket.join(`conversation_${data.conversationId}`);
    console.log(`用戶加入對話房間: ${data.conversationId}`);
  });
  socket.on(
    "send_message",
    async (data: {
      conversationId: string;
      content: string;
      messageType?: "TEXT" | "IMAGE" | "FILE";
    }) => {
      try {
        const { conversationId, content, messageType = "TEXT" } = data;
        const senderId = socket.userId;

        if (!senderId) {
          socket.emit("error", { message: "用戶未認證" });
          return;
        }

        // 建立訊息
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId,
            content,
            messageType,
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        });

        // 更新對話的最後訊息時間
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: new Date() },
        });

        // 廣播訊息給對話房間內的所有用戶
        io.to(`conversation_${conversationId}`).emit("new_message", {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          messageType: message.messageType,
          createdAt: message.createdAt,
          sender: message.sender,
        });

        console.log(`訊息已發送到對話 ${conversationId}`);
      } catch (error) {
        console.error("發送訊息錯誤:", error);
        socket.emit("error", { message: "發送訊息失敗" });
      }
    }
  );
  socket.on("disconnect", () => {
    const currentSocket = userSocketMap.get(userId);
    if (currentSocket === socket.id) {
      userSocketMap.delete(userId);
    }
  });
});
console.log(io.engine.clientsCount);

// 啟動伺服器
const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
server.listen(port, host, () => {
  console.log(`伺服器啟動於 http://${host}:${port}`);
});
