import dotenv from "dotenv";
dotenv.config();
import express from "express";
import path from "path";
import cors from "cors";

import uploadRouter from "./routes/uploads";
import worksRouter from "./routes/works";
import subscribeRouter from "./routes/subscribe";
import authRouter from "./routes/auth";
import profileRouter from "./routes/profile";
import notificationRouter from "./routes/notification";
// import {
//   securityHeaders,
//   generalLimiter,
//   authLimiter,
//   errorHandler,
// } from "./middlewares/security";

const app = express();
const port = 3000;

// 中介層
app.use(express.json());
app.use(
  cors({
    origin: ["https://9e275b52.haloopf.pages.dev", "http://localhost:3000"],
    credentials: true,
  })
);
// app.use(securityHeaders);
// app.use(generalLimiter);
// app.use("/api/auth", authLimiter);
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));

//路由
app.use("/api/uploads", uploadRouter);
app.use("/api/works", worksRouter);
app.use("/api/subscribe", subscribeRouter);
app.use("/api/auth", authRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/profile", profileRouter);

import { sendNotificationToHelper } from "./routes/notification";

const notificationData = {
  type: "通知類型",
  title: "通知標題",
  message: "通知內容",
  unitName: " 店家名稱",
  positionName: " 職位名稱",
  timestamp: new Date(),
  isRead: false,
};
sendNotificationToHelper(`cmb81cf4z0000d93wq8eu9cp0`, notificationData);

// 提供靜態檔案
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/account", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "account.html"));
});

app.get("/works", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "works.html"));
});
// // 掛載  CSS, Images
// const publicPath = path.resolve(__dirname, "../../vite/public");
// app.use(express.static(publicPath));

// // 掛載Html
// const htmlPath = path.resolve(__dirname, "../../vite");
// app.use(express.static(htmlPath));

// 掛載 dist（JS）
// const distPath = path.resolve(__dirname, "../../vite/dist");
// app.use("/dist", express.static(distPath));

// app.get("/", (_req, res) => {
//   res.sendFile(path.join(htmlPath, "index.html"));
// });

// 啟動伺服器
app.listen(port, () => {
  console.log(`伺服器啟動於 http://localhost:${port}`);
});
