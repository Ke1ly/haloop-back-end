import prisma from "../config/database.js";
import express, { Request, Response } from "express";
const router = express.Router();
import { authorizeRole, AuthenticatedRequest } from "../middlewares/auth.js";
import {
  WorkPostForRecommendation,
  ScoredPost,
  FilterSubscription,
  Subscription,
} from "../types/Work.js";
import redis from "../config/redis.js";
import { indexSubscriptionAsPercolator } from "../services/elasticsearch/elasticsearchManager.js";

router.post(
  "/",
  authorizeRole("HELPER"),
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      name,
      city,
      startDate,
      endDate,
      applicantCount,
      positionCategories = [],
      averageWorkHours,
      minDuration,
      accommodations = [],
      meals = [],
      experiences = [],
      environments = [],
    } = req.body;

    const userId = req.user?.userId;
    if (!userId) {
      return void res
        .status(401)
        .json({ success: false, message: "無法取得使用者資訊" });
    }

    // 查詢該 user 對應的 helperProfile
    const helperProfile = await prisma.helperProfile.findUnique({
      where: { userId: userId },
    });

    if (!helperProfile) {
      return void res.status(404).json({ message: "Helper profile not found" });
    }

    const data: any = {
      name: null,
      helperProfileId: helperProfile.id,
      city: null,
      startDate: null,
      endDate: null,
      applicantCount: null,
      averageWorkHours: null,
      minDuration: null,
      positionCategories: undefined, // 關聯欄位不可存 null，省略或給明確 connect
      accommodations: undefined,
      meals: undefined,
      experiences: undefined,
      environments: undefined,
      filters: {
        city: city ?? null,
        startDate: startDate ?? null,
        endDate: endDate ?? null,
        applicantCount: applicantCount ?? null,
        averageWorkHours: averageWorkHours ?? null,
        minDuration: minDuration ?? null,
        positionCategories: positionCategories ?? [],
        accommodations: accommodations ?? [],
        meals: meals ?? [],
        experiences: experiences ?? [],
        environments: environments ?? [],
      },
    };

    if (
      !(
        city ||
        startDate ||
        endDate ||
        applicantCount ||
        averageWorkHours ||
        minDuration ||
        positionCategories.length ||
        meals.length ||
        experiences.length ||
        accommodations.length ||
        experiences.length ||
        environments.length
      )
    ) {
      return void res.status(404).json({ message: "至少需要選擇一個條件" });
    }

    if (name) {
      data.name = name;
    } else {
      data.name = "未命名的訂閱";
    }
    if (city) data.city = city;

    if (startDate) {
      const parsedStartDate = new Date(startDate);
      if (!isNaN(parsedStartDate.getTime())) {
        data.startDate = parsedStartDate;
      } else {
        return void res.status(400).json({ error: "Invalid startDate" });
      }
    }

    if (endDate) {
      const parsedEndDate = new Date(endDate);
      if (!isNaN(parsedEndDate.getTime())) {
        data.endDate = parsedEndDate;
      } else {
        return void res.status(400).json({ error: "Invalid endDate" });
      }
    }

    if (applicantCount) data.applicantCount = applicantCount;
    if (averageWorkHours) data.averageWorkHours = averageWorkHours;
    if (minDuration) data.minDuration = minDuration;
    if (positionCategories.length > 0) {
      data.positionCategories = {
        connectOrCreate: positionCategories.map((name: string) => ({
          where: { name },
          create: { name },
        })),
      };
    }
    if (accommodations.length > 0) {
      data.accommodations = {
        connectOrCreate: accommodations.map((name: string) => ({
          where: { name },
          create: { name },
        })),
      };
    }

    if (meals.length > 0) {
      data.meals = {
        connectOrCreate: meals.map((name: string) => ({
          where: { name },
          create: { name },
        })),
      };
    }

    if (experiences.length > 0) {
      data.experiences = {
        connectOrCreate: experiences.map((name: string) => ({
          where: { name },
          create: { name },
        })),
      };
    }

    if (environments.length > 0) {
      data.environments = {
        connectOrCreate: environments.map((name: string) => ({
          where: { name },
          create: { name },
        })),
      };
    }
    const newSubscription = await prisma.filterSubscription.create({
      data,
    });

    // 將 subscription 索引到 ES 和 percolator
    await indexSubscriptionAsPercolator(newSubscription);

    res.status(201).json({ newSubscription });
  }
);

router.get(
  "/",
  authorizeRole("HELPER"),
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      return void res
        .status(401)
        .json({ success: false, message: "無法取得使用者資訊" });
    }

    // 查詢該 user 對應的 helperProfile
    const helperProfile = await prisma.helperProfile.findUnique({
      where: { userId: userId },
    });

    if (!helperProfile) {
      return void res.status(404).json({ message: "Helper profile not found" });
    }
    const helperProfileId = helperProfile.id;

    const subscriptions = await prisma.filterSubscription.findMany({
      where: {
        helperProfileId: helperProfileId,
      },
      select: { id: true, name: true, filters: true },
    });

    res.status(200).json({ subscriptions });
  }
);

router.get(
  "/recommendations",
  authorizeRole("HELPER"),
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      return void res
        .status(401)
        .json({ success: false, message: "無法取得使用者資訊" });
    }

    // 查詢該 user 對應的 helperProfile
    const helperProfile = await prisma.helperProfile.findUnique({
      where: { userId: userId },
    });

    if (!helperProfile) {
      return void res.status(404).json({ message: "Helper profile not found" });
    }
    const helperProfileId = helperProfile.id;

    //查詢 redis 中推薦貼文 Id
    const key = `recommended:userId:${helperProfileId}`;
    const postIds = await redis.zrevrange(key, 0, 4); // 取最新 5 筆

    //查詢推薦貼文資料
    const rawWorkPosts = await prisma.workPost.findMany({
      where: {
        id: { in: postIds },
      },
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

    res.status(200).json({ formattedWorkPosts });
  }
);

router.get(
  "/matched-posts",
  authorizeRole("HELPER"),
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // const subscriptionId = req.params.subscriptionId;
    const subscriptionId = req.query.id as string;

    // 驗證該 FilterSubscription 屬於當前使用者
    const subscription = await prisma.filterSubscription.findUnique({
      where: { id: subscriptionId },
      include: { helperProfile: { select: { userId: true } } },
    });
    if (!subscription || subscription.helperProfile.userId !== userId) {
      return res
        .status(404)
        .json({ message: "Subscription not found or unauthorized" });
    }

    // 查詢匹配貼文（按匹配時間降序）
    const matchedPosts = await prisma.matchedWorkPost.findMany({
      where: { filterSubscriptionId: subscriptionId },
      include: {
        workPost: {
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
        },
      },
      orderBy: { matchedAt: "desc" },
    });

    res
      .status(200)
      .json({ matchedPosts: matchedPosts.map((match) => match.workPost) });
  }
);

export default router;
