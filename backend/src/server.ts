//import basic utils
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

// import routers
import uploadRouter from "./controllers/uploads.js";
import worksRouter from "./controllers/works.js";
import subscriptionRouter from "./controllers/subscription.js";
import authRouter from "./controllers/auth.js";
import profileRouter from "./controllers/profile.js";
import workpostRouter from "./controllers/workpost.js";
import chatRouter from "./controllers/chat.js";
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
  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "https://haloop.yunn.space",
            "https://maps.googleapis.com",
            "https://maps.gstatic.com",
            "https://kit.fontawesome.com",
            "https://kit-free.fontawesome.com",
            "'unsafe-inline'",
          ],
          imgSrc: [
            "'self'",
            "https://d2n15xmo5dlxdb.cloudfront.net",
            "data:",
            "https://maps.gstatic.com", // Google Maps Tiles
            "https://maps.googleapis.com", // Google map marker icons
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://kit.fontawesome.com",
            "https://kit-free.fontawesome.com",
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "https://kit.fontawesome.com",
            "https://kit-free.fontawesome.com",
          ],
          connectSrc: [
            "'self'",
            "https://api.haloop.yunn.space",
            "https://haloop.yunn.space",
            "https://maps.googleapis.com",
          ],
          frameSrc: ["'self'"],
          objectSrc: ["'none'"],
          formAction: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.set("trust proxy", 1);
  //全域 limiter 防惡意攻擊
  const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 1000,
  });
  app.use(globalLimiter);

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  const looseLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  // 路由 ＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
  app.use("/api/uploads", strictLimiter, uploadRouter);
  app.use("/api/works", looseLimiter, worksRouter);
  app.use("/api/subscription", strictLimiter, subscriptionRouter);
  app.use("/api/auth", looseLimiter, authRouter);
  app.use("/api/profile", generalLimiter, profileRouter);
  app.use("/api/workpost", looseLimiter, workpostRouter);
  app.use("/api/chat", generalLimiter, chatRouter);

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
