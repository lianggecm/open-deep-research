"""
Main orchestrator for the ADK-based Deep Research process.

This module defines the `DeepResearchOrchestratorAgent`, which manages the
end-to-end research workflow, including planning, iterative data gathering,
image generation, report synthesis, and event emission for frontend updates.
It also includes the command-line entry point for invoking the research process.
"""
import time
import uuid
import asyncio
import argparse
from typing import Optional

from adk.agents import SequentialAgent, InvocationContext, BaseAgent
from adk.events import Event
from adk.callbacks import after_agent_run, before_agent_run, after_tool_run, on_agent_error # For event emitting

from .llm_agents import (
    planning_agent,
    plan_parser_agent,
    report_generator_agent,
    image_prompt_generator_agent,
    plan_summary_agent
)
from .tools import image_generation_tool, s3_upload_tool, web_search_tool # web_search_tool used by gather_agent
from .gather_agent import GatherLoopAgent
from .schemas import (
    ResearchState,
    PlanningStartedEvent, PlanningCompletedEvent,
    ReportStartedEvent, ReportGeneratingEvent, ReportGeneratedEvent,
    ResearchCompletedEvent, ErrorEvent,
    CoverGenerationStartedEvent, CoverGenerationCompletedEvent
)
from .event_service import AdkEventService
from .config import RESEARCH_CONFIG, TOGETHER_API_KEY # Assuming TOGETHER_API_KEY is globally available or passed in context

# Database interaction (conceptual - replace with actual DB client and functions)
# These would be synchronous or run in an executor if async.
def db_update_research_start(session_id: str, research_topic: str):
    print(f"DB: Updating research {session_id}, topic: {research_topic}, status: processing")
    # Actual DB call: db.update(research).set({researchTopic, researchStartedAt: new Date()}).where(eq(research.id, sessionId))
    pass

def db_complete_research(session_id: str, report: str, cover_url: str, title: str, sources: list):
    print(f"DB: Completing research {session_id}, title: {title}")
    # Actual DB call: db.update(research).set({report, coverUrl, status: "completed", title, completedAt, sources})...
    pass

def db_get_initial_user_message(session_id: str) -> str: # Used for topic if not directly provided
    print(f"DB: Getting initial message for {session_id}")
    return "Default initial user message if not found"


class DeepResearchOrchestratorAgent(SequentialAgent):
    """
    Main orchestrator for the Deep Research process using ADK.
    Mirrors the overall flow of the original `start-research-workflow.ts` from
    the TypeScript implementation.

    This agent is responsible for:
    1. Initializing the research state.
    2. Orchestrating sub-agents for planning, data gathering, image generation, and report writing.
    3. Managing the overall flow and data passing between steps via `context.state`.
    4. Ensuring appropriate events are emitted for frontend updates via `AdkEventService`.
    5. Interacting with the database for initial setup and final report storage.
    """
    def __init__(self, session_id: str, initial_topic: str, together_api_key: Optional[str] = None, **kwargs):
        """
        Initializes the DeepResearchOrchestratorAgent.

        Args:
            session_id: The unique identifier for the research session.
            initial_topic: The initial research topic provided by the user.
            together_api_key: Optional API key for TogetherAI services. Falls back to config if None.
        """
        self.session_id = session_id
        self.initial_topic = initial_topic
        self.together_api_key = together_api_key or TOGETHER_API_KEY

        # AdkEventService is used to emit events to Redis for frontend updates.
        # This provider lambda allows sub-agents to get an instance scoped to the session.
        self.event_service_provider = lambda sid: AdkEventService(session_id=sid)

        # Instantiate long-lived child agents.
        # Other agents (LLM-based) are typically stateless and defined globally in llm_agents.py
        self.gather_loop_agent = GatherLoopAgent(event_service_provider=self.event_service_provider)

        # As this agent uses a custom _run_async_impl for its logic, the sub_agents
        # list here is more for ADK's registration/awareness than for automatic sequential execution by this class.
        # Actual invocation is handled within _run_async_impl.
        super().__init__(
            name="DeepResearchOrchestratorAgent",
            description="Orchestrates the end-to-end deep research process.",
            # Define the main sequence of agents.
        # Some steps are calls to LLM agents, some are tool calls, some are custom logic.
        # For custom logic or tool calls not fitting neatly into a sub-agent,
        # we might override _run_async_impl or use a custom BaseAgent for those steps.

        # For now, we'll define agents that will be called.
        # The actual invocation will be in _run_async_impl for more control.
        super().__init__(
            name="DeepResearchOrchestratorAgent",
            description="Orchestrates the end-to-end deep research process.",
            # Sub-agents can be listed here if the sequence is rigid and fits SequentialAgent's model.
            # However, given the custom logic for DB updates, eventing, and state manipulation,
            # a custom _run_async_impl is more appropriate.
            sub_agents=[
                planning_agent,       # Step 1a: Generate plan text
                plan_parser_agent,    # Step 1b: Parse plan to get queries
                # plan_summary_agent will be called after plan_parser_agent
                # self.gather_loop_agent, # Step 2: Iterative search and gather (dynamically called)
                # image_prompt_generator_agent, # Step 3a
                # image_generation_tool,      # Step 3b (tool, not agent)
                # s3_upload_tool,             # Step 3c (tool, not agent)
                # report_generator_agent,     # Step 4
            ],
            **kwargs
        )

        # Register ADK Callbacks for global eventing if needed, or pass event_service down.
        # For simplicity, event_service is passed to children that need it.

    async def _run_async_impl(self, context: InvocationContext, **kwargs) -> Event:
        """
        Custom implementation of the research orchestration.

        This method defines the step-by-step execution of the research process,
        invoking various sub-agents and tools, managing state via `context.state`,
        and emitting events through `AdkEventService`.

        Args:
            context: The ADK InvocationContext for the current agent run.

        Returns:
            An ADK Event indicating the final status of the orchestration.
        """
        event_service = self.event_service_provider(self.session_id)

        try:
            # Initialize ResearchState in ADK's context.state.
            # This state is passed around and modified by sub-agents.
            # Key state variables include: research_topic, initial_queries, search_results,
            # all_queries, iteration, budget, etc.
            # The topic might come from initial_user_message in DB or be passed directly.
            # For this ADK agent, we assume `initial_topic` is provided.
            context.state["research_topic"] = self.initial_topic
            context.state["session_id"] = self.session_id # For easy access if needed
            context.state["together_api_key"] = self.together_api_key # For tools/agents needing it
            context.state["budget"] = RESEARCH_CONFIG["budget"]
            context.state["iteration"] = 0
            context.state["all_queries"] = []
            context.state["search_results"] = []

            db_update_research_start(self.session_id, self.initial_topic) # Update DB: research started

            # --- Step 1: Generate Initial Research Plan ---
            event_service.add_event(PlanningStartedEvent(topic=self.initial_topic, timestamp=0))

            # 1a. Generate plan text
            # Pass topic via context state for planning_agent
            context.state["user_content"] = {"topic": self.initial_topic} # Assuming LlmAgent can pick this up
            plan_text_event = await self.invoke_agent_async(context, agent_name=planning_agent.name)
            full_plan_text = plan_text_event.content.text if plan_text_event.content else ""

            # 1b. Parse plan to get initial queries
            context.state["user_content"] = {"plan_text": full_plan_text}
            parsed_plan_event = await self.invoke_agent_async(context, agent_name=plan_parser_agent.name)
            initial_queries = []
            if parsed_plan_event.content and hasattr(parsed_plan_event.content, "queries"):
                initial_queries = parsed_plan_event.content.queries

            context.state["initial_queries"] = initial_queries[:RESEARCH_CONFIG["maxQueries"]] # Cap initial queries

            # 1c. Summarize the plan (for UI event)
            context.state["user_content"] = {"full_plan_text": full_plan_text}
            plan_summary_event_adk = await self.invoke_agent_async(context, agent_name=plan_summary_agent.name)
            summarized_plan_text = plan_summary_event_adk.content.text if plan_summary_event_adk.content else "Plan summary not available."

            event_service.add_event(PlanningCompletedEvent(
                queries=context.state["initial_queries"],
                plan=summarized_plan_text, # Summarized plan for the event
                timestamp=0,
                iteration=0
            ))

            # --- Step 2: Invoke the Iterative Search Workflow (GatherLoopAgent) ---
            # GatherLoopAgent expects "initial_queries" and "budget" in context.state
            if not context.state["initial_queries"]:
                print("No initial queries generated. Skipping gather phase.")
                # Potentially emit an error or complete with minimal info
            else:
                await self.invoke_agent_async(context, agent_name=self.gather_loop_agent.name)
            # State (search_results, all_queries, iteration) is updated by GatherLoopAgent within context.state

            # --- Step 3: Generate Cover Image ---
            # 3a. Generate image prompt
            context.state["user_content"] = {"research_topic": self.initial_topic}
            img_prompt_event = await self.invoke_agent_async(context, agent_name=image_prompt_generator_agent.name)
            image_gen_prompt = img_prompt_event.content.text if img_prompt_event.content else None

            s3_cover_image_url = None
            if image_gen_prompt:
                event_service.add_event(CoverGenerationStartedEvent(prompt=image_gen_prompt, timestamp=0))

                # 3b. Generate image using the tool
                image_tool_output_event = await self.invoke_tool_async(
                    context,
                    tool_name=image_generation_tool.name,
                    user_content={"prompt": image_gen_prompt, "together_api_key": self.together_api_key}
                )
                # Assuming tool output is directly in content or get_tool_outputs()
                img_tool_res = image_tool_output_event.get_tool_outputs()[0].content if image_tool_output_event.get_tool_outputs() else {}
                generated_image_url = img_tool_res.get("image_url")

                if generated_image_url:
                    # 3c. Upload to S3 using the tool
                    object_key = f"research-covers/{self.session_id}-{uuid.uuid4()}.jpg"
                    s3_upload_event = await self.invoke_tool_async(
                        context,
                        tool_name=s3_upload_tool.name,
                        user_content={"image_url": generated_image_url, "object_key": object_key}
                    )
                    s3_tool_res = s3_upload_event.get_tool_outputs()[0].content if s3_upload_event.get_tool_outputs() else {}
                    s3_cover_image_url = s3_tool_res.get("s3_url")

                    if s3_cover_image_url:
                        event_service.add_event(CoverGenerationCompletedEvent(cover_image=s3_cover_image_url, timestamp=0))
                    else:
                        print(f"S3 upload failed: {s3_tool_res.get('error')}")
                        event_service.add_event(ErrorEvent(message=f"S3 upload failed: {s3_tool_res.get('error')}", step="s3_upload", timestamp=0))
                else:
                    print(f"Image generation failed: {img_tool_res.get('error')}")
                    event_service.add_event(ErrorEvent(message=f"Image generation failed: {img_tool_res.get('error')}", step="image_generation", timestamp=0))
            else:
                print("Image generation prompt was not created. Skipping image generation.")


            # --- Step 4: Generate Final Comprehensive Report ---
            event_service.add_event(ReportStartedEvent(timestamp=0))

            # report_generator_agent needs access to context.state.search_results and context.state.research_topic
            # ADK LlmAgent can be configured to stream if the underlying LLM and ADK support it.
            # If streaming, we'd get partial events. For now, assume one final event.
            # The original code has a loop for ReportGeneratingEvent. This would require
            # the report_generator_agent or its underlying LLM to support streaming callbacks.
            # For simplicity here, we'll emit one ReportGeneratingEvent before the final, then ReportGeneratedEvent.

            # This is a simplified way to handle progressive updates.
            # True streaming would involve the LlmAgent yielding partial responses.
            async def on_partial_report_chunk(chunk_text): # Callback for streaming
                event_service.add_event(ReportGeneratingEvent(partialReport=chunk_text, timestamp=0))

            # If report_generator_agent is set up for streaming and ADK supports passing such a callback:
            # context.callbacks = {"on_llm_stream_chunk": on_partial_report_chunk} # Conceptual

            # Prepare user_content for report_generator_agent
            # The prompt for report_generator_agent (PROMPTS['answerPrompt']) expects the topic and search results.
            # We need to format the search_results as a string similar to the original TypeScript.
            formatted_search_results_for_prompt = "\n\n".join([
                f"- Link: {sr.link}\nTitle: {sr.title}\nSummary: {sr.summary}"
                for sr in context.state.get("search_results", [])
            ])
            context.state["user_content"] = {
                "topic": context.state.get("research_topic", self.initial_topic),
                "search_results_text": formatted_search_results_for_prompt
            }
            # The instruction_provider for report_generator_agent should then use these,
            # e.g. by formatting its system prompt to include placeholders for topic and search_results_text
            # or the user message part of the LLM call will be constructed using this user_content.
            # Given PROMPTS['answerPrompt'] is a system prompt, it might be better to adjust its
            # instruction_provider to directly incorporate these from context.state if ADK supports prompt templating from context.state.
            # For now, assuming LlmAgent will form a user message like "Research Topic: {topic}\n\nSearch Results:\n{search_results_text}"
            # if its prompt is simple and user_content is structured.
            # Or, modify the report_generator_agent's instruction_provider to build the full prompt.
            # Let's assume the latter is more robust for complex prompts:
            # The LlmAgent's instruction_provider for report_generator_agent should be modified
            # to construct the full user-facing prompt using context.state.research_topic and context.state.search_results.
            # For this step, we'll assume the current setup is that user_content is sent as the user message.

            report_event = await self.invoke_agent_async(context, agent_name=report_generator_agent.name)
            final_report_text = report_event.content.text if report_event.content else "Report generation failed."

            # Simulate one intermediate ReportGeneratingEvent for now
            if len(final_report_text) > 200:
                 event_service.add_event(ReportGeneratingEvent(partialReport=final_report_text[:len(final_report_text)//2], timestamp=0))

            event_service.add_event(ReportGeneratedEvent(report=final_report_text, timestamp=0))

            # --- Step 5: Store Final Report in DB and Complete ---
            # Extract title (e.g., first H1 heading from Markdown)
            report_title = self.initial_topic # Placeholder
            lines = final_report_text.split('\n')
            for line in lines:
                if line.startswith("# "):
                    report_title = line[2:].strip()
                    break

            final_search_results_for_db = [
                {"url": sr.link, "title": sr.title} for sr in context.state.get("search_results", [])
            ]

            db_complete_research(
                session_id=self.session_id,
                report=final_report_text,
                cover_url=s3_cover_image_url or "",
                title=report_title,
                sources=final_search_results_for_db
            )

            event_service.add_event(ResearchCompletedEvent(
                finalResultCount=len(context.state.get("search_results", [])),
                totalIterations=context.state.get("iteration", 0),
                timestamp=0
            ))

            print(f"Research process completed for session {self.session_id}.")
            return Event(self.name, content={"status": "success", "report": final_report_text, "cover_url": s3_cover_image_url})

        except Exception as e:
            print(f"Error during research orchestration for session {self.session_id}: {e}")
            event_service.add_event(ErrorEvent(
                message=str(e),
                step="orchestration_error",
                timestamp=int(time.time() * 1000) # Use real timestamp for errors
            ))
            # ADK might have its own error event system. This ensures our custom event is sent.
            # Re-raise or return an error event recognized by ADK's runner.
            # For now, returning a generic error event from this agent.
            return Event(self.name, content={"status": "error", "message": str(e)}, event_type="error")


# --- Entry point for running the ADK Deep Research ---
# This would be called from the modified `startResearch.ts` (e.g., via a Python shell command or a simple API).
async def run_adk_deep_research(session_id: str, topic: str, together_api_key: Optional[str] = None):
    """
    Initializes and runs the DeepResearchOrchestratorAgent.

    This function serves as the main entry point when triggering the research
    process from an external caller (e.g., a command-line interface or another service).
    It sets up the necessary context and starts the orchestrator agent.

    Args:
        session_id: The session ID for this research task.
        topic: The research topic.
        together_api_key: Optional TogetherAI API key.

    Returns:
        The content of the final event from the agent execution, typically
        containing the status and results of the research.
    """
    print(f"Starting ADK Deep Research for session: {session_id}, topic: {topic}")

    # Create the main orchestrator agent instance
    orchestrator = DeepResearchOrchestratorAgent(
        session_id=session_id,
        initial_topic=topic,
        together_api_key=together_api_key
    )

    # Create an initial InvocationContext for the run.
    # In a full ADK application, the ADK runtime and SessionService would typically manage
    # session creation and context provision. For this script-based entry point,
    # a simplified context is created.
    # The `session` field should ideally be a proper ADK Session object if using
    # ADK's built-in session persistence. A dict is used here for simplicity in a standalone run.
    mock_session_data = {"id": session_id, "state": {}, "events": []}

    context = InvocationContext(
        invocation_id=str(uuid.uuid4()), # Unique ID for this specific run/invocation
        agent=orchestrator,              # The root agent being invoked
        session=mock_session_data,       # Mocked/simplified session data for this run
        user_content={"topic": topic},   # Initial user input for the agent
        # services: In a full ADK setup, this would be populated by the ADK runtime
        # with services like LlmService, ToolService, SessionService, etc.
        # For this direct invocation, agents are expected to instantiate or access
        # services (like AdkEventService) or clients (like httpx for TogetherAIAdapter) themselves,
        # or have them passed if necessary (like event_service_provider).
    )

    # Tool registration: ADK's runtime normally handles making tools available to agents.
    # If running agents programmatically outside a full ADK runtime, one might need
    # to ensure tools are discoverable or explicitly provide a ToolService in the context.
    # For this implementation, tools are imported and invoked by name directly within agents,
    # assuming ADK's `invoke_tool_async` can resolve them if they are globally defined
    # or part of a default toolset known to the basic ADK structures used.

    # Execute the agent
    final_event = await orchestrator.run(context) # `run` is usually the entry point for an agent

    if final_event.event_type == "error" or (isinstance(final_event.content, dict) and final_event.content.get("status") == "error"):
        print(f"ADK Deep Research for session {session_id} failed. Error: {final_event.content}")
    else:
        print(f"ADK Deep Research for session {session_id} completed successfully.")
        # final_event.content might contain the final report or status.

    return final_event.content


if __name__ == '__main__':
    import asyncio
    import argparse

    parser = argparse.ArgumentParser(description="Run ADK Deep Research Agent.")
    parser.add_argument("--session_id", required=True, help="The session ID for the research.")
    parser.add_argument("--topic", required=True, help="The research topic.")
    parser.add_argument("--together_api_key", required=False, default=None, help="Optional TogetherAI API key.")

    args = parser.parse_args()

    print(f"Command-line invocation for session {args.session_id} with topic '{args.topic}'")
    if "YOUR_TOGETHER_API_KEY" in TOGETHER_API_KEY and not args.together_api_key : # Check global config if not provided
        print("Error: TOGETHER_API_KEY not configured in config.py and not provided as argument.")
        # In a real script, you might exit here: import sys; sys.exit(1)
    else:
        try:
            # Use provided key if available, otherwise fallback to config (which run_adk_deep_research also does)
            api_key_to_use = args.together_api_key if args.together_api_key else TOGETHER_API_KEY
            if "YOUR_TOGETHER_API_KEY" in api_key_to_use: # Final check if it's still the placeholder
                 print("Error: Valid Together API key is missing.")
            else:
                asyncio.run(run_adk_deep_research(
                    session_id=args.session_id,
                    topic=args.topic,
                    together_api_key=api_key_to_use
                ))
        except Exception as e:
            print(f"Error running ADK research from command line: {e}")
            import traceback
            traceback.print_exc()
    # Example usage from command line:
    # python src/adk_deep_research/main_agent.py --session_id "cmd_test_123" --topic "Latest advancements in quantum computing" --together_api_key "sk-..."
    pass
