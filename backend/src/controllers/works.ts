import express, { Request, Response } from "express";
const router = express.Router();
import sanitizeHtml from "sanitize-html";

//middlewares
import { authorizeRole, AuthenticatedRequest } from "../middlewares/auth.js";

//types
import {
  WorkPostFilterInput,
  RawWorkPost,
  formattedWorkPost,
} from "../types/Work.js";

//services&utils
import { indexNewWorkPost } from "../services/elasticsearch/recommendation.js";
import { notificationQueue } from "../config/queue.js";
import { formatWorkPost } from "../utils/formatWorkPost.js";

//models
import { FindHostProfile } from "../models/UserModel.js";
import { CreateWorkPost, FindWorkPostsByFilter } from "../models/PostModel.js";

router.post(
  "/",
  authorizeRole("HOST"),
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return void res.status(401).json({ message: "Unauthorized" });

    // 查詢該 user 對應的 HostProfile
    const hostProfile = await FindHostProfile(userId);
    if (!hostProfile) {
      return void res.status(404).json({ message: "Host profile not found" });
    }

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

    // basic validation
    const errors: string[] = [];
    if (
      !positionName ||
      !images?.length ||
      !startDate ||
      !endDate ||
      !recruitCount ||
      !averageWorkHours ||
      !minDuration
    ) {
      errors.push("請填寫所有必填欄位");
    }

    if (images.length < 3 || images.length > 8) {
      errors.push("請上傳 3–8 張圖片");
    }

    // 日期格式與邏輯
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      errors.push("請輸入有效的日期");
    } else if (end <= start) {
      errors.push("結束日期必須晚於開始日期");
    }

    // 陣列格式驗證
    const arrayFields = {
      positionCategories,
      accommodations,
      meals,
      experiences,
      environments,
      requirements,
    };
    for (const [key, value] of Object.entries(arrayFields)) {
      if (!Array.isArray(value)) {
        errors.push(`${key} 必須是陣列`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // XSS sanitize
    const cleanPositionDescription = sanitizeHtml(positionDescription ?? "", {
      allowedTags: [],
      allowedAttributes: {},
    });
    const cleanBenefitsDescription = sanitizeHtml(benefitsDescription ?? "", {
      allowedTags: [],
      allowedAttributes: {},
    });
    const cleanPositionName = sanitizeHtml(positionName ?? "", {
      allowedTags: [],
      allowedAttributes: {},
    });

    try {
      const newWorkPost = await CreateWorkPost(
        hostProfile.id,
        startDate,
        endDate,
        recruitCount,
        images,
        cleanPositionName,
        positionCategories,
        averageWorkHours,
        minDuration,
        requirements,
        cleanPositionDescription,
        accommodations,
        meals,
        experiences,
        environments,
        cleanBenefitsDescription
      );

      res.status(201).json({
        success: true,
        message: "工作貼文建立成功",
        newWorkPost: newWorkPost,
      });
      const formattedWorkPost: formattedWorkPost = formatWorkPost(newWorkPost);

      // 同步至 Elasticsearch，並交給 queue 執行訂閱比對
      try {
        await indexNewWorkPost(newWorkPost);
        await enqueueNotificationJob(formattedWorkPost, hostProfile.unitName);
      } catch (error) {
        console.error("Error syncing new work post:", error);
        // await redis.lpush("failed:workposts", newWorkPost.id); // 記錄補償
      }
    } catch (error) {
      console.error("Error creating work post:", error);
      return res.status(500).json({
        success: false,
        message: "伺服器錯誤，請稍後再試",
      });
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

  const rawWorkPosts: RawWorkPost[] = await FindWorkPostsByFilter(filters);
  const formattedWorkPosts: formattedWorkPost[] =
    rawWorkPosts.map(formatWorkPost);
  res.status(200).json({ formattedWorkPosts });
});

async function enqueueNotificationJob(
  post: formattedWorkPost,
  unitName: string
) {
  await notificationQueue.add(
    "notifyForPost",
    { post, unitName },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    }
  );
  console.log(`Enqueued notification job for post ${post.id}`);
}

export default router;
