export interface Conversation {
  id: string;
  type: "DIRECT" | "GROUP";
  lastMessageAt?: Date;
  participants: ConversationParticipant[];
  messages?: Message[];
}

export interface ConversationParticipant {
  userId: string;
  participantRole: "HELPER" | "HOST";
  lastReadAt?: Date;
  user?: User;
}
export interface User {
  id: string;
  username: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: "TEXT" | "IMAGE" | "FILE";
  isRead: boolean;
  createdAt: Date;
  sender?: User;
}
