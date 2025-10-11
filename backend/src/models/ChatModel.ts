import prisma from "../config/database.js";
import { Message } from "../types/Chat.js";

import { AppError } from "../utils/Error.js";

export async function FindOrCreateConversation(
  currentUserId: string,
  targetUserId: string
) {
  const sortedIds = [currentUserId, targetUserId].sort();
  const participantPair = `${sortedIds[0]}-${sortedIds[1]}`;
  return await prisma.conversation.upsert({
    where: { uniqueParticipantPair: participantPair },
    update: {},
    create: {
      type: "DIRECT",
      uniqueParticipantPair: participantPair,
      participants: {
        create: [
          { userId: currentUserId, participantRole: "HELPER" },
          { userId: targetUserId, participantRole: "HOST" },
        ],
      },
    },
    include: { participants: true },
  });
}

export async function FindAllConversationsByuserId(userId: string) {
  return await prisma.conversationParticipant.findMany({
    where: {
      userId,
    },
    include: {
      conversation: {
        include: {
          participants: {
            where: {
              userId: { not: userId },
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      conversation: {
        lastMessageAt: "desc",
      },
    },
  });
}

export async function CalculatUnreadCounts(
  conversationIds: string[],
  userId: string
) {
  return await prisma.message.groupBy({
    by: ["conversationId"],
    _count: { id: true },
    where: {
      conversationId: { in: conversationIds },
      senderId: { not: userId },
      isRead: false,
      createdAt: { gt: new Date(0) }, // 簡化 lastReadAt 邏輯
    },
  });
}

export async function FindMessagesByConversationId(
  conversationId: string,
  page: string,
  limit: string
): Promise<
  | {
      id: string;
      conversationId: string;
      content: string;
      senderId: string;
      isRead: boolean;
      createdAt: Date;
    }[]
  | null
> {
  return await prisma.message.findMany({
    where: { conversationId },
    select: {
      id: true,
      conversationId: true,
      content: true,
      senderId: true,
      isRead: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    skip: (parseInt(page as string) - 1) * parseInt(limit as string),
    take: parseInt(limit as string),
  });
}

export async function ValidateConversationAccess(
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

export async function MarkMessagesAsRead(
  userId: string,
  conversationId: string
): Promise<number> {
  return await prisma.$transaction(async (tx) => {
    // 更新訊息為已讀
    await tx.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    // 更新 lastReadAt
    await tx.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    // 計算新 unreadCount
    const unreadCount = await tx.message.count({
      where: { conversationId, senderId: { not: userId }, isRead: false },
    });

    return unreadCount;
  });
}

export async function CreateMessage(
  conversationId: string,
  content: string,
  userId: string,
  messageType?: "TEXT" | "IMAGE" | "FILE"
): Promise<Message> {
  return await prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: { conversationId, senderId: userId, content, messageType },
      include: { sender: { select: { id: true, username: true } } },
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });
    return message;
  });
}

export async function FindParticipantsInConversation(conversationId: string) {
  return await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      participants: { select: { userId: true } },
    },
  });
}

export async function MarkMessageAsRead(messageId: string) {
  await prisma.message.update({
    where: { id: messageId },
    data: { isRead: true },
  });
}

export async function CountUnreadCount(
  conversationId: string,
  recipientId: string
) {
  return await prisma.message.count({
    where: {
      conversationId,
      senderId: { not: recipientId },
      isRead: false,
    },
  });
}
