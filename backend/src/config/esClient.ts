import { Client } from "@opensearch-project/opensearch";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";

let esClient: Client;
if (process.env.NODE_ENV === "production") {
  // 檢查環境變數
  const region = process.env.AWS_REGION || "ap-southeast-2";
  const nodeUrl = process.env.OPENSEARCH_URL;

  console.log("Region:", region);
  console.log("Node URL:", nodeUrl);

  if (!nodeUrl) {
    throw new Error("OPENSEARCH_URL 環境變數未設定");
  }

  console.log("=== 創建簽章客戶端 ===");
  const testCredentials = async () => {
    try {
      const credentialsProvider = defaultProvider();
      const credentials = await credentialsProvider();
      console.log("AWS Credentials loaded successfully");
      console.log(
        "Access Key ID:",
        credentials.accessKeyId?.substring(0, 10) + "..."
      );
      console.log("✓ 憑證載入成功");
      return credentials;
    } catch (error) {
      console.error("Failed to load AWS credentials:", error);
      throw error;
    }
  };
  try {
    esClient = new Client({
      ...AwsSigv4Signer({
        region: process.env.AWS_REGION || "ap-southeast-2",
        service: "es",
        getCredentials: () => {
          const credentialsProvider = defaultProvider();
          return credentialsProvider();
        },
      }),
      node: process.env.OPENSEARCH_URL,
      requestTimeout: 30000,
      sniffOnStart: false,
      ssl: {
        rejectUnauthorized: true,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("✓ 簽章器創建成功");
  } catch (error) {
    console.error("✗ 創建簽章客戶端失敗:", error);
    throw error;
  }

  testCredentials().catch(console.error);
} else {
  esClient = new Client({
    node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
  });
}
export { esClient };
