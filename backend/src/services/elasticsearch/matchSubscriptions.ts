import { esClient } from "../../config/esClient.js";
import { SUBSCRIPTIONS_PERCOLATOR_INDEX } from "./elasticsearchManager.js";

export async function getMatchingSubscriptions(formattedWorkPost: any) {
  try {
    const response = await esClient.search({
      index: SUBSCRIPTIONS_PERCOLATOR_INDEX,
      body: {
        query: {
          percolate: {
            field: "query",
            document: formattedWorkPost,
          },
        },
      },
    });

    const matches = response.body.hits.hits.map((hit: any) => ({
      helperId: hit._source.helper_profile_id,
      subscriptionId: hit._source.subscription_id,
    }));

    return matches;
  } catch (error) {
    console.error("Percolator error:", error);
    return [];
  }
}
