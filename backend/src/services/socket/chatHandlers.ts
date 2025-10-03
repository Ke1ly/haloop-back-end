import { Socket, Server } from "socket.io";
import { getUserSockets } from "./socketManager.js";
import prisma from "../../config/database.js";

//types
import { Message } from "../../types/Chat.js";
import { CustomSocket } from "../socket/socketManager.js";

export const chatHandlers = (socket: CustomSocket, io: Server) => {
  const userId = socket.userId;

  // 加入對話房間
  socket.on("join_conversation", async (data: { conversationId: string }) => {
    const { conversationId } = data;
    const isValid = await validateConversationAccess(userId, conversationId);
    if (!isValid) {
      socket.emit("error", { message: "無權加入此對話" });
      return;
    }
    socket.join(`conversation_${conversationId}`);
    console.log(`用戶 ${userId} 加入對話房間: ${conversationId}`);

    const unreadCount = await markMessagesAsRead(userId, conversationId);
    socket.emit("unread_update", { conversationId, unreadCount });

    async function markMessagesAsRead(
      userId: string,
      conversationId: string
    ): Promise<number> {
      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false,
        },
        data: { isRead: true },
      });
      // 更新 lastReadAt
      await prisma.conversationParticipant.updateMany({
        where: {
          conversationId,
          userId,
        },
        data: {
          lastReadAt: new Date(),
        },
      });
      // 計算新 unreadCount 並 emit 更新
      const unreadCount = await prisma.message.count({
        where: { conversationId, senderId: { not: userId }, isRead: false },
      });
      return unreadCount;
    }
  });

  // 離開對話房間
  socket.on("leave_conversation", async (data: { conversationId: string }) => {
    const { conversationId } = data;

    socket.leave(`conversation_${conversationId}`);
    console.log(`用戶 ${userId} 離開對話房間: ${conversationId}`);

    const isValid = await validateConversationAccess(userId, conversationId);
    if (!isValid) {
      socket.emit("error", { message: "無權離開此對話" });
      return;
    }
  });

  // 發送訊息
  socket.on(
    "send_message",
    async (data: {
      conversationId: string;
      content: string;
      messageType?: "TEXT" | "IMAGE" | "FILE";
    }) => {
      try {
        const { conversationId, content, messageType = "TEXT" } = data;

        // 建立訊息
        const message: Message = await prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            content,
            messageType,
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        });

        // 更新對話最後訊息時間
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: new Date() },
        });

        // 查詢收訊方
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: {
            id: true,
            participants: { select: { userId: true } },
          },
        });
        let recipientId: string | undefined;
        if (conversation) {
          recipientId = conversation.participants.find(
            (p) => p.userId !== userId // 排除發訊方
          )?.userId;
        }
        // 如果收訊方已在房間內，即時標記該新訊息為已讀
        const room = `conversation_${conversationId}`;
        if (recipientId && (await isUserInRoom(io, recipientId, room))) {
          await prisma.message.update({
            where: { id: message.id },
            data: { isRead: true },
          });
        }

        // 廣播訊息至對話房間
        io.to(`conversation_${conversationId}`).emit("new_message_online", {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          messageType: message.messageType,
          createdAt: message.createdAt,
          sender: message.sender,
        });

        // 推送通知到收訊方 (僅如果未在房間內)
        if (recipientId && !(await isUserInRoom(io, recipientId, room))) {
          const unreadCount = await prisma.message.count({
            where: {
              conversationId,
              senderId: { not: recipientId },
              isRead: false,
            },
          });
          const recipientSockets = getUserSockets(recipientId);
          recipientSockets.forEach((socketId) => {
            io.to(socketId).emit("new_message_offline", {
              id: message.id,
              conversationId: message.conversationId,
              senderId: message.senderId,
              content: message.content,
              createdAt: message.createdAt,
              unreadCount: unreadCount,
            });
          });
        }
      } catch (error) {
        console.error("發送訊息錯誤:", error);
        socket.emit("error", { message: "發送訊息失敗" });
      }
    }
  );

  // 正在輸入狀態
  socket.on("typing", (data: { conversationId: string; isTyping: boolean }) => {
    socket.to(`conversation_${data.conversationId}`).emit("user_typing", {
      userId,
      isTyping: data.isTyping,
    });
  });
};

// 檢查用戶是否在指定房間內
async function isUserInRoom(
  io: Server,
  userId: string,
  room: string
): Promise<boolean> {
  const userSockets = getUserSockets(userId);
  for (const socketId of userSockets) {
    const socket = await io.sockets.sockets.get(socketId);
    if (socket && socket.rooms.has(room)) {
      return true;
    }
  }
  return false;
}

async function validateConversationAccess(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      participants: { select: { userId: true } },
    },
  });
  if (
    !conversation ||
    !conversation.participants.some((p) => p.userId === userId)
  ) {
    return false;
  }
  return true;
}
