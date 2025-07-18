import cron from "node-cron";
import redis from "../config/redis.js";
import prisma from "../config/database.js";
import {
  WorkPostForRecommendation,
  ScoredPost,
  FilterSubscription,
  Subscription,
} from "../types/Work.js";

cron.schedule("0 3 * * *", async () => {
  const helperProfiles = await getAllHelperProfileIds();

  for (const helperProfile of helperProfiles) {
    const recommendedPosts = await getRecommendedPosts(helperProfile.id);
    const recommendedPostIds = recommendedPosts.map((p) => p.post.id);
    const key = `recommended:userId:${helperProfile.id}`;

    // 找出尚未推薦過的貼文
    const alreadyRecommended = await redis.smembers(key); // Array<string>
    const newRecommendations = recommendedPostIds.filter(
      (id) => !alreadyRecommended.includes(id)
    );

    // 推薦最多 5 筆新資料
    const finalRecommendations = newRecommendations.slice(0, 5);

    // 加入 Redis 記錄，避免未來重複推薦
    if (finalRecommendations.length > 0) {
      await redis.sadd(key, ...finalRecommendations);
      await redis.expire(key, 60 * 60 * 24 * 30); // 一個月後過期

      console.log(`推薦給使用者 ${helperProfile.id}:`, finalRecommendations);
    } else {
      console.log(`使用者 ${helperProfile.id} 沒有新貼文可推薦`);
    }

    // 後續考慮將推薦寫入資料庫
  }
});
async function getAllHelperProfileIds() {
  const helperProfileIds = await prisma.helperProfile.findMany({
    select: {
      id: true,
    },
  });
  return helperProfileIds;
}

async function getRecommendedPosts(helperProfileId: string) {
  //取得這位使用者的所有條件訂閱
  const rawSubscriptions = await prisma.filterSubscription.findMany({
    where: {
      helperProfileId,
    },
    select: {
      helperProfileId: true,
      filters: true,
    },
  });
  //整理條件訂閱格式
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
  const subscription = subscriptions[0];

  //取得所有貼文
  const rawWorkPosts = await prisma.workPost.findMany({
    select: {
      id: true,
      startDate: true, //後續決定是否預篩選日期
      endDate: true, //後續決定是否預篩選日期
      positionName: true, //for rendering
      averageWorkHours: true,
      minDuration: true,
      recruitCount: true,
      positionCategories: { select: { name: true } },
      meals: { select: { name: true } },
      experiences: { select: { name: true } },
      environments: { select: { name: true } },
      accommodations: { select: { name: true } },
      images: {
        //for rendering
        select: {
          imageUrl: true,
        },
      },
      unit: {
        select: {
          city: true,
          unitName: true, //for rendering
        },
      },
    },
  });

  //整理貼文格式
  function formatWorkPost(post: any): WorkPostForRecommendation {
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
  const formattedWorkPosts = rawWorkPosts.map(formatWorkPost);

  //[函式] 輸入條件與貼文，比對相似度
  function getTopMatchedPosts(
    subscription: Subscription,
    posts: WorkPostForRecommendation[],
    top: number
  ): ScoredPost[] {
    const filter = subscription.filters;

    const CITY_LIST = [
      "基隆市",
      "臺北市",
      "新北市",
      "桃園市",
      "新竹市",
      "新竹縣",
      "苗栗縣",
      "臺中市",
      "彰化縣",
      "南投縣",
      "雲林縣",
      "嘉義縣",
      "嘉義市",
      "臺南市",
      "高雄市",
      "屏東縣",
      "宜蘭縣",
      "花蓮縣",
      "臺東縣",
      "澎湖縣",
      "金門縣",
      "連江縣",
    ];

    const CITY_SIMILARITY: Record<string, Record<string, number>> = {};

    const LEVEL_1_NEIGHBORS: [string, string][] = [
      //北
      ["基隆市", "新北市"],
      ["基隆市", "臺北市"],
      ["臺北市", "新北市"],
      ["新北市", "桃園市"],
      ["新北市", "宜蘭市"],
      //北中
      ["桃園市", "新竹縣"],
      ["桃園市", "新竹市"],
      ["新竹縣", "新竹市"],
      ["新竹縣", "苗栗縣"],
      ["新竹市", "苗栗縣"],
      //中
      ["苗栗縣", "臺中市"],
      ["臺中市", "彰化縣"],
      ["臺中市", "南投縣"],
      ["彰化縣", "南投縣"],
      ["彰化縣", "雲林縣"],
      ["南投縣", "雲林縣"],
      //南
      ["雲林縣", "嘉義縣"],
      ["雲林縣", "嘉義市"],
      ["嘉義縣", "嘉義市"],
      ["嘉義縣", "臺南市"],
      ["嘉義市", "臺南市"],
      ["臺南市", "高雄市"],
      ["高雄市", "屏東縣"],
      ["屏東縣", "臺東縣"],
      //東
      ["宜蘭縣", "花蓮縣"],
      ["花蓮縣", "臺東縣"],
      //外島
      ["金門縣", "連江縣"],
    ];

    const LEVEL_2_NEIGHBORS: [string, string][] = [
      //北
      ["基隆市", "宜蘭縣"],
      ["基隆市", "桃園市"],
      ["臺北市", "宜蘭縣"],
      ["臺北市", "桃園市"],
      //北中
      ["桃園市", "苗栗縣"],
      ["新竹縣", "台中市"],
      ["新竹市", "台中市"],

      // 中
      ["苗栗縣", "彰化縣"],
      ["苗栗縣", "南投縣"],
      ["臺中市", "雲林縣"],
      ["彰化縣", "嘉義縣"],
      ["彰化縣", "嘉義市"],
      ["南投縣", "嘉義縣"],
      ["南投縣", "嘉義市"],

      //南
      ["雲林縣", "臺南市"],
      ["嘉義縣", "高雄市"],
      ["嘉義市", "高雄市"],
      ["臺南市", "屏東縣"],
      ["屏東縣", "花蓮縣"],

      //外島
      ["金門縣", "澎湖縣"],
      ["連江縣", "澎湖縣"],
    ];

    for (const cityA of CITY_LIST) {
      CITY_SIMILARITY[cityA] = {};
      for (const cityB of CITY_LIST) {
        if (cityA === cityB) {
          CITY_SIMILARITY[cityA][cityB] = 1.0;
        } else if (
          LEVEL_1_NEIGHBORS.some(
            ([a, b]) =>
              (a === cityA && b === cityB) || (a === cityB && b === cityA)
          )
        ) {
          CITY_SIMILARITY[cityA][cityB] = 0.8;
        } else if (
          LEVEL_2_NEIGHBORS.some(
            ([a, b]) =>
              (a === cityA && b === cityB) || (a === cityB && b === cityA)
          )
        ) {
          CITY_SIMILARITY[cityA][cityB] = 0.3;
        } else {
          CITY_SIMILARITY[cityA][cityB] = 0.0;
        }
      }
    }

    function calculateScore(post: WorkPostForRecommendation): number {
      let score = 0;
      let totalWeight = 0;

      // 城市相似度
      if (filter.city) {
        const sim = CITY_SIMILARITY[filter.city]?.[post.unit.city] ?? 0;
        score += sim * 1;
        totalWeight += 1;
      }

      // 招募人數：越接近越好
      if (filter.applicantCount != null) {
        const diff = Math.abs(filter.applicantCount - post.recruitCount);
        score += 1 - diff / 10; // 以最多10人計算
        totalWeight += 1;
      }

      // 平均工作時數：越少越好
      if (filter.averageWorkHours != null) {
        const ratio = post.averageWorkHours / filter.averageWorkHours;
        score += ratio <= 1 ? 1 : 1 - ratio / 2; // 超過多一倍不給分
        totalWeight += 1;
      }

      // 最短天數：越少越好
      if (filter.minDuration != null) {
        const diff = post.minDuration - filter.minDuration;
        if (diff <= 0) {
          score += 1;
        } else if (diff <= 14) {
          score += 1 - diff / 15;
        } else {
          score += 0; // 超過 14 天不給分
        }
        totalWeight += 1;
      }

      // 多選類比對
      const scoreCategory = (filterArr: string[], postArr: string[]) => {
        if (filterArr.length === 0) return 1; // 使用者未設定篩選則給滿分
        const matchCount = filterArr.filter((item) =>
          postArr.includes(item)
        ).length;
        return matchCount / filterArr.length;
      };

      const fields: [string[], string[]][] = [
        [filter.accommodations ?? [], post.accommodations],
        [filter.meals ?? [], post.meals],
        [filter.environments ?? [], post.environments],
        [filter.experiences ?? [], post.experiences],
        [filter.positionCategories ?? [], post.positionCategories],
      ];

      for (const [filterArr, postArr] of fields) {
        score += scoreCategory(filterArr, postArr);
        totalWeight += 1;
      }

      return totalWeight > 0 ? score / totalWeight : 0;
    }

    return posts
      .map((post) => ({
        post,
        score: calculateScore(post),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, top);
  }
  const posts = getTopMatchedPosts(subscription, formattedWorkPosts, 3);
  return posts;
}
