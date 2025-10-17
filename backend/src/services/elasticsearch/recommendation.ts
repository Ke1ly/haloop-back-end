import redis from "../../config/redis.js";
import { esClient } from "../../config/esClient.js";

//types
import { BaseFilter, ScoredPost } from "../../types/Subscription.js";

//services & utils
import { transformWorkPostForES } from "./elasticsearchManager.js";
import cron from "node-cron";

//models
import {
  FindSubscriptions,
  FindUniqueWorkPostForES,
} from "../../models/PostModel.js";
import { GetAllHelperProfiles } from "../../models/UserModel.js";

// 索引名稱
const WORK_POST_INDEX = "workposts";

interface Subscription {
  helperProfileId: string;
  filters: BaseFilter;
}

type SortOrder = "asc" | "desc";

const CITY_SIMILARITY: Record<string, Record<string, number>> = {
  臺北市: { 臺北市: 1.0, 新北市: 0.8, 基隆市: 0.8, 桃園市: 0.3 },
  新北市: { 新北市: 1.0, 臺北市: 0.8, 基隆市: 0.8, 桃園市: 0.8 },
  桃園市: { 桃園市: 1.0, 新北市: 0.8, 新竹市: 0.8, 新竹縣: 0.8 },
  新竹市: { 新竹市: 1.0, 桃園市: 0.8, 新竹縣: 0.8, 苗栗縣: 0.8 },
  新竹縣: { 新竹縣: 1.0, 新竹市: 0.8, 桃園市: 0.8, 苗栗縣: 0.8 },
  苗栗縣: { 苗栗縣: 1.0, 新竹縣: 0.8, 新竹市: 0.8, 臺中市: 0.8 },
  臺中市: { 臺中市: 1.0, 苗栗縣: 0.8, 彰化縣: 0.8, 南投縣: 0.8 },
  彰化縣: { 彰化縣: 1.0, 臺中市: 0.8, 南投縣: 0.8, 雲林縣: 0.8 },
  南投縣: { 南投縣: 1.0, 臺中市: 0.8, 彰化縣: 0.8, 雲林縣: 0.8 },
  雲林縣: { 雲林縣: 1.0, 彰化縣: 0.8, 南投縣: 0.8, 嘉義縣: 0.8, 嘉義市: 0.8 },
  嘉義縣: { 嘉義縣: 1.0, 雲林縣: 0.8, 嘉義市: 0.8, 臺南市: 0.8 },
  嘉義市: { 嘉義市: 1.0, 嘉義縣: 0.8, 雲林縣: 0.8, 臺南市: 0.8 },
  臺南市: { 臺南市: 1.0, 嘉義縣: 0.8, 嘉義市: 0.8, 高雄市: 0.8 },
  高雄市: { 高雄市: 1.0, 臺南市: 0.8, 屏東縣: 0.8 },
  屏東縣: { 屏東縣: 1.0, 高雄市: 0.8, 臺東縣: 0.3 },
  宜蘭縣: { 宜蘭縣: 1.0, 新北市: 0.3, 臺北市: 0.3, 花蓮縣: 0.8 },
  花蓮縣: { 花蓮縣: 1.0, 宜蘭縣: 0.8, 臺東縣: 0.8 },
  臺東縣: { 臺東縣: 1.0, 花蓮縣: 0.8, 屏東縣: 0.3 },
  澎湖縣: { 澎湖縣: 1.0, 金門縣: 0.3, 連江縣: 0.3 },
  金門縣: { 金門縣: 1.0, 連江縣: 0.8, 澎湖縣: 0.3 },
  連江縣: { 連江縣: 1.0, 金門縣: 0.8, 澎湖縣: 0.3 },
  基隆市: { 基隆市: 1.0, 臺北市: 0.8, 新北市: 0.8, 宜蘭縣: 0.3 },
};

// 使用 Elasticsearch 獲取推薦貼文
async function getRecommendedPostsFromES(helperProfileId: string) {
  try {
    // 獲取使用者的篩選條件
    const rawSubscriptions = await FindSubscriptions(helperProfileId);
    if (rawSubscriptions.length === 0) {
      return [];
    }

    const subscription = rawSubscriptions[0];
    const filters = subscription.filters as BaseFilter;

    // 建構 Elasticsearch 查詢
    const esQuery = buildElasticsearchQuery(filters);

    // 執行查詢
    const response = await esClient.search({
      index: WORK_POST_INDEX,
      body: esQuery,
    });

    // 轉換格式
    const recommendedPosts: ScoredPost[] = response.body.hits.hits.map(
      (hit: any) => ({
        post: {
          id: hit._source.id,
          ...hit._source,
        },
        score: hit._score,
      })
    );

    return recommendedPosts.slice(0, 10);
  } catch (error) {
    console.error("Error getting recommended posts from Elasticsearch:", error);
    throw error;
  }
}
// 建構 Elasticsearch 查詢
function buildElasticsearchQuery(filters: BaseFilter) {
  const must: any[] = [];
  const should: any[] = [];
  const filter: any[] = [];

  // 城市篩選
  if (filters.city) {
    const citySimilarities = CITY_SIMILARITY[filters.city] || {};

    // 根據相似度分組
    const cityGroups = {
      exact: [] as string[],
      high: [] as string[],
      medium: [] as string[],
    };

    Object.entries(citySimilarities).forEach(([city, score]) => {
      if (score === 1.0) cityGroups.exact.push(city);
      else if (score === 0.8) cityGroups.high.push(city);
      else if (score === 0.3) cityGroups.medium.push(city);
    });

    if (cityGroups.exact.length > 0) {
      should.push({
        terms: { "unit.city": cityGroups.exact, boost: 5 },
      });
    }

    if (cityGroups.high.length > 0) {
      console.log("cityGroups.high", cityGroups.high);

      should.push({
        terms: { "unit.city": cityGroups.high, boost: 3 },
      });
    }

    if (cityGroups.medium.length > 0) {
      console.log("cityGroups.medium", cityGroups.medium);

      should.push({
        terms: { "unit.city": cityGroups.medium, boost: 1 },
      });
    }

    console.log(`City filter applied for ${filters.city}:`, {
      exact: cityGroups.exact.length,
      high: cityGroups.high.length,
      medium: cityGroups.medium.length,
    });
  }

  // 數值範圍篩選
  if (filters.averageWorkHours) {
    should.push({
      function_score: {
        query: { match_all: {} },
        functions: [
          {
            gauss: {
              averageWorkHours: {
                origin: 0,
                scale: filters.averageWorkHours * 1.5,
                offset: filters.averageWorkHours,
                decay: 0.2,
              },
            },
            weight: 1.5,
          },
        ],
      },
    });
  }

  if (filters.minDuration) {
    should.push({
      function_score: {
        query: { match_all: {} },
        functions: [
          {
            gauss: {
              minDuration: {
                origin: 0,
                scale: filters.minDuration * 1.2,
                offset: filters.minDuration,
                decay: 0.2,
              },
            },
            weight: 1.5,
          },
        ],
      },
    });
  }

  if (filters.applicantCount) {
    should.push({
      function_score: {
        query: { match_all: {} },
        functions: [
          {
            gauss: {
              recruitCount: {
                origin: 10,
                scale: filters.applicantCount * 1.5,
                offset: 10 - filters.applicantCount,
                decay: 0.2,
              },
            },
            weight: 1.5,
          },
        ],
      },
    });
  }

  // 多選條件篩選
  const multiSelectFields = [
    "accommodations",
    "meals",
    "environments",
    "experiences",
    "positionCategories",
  ];

  multiSelectFields.forEach((field) => {
    const filterValues = filters[field as keyof BaseFilter] as string[];
    if (filterValues && filterValues.length > 0) {
      should.push({
        terms: {
          [field]: filterValues,
          boost: 2,
        },
      });
    }
  });

  // 確保時間未過期
  filter.push({
    range: {
      endDate: {
        gte: "now",
      },
    },
  });

  return {
    query: {
      bool: {
        must: must.length > 0 ? must : [{ match_all: {} }],
        should: should,
        filter: filter,
        minimum_should_match: should.length > 0 ? 1 : 0,
      },
    },
    sort: [
      { _score: { order: "desc" as SortOrder } },
      { startDate: { order: "asc" as SortOrder } },
    ],
    size: 10,
  };
}

// 更新的排程任務
cron.schedule("0 3 * * *", async () => {
  try {
    console.log("Starting daily recommendation job with Elasticsearch...");

    const helperProfiles = await GetAllHelperProfiles();

    for (const helperProfile of helperProfiles) {
      console.log(`Starting user ${helperProfile.id}'s recommendation`);

      try {
        const recommendedPosts: ScoredPost[] = await getRecommendedPostsFromES(
          helperProfile.id
        );
        console.log(
          `User ${helperProfile.id} got ${recommendedPosts.length} recommended posts`
        );
        if (recommendedPosts.length > 0) {
          const recommendedPostIds = recommendedPosts.map(
            (
              p
              // : { post: WorkPostDocument; score: number }
            ) => p.post.id
          );
          const key = `recommended:userId:${helperProfile.id}`;

          // 找出尚未推薦過的貼文
          const alreadyRecommended = await redis.zrange(key, 0, -1);
          const newRecommendations = recommendedPostIds.filter(
            (id) => !alreadyRecommended.includes(String(id))
          );

          // 推薦最多 5 筆新資料
          let finalRecommendations = newRecommendations.slice(0, 5);

          // 加入 Redis 記錄，避免未來重複推薦
          if (finalRecommendations.length > 0) {
            const timestamp = Date.now();
            await redis.zadd(
              key,
              ...finalRecommendations.flatMap((id: string) => [timestamp, id])
            );
            await redis.expire(key, 60 * 60 * 24 * 30); // 一個月後過期

            console.log(
              `Recommendations for ${helperProfile.id}:`,
              finalRecommendations
            );
          }
        } else {
          console.log(`User ${helperProfile.id} has no recommendations`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(
          `Error processing recommendations for user ${helperProfile.id}:`,
          error
        );
      }
    }

    console.log("Daily recommendation job completed");
  } catch (error) {
    console.error("Error in daily recommendation job:", error);
  }
});

// 監聽資料變更並即時更新 Elasticsearch
export async function updateWorkPostInES(postId: string) {
  try {
    const workPost = await FindUniqueWorkPostForES(postId);

    if (workPost) {
      await esClient.index({
        index: WORK_POST_INDEX,
        id: postId,
        body: transformWorkPostForES(workPost),
      });
      console.log(`Updated work post ${postId} in Elasticsearch`);
    }
  } catch (error) {
    console.error(
      `Error updating work post ${postId} in Elasticsearch:`,
      error
    );
  }
}

// 新增一筆 Elasticsearch
export async function indexNewWorkPost(post: any) {
  const doc = transformWorkPostForES(post);
  await esClient.index({
    index: WORK_POST_INDEX,
    id: String(doc.id),
    body: doc,
  });
}
