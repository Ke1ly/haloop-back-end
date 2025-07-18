import prisma from "../config/database.js";
import express, { Request, Response } from "express";
const router = express.Router();
import { Notification } from "../types/User.js";

const connectedHelpers = new Map<string, Response>();

router.get("/stream/:helperId", (req, res) => {
  const helperId = req.params.helperId as string; // 從 URL 取得 helperId

  // 設定 SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream", // 告訴瀏覽器這是 SSE 串流
    "Cache-Control": "no-cache", // 禁止快取
    Connection: "keep-alive", // 保持連接開啟
    "Access-Control-Allow-Origin": "*", // 允許跨域
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  // 儲存此幫手的連接
  connectedHelpers.set(helperId, res);

  // 發送初始連接確認訊息
  res.write(
    `data: ${JSON.stringify({
      type: "connected",
      message: "通知服務已連接",
      timestamp: new Date().toISOString(),
    })}\n\n`
  );
  // 當連接斷開時清理
  req.on("close", () => {
    connectedHelpers.delete(helperId);
    console.log(`幫手 ${helperId} 斷開連接`);
  });
});

export function sendNotificationToHelper(
  helperId: string,
  notification: Notification
) {
  const connection = connectedHelpers.get(helperId);

  if (connection) {
    const notificationData = {
      type: "new_notification",
      //   id: notification.id,
      title: notification.title,
      message: notification.message,
      unitName: notification.unitName,
      positionName: notification.positionName,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    try {
      connection.write(`data: ${JSON.stringify(notificationData)}\n\n`);
      console.log(`通知已發送給幫手 ${helperId}:`, notificationData.title);
    } catch (error) {
      console.error(`發送通知失敗 (幫手 ID: ${helperId}):`, error);
      connectedHelpers.delete(helperId);
    }
  } else {
    console.log(`幫手 ${helperId} 目前未連線，無法發送通知`);
  }
}

export default router;
