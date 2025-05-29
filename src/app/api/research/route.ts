import { getDeepresearch } from "@/db/action";
import { streamStorage } from "@/deepresearch/storage";
import { StreamEvent } from "@/deepresearch/schemas";

export const runtime = "edge";
export const dynamic = "force-dynamic"; // Required for streaming

// Types for streaming data

interface ResearchStatusRow {
  type: "research_status";
  status: "pending" | "completed" | "processing";
  timestamp: number;
  iteration: number;
}

export type ResearchEventStreamEvents = ResearchStatusRow | StreamEvent;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return new Response("Missing sessionId", { status: 400 });
  }

  try {
    // Get research data from database and events from Redis
    const research = await getDeepresearch(sessionId);
    const events = await streamStorage.getEvents(sessionId);

    const steps: ResearchEventStreamEvents[] = [
      {
        type: "research_status",
        status: research.status,
        timestamp: research.createdAt.getTime(),
        iteration: -1,
      },
      ...events,
    ];

    const response = {
      task_id: sessionId,
      status: research.status,
      events: steps,
      is_completed:
        research.status === "completed" ||
        events.some((event) => event.type === "research_completed"),
    };

    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error fetching research data:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
