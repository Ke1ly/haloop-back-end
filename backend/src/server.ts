//import basic utils
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import http from "http";
// import routers
import uploadRouter from "./routes/uploads.js";
import worksRouter from "./routes/works.js";
import subscriptionRouter from "./routes/subscription.js";
import authRouter from "./routes/auth.js";
import profileRouter from "./routes/profile.js";
import workpostRouter from "./routes/workpost.js";
import chatRouter from "./routes/chat.js";
// import services
import "./services/elasticsearch/recommendation.js";
import { initializeSocket } from "./services/socket/socketManager.js";
import { setIOInstance } from "./services/notificationService.js";
import { initNotificationWorker, setSharedIOInstance } from "./config/queue.js";

async function main() {
  if (process.env.NODE_ENV === "development") {
    dotenv.config({ path: ".env.development" });
  }
  // else {
  //   dotenv.config({ path: ".env.production" });
  // }

  //set server
  const app = express();
  const port = 3000;

  // 初始化 Socket.IO
  const httpServer = http.createServer(app);
  const io = await initializeSocket(httpServer);
  setIOInstance(io); // 設定全域 IO 實例

  // middleware
  const corsOrigin = process.env.CORS_ORIGIN;
  if (!corsOrigin) {
    throw new Error("CORS_ORIGIN not set");
  }
  app.use(
    cors({
      origin: [corsOrigin],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(express.json());

  // 路由 ＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
  app.use("/api/uploads", uploadRouter);
  app.use("/api/works", worksRouter);
  app.use("/api/subscription", subscriptionRouter);
  app.use("/api/auth", authRouter);
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
  app.get("/chat", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "chat.html"));
  });
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });

  if (process.env.NODE_ENV === "development") {
    setSharedIOInstance(io);
    initNotificationWorker();
  }

  // 啟動伺服器
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
  httpServer.listen(port, host, () => {
    console.log(`伺服器啟動於 http://${host}:${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
