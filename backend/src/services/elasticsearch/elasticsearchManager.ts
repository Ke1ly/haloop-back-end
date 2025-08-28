import { esClient } from "../../config/esClient.js";
import prisma from "../../config/database.js";

// 索引名稱
const WORK_POST_INDEX = "workposts";
const BATCH_SIZE = 100;

const INDEX_MAPPING = {
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

const INDEX_SETTINGS = {
  number_of_shards: 1,
  number_of_replicas: 0,
};

export interface WorkPostDocument {
  id: string;
  startDate: string;
  endDate: string;
  averageWorkHours: number;
  minDuration: number;
  recruitCount: number;
  positionCategories: string[];
  meals: string[];
  experiences: string[];
  environments: string[];
  accommodations: string[];
  unit: {
    city: string;
  };
}

// 初始化 Elasticsearch 索引
async function initializeIndices() {
  try {
    console.log("Checking if index exists...");
    const indexExists = await esClient.indices.exists({
      index: WORK_POST_INDEX,
    });
    if (indexExists) {
      const { body } = await esClient.indices.getMapping({
        index: WORK_POST_INDEX,
      });
      const currentMapping = body[WORK_POST_INDEX]?.mappings?.properties;
      const expectedMapping = INDEX_MAPPING.properties;
      const mappingMatches =
        JSON.stringify(currentMapping) === JSON.stringify(expectedMapping);

      if (!mappingMatches) {
        console.log("Index mapping outdated, updating...");
        await esClient.indices.putMapping({
          index: WORK_POST_INDEX,
          body: INDEX_MAPPING,
        });
        console.log("Index mapping updated successfully");
      } else {
        console.log(
          "Index exists with correct mapping, skipping initialization"
        );
        return;
      }
    } else {
      console.log(" Creating new index...");
      await esClient.indices.create({
        index: WORK_POST_INDEX,
        body: {
          mappings: INDEX_MAPPING,
          settings: INDEX_SETTINGS,
        },
      });
      console.log(`Index ${WORK_POST_INDEX} created successfully`);
    }
  } catch (error) {
    console.error("Error initializing Elasticsearch indices:", error);
    throw error;
  }
}

// 將現有資料同步到 Elasticsearch
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

// 初始化函式
async function initialize() {
  try {
    await initializeIndices();
    await syncAllWorkPostsToElasticsearch();
    console.log("Elasticsearch recommendation system initialized successfully");
  } catch (error) {
    console.error(
      "Failed to initialize Elasticsearch recommendation system:",
      error
    );
    throw error;
  }
}

export { transformWorkPostForES, initialize };
