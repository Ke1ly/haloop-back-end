import prisma from "../config/database";
import express, { Request, Response } from "express";
const router = express.Router();
import { Notification } from "../types/User";

const connectedHelpers = new Map<string, Response>();

router.get("/stream/:helperId", (req, res) => {
  const helperId = req.params.helperId as string;

  // 設定 SSE 必要的 headers
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
    connectedHelpers.delete(helperId); // 從連接列表中移除
    console.log(`幫手 ${helperId} 斷開連接`);
  });
});

// 發送通知給特定幫手的函數
export function sendNotificationToHelper(
  helperId: string,
  notification: Notification
) {
  const connection = connectedHelpers.get(helperId);

  if (connection) {
    // 格式化通知數據
    const notificationData = {
      type: "new_notification", // 通知類型
      //   id: notification.id, // 通知 ID
      title: notification.title, // 通知標題
      message: notification.message, // 通知內容
      unitName: notification.unitName, // 店家名稱
      positionName: notification.positionName, // 職位名稱
      timestamp: new Date().toISOString(), // 時間戳記
      isRead: false, // 是否已讀
    };

    try {
      // 發送 SSE 事件到前端
      connection.write(`data: ${JSON.stringify(notificationData)}\n\n`);
      console.log(`通知已發送給幫手 ${helperId}:`, notificationData.title);
    } catch (error) {
      console.error(`發送通知失敗 (幫手 ID: ${helperId}):`, error);
      // 如果發送失敗，移除無效連接
      connectedHelpers.delete(helperId);
    }
  } else {
    console.log(`幫手 ${helperId} 目前未連線，無法發送通知`);
  }
}

export default router;
