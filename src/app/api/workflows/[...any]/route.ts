/**
 * Workflow API Routes - Serves the refactored research workflows
 */

import { serveMany } from "@upstash/workflow/nextjs";
import { startResearchWorkflow } from "../../../../deepresearch/workflows/start-research-workflow";
import { gatherSearchQueriesWorkflow } from "../../../../deepresearch/workflows/gather-search-workflow";

// Export the workflow endpoints
export const { POST } = serveMany({
  "start-research": startResearchWorkflow,
  "gather-search-queries": gatherSearchQueriesWorkflow,
});
