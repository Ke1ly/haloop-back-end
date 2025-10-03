import { Redis } from "ioredis";
import { esClient } from "../config/esClient.js";
import prisma from "../config/database.js";

//services&utils
import { createAdapter } from "@socket.io/redis-adapter";
import { Server } from "socket.io";
import { Queue, Worker } from "bullmq";

//types
import { SUBSCRIPTIONS_PERCOLATOR_INDEX } from "../services/elasticsearch/elasticsearchManager.js";
// import { sendSocketNotificationToHelper } from "../services/notificationService.js";
import { formattedWorkPost } from "../types/Work.js";
import { MatchResult, Notification } from "../types/Subscription.js";

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: 6379,
  username: "default",
  password: process.env.REDIS_PASSWORD || "",
  tls: process.env.NODE_ENV === "production" ? {} : undefined,
  maxRetriesPerRequest: null,
};
const connection = new Redis(redisConfig);
export const notificationQueue = new Queue("notificationQueue", { connection });

let workerIOInstance: Server;
let sharedIOInstance: Server; // 用於本地開發測試

async function initWorkerSocketIO() {
  if (process.env.NODE_ENV === "production") {
    console.log("初始化 Worker Socket.IO...");

    const pubClient = new Redis(redisConfig);
    const subClient = new Redis(redisConfig);

    const io = new Server();
    io.adapter(createAdapter(pubClient, subClient));

    workerIOInstance = io;
    console.log("Worker Socket.IO 已初始化，使用 Redis 適配器");

    process.on("SIGTERM", async () => {
      await pubClient.quit();
      await subClient.quit();
      io.close();
    });
  } else {
    console.log("本地開發模式，共用 Backend Socket.IO 實例");
  }
}

export const setSharedIOInstance = (io: Server) => {
  sharedIOInstance = io;
  console.log(" 已設定共用 Socket.IO 實例（本地開發模式）");
};

// Worker 專用的通知發送函數
async function sendNotificationFromWorker(
  userId: string,
  eventName: string,
  notification: any
) {
  try {
    if (process.env.NODE_ENV === "production" && workerIOInstance) {
      workerIOInstance.to(`user_${userId}`).emit(eventName, notification);
      console.log(`[Worker-Redis] 事件 ${eventName} 已發送給用戶 ${userId}`);
    } else if (sharedIOInstance) {
      sharedIOInstance.to(`user_${userId}`).emit(eventName, notification);
      console.log(` [Worker-Local] 事件 ${eventName} 已發送給用戶 ${userId}`);
    } else {
      console.error("找不到可用的 Socket.IO 實例");
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Worker 發送通知失敗:`, error);
    return false;
  }
}

// 主初始化函數
async function init() {
  await initWorkerSocketIO();
  initNotificationWorker();
}

// 根據執行模式決定是否初始化
if (process.argv.includes("--worker") || process.env.NODE_MODE === "worker") {
  init().catch(console.error);
} else if (process.env.NODE_ENV === "development") {
  console.log("本地開發模式：Worker 將在 Backend 進程中運行");
}

export function initNotificationWorker() {
  const worker = new Worker(
    "notificationQueue",
    async (job) => {
      // 擴展多個 worker 時用，防止同一個 Job 被多個 Worker 同時拾取重複執行
      // const jobId = job.id;
      // const lockKey = `job:${jobId}:processing`;
      // const locked = await connection.setnx(lockKey, "1");
      // if (!locked) {
      //   console.log(`Job ${jobId} 已處理或重複，丟棄`);
      //   return;
      // }
      // await connection.expire(lockKey, 3600); // 1 小時失效

      const { post, unitName } = job.data;
      console.log(`Processing notifications for post ${post.id}`);

      const matches = await getMatchingSubscriptions(post);

      if (matches.length > 0) {
        await prisma.matchedWorkPost.createMany({
          data: matches.map((m) => ({
            workPostId: post.id,
            filterSubscriptionId: m.subscriptionId,
          })),
          skipDuplicates: true,
        });

        console.log(
          `found ${matches.length} matches，存入資料庫，準備發送通知`
        );
        matches.forEach((m) => {
          console.log(m.helperId, m.subscriptionId);
        });
        const matchedHelperIds = [
          ...new Set(matches.map((match) => match.helperId)),
        ];
        if (matchedHelperIds.length > 0) {
          await sendBatchNotificationsFromWorker(
            matchedHelperIds,
            post,
            unitName
          );
        }
      }
      // await connection.del(lockKey);
    },
    { connection, concurrency: 2, limiter: { max: 100, duration: 60000 } }
  );

  worker.on("failed", async (job, err) => {
    if (!job) {
      console.error("Job 未定義，無法移至死信佇列，錯誤:", err);
      return;
    }

    console.error(`Job ${job.id} 失敗:`, err);
    // 將失敗 Job 移至死信佇列
    try {
      await job.moveToFailed(err, "worker-token", false);
    } catch (moveError) {
      console.error(`移動 Job ${job.id} 至死信佇列失敗:`, moveError);
    }
  });

  worker.on("error", (error) => {
    console.error("Worker error:", error);
  });

  setInterval(async () => {
    await notificationQueue.clean(30 * 24 * 3600 * 1000, 1000, "completed"); // 清除 30 天前的 completed Job
  }, 24 * 3600 * 1000); // 每天執行一次 clean
  console.log("Notification Worker started");
}

async function getMatchingSubscriptions(formattedWorkPost: formattedWorkPost) {
  try {
    const response = await esClient.search({
      index: SUBSCRIPTIONS_PERCOLATOR_INDEX,
      body: {
        query: {
          percolate: {
            field: "query",
            document: formattedWorkPost,
          },
        },
      },
    });

    const matches: MatchResult[] = response.body.hits.hits.map((hit: any) => ({
      helperId: hit._source.helper_profile_id,
      subscriptionId: hit._source.subscription_id,
    }));

    return matches;
  } catch (error) {
    console.error("Percolator error:", error);
    return [];
  }
}

// async function sendBatchNotifications(
//   helperIds: string[],
//   workPost: any,
//   unitName: string
// ) {
//   const notification = {
//     id: `workpost_${workPost.id}_${Date.now()}`,
//     title: "新店家符合您的條件！",
//     message: `${unitName} 發佈了新貼文：${workPost.positionName}`,
//     data: {
//       workPostId: workPost.id,
//       unitName: unitName,
//       positionName: workPost.positionName,
//     },
//     timestamp: new Date().toISOString(),
//   };

//   const helperProfiles = await prisma.helperProfile.findMany({
//     where: { id: { in: helperIds } },
//     select: { id: true, userId: true },
//   });

//   const helperIdToUserId = new Map(
//     helperProfiles.map((profile) => [profile.id, profile.userId])
//   );

//   const results = await Promise.allSettled(
//     helperIds.map((helperId) => {
//       try {
//         const userId = helperIdToUserId.get(helperId);
//         if (!userId) {
//           throw new Error(`未找到對應的 helperProfile，helperId: ${helperId}`);
//         }
//         sendSocketNotificationToHelper(helperId, userId, notification);
//       } catch (error) {
//         console.error(`處理 helperId ${helperId} 失敗:`, error);
//         throw error;
//       }
//     })
//   );

//   // 記錄失敗的通知
//   results.forEach((result, index) => {
//     if (result.status === "rejected") {
//       console.error(
//         `Failed to send notification to helper ${helperIds[index]}:`,
//         result.reason
//       );
//     }
//   });
// }

// Worker 批次發送通知(取代原本sendBatchNotifications)
async function sendBatchNotificationsFromWorker(
  helperIds: string[],
  workPost: any,
  unitName: string
) {
  const notificationBase = {
    title: "新商家符合您的條件！",
    message: `${unitName} 發佈了新貼文：${workPost.positionName}`,
    data: {
      workPostId: workPost.id,
      unitName: unitName,
      positionName: workPost.positionName,
    },
  };

  // 取得 helper 對應的 user // 未來如果 helperIds 多，加分頁 { take: 100, skip: offset }
  const helperProfiles = await prisma.helperProfile.findMany({
    where: { id: { in: helperIds } },
    select: { id: true, userId: true },
  });

  // 批量插入資料
  const notificationsToCreate = helperProfiles.map((profile) => ({
    helperProfileId: profile.id,
    title: notificationBase.title,
    message: notificationBase.message,
    data: notificationBase.data,
    isRead: false,
  }));

  await prisma.notification.createMany({
    data: notificationsToCreate,
  });

  // 批量計算所有 helperProfileId 的未讀數
  const helperProfileIds = helperProfiles.map((p) => p.id);
  const unreadCounts = await prisma.notification.groupBy({
    by: ["helperProfileId"],
    _count: { id: true },
    where: {
      helperProfileId: { in: helperProfileIds },
      isRead: false,
    },
  });

  // 建立 map 快速查找未讀數
  const unreadMap = new Map(
    unreadCounts.map((c) => [c.helperProfileId, c._count.id || 0])
  );

  // 發送通知和未讀更新
  const promises = helperProfiles.map(async (profile) => {
    try {
      const notification: Notification = {
        id: `workpost_${workPost.id}_${Date.now()}`,
        ...notificationBase,
        timestamp: new Date().toISOString(),
      };

      // 透過 Worker Socket.IO 發送通知到房間
      await sendNotificationFromWorker(
        profile.userId,
        "new_notification",
        notification
      );

      // 更新未讀數量
      const unreadCount = unreadMap.get(profile.id) || 0;
      await sendNotificationFromWorker(profile.userId, "unread_count", {
        count: unreadCount,
      });
    } catch (error) {
      console.error(`處理 helper ${profile.id} 失敗:`, error);
    }
  });

  const results = await Promise.allSettled(promises);

  // 記錄失敗的通知
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `發送通知給 helper ${helperProfiles[index]?.id} 失敗:`,
        result.reason
      );
    }
  });
}
