import { esClient } from "../../config/esClient.js";
import prisma from "../../config/database.js";

//types
import { WorkPostDocument, BaseFilter } from "../../types/Subscription.js";
import { RawWorkPost } from "../../types/Work.js";

// 索引名稱
const WORK_POST_INDEX = "workposts";
const SUBSCRIPTIONS_PERCOLATOR_INDEX = "subscriptions_percolator";
const BATCH_SIZE = 100;

const WORK_POST＿INDEX_MAPPING = {
  properties: {
    id: { type: "keyword" },
    startDate: { type: "date" },
    endDate: { type: "date" },
    averageWorkHours: { type: "integer" },
    minDuration: { type: "integer" },
    recruitCount: { type: "integer" },
    positionCategories: { type: "keyword" },
    meals: { type: "keyword" },
    experiences: { type: "keyword" },
    environments: { type: "keyword" },
    accommodations: { type: "keyword" },
    unit: {
      properties: {
        city: {
          type: "keyword",
        },
      },
    },
    popularity_score: { type: "float" },
    created_at: { type: "date" },
  },
} as const;

const SUBSCRIPTIONS_PERCOLATOR_INDEX_MAPPING = {
  properties: {
    query: { type: "percolator" },
    subscription_id: { type: "keyword" },
    helper_profile_id: { type: "keyword" },
    filters: {
      properties: {
        city: { type: "keyword" },
        startDate: { type: "date" },
        endDate: { type: "date" },
        applicantCount: { type: "integer" },
        averageWorkHours: { type: "integer" },
        minDuration: { type: "integer" },
        positionCategories: { type: "keyword" },
        accommodations: { type: "keyword" },
        experiences: { type: "keyword" },
        environments: { type: "keyword" },
        meals: { type: "keyword" },
      },
    },
    id: { type: "keyword" },
    startDate: { type: "date" },
    endDate: { type: "date" },
    averageWorkHours: { type: "integer" },
    minDuration: { type: "integer" },
    recruitCount: { type: "integer" },
    positionCategories: { type: "keyword" },
    meals: { type: "keyword" },
    experiences: { type: "keyword" },
    environments: { type: "keyword" },
    accommodations: { type: "keyword" },
    unit: {
      type: "nested",
      properties: {
        city: { type: "keyword" },
      },
    },
    popularity_score: { type: "float" },
    created_at: { type: "date" },
  },
} as const;

const INDEX_SETTINGS = {
  number_of_shards: 1,
  number_of_replicas: 0,
};

// 初始化索引
async function initializeIndices(indexName: string, mapping: any) {
  try {
    console.log(`Checking if ${indexName} index exists...`);
    const indexExists = await esClient.indices.exists({
      index: indexName,
    });

    if (indexExists.body) {
      console.log(`Index ${indexName} already exists. Checking mapping...`);
      const { body } = await esClient.indices.getMapping({
        index: indexName,
      });
      const currentMapping = body[indexName]?.mappings?.properties;
      const expectedMapping = mapping.properties;
      const mappingMatches =
        JSON.stringify(currentMapping) === JSON.stringify(expectedMapping);

      if (!mappingMatches) {
        console.log("Index mapping outdated, updating...");
        await esClient.indices.putMapping({
          index: indexName,
          body: mapping,
        });
        console.log("Index mapping updated successfully");
      } else {
        console.log(
          "Index exists with correct mapping, skipping initialization"
        );
        return;
      }
    } else {
      console.log(`Index ${indexName} not found. Creating...`);
      await esClient.indices.create({
        index: indexName,
        body: {
          mappings: mapping,
          settings: INDEX_SETTINGS,
        },
      });
      console.log(`Index ${indexName} created successfully`);
    }
  } catch (error) {
    console.error("Error initializing Elasticsearch indices:", error);
    throw error;
  }
}

// 同步 workpost 資料
async function syncAllWorkPostsToElasticsearch() {
  try {
    const totalCount = await prisma.workPost.count();
    console.log(`Total work posts to sync: ${totalCount}`);

    let processed = 0;
    let offset = 0;

    while (offset < totalCount) {
      console.log(
        ` Processing batch ${Math.floor(offset / BATCH_SIZE) + 1}/${Math.ceil(
          totalCount / BATCH_SIZE
        )}...`
      );

      // 從資料庫獲取所有工作貼文
      const rawWorkPosts = await prisma.workPost.findMany({
        take: BATCH_SIZE,
        skip: offset,
        select: {
          id: true,
          startDate: true,
          endDate: true,
          averageWorkHours: true,
          minDuration: true,
          recruitCount: true,
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
      if (rawWorkPosts.length === 0) break;

      // 批量索引文件
      const body = rawWorkPosts.flatMap((post) => [
        { index: { _index: WORK_POST_INDEX, _id: post.id } },
        transformWorkPostForES(post),
      ]);

      const response = await esClient.bulk({ body });

      if (response.body.errors) {
        console.error(
          "Bulk indexing errors:",
          response.body.items?.filter(
            (item) =>
              item.index?.error ||
              item.create?.error ||
              item.update?.error ||
              item.delete?.error
          )
        );
      } else {
        processed += rawWorkPosts.length;
        offset += BATCH_SIZE;
        console.log(
          `Successfully indexed ${processed}/${totalCount} work posts`
        );
        if (offset < totalCount) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      console.log(`Successfully indexed ${processed} work posts`);
    }
  } catch (error) {
    console.error("Error syncing work posts to Elasticsearch:", error);
    throw error;
  }
}

// 同步 subscription 資料
async function syncAllSubscriptionsToElasticsearch() {
  try {
    const totalCount = await prisma.filterSubscription.count();
    console.log(`Total work posts to sync: ${totalCount}`);

    let processed = 0;
    let offset = 0;

    while (offset < totalCount) {
      console.log(
        ` Processing batch ${Math.floor(offset / BATCH_SIZE) + 1}/${Math.ceil(
          totalCount / BATCH_SIZE
        )}...`
      );

      // 從資料庫獲取所有工作貼文
      const subscriptions = await prisma.filterSubscription.findMany({
        take: BATCH_SIZE,
        skip: offset,
        select: {
          id: true,
          helperProfileId: true,
          filters: true,
        },
      });
      if (subscriptions.length === 0) break;

      await Promise.all(
        subscriptions.map(async (subscription) => {
          try {
            await indexSubscriptionAsPercolator(subscription);
          } catch (error) {
            console.error(
              `Error indexing subscription ${subscription.id}:`,
              error
            );
          }
        })
      );

      processed += subscriptions.length;
      offset += BATCH_SIZE;
      console.log(
        `Successfully indexed ${processed}/${totalCount} subscriptions`
      );
      if (offset < totalCount) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // 避免 ES 過載
      }
    }
  } catch (error) {
    console.error("Error syncing subscriptions to Elasticsearch:", error);
    throw error;
  }
}

// 將 workpost 資料轉為 ES doc
function transformWorkPostForES(post: any): WorkPostDocument {
  return {
    id: post.id,
    startDate: post.startDate,
    endDate: post.endDate,
    averageWorkHours: post.averageWorkHours,
    minDuration: post.minDuration,
    recruitCount: post.recruitCount,
    positionCategories: post.positionCategories?.map((p: any) => p.name) || [],
    meals: post.meals?.map((m: any) => m.name) || [],
    experiences: post.experiences?.map((e: any) => e.name) || [],
    environments: post.environments?.map((e: any) => e.name) || [],
    accommodations: post.accommodations?.map((a: any) => a.name) || [],
    unit: {
      city: post.unit?.city || "",
    },
  };
}

// 將 subscription 轉為 percolator 查詢並索引
export async function indexSubscriptionAsPercolator(subscription: any) {
  const filters = subscription.filters;

  // 檢查是否有至少一個條件
  const hasConditions =
    filters.city ||
    filters.startDate ||
    filters.endDate ||
    filters.applicantCount ||
    filters.averageWorkHours ||
    filters.minDuration ||
    filters.accommodations?.length > 0 ||
    filters.environments?.length > 0 ||
    filters.experiences?.length > 0 ||
    filters.meals?.length > 0 ||
    filters.positionCategories?.length > 0;

  if (!hasConditions) {
    throw new Error(
      `Subscription ${subscription.id} has no conditions, skipping indexing`
    );
  }

  const boolQuery: any = {
    bool: {
      filter: [],
    },
  };

  // 處理必須條件
  if (filters.city) {
    boolQuery.bool.filter.push({
      nested: {
        path: "unit",
        query: {
          term: { "unit.city": filters.city },
        },
      },
    });
  }
  if (filters.applicantCount) {
    boolQuery.bool.filter.push({
      range: { recruitCount: { gte: filters.applicantCount } },
    });
  }
  if (filters.averageWorkHours) {
    boolQuery.bool.filter.push({
      range: { averageWorkHours: { lte: filters.averageWorkHours } },
    });
  }
  if (filters.minDuration) {
    boolQuery.bool.filter.push({
      range: { minDuration: { lte: filters.minDuration } },
    });
  }

  if (filters.startDate || filters.endDate) {
    const dateQuery: any = {
      bool: {
        filter: [],
      },
    };
    // 貼文的 startDate <= filters.endDate
    if (filters.endDate) {
      dateQuery.bool.filter.push({
        range: { startDate: { lte: filters.endDate } },
      });
      console.log(dateQuery);
    }
    // 貼文的 endDate >= filters.startDate
    if (filters.startDate) {
      dateQuery.bool.filter.push({
        range: { endDate: { gte: filters.startDate } },
      });
      console.log(dateQuery);
    }
    // 如果只有一個日期條件，另一個條件不加限制
    if (dateQuery.bool.filter.length > 0) {
      console.log("dateQuery", dateQuery.bool.filter);
      boolQuery.bool.filter.push(dateQuery);
    }
  }

  const arrayFields = [
    "accommodations",
    "environments",
    "experiences",
    "meals",
    "positionCategories",
  ];
  arrayFields.forEach((field) => {
    if (filters[field]?.length > 0) {
      boolQuery.bool.filter.push({
        bool: {
          should: filters[field].map((value: string) => ({
            term: { [field]: value },
          })),
          minimum_should_match: 1, // 陣列內至少匹配一個值
        },
      });
    } // 若無條件，不加任何查詢，視為通過
  });

  const doc = {
    query: boolQuery,
    subscription_id: subscription.id,
    helper_profile_id: subscription.helperProfileId,
    filters: subscription.filters,
  };
  await esClient.index({
    index: SUBSCRIPTIONS_PERCOLATOR_INDEX,
    id: subscription.id,
    body: doc,
  });
  console.log(`Indexed subscription ${subscription.id} in percolator index`);
}

async function waitForOpenSearch() {
  let retries = 5;
  while (retries > 0) {
    try {
      await esClient.ping();
      console.log("OpenSearch is ready");
      return;
    } catch (error) {
      console.log("Waiting for OpenSearch...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      retries--;
    }
  }
  throw new Error("OpenSearch not available");
}

// 初始化函式
async function initialize() {
  try {
    await waitForOpenSearch();
    await initializeIndices(WORK_POST_INDEX, WORK_POST＿INDEX_MAPPING);
    await initializeIndices(
      SUBSCRIPTIONS_PERCOLATOR_INDEX,
      SUBSCRIPTIONS_PERCOLATOR_INDEX_MAPPING
    );

    await syncAllWorkPostsToElasticsearch();
    await syncAllSubscriptionsToElasticsearch();
    console.log("Elasticsearch recommendation system initialized successfully");
  } catch (error) {
    console.error(
      "Failed to initialize Elasticsearch recommendation system:",
      error
    );
    throw error;
  }
}
export { transformWorkPostForES, initialize, SUBSCRIPTIONS_PERCOLATOR_INDEX };
