import prisma from "../config/database.js";
import express, { Request, Response } from "express";
const router = express.Router();
import { sendNotificationToHelper } from "./notification.js";
import { authorizeRole, AuthenticatedRequest } from "../middlewares/auth.js";
import {
  WorkPostFilterInput,
  WorkPostForFilter,
  FilterSubscription,
  Subscription,
} from "../types/Work.js";

router.post(
  "/",
  authorizeRole("HOST"),
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return void res.status(401).json({ message: "Unauthorized" });

    // 查詢該 user 對應的 HostProfile
    const hostProfile = await prisma.hostProfile.findUnique({
      where: { userId: userId },
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
          unit: {
            select: {
              city: true,
            },
          },
        },
      });

      //儲存圖片
      if (Array.isArray(images) && images.length > 0) {
        await prisma.workPostImage.createMany({
          data: images.map((imageUrl: string) => ({
            imageUrl,
            workPostId: newWorkPost.id,
          })),
        });
      }

      //儲存可選日期
      function getDaysBetween(start: string, end: string): string[] {
        const result: string[] = [];
        let startDate = new Date(start);
        const endDate = new Date(end);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        while (startDate <= endDate) {
          const dateStr = startDate.toISOString().split("T")[0]; // yyyy-mm-dd
          result.push(dateStr);

          startDate.setDate(startDate.getDate() + 1);
        }

        return result;
      }
      const days = getDaysBetween(startDate, endDate);
      const availabilities = days.map((date) => ({
        date,
        workPostId: newWorkPost.id,
        maxRecruitCount: newWorkPost.recruitCount,
        remainingRecruitCount: newWorkPost.recruitCount,
      }));
      await prisma.availability.createMany({ data: availabilities });

      res.status(201).json({ newWorkPost });

      //取出所有訂閱
      const rawSubscriptions = await prisma.filterSubscription.findMany({
        select: {
          helperProfileId: true,
          filters: true,
        },
      });

      //整理訂閱格式
      function parseFilter(json: unknown): FilterSubscription {
        if (typeof json !== "object" || json === null || Array.isArray(json)) {
          throw new Error("Invalid filter format");
        }
        return json as FilterSubscription;
      }

      const subscriptions: Subscription[] = rawSubscriptions.map(
        (subscription) => ({
          helperProfileId: subscription.helperProfileId,
          filters: parseFilter(subscription.filters),
        })
      );

      //整理貼文格式
      const formattedWorkPosts = formatWorkPost(newWorkPost);

      //比對訂閱條件與貼文
      const matchedHelperIds = getMatchingHelperIds(
        formattedWorkPosts,
        subscriptions
      );

      // 為每個符合條件的幫手發送通知
      for (const helperId of matchedHelperIds) {
        const notification = {
          id: `notif_${Date.now()}_${helperId}`,
          title: "新店家符合您的條件！",
          message: `${hostProfile.unitName} 發佈了新貼文，符合您的篩選條件`,
          unitName: hostProfile.unitName,
          positionName: newWorkPost.positionName,
        };
        sendNotificationToHelper(`${helperId}`, notification);
      }
    } catch (error) {
      console.error("發佈貼文時發生錯誤:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

function getMatchingHelperIds(
  newWorkPost: WorkPostForFilter,
  subscriptions: Subscription[]
): string[] {
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

  return subscriptions
    .filter((subscription) => {
      const f = subscription.filters;
      const subStart = f.startDate ? new Date(f.startDate) : undefined;
      const subEnd = f.endDate ? new Date(f.endDate) : undefined;
      console.log(subStart, newWorkPost.startDate);
      const isDateValid =
        (!subStart || subStart >= newWorkPost.startDate) &&
        (!subEnd || subEnd <= newWorkPost.endDate);

      const isCityValid =
        f.city !== null &&
        f.city !== undefined &&
        newWorkPost.unit.city == f.city;

      const isRecruitValid =
        f.applicantCount !== null &&
        f.applicantCount !== undefined &&
        newWorkPost.recruitCount >= f.applicantCount;

      const isWorkValid =
        (f.averageWorkHours === null ||
          f.averageWorkHours === undefined ||
          newWorkPost.averageWorkHours <= f.averageWorkHours) &&
        (f.minDuration === null ||
          f.minDuration === undefined ||
          newWorkPost.minDuration <= f.minDuration);

      const isAccommodationsMatch = hasIntersection(
        newWorkPost.accommodations,
        f.accommodations
      );
      const isEnvironmentsMatch = hasIntersection(
        newWorkPost.environments,
        f.environments
      );
      const isExperiencesMatch = hasIntersection(
        newWorkPost.experiences,
        f.experiences
      );
      const isMealsMatch = hasIntersection(newWorkPost.meals, f.meals);
      const isPositionMatch = hasIntersection(
        newWorkPost.positionCategories,
        f.positionCategories
      );
      console.log(
        isDateValid,
        isRecruitValid,
        isWorkValid,
        isCityValid,
        isAccommodationsMatch,
        isEnvironmentsMatch,
        isExperiencesMatch,
        isPositionMatch
      );
      return (
        isDateValid &&
        isCityValid &&
        isRecruitValid &&
        isWorkValid &&
        (isAccommodationsMatch ||
          isEnvironmentsMatch ||
          isExperiencesMatch ||
          isMealsMatch ||
          isPositionMatch)
      );
    })

    .map((sub) => sub.helperProfileId);
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
          address: true,
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

export default router;
