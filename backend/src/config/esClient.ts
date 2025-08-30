import { Client } from "@opensearch-project/opensearch";

let esClient: Client;
if (process.env.NODE_ENV === "production") {
  esClient = new Client({
    node: process.env.OPENSEARCH_URL!,
    requestTimeout: 30000,
    //     auth: {
    //       username: process.env.OPENSEARCH_USERNAME,
    //       password: process.env.OPENSEARCH_PASSWORD,
    //     },
    ssl: {
      rejectUnauthorized: true,
    },
    headers: {
      "Content-Type": "application/json",
    },
  });
  console.log("✓ 成功連線到 OpenSearch (Public Access, 無 FGAC)");
} else {
  esClient = new Client({
    node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
  });
}
export { esClient };
