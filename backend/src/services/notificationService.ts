import { Server } from "socket.io";
import { getUserSockets } from "./socket/socketManager.js";
import prisma from "../config/database.js";
import { Notification } from "../types/Subscription.js";

let ioInstance: Server;

export const setIOInstance = (io: Server) => {
  ioInstance = io;
};

export const sendNotificationToUser = async (
  userId: string,
  eventName: string,
  notification: Notification
): Promise<boolean> => {
  if (!ioInstance) {
    console.error("Socket.IO 實例未初始化");
    return false;
  }

  try {
    if (process.env.NODE_ENV === "production") {
      ioInstance.to(`user_${userId}`).emit(eventName, notification);
      console.log(`事件 ${eventName} 已透過 Redis 發送給用戶 ${userId}`);
    } else {
      const userSockets = getUserSockets(userId);
      if (userSockets.length > 0) {
        userSockets.forEach((socketId) => {
          ioInstance.to(socketId).emit(eventName, notification);
        });
        console.log(
          ` [Local] 事件 ${eventName} 已發送給用戶 ${userId}，裝置數: ${userSockets.length}`
        );
      } else {
        console.log(`用戶 ${userId} 目前離線`);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error(`發送通知失敗:`, error);
    return false;
  }

  // else if (process.env.NODE_ENV === "development") {
  //   const userSockets = getUserSockets(userId);
  //   if (userSockets.length > 0) {
  //     // 發送給該用戶的所有連線
  //     userSockets.forEach((socketId) => {
  //       ioInstance.to(socketId).emit(eventName, notification);
  //     });

  //     console.log(
  //       `事件 ${eventName} 已發送給用戶 ${userId}，裝置數量: ${userSockets.length}`
  //     );
  //     return true;
  //   } else {
  //     console.log(
  //       `用戶 ${userId} 目前離線，事件 ${eventName} 將儲存為離線通知`
  //     );
  //     return false;
  //   }
  // }
};

// export const sendSocketNotificationToHelper = async (
//   helperId: string,
//   userId: string,
//   notification: any
// ): Promise<void> => {
//   try {
//     const helperProfile = await prisma.helperProfile.findUnique({
//       where: { id: helperId },
//     });
//     if (!helperProfile) {
//       console.error(
//         `HelperProfile with ID ${helperId} not found for user ${userId}`
//       );
//       return;
//     }

//     // 儲存到資料庫
//     await prisma.notification.create({
//       data: {
//         helperProfileId: helperId,
//         title: notification.title,
//         message: notification.message,
//         data: notification.data || {},
//         isRead: false,
//       },
//     });

//     const unreadCount = await prisma.notification.count({
//       where: {
//         helperProfileId: helperId,
//         isRead: false,
//       },
//     });

//     const sent = await sendNotificationToUser(
//       userId,
//       "new_notification",
//       notification
//     );

//     // 如果用戶在線，更新未讀數量
//     if (sent) {
//       await sendNotificationToUser(userId, "unread_count", {
//         count: unreadCount,
//       });
//     }
//   } catch (error) {
//     console.error(`發送通知給用戶 ${helperId} 失敗:`, error);
//     throw error;
//   }
// };
