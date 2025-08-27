import { Socket, Server } from "socket.io";
import { addUserSocket, removeUserSocket } from "./socketManager.js";

export const connectionHandlers = (
  socket: Socket,
  io: Server,
  userSocketMap: Map<string, Set<string>>
) => {
  const userId = (socket as any).userId;
  const userType = (socket as any).userType;

  // 加入用戶連線映射
  addUserSocket(userId, socket.id);

  // 處理頁面特定的房間加入
  // socket.on("join_page", (data: { pageName: string }) => {
  //   const roomName = `page_${data.pageName}`;
  //   socket.join(roomName);
  //   console.log(`用戶 ${userId} 加入頁面房間: ${roomName}`);
  // });

  // socket.on("leave_page", (data: { pageName: string }) => {
  //   const roomName = `page_${data.pageName}`;
  //   socket.leave(roomName);
  //   console.log(`用戶 ${userId} 離開頁面房間: ${roomName}`);
  // });

  // 心跳檢測
  // socket.on("ping", (callback) => {
  //   if (typeof callback === "function") {
  //     callback({ timestamp: Date.now() });
  //   }
  // });

  // 獲取用戶狀態
  socket.on("get_user_status", (callback) => {
    const userSockets = userSocketMap.get(userId);
    const socketCount = userSockets ? userSockets.size : 0;

    if (typeof callback === "function") {
      callback({
        isOnline: socketCount > 0,
        deviceCount: socketCount,
        currentSocketId: socket.id,
      });
    }
  });
};
