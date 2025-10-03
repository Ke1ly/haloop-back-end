import prisma from "../../config/database.js";
//services & utils
import { Socket, Server } from "socket.io";
import { getUserSockets } from "./socketManager.js";
//types
import { Notification } from "../../types/Subscription.js";
import { CustomSocket } from "../socket/socketManager.js";

export const notificationHandlers = async (
  socket: CustomSocket,
  io: Server
) => {
  const userId = socket.userId;
  const helperProfileId = socket.helperProfileId;

  // 獲取未讀通知數量
  socket.on(
    "get_unread_count",
    async (
      callback: (response: { count: number } | { message: string }) => void
    ) => {
      try {
        if (!helperProfileId) {
          const error = {
            message: `未找到對應的 helperProfile，userId: ${userId}`,
          };
          console.error(error.message);
          socket.emit("error", error);
          if (typeof callback === "function") {
            callback(error);
          }
          return;
        }

        const count = await prisma.notification.count({
          where: {
            helperProfileId: helperProfileId,
            isRead: false,
          },
        });

        const response = { count };

        socket.emit("unread_count", response);

        if (typeof callback === "function") {
          callback(response);
        }
      } catch (error) {
        console.error("獲取未讀通知數量錯誤:", error);
        socket.emit("error", { message: "獲取通知失敗" });
      }
    }
  );

  // 標記通知為已讀
  socket.on("mark_notification_read", async (data: { userId: string }) => {
    try {
      if (!helperProfileId) {
        const error = {
          message: `未找到對應的 helperProfile，userId: ${userId}`,
        };
        console.error(error.message);
        socket.emit("error", error);
        return;
      }

      await prisma.notification.updateMany({
        where: {
          helperProfileId: helperProfileId,
          isRead: false,
        },
        data: { isRead: true },
      });

      const userSockets = getUserSockets(userId);

      // 同時更新未讀數量
      const newCount = await prisma.notification.count({
        where: {
          helperProfileId: helperProfileId,
          isRead: false,
        },
      });
      userSockets.forEach((socketId) => {
        io.to(socketId).emit("unread_count", { count: newCount });
      });
    } catch (error) {
      console.error("標記通知已讀錯誤:", error);
      socket.emit("error", { message: "標記通知失敗" });
    }
  });

  // 獲取通知列表
  socket.on(
    "get_notifications",
    async (
      data: {
        limit?: number;
        offset?: number;
      },
      callback
    ) => {
      try {
        if (!helperProfileId) {
          const error = {
            message: `未找到對應的 helperProfile，userId: ${userId}`,
          };
          console.error(error.message);
          socket.emit("error", error);
          if (typeof callback === "function") {
            callback(error);
          }
          return;
        }
        const { limit = 20, offset = 0 } = data;

        const notifications: Notification[] =
          await prisma.notification.findMany({
            where: { helperProfileId: helperProfileId },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
            select: {
              id: true,
              title: true,
              message: true,
              data: true,
              createdAt: true,
              isRead: true,
            },
          });

        const response = { notifications };
        socket.emit("notifications_list", response);
        if (typeof callback === "function") {
          callback(response);
        }
      } catch (error) {
        console.error("獲取通知列表錯誤:", error);
        socket.emit("error", { message: "獲取通知列表失敗" });
      }
    }
  );
};
