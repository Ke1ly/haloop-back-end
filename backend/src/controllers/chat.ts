import express, { Request, Response } from "express";
const router = express.Router();

//middlewares
import { authorizeRole, AuthenticatedRequest } from "../middlewares/auth.js";

//models
import { FindHelperProfile } from "../models/UserModel.js";
import {
  FindOrCreateConversation,
  FindAllConversationsByuserId,
  CalculatUnreadCounts,
  FindMessagesByConversationId,
} from "../models/ChatModel.js";

router.post(
  "/conversation",
  authorizeRole("HELPER"),
  async (req: AuthenticatedRequest, res: Response) => {
    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      return void res.status(404).json({ message: "user not found" });
    }

    // 查詢該 user 對應的 helperProfile，必須是 Helper 才可以點按鈕與店家開啟對話
    const helperProfile = await FindHelperProfile(currentUserId);
    if (!helperProfile) {
      return void res.status(404).json({ message: "Helper profile not found" });
    }

    const targetUserId = req.body.targetUserId;
    if (currentUserId === targetUserId) {
      throw new Error("您無法和自己建立對話");
    }

    let conversation = await FindOrCreateConversation(
      currentUserId,
      targetUserId
    );

    res.json(conversation);
  }
);

router.get(
  "/conversations/:userId",
  authorizeRole(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const conversations = await FindAllConversationsByuserId(userId);

      // 批量計算所有 conversations 的未讀數
      const conversationIds = conversations.map((p) => p.conversationId);
      const unreadCounts = await CalculatUnreadCounts(conversationIds, userId);

      const unreadMap = new Map(
        unreadCounts.map((c) => [c.conversationId, c._count.id || 0])
      );

      const formattedConversations = conversations.map((participant) => {
        const unreadCount = unreadMap.get(participant.conversationId) || 0;
        return {
          conversationId: participant.conversation.id,
          myRole: participant.participantRole,
          otherUser: participant.conversation.participants[0]?.user,
          otherUserRole:
            participant.conversation.participants[0]?.participantRole,
          lastMessage: participant.conversation.messages[0],
          lastMessageAt: participant.conversation.lastMessageAt,
          unreadCount,
        };
      });

      res.json(formattedConversations);
    } catch (error) {
      console.error("獲取對話列表錯誤:", error);
      res.status(500).json({ error: "獲取對話列表失敗" });
    }
  }
);

router.get(
  "/messages/:conversationId",
  authorizeRole(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { conversationId } = req.params;
      let page = req.query.page as string;
      page = page || "1";
      let limit = req.query.limit as string;
      limit = limit || "50";

      const messages = await FindMessagesByConversationId(
        conversationId,
        page,
        limit
      );
      if (!messages) {
        res.json();
      } else {
        res.json(messages.reverse());
      }
    } catch (error) {
      console.error("獲取訊息錯誤:", error);
      res.status(500).json({ error: "獲取訊息失敗" });
    }
  }
);
export default router;
