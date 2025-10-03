import { Redis } from "ioredis";

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: 6379,
  username: "default",
  password: process.env.REDIS_PASSWORD || "",
  tls: process.env.NODE_ENV === "production" ? {} : undefined,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true, // 延遲連線直到第一次使用
};

const redis = new Redis({
  ...redisConfig,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redis.on("connect", () => console.log("Redis 連接成功"));
redis.on("error", (err) => console.error("Redis 連接錯誤:", err));

export default redis;
