import { getDeepresearch } from "@/db/action";
import { streamStorage } from "@/deepresearch/storage";
import { StreamEvent } from "@/deepresearch/schemas";

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

  const encoder = new TextEncoder();

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

    if (research.status === "completed") {
      // Research is already completed, send all events at once

      const allData = steps.map((step) => ({
        task_id: sessionId,
        row: step,
      }));

      return new Response(
        allData.map((data) => `data: ${JSON.stringify(data)}\n\n`).join(""),
        {
          headers: {
            "Content-Type": "text/event-stream", // Still use event-stream for consistency on client
            "Cache-Control": "no-cache",
          },
        }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        let sentSteps = new Set<string>();
        let isCompleted = false;
        let isControllerClosed = false; // Flag to track if the controller has been closed

        const pollAndStream = async () => {
          try {
            if (isControllerClosed) {
              return; // Controller is closed, prevent further operations
            }
            // Fetch fresh events from Redis
            const freshEvents = await streamStorage.getEvents(sessionId);

            // Stream only new steps
            for (const newEvent of freshEvents) {
              const stepKey = `${newEvent.type}-${newEvent.timestamp}`;
              if (!sentSteps.has(stepKey)) {
                sentSteps.add(stepKey);
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      task_id: sessionId,
                      row: newEvent,
                    })}\n\n`
                  )
                );
                // Small delay between steps for better UX
                await new Promise((r) => setTimeout(r, 300));
              }
            }

            // Check if research is completed
            isCompleted = freshEvents.some(
              (event) => event.type === "research_completed"
            );

            // Continue polling if not completed
            if (!isCompleted) {
              setTimeout(pollAndStream, 2000); // Poll every 2 seconds
            } else {
              // Research completed
              if (!isControllerClosed) {
                // Check if controller is still open
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      task_status: "completed",
                      task_id: sessionId,
                    })}\n\n`
                  )
                );
                controller.close();
                isControllerClosed = true; // Set flag immediately after closing
              }
            }
          } catch (error) {
            console.error("Error during polling:", error);
            // Handle controller closed error specifically
            if (
              error instanceof TypeError &&
              error.message.includes("Controller is already closed")
            ) {
              isControllerClosed = true;
              return;
            }
            // Continue polling for other types of errors if not completed
            if (!isCompleted && !isControllerClosed) {
              setTimeout(pollAndStream, 3000);
            }
          }
        };

        // Start polling
        await pollAndStream();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error streaming research data:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
