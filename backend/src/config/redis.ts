import Redis from "ioredis";

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: 6379,
  username: "default",
  password: process.env.REDIS_PASSWORD,
  tls: {}, // ElastiCache 通常需啟用 TLS
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true, // 延遲連線直到第一次使用
};

const redis = new Redis.default(redisConfig);

redis.on("connect", () => console.log("Redis 連接成功"));
redis.on("error", (err) => console.error("Redis 連接錯誤:", err));

export default redis;
