import prisma from "../config/database";
import express, { Request, Response } from "express";
const router = express.Router();
import { sendNotificationToHelper } from "./notification";
import { authorizeRole, AuthenticatedRequest } from "../middlewares/auth";
import {
  WorkPostFilterInput,
  WorkPostForFilter,
  FilterSubscription,
  HostProfileResponse,
  Subscription,
} from "../types/Work";

router.post(
  "/",
  authorizeRole("HOST"),
  async (req: AuthenticatedRequest, res: Response) => {
    console.log("02有經過/works");

    const userId = req.user?.userId; // 從 JWT middleware 解出的 payload
    if (!userId) return void res.status(401).json({ message: "Unauthorized" });

    // 查詢該 user 對應的 HostProfile
    const hostProfile = await prisma.hostProfile.findUnique({
      where: { userId: userId },
    });

    if (!hostProfile) {
      return void res.status(404).json({ message: "Host profile not found" });
    }

    try {
      // 解析 req.body
      const {
        startDate,
        endDate,
        recruitCount,
        images,
        positionName,
        positionCategories,
        averageWorkHours,
        minDuration,
        requirements,
        positionDescription,
        accommodations,
        meals,
        experiences,
        environments,
        benefitsDescription,
      } = req.body;

      //建立新貼文
      const newWorkPost = await prisma.workPost.create({
        data: {
          unitId: hostProfile.id,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          recruitCount,
          positionName,
          positionCategories: {
            connectOrCreate: positionCategories.map((item: string) => ({
              where: { name: item },
              create: { name: item },
            })),
          },
          averageWorkHours,
          minDuration,
          requirements: {
            connectOrCreate: requirements.map((item: string) => ({
              where: { name: item },
              create: { name: item },
            })),
          },
          positionDescription,
          meals: {
            connectOrCreate: meals.map((item: string) => ({
              where: { name: item },
              create: { name: item },
            })),
          },
          benefitsDescription,
          accommodations: {
            connectOrCreate: accommodations.map((item: string) => ({
              where: { name: item },
              create: { name: item },
            })),
          },
          experiences: {
            connectOrCreate: experiences.map((item: string) => ({
              where: { name: item },
              create: { name: item },
            })),
          },
          environments: {
            connectOrCreate: environments.map((item: string) => ({
              where: { name: item },
              create: { name: item },
            })),
          },
        },
        include: {
          positionCategories: true,
          requirements: true,
          accommodations: true,
          meals: true,
          experiences: true,
          environments: true,
          unit: true,
        },
      });
      console.log("04後端回傳newWorkPost", newWorkPost);

      if (Array.isArray(images) && images.length > 0) {
        await prisma.workPostImage.createMany({
          data: images.map((imageUrl: string) => ({
            imageUrl,
            workPostId: newWorkPost.id,
          })),
        });
      }
      res.status(201).json({ newWorkPost });

      //取出所有訂閱＿JSON版本
      const subscriptions = await prisma.filterSubscription.findMany({
        select: {
          helperProfileId: true,
          filters: true,
        },
      });
      console.log("05取出所有待檢查的subscriptions", subscriptions);

      // matchSubscription(newWorkPost, subscriptions);

      //取出所有訂閱＿資料庫版本
      // const subscriptions = await prisma.filterSubscription.findMany({
      //   include: {
      //     positionCategories: true,
      //     meals: true,
      //     experiences: true,
      //     environments: true,
      //     accommodations: true,
      //     // helperId:true
      //   },
      // });
      // console.log(subscriptions);

      //一一檢查這些訂閱，看新店家是否符和這些條件_JSON修改到一半
      // let matchedHelpers = [];

      // for (const subscription of subscriptions) {
      //   const filter = subscription.filters as FilterSubscription;
      //   const match = isMatch(
      //     filter,
      //     {
      //       ...newWorkPost,
      //       startDate: newWorkPost.startDate.toISOString(),
      //       endDate: newWorkPost.endDate.toISOString(),
      //     },
      //     hostProfile
      //   );
      //   if (match) {
      //     matchedHelpers.push(subscription.helperProfileId);
      //   }
      // }
      //一一檢查這些訂閱，看新店家是否符和這些條件＿資料庫版本
      // for (const subscription of subscriptions) {
      //   const filterInput = transformSubscriptionToFilter(subscription);
      //   const match = isMatch(filterInput, {
      //     ...newWorkPost,
      //     startDate: newWorkPost.startDate.toISOString(),
      //     endDate: newWorkPost.endDate.toISOString(),
      //   });
      //   if (match) {
      //     matchedHelpers.push(subscription.helperId);
      //     console.log("有符合！");
      //   } else {
      //     console.log("沒有符合！");
      //   }
      // }

      // 為每個符合條件的幫手發送通知＿不分版本
      // for (const helper of matchedHelpers) {
      //   const notification = {
      //     id: `notif_${Date.now()}_${helper}`, // 生成唯一通知 ID
      //     title: "新店家符合您的條件！",
      //     message: `${hostProfile.unitName} 發佈了新貼文，符合您的篩選條件`,
      //     unitName: hostProfile.unitName,
      //     positionName: newWorkPost.positionName,
      //   };
      //   sendNotificationToHelper(`${helper}`, notification);
      // }
    } catch (error) {
      console.error("發佈貼文時發生錯誤:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// function transformSubscriptionToFilter(
//   subscription: any
// ): FilterSubscription {
//   return {
//     city: subscription.city ?? undefined,
//     startDate: subscription.startDate ?? undefined,
//     endDate: subscription.endDate ?? undefined,
//     applicantCount: subscription.applicantCount ?? undefined,
//     averageWorkHours: subscription.averageWorkHours ?? undefined,
//     minDuration: subscription.minStay ?? undefined,
//     positionCategories: subscription.positionCategories?.map(
//       (item: any) => item.name
//     ),
//     accommodations: subscription.accommodations?.map((item: any) => item.name),
//     meals: subscription.meals?.map((item: any) => item.name),
//     experiences: subscription.experiences?.map((item: any) => item.name),
//     environments: subscription.environments?.map((item: any) => item.name),
//   };
// }

// function isMatch(
//   filter: FilterSubscription,
//   post: WorkPostForFilter,
//   unit: HostProfileResponse
// ): boolean {
//   if (filter.city && filter.city !== unit.city) return false;
//   if (filter.startDate && new Date(post.startDate) > new Date(filter.startDate))
//     return false;
//   if (filter.endDate && new Date(post.endDate) < new Date(filter.endDate))
//     return false;
//   if (
//     filter.applicantCount !== undefined &&
//     post.recruitCount < filter.applicantCount
//   )
//     return false;
//   if (
//     filter.averageWorkHours !== undefined &&
//     post.averageWorkHours > filter.averageWorkHours
//   ) {
//     return false;
//   }
//   if (
//     filter.minDuration !== undefined &&
//     post.minDuration > filter.minDuration
//   ) {
//     return false;
//   }
//   const arrayFields: (keyof Pick<
//     WorkPostFilterInput,
//     | "positionCategories"
//     | "accommodations"
//     | "meals"
//     | "experiences"
//     | "environments"
//   >)[] = [
//     "positionCategories",
//     "accommodations",
//     "meals",
//     "experiences",
//     "environments",
//   ];

//   for (const field of arrayFields) {
//     const filterValues = filter[field];
//     const postValues = post[field]?.map((item) => item.name);

//     if (filterValues && filterValues.length > 0) {
//       const hasMatch = filterValues.some((value) =>
//         postValues?.includes(value)
//       );
//       if (!hasMatch) return false;
//     }
//   }

//   return true;
// }

// function matchSubscription(
//   newWorkPost: any,
//   subscriptions: Subscription[]
// ): string[] {
//   const getIds = (items: { id: string }[]) => items.map((item) => item.id);

//   const workPostData = {
//     city: newWorkPost.unit.city,
//     startDate: newWorkPost.startDate,
//     endDate: newWorkPost.startDate,
//     recruitCount: newWorkPost.recruitCount,
//     averageWorkHours: newWorkPost.averageWorkHours,
//     minDuration: newWorkPost.minDuration,
//     positionCategories: getIds(newWorkPost.positionCategories),
//     accommodations: getIds(newWorkPost.accommodations),
//     meals: getIds(newWorkPost.meals),
//     experiences: getIds(newWorkPost.experiences),
//     environments: getIds(newWorkPost.environments),
//   };
//   console.log("整理即將進行比對的NewWorkPost資料", workPostData);

//   return subscriptions
//     .filter((sub) => {
//       const f = sub.filters;

//       // 比對 city
//       if (
//         f.city != null &&
//         (workPostData.city == null || workPostData.city !== f.city)
//       )
//         return false;

//       // 比對日期
//       if (f.startDate && workPostData.startDate > new Date(f.startDate))
//         return false;
//       if (f.endDate && workPostData.endDate < new Date(f.endDate)) return false;

//       // 比對人數、時數、期間
//       if (
//         f.applicantCount != null &&
//         workPostData.recruitCount < f.applicantCount
//       )
//         return false;
//       if (
//         f.averageWorkHours != null &&
//         workPostData.averageWorkHours > f.averageWorkHours
//       )
//         return false;
//       if (f.minDuration != null && workPostData.minDuration > f.minDuration)
//         return false;

//       // 比對交集項目，只要有交集就符合
//       const hasOverlap = (a: string[], b: string[]) =>
//         a.some((id) => b.includes(id));

//       if (
//         Array.isArray(f.positionCategories) &&
//         f.positionCategories.length > 0 &&
//         !hasOverlap(workPostData.positionCategories, f.positionCategories)
//       )
//         return false;
//       if (
//         Array.isArray(f.accommodations) &&
//         f.accommodations.length > 0 &&
//         !hasOverlap(workPostData.accommodations, f.accommodations)
//       )
//         return false;

//       if (
//         Array.isArray(f.meals) &&
//         f.meals.length > 0 &&
//         !hasOverlap(workPostData.meals, f.meals)
//       )
//         return false;
//       if (
//         Array.isArray(f.experiences) &&
//         f.experiences.length > 0 &&
//         !hasOverlap(workPostData.experiences, f.experiences)
//       )
//         return false;
//       if (
//         Array.isArray(f.environments) &&
//         f.environments.length > 0 &&
//         !hasOverlap(workPostData.environments, f.environments)
//       )
//         return false;

//       return true;
//     })
//     .map((sub) => sub.helperProfileId);
// }

// function sendNotificationToHelper(helperId: int, notification: any) {
//   const connection = connectedHelpers.get(helperId);

//   if (connection) {
//     // 格式化通知數據
//     const notificationData = {
//       type: "new_notification", // 通知類型
//       id: notification.id, // 通知 ID
//       title: notification.title, // 通知標題
//       message: notification.message, // 通知內容
//       storeId: notification.storeId, // 店家 ID
//       storeName: notification.storeName, // 店家名稱
//       timestamp: new Date().toISOString(), // 時間戳記
//       isRead: false, // 是否已讀
//     };

//     try {
//       // 發送 SSE 事件到前端
//       connection.write(`data: ${JSON.stringify(notificationData)}\n\n`);
//       console.log(`通知已發送給幫手 ${helperId}:`, notificationData.title);
//     } catch (error) {
//       console.error(`發送通知失敗 (幫手 ID: ${helperId}):`, error);
//       // 如果發送失敗，移除無效連接
//       connectedHelpers.delete(helperId);
//     }
//   } else {
//     console.log(`幫手 ${helperId} 目前未連線，無法發送通知`);
//   }
// }

// const connectedHelpers = new Map();

// router.get("/notifications/:helperId", (req: Request, res: Response) => {
//   const helperId = req.params.helperId; // 從 URL 參數取得幫手 ID

//   // 設定 SSE 必要的 headers
//   res.writeHead(200, {
//     "Content-Type": "text/event-stream", // 告訴瀏覽器這是 SSE 串流
//     "Cache-Control": "no-cache", // 禁止快取
//     Connection: "keep-alive", // 保持連接開啟
//     "Access-Control-Allow-Origin": "*", // 允許跨域
//     "Access-Control-Allow-Headers": "Cache-Control",
//   });

//   // 儲存此幫手的連接
//   connectedHelpers.set(helperId, res);

//   // 發送初始連接確認訊息
//   res.write(
//     `data: ${JSON.stringify({
//       type: "connected",
//       message: "通知服務已連接",
//       timestamp: new Date().toISOString(),
//     })}\n\n`
//   );

//   // 當連接斷開時清理
//   req.on("close", () => {
//     connectedHelpers.delete(helperId); // 從連接列表中移除
//     console.log(`幫手 ${helperId} 斷開連接`);
//   });

//   // 每 30 秒發送心跳包保持連接
//   const heartbeat = setInterval(() => {
//     if (connectedHelpers.has(helperId)) {
//       res.write(
//         `data: ${JSON.stringify({
//           type: "heartbeat",
//           timestamp: new Date().toISOString(),
//         })}\n\n`
//       );
//     } else {
//       clearInterval(heartbeat); // 如果連接已斷開，停止心跳
//     }
//   }, 30000);
// });

router.get("/", async (req: Request, res: Response) => {
  const {
    city,
    startDate,
    endDate,
    applicantCount,
    averageWorkHours,
    minDuration,
    positionCategories,
    accommodations,
    meals,
    experiences,
    environments,
  }: WorkPostFilterInput = req.query;
  const filters: any = {};
  if (city) {
    filters.unit = {
      city: String(city),
    };
  }

  if (startDate) {
    filters.startDate = {
      lte: new Date(startDate as string),
    };
  }

  if (endDate) {
    filters.endDate = {
      gte: new Date(endDate as string),
    };
  }

  if (applicantCount) {
    filters.recruitCount = {
      gte: Number(applicantCount),
    };
  }

  if (averageWorkHours) {
    filters.averageWorkHours = {
      lte: Number(averageWorkHours),
    };
  }
  if (minDuration) {
    filters.minDuration = {
      lte: Number(minDuration),
    };
  }

  if (positionCategories) {
    const positionCategoriesList = Array.isArray(positionCategories)
      ? positionCategories
      : [positionCategories];
    filters.positionCategories = {
      some: {
        name: {
          in: positionCategoriesList as string[],
        },
      },
    };
  }

  if (accommodations) {
    const accommodationsList = Array.isArray(accommodations)
      ? accommodations
      : [accommodations];
    filters.accommodations = {
      some: {
        name: {
          in: accommodationsList as string[],
        },
      },
    };
  }

  if (meals) {
    const mealsList = Array.isArray(meals) ? meals : [meals];
    filters.meals = {
      some: {
        name: {
          in: mealsList as string[],
        },
      },
    };
  }

  if (experiences) {
    const experiencesList = Array.isArray(experiences)
      ? experiences
      : [experiences];
    filters.experiences = {
      some: {
        name: {
          in: experiencesList as string[],
        },
      },
    };
  }

  if (environments) {
    const environmentsList = Array.isArray(environments)
      ? environments
      : [environments];
    filters.environments = {
      some: {
        name: {
          in: environmentsList as string[],
        },
      },
    };
  }
  console.log("後端即將以", filters, "搜尋");
  const workPostData = await prisma.workPost.findMany({
    where: filters,
    include: {
      positionCategories: true,
      meals: true,
      experiences: true,
      environments: true,
      accommodations: true,
      images: true,
      unit: true,
    },
  });
  res.status(200).json({ workPostData });
});

export default router;
