import { Client } from "@opensearch-project/opensearch";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";

let esClient: Client;
if (process.env.NODE_ENV === "production") {
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
  });
} else {
  esClient = new Client({
    node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
  });
}
export { esClient };
