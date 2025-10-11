import redis from "../config/redis.js";
import express, { Request, Response } from "express";
const router = express.Router();

//middlewares
import { authorizeRole, AuthenticatedRequest } from "../middlewares/auth.js";

//types
import {
  FilterInput,
  BaseSubscription,
  MatchedWorkPost,
} from "../types/Subscription.js";
import { RawWorkPost, formattedWorkPost } from "../types/Work.js";

//services & utils
import { indexSubscriptionAsPercolator } from "../services/elasticsearch/elasticsearchManager.js";
import { formatWorkPost } from "../utils/formatWorkPost.js";

//models
import { FindHelperProfile } from "../models/UserModel.js";
import {
  CreateFilterSubscription,
  FindSubscriptions,
  FindWorkPostsById,
  FindUniqueSubscription,
  FindMatchingWorkPostBySubscriptionId,
} from "../models/PostModel.js";

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
    }: FilterInput = req.body;

    const userId = req.user?.userId;
    if (!userId) {
      return void res
        .status(401)
        .json({ success: false, message: "無法取得使用者資訊" });
    }

    // 查詢該 user 對應的 helperProfile
    const helperProfile = await FindHelperProfile(userId);

    if (!helperProfile) {
      return void res.status(404).json({ message: "Helper profile not found" });
    }

    const newSubscription = await CreateFilterSubscription(
      helperProfile.id,
      name,
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
      environments
    );

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
    const helperProfile = await FindHelperProfile(userId);
    if (!helperProfile) {
      return void res.status(404).json({ message: "Helper profile not found" });
    }

    const subscriptions = await FindSubscriptions(helperProfile.id);

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
    const helperProfile = await FindHelperProfile(userId);
    if (!helperProfile) {
      return void res.status(404).json({ message: "Helper profile not found" });
    }
    const helperProfileId = helperProfile.id;

    //查詢 redis 中推薦貼文 Id
    const key = `recommended:userId:${helperProfileId}`;
    const postIds = await redis.zrevrange(key, 0, 4); // 取最新 5 筆

    //查詢推薦貼文資料
    const rawWorkPosts: RawWorkPost[] = await FindWorkPostsById(postIds);
    const formattedWorkPosts: formattedWorkPost[] =
      rawWorkPosts.map(formatWorkPost);

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
    const subscription = await FindUniqueSubscription(subscriptionId);
    if (!subscription || subscription.helperProfile.userId !== userId) {
      return res
        .status(404)
        .json({ message: "Subscription not found or unauthorized" });
    }

    // 查詢匹配貼文（按匹配時間降序）
    const matchedPosts = await FindMatchingWorkPostBySubscriptionId(
      subscriptionId
    );
    res
      .status(200)
      .json({ matchedPosts: matchedPosts?.map((match) => match.workPost) });
  }
);

export default router;
