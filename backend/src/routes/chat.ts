import prisma from "../config/database.js";
import express, { Request, Response } from "express";
const router = express.Router();
import { authorizeRole, AuthenticatedRequest } from "../middlewares/auth.js";

router.post(
  "/conversation",
  authorizeRole("HELPER"),
  async (req: AuthenticatedRequest, res: Response) => {
    const currentUserId = req.user?.userId;

    // 查詢該 user 對應的 helperProfile，必須是 Helper 才可以點按鈕與店家開啟對話
    const helperProfile = await prisma.helperProfile.findUnique({
      where: { userId: currentUserId },
    });
    if (!helperProfile) {
      return void res.status(404).json({ message: "Helper profile not found" });
    }

    const targetUserId = req.body.targetUserId;
    if (currentUserId === targetUserId) {
      throw new Error("您無法和自己建立對話");
    }

    //檢查是否有對話
    let conversation = await prisma.conversation.findFirst({
      where: {
        type: "DIRECT",
        participants: {
          some: { userId: currentUserId },
        },
        AND: {
          participants: {
            some: { userId: targetUserId },
          },
        },
      },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          type: "DIRECT",
          participants: {
            create: [
              {
                user: { connect: { id: currentUserId } },
                participantRole: "HELPER",
              },
              {
                user: { connect: { id: targetUserId } },
                participantRole: "HOST",
              },
            ],
          },
        },
        include: {
          participants: true,
        },
      });
    }
    res.json(conversation);
  }
);

router.get("/conversations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await prisma.conversationParticipant.findMany({
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
                    avatar: true,
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
    const formattedConversations = conversations.map((participant) => ({
      conversationId: participant.conversation.id,
      myRole: participant.participantRole,
      otherUser: participant.conversation.participants[0]?.user,
      otherUserRole: participant.conversation.participants[0]?.participantRole,
      lastMessage: participant.conversation.messages[0],
      lastMessageAt: participant.conversation.lastMessageAt,
      unreadCount: 0,
    }));

    res.json(formattedConversations);
  } catch (error) {
    console.error("獲取對話列表錯誤:", error);
    res.status(500).json({ error: "獲取對話列表失敗" });
  }
});

router.get("/messages/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = "1", limit = "50" } = req.query;

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    });

    res.json(messages.reverse()); // 讓最新訊息在下方
  } catch (error) {
    console.error("獲取訊息錯誤:", error);
    res.status(500).json({ error: "獲取訊息失敗" });
  }
});
export default router;
