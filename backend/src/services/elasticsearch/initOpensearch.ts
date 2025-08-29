import { initialize } from "./elasticsearchManager.js";

async function runInitialization() {
  try {
    console.log("Starting OpenSearch initialization...");
    await initialize();
    console.log("OpenSearch initialization completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("OpenSearch initialization failed:", error);
    process.exit(1);
  }
}

runInitialization();
