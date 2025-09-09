import prisma from "../config/database.js";
import express, { Request, Response } from "express";
const router = express.Router();
import { authorizeRole, AuthenticatedRequest } from "../middlewares/auth.js";
import { WorkPostFilterInput } from "../types/Work.js";
import { indexNewWorkPost } from "../services/elasticsearch/recommendation.js";
import { notificationQueue } from "../config/queue.js";

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
      const formattedWorkPost = formatWorkPost(newWorkPost);
      // 同步至 Elasticsearch
      try {
        await indexNewWorkPost(newWorkPost);
        await enqueueNotificationJob(formattedWorkPost, hostProfile.unitName);
      } catch (error) {
        console.error("Error syncing new work post:", error);

        // await redis.lpush("failed:workposts", newWorkPost.id); // 記錄補償
      }
    } catch (error) {
      console.error("Error creating work post:", error);
      res.status(500).json({ message: "Failed to create work post" });
    }
  }
);

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

async function enqueueNotificationJob(post: any, unitName: string) {
  await notificationQueue.add("notifyForPost", { post, unitName });
  console.log(`Enqueued notification job for post ${post.id}`);
}

export default router;
