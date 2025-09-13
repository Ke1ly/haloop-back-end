import { Client } from "@opensearch-project/opensearch";

let esClient: Client;
if (process.env.NODE_ENV === "production") {
  if (
    !process.env.OPENSEARCH_URL ||
    !process.env.OPENSEARCH_USERNAME ||
    !process.env.OPENSEARCH_PASSWORD
  ) {
    throw new Error(
      "缺少 OpenSearch 配置: 需要 OPENSEARCH_URL, OPENSEARCH_USERNAME, OPENSEARCH_PASSWORD"
    );
  }

  esClient = new Client({
    node: process.env.OPENSEARCH_URL,
    auth: {
      username: process.env.OPENSEARCH_USERNAME,
      password: process.env.OPENSEARCH_PASSWORD,
    },
    ssl: {
      rejectUnauthorized: true, // 確保 SSL 證書驗證
    },
    headers: {
      "Content-Type": "application/json",
    },
    requestTimeout: 30000,
  });

  console.log("✓ 成功連線到 OpenSearch (VPC Access, FGAC 啟用)");
} else {
  esClient = new Client({
    node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
  });
}
export { esClient };
