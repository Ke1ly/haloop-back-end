import { Socket, Server } from "socket.io";
import { getUserSockets } from "./socketManager.js";
import prisma from "../../config/database.js";
import sanitizeHtml from "sanitize-html";

//types
import { Message } from "../../types/Chat.js";
import { CustomSocket } from "../socket/socketManager.js";

//models
import {
  ValidateConversationAccess,
  MarkMessagesAsRead,
  CreateMessage,
  FindParticipantsInConversation,
  MarkMessageAsRead,
  CountUnreadCount,
} from "../../models/ChatModel.js";

export const chatHandlers = (socket: CustomSocket, io: Server) => {
  const userId = socket.userId;

  // 加入對話房間
  socket.on("join_conversation", async (data: { conversationId: string }) => {
    const { conversationId } = data;
    //驗證權限
    const isValid = await ValidateConversationAccess(userId, conversationId);
    if (!isValid) {
      socket.emit("error", { message: "無權加入此對話" });
      return;
    }
    //加入對話房間
    socket.join(`conversation_${conversationId}`);
    console.log(`用戶 ${userId} 加入對話房間: ${conversationId}`);

    //更新 unreadCount
    const unreadCount = await MarkMessagesAsRead(userId, conversationId);
    socket.emit("unread_update", { conversationId, unreadCount });
  });

  // 離開對話房間
  socket.on("leave_conversation", async (data: { conversationId: string }) => {
    const { conversationId } = data;

    socket.leave(`conversation_${conversationId}`);
    console.log(`用戶 ${userId} 離開對話房間: ${conversationId}`);

    const isValid = await ValidateConversationAccess(userId, conversationId);
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
        const { conversationId, messageType = "TEXT" } = data;
        let { content } = data;
        content = sanitizeHtml(content, {
          allowedTags: [],
          allowedAttributes: {},
        });

        if (!content || content.length > 1000) {
          socket.emit("error", { message: "訊息內容過長" });
          return;
        }

        // 建立訊息
        const message: Message = await CreateMessage(
          conversationId,
          content,
          userId,
          messageType
        );

        // 查詢收訊方
        const conversation = await FindParticipantsInConversation(
          conversationId
        );

        let recipientId: string | undefined;
        if (conversation) {
          recipientId = conversation.participants.find(
            (p) => p.userId !== userId // 排除發訊方
          )?.userId;
        }

        // 如果收訊方已在房間內，即時標記該新訊息為已讀
        const room = `conversation_${conversationId}`;
        if (recipientId && (await isUserInRoom(io, recipientId, room))) {
          await MarkMessageAsRead(message.id);
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
          const unreadCount = await CountUnreadCount(
            conversationId,
            recipientId
          );
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
