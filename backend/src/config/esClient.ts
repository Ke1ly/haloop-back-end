// import { Client } from "@elastic/elasticsearch";
// export const esClient = new Client({
//   node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
//   auth: {
//     username: process.env.ES_USERNAME || "elastic",
//     password: process.env.ES_PASSWORD!,
//   },
// });

import { Client } from "@opensearch-project/opensearch";
import { defaultProvider } from "@aws-sdk/credential-provider-node"; // 需要額外安裝 @aws-sdk/credential-provider-node
// import { HttpClient } from "@opensearch-project/opensearch/lib/HttpClient"; // 或使用 aws4 簽署
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";

let esClient: Client;
if (process.env.NODE_ENV === "production") {
  esClient = new Client({
    ...AwsSigv4Signer({
      region: process.env.AWS_REGION || "ap-southeast-2", // 從環境變數取得 AWS 區域，預設值可調整
      service: "es", // 針對 Amazon OpenSearch Service 使用 'es'（若為 Serverless 則用 'aoss'）
      getCredentials: () => {
        const credentialsProvider = defaultProvider();
        return credentialsProvider();
      },
    }),
    node: process.env.OPENSEARCH_URL,
  });
} else {
  esClient = new Client({
    node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
    auth: {
      username: process.env.ES_USERNAME || "elastic",
      password: process.env.ES_PASSWORD || "", // 注意：開發環境若無密碼，可調整
    },
  });
}
export { esClient };
// const awsCredentials = defaultProvider();
// export const esClient = new Client({
//   node: process.env.OPENSEARCH_URL,
//   Connection: {
//     aws: {
//       getCredentials: awsCredentials,
//     },
//   },
// });
