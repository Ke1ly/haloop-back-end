import prisma from "../config/database";
import express, { Request, Response } from "express";
const router = express.Router();
import { authorizeRole, AuthenticatedRequest } from "../middlewares/auth";

router.post(
  "/",
  authorizeRole("HELPER"),
  async (req: AuthenticatedRequest, res: Response) => {
    console.log("02後端進入/subscribe");

    const {
      // name,
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

    // 查詢該 user 對應的 HostProfile
    const helperProfile = await prisma.helperProfile.findUnique({
      where: { userId: userId },
    });

    if (!helperProfile) {
      return void res.status(404).json({ message: "Helper profile not found" });
    }

    const data: any = {
      name: "我的訂閱", //之後從前端拿資料
      helperProfileId: helperProfile.id,
      city: null,
      startDate: null,
      endDate: null,
      applicantCount: null,
      averageWorkHours: null,
      minDuration: null,
      positionCategories: undefined, // 注意：這些是關聯欄位，不要存 null，應該省略或給明確 connect
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
    console.log("03後端準備要存進資料庫的訂閱條件", data);
    const newSubscription = await prisma.filterSubscription.create({
      data,
    });

    console.log("04後端回傳 newSubscription", newSubscription);
    res.status(201).json({ newSubscription });
  }
);
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  //取出所有訂閱＿JSON版本
  const subscriptions = await prisma.filterSubscription.findMany({
    select: {
      helperProfileId: true,
      filters: true,
    },
  });
  console.log("test", subscriptions);
  console.log(subscriptions[0]);
});
export default router;
