import prisma from "../config/database.js";
import express, { Request, Response } from "express";
const router = express.Router();
import { authorizeRole, AuthenticatedRequest } from "../middlewares/auth.js";
import {
  WorkPostFilterInput,
  WorkPostForFilter,
  FilterSubscription,
  Subscription,
} from "../types/Work.js";
import { sendSocketNotificationToHelper } from "../services/notificationService.js";
// import { indexNewWorkPost } from "../services/elasticsearch/recommendation.js";

router.post(
  "/",
  authorizeRole("HOST"),
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return void res.status(401).json({ message: "Unauthorized" });

    // 查詢該 user 對應的 HostProfile
    const hostProfile = await prisma.hostProfile.findUnique({
      where: { userId: userId },
      select: { id: true, unitName: true },
    });
    if (!hostProfile) {
      return void res.status(404).json({ message: "Host profile not found" });
    }

    try {
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

      // 使用 transaction 確保資料一致性
      const newWorkPost = await prisma.$transaction(async (tx) => {
        const modelMap = {
          positionCategory: tx.positionCategory,
          meal: tx.meal,
          requirement: tx.requirement,
          experience: tx.experience,
          environment: tx.environment,
          accommodation: tx.accommodation,
        } as const;

        type ModelMap = typeof modelMap;
        type ModelName = keyof ModelMap;

        async function upsertNames(modelName: ModelName, inputNames: string[]) {
          if (!inputNames || inputNames.length === 0) return;

          const model = modelMap[modelName] as {
            findMany: (args?: any) => Promise<any>;
            createMany: (args?: any) => Promise<any>;
          };
          const existing = await model.findMany({
            where: { name: { in: inputNames } },
            select: { name: true } as const,
          });
          const existingNames = new Set(
            existing.map((e: { name: string }) => e.name)
          );
          const toCreate = inputNames.filter(
            (name) => !existingNames.has(name)
          );
          if (toCreate.length > 0) {
            await model.createMany({
              data: toCreate.map((name) => ({ name })),
              skipDuplicates: true,
            });
          }
        }
        // 確保所有相關的 lookup 資料存在
        await Promise.all([
          upsertNames("positionCategory", positionCategories),
          upsertNames("meal", meals),
          upsertNames("requirement", requirements),
          upsertNames("experience", experiences),
          upsertNames("environment", environments),
          upsertNames("accommodation", accommodations),
        ]);

        //生成可選日期資料
        function getDaysBetween(start: string, end: string): string[] {
          const result: string[] = [];
          let startDate = new Date(start);
          const endDate = new Date(end);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);

          while (startDate <= endDate) {
            const dateStr = startDate.toISOString();
            result.push(dateStr);

            startDate.setDate(startDate.getDate() + 1);
          }

          return result;
        }
        const days = getDaysBetween(startDate, endDate);

        const newWorkPost = await tx.workPost.create({
          data: {
            unitId: hostProfile.id,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            recruitCount,
            positionName,
            positionCategories: {
              connect:
                positionCategories?.map((name: string) => ({ name })) || [],
            },
            averageWorkHours,
            minDuration,
            requirements: {
              connect: requirements?.map((name: string) => ({ name })) || [],
            },
            positionDescription,
            meals: {
              connect: meals?.map((name: string) => ({ name })) || [],
            },
            benefitsDescription,
            accommodations: {
              connect: accommodations?.map((name: string) => ({ name })) || [],
            },
            experiences: {
              connect: experiences?.map((name: string) => ({ name })) || [],
            },
            environments: {
              connect: environments?.map((name: string) => ({ name })) || [],
            },
            images:
              Array.isArray(images) && images.length > 0
                ? {
                    createMany: {
                      data: images.map((imageUrl: string) => ({ imageUrl })),
                    },
                  }
                : undefined,
            availabilities: {
              createMany: {
                data: days.map((date) => ({
                  date,
                  maxRecruitCount: recruitCount,
                  remainingRecruitCount: recruitCount,
                })),
              },
            },
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            positionName: true,
            recruitCount: true,
            averageWorkHours: true,
            minDuration: true,
            positionCategories: { select: { name: true } },
            meals: { select: { name: true } },
            experiences: { select: { name: true } },
            environments: { select: { name: true } },
            accommodations: { select: { name: true } },
            images: { select: { imageUrl: true } },
            availabilities: {
              select: {
                date: true,
                maxRecruitCount: true,
                remainingRecruitCount: true,
              },
            },
            unit: {
              select: {
                city: true,
              },
            },
          },
        });

        return newWorkPost;
      });
      res.status(201).json({ newWorkPost: newWorkPost });

      // 比對訂閱
      setImmediate(async () => {
        try {
          if (hostProfile) {
            await processWorkPostNotifications(newWorkPost, hostProfile);
          }
        } catch (error) {
          console.error("Background notification processing failed:", error);
          // 加入重試機制
        }
      });

      // 同步至 Elasticsearch
      // try {
      //   await indexNewWorkPost(newWorkPost);
      // } catch (error) {
      //   console.error("Error syncing new work post:", error);

      //   // await redis.lpush("failed:workposts", newWorkPost.id); // 記錄補償
      // }
    } catch (error) {
      console.error("Error creating work post:", error);
      res.status(500).json({ message: "Failed to create work post" });
    }
  }
);

// 回傳 { helperId, subscriptionId }[]
function getMatchingSubscriptions(
  formattedWorkPost: WorkPostForFilter,
  subscriptions: { id: string; helperProfileId: string; filters: any }[]
): { helperId: string; subscriptionId: string }[] {
  const hasIntersection = (
    postItems: string[],
    filterItems?: string[] | null
  ) => {
    if (
      filterItems === null ||
      filterItems === undefined ||
      filterItems.length === 0
    )
      return true;
    return postItems.some((item) => filterItems.includes(item));
  };

  const matches: { helperId: string; subscriptionId: string }[] = [];

  subscriptions.forEach((subscription) => {
    const f = subscription.filters;

    const subStart = f.startDate ? new Date(f.startDate) : undefined;
    const subEnd = f.endDate ? new Date(f.endDate) : undefined;

    const isDateValid =
      (!subStart || subStart >= formattedWorkPost.startDate) &&
      (!subEnd || subEnd <= formattedWorkPost.endDate);

    const isCityValid =
      f.city !== null &&
      f.city !== undefined &&
      formattedWorkPost.unit.city == f.city;

    const isRecruitValid =
      f.applicantCount !== null &&
      f.applicantCount !== undefined &&
      formattedWorkPost.recruitCount >= f.applicantCount;

    const isWorkValid =
      (f.averageWorkHours === null ||
        f.averageWorkHours === undefined ||
        formattedWorkPost.averageWorkHours <= f.averageWorkHours) &&
      (f.minDuration === null ||
        f.minDuration === undefined ||
        formattedWorkPost.minDuration <= f.minDuration);

    const isAccommodationsMatch = hasIntersection(
      formattedWorkPost.accommodations,
      f.accommodations
    );

    const isEnvironmentsMatch = hasIntersection(
      formattedWorkPost.environments,
      f.environments
    );

    const isExperiencesMatch = hasIntersection(
      formattedWorkPost.experiences,
      f.experiences
    );

    const isMealsMatch = hasIntersection(formattedWorkPost.meals, f.meals);
    const isPositionMatch = hasIntersection(
      formattedWorkPost.positionCategories,
      f.positionCategories
    );

    let isMatch =
      isDateValid &&
      isCityValid &&
      isRecruitValid &&
      isWorkValid &&
      (isAccommodationsMatch ||
        isEnvironmentsMatch ||
        isExperiencesMatch ||
        isMealsMatch ||
        isPositionMatch);
    if (isMatch) {
      matches.push({
        helperId: subscription.helperProfileId,
        subscriptionId: subscription.id,
      });
    }
  });
  return matches;
}

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

  if (applicantCount && applicantCount > 0) {
    filters.recruitCount = {
      gte: Number(applicantCount),
    };
  }

  if (averageWorkHours && averageWorkHours > 0) {
    filters.averageWorkHours = {
      lte: Number(averageWorkHours),
    };
  }
  if (minDuration && minDuration > 0) {
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

  const rawWorkPosts = await prisma.workPost.findMany({
    where: filters,
    select: {
      id: true,
      positionName: true,
      averageWorkHours: true,
      minDuration: true,
      positionCategories: { select: { name: true } },
      meals: { select: { name: true } },
      experiences: { select: { name: true } },
      environments: { select: { name: true } },
      accommodations: { select: { name: true } },
      images: {
        select: {
          imageUrl: true,
        },
      },
      unit: {
        select: {
          id: true,
          userId: true,
          city: true,
          unitName: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });
  const formattedWorkPosts = rawWorkPosts.map(formatWorkPost);
  res.status(200).json({ formattedWorkPosts });
});

function formatWorkPost(post: any) {
  return {
    ...post,
    images: (post.images ?? []).map((img: any) => img.imageUrl),
    positionCategories: (post.positionCategories ?? []).map(
      (cat: any) => cat.name
    ),
    accommodations: (post.accommodations ?? []).map((acc: any) => acc.name),
    meals: (post.meals ?? []).map((meal: any) => meal.name),
    experiences: (post.experiences ?? []).map((exp: any) => exp.name),
    environments: (post.environments ?? []).map((env: any) => env.name),
  };
}

// 背景處理通知
async function processWorkPostNotifications(
  newWorkPost: any,
  hostProfile: { id: string; unitName: string }
) {
  try {
    // 批次取出所有訂閱，使用分頁避免記憶體問題
    const BATCH_SIZE = 100;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const rawSubscriptions = await prisma.filterSubscription.findMany({
        select: {
          id: true,
          helperProfileId: true,
          filters: true,
        },
        skip: offset,
        take: BATCH_SIZE,
      });

      if (rawSubscriptions.length === 0) {
        hasMore = false;
        break;
      }

      // 整理訂閱格式
      function parseFilter(json: unknown): FilterSubscription {
        if (typeof json !== "object" || json === null || Array.isArray(json)) {
          throw new Error("Invalid filter format");
        }
        return json as FilterSubscription;
      }

      const subscriptions: {
        id: string;
        helperProfileId: string;
        filters: FilterSubscription;
      }[] = rawSubscriptions.map((subscription) => ({
        id: subscription.id,
        helperProfileId: subscription.helperProfileId,
        filters: parseFilter(subscription.filters),
      }));

      // 整理貼文格式
      const formattedWorkPost = formatWorkPost(newWorkPost);

      // 比對訂閱條件與貼文
      const matchedSubscriptions = getMatchingSubscriptions(
        formattedWorkPost,
        subscriptions
      );

      if (matchedSubscriptions.length > 0) {
        await prisma.matchedWorkPost.createMany({
          data: matchedSubscriptions.map((match) => ({
            workPostId: newWorkPost.id,
            filterSubscriptionId: match.subscriptionId,
          })),
          skipDuplicates: true,
        });
      }

      // 批次發送通知
      const matchedHelperIds = matchedSubscriptions.map(
        (match) => match.helperId
      );
      if (matchedHelperIds.length > 0) {
        await sendBatchNotifications(
          matchedHelperIds,
          newWorkPost,
          hostProfile.unitName
        );
      }

      offset += BATCH_SIZE;
    }
  } catch (error) {
    console.error("Error in processWorkPostNotifications:", error);
    throw error;
  }
}

// 批次發送通知函數
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
export default router;
