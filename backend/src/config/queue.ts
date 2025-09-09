import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { esClient } from "../config/esClient.js";
import { SUBSCRIPTIONS_PERCOLATOR_INDEX } from "../services/elasticsearch/elasticsearchManager.js";
import prisma from "../config/database.js";
import { sendSocketNotificationToHelper } from "../services/notificationService.js";

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  username: "default",
  password: process.env.REDIS_PASSWORD || "",
  tls: process.env.NODE_ENV === "production" ? {} : undefined,
  maxRetriesPerRequest: null,
});

export const notificationQueue = new Queue("notificationQueue", { connection });

// Worker
export function initNotificationWorker() {
  new Worker(
    "notificationQueue",
    async (job) => {
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
          `found ${matches.length} matches， ${matches} ，存入資料庫，準備發送通知`
        );
        const matchedHelperIds = [
          ...new Set(matches.map((match) => match.helperId)),
        ];
        if (matchedHelperIds.length > 0) {
          await sendBatchNotifications(matchedHelperIds, post, unitName);
        }
      }
    },
    { connection, concurrency: 2, limiter: { max: 100, duration: 60000 } }
  ).on("error", (error) => {
    console.error("Worker error:", error);
  });

  setInterval(async () => {
    await notificationQueue.clean(24 * 3600 * 1000, 1000, "completed");
  }, 24 * 3600 * 1000);
  console.log("Notification Worker started");
}

async function getMatchingSubscriptions(formattedWorkPost: any) {
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

    const matches = response.body.hits.hits.map((hit: any) => ({
      helperId: hit._source.helper_profile_id,
      subscriptionId: hit._source.subscription_id,
    }));

    return matches;
  } catch (error) {
    console.error("Percolator error:", error);
    return [];
  }
}

async function sendBatchNotifications(
  helperIds: string[],
  workPost: any,
  unitName: string
) {
  const notification = {
    id: `workpost_${workPost.id}_${Date.now()}`,
    title: "新店家符合您的條件！",
    message: `${unitName} 發佈了新貼文：${workPost.positionName}`,
    data: {
      workPostId: workPost.id,
      unitName: unitName,
      positionName: workPost.positionName,
    },
    timestamp: new Date().toISOString(),
  };

  const helperProfiles = await prisma.helperProfile.findMany({
    where: { id: { in: helperIds } },
    select: { id: true, userId: true },
  });

  const helperIdToUserId = new Map(
    helperProfiles.map((profile) => [profile.id, profile.userId])
  );

  const results = await Promise.allSettled(
    helperIds.map((helperId) => {
      try {
        const userId = helperIdToUserId.get(helperId);
        if (!userId) {
          throw new Error(`未找到對應的 helperProfile，helperId: ${helperId}`);
        }
        sendSocketNotificationToHelper(helperId, userId, notification);
      } catch (error) {
        console.error(`處理 helperId ${helperId} 失敗:`, error);
        throw error;
      }
    })
  );

  // 記錄失敗的通知
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Failed to send notification to helper ${helperIds[index]}:`,
        result.reason
      );
    }
  });
}
