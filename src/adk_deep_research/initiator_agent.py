"""
ADK Agent to initiate the Deep Research Process.

This module defines `ResearchInitiatorAgent`, which replicates the initial
setup and triggering logic similar to the original TypeScript `startResearch.ts`.
It is responsible for:
- Conceptually fetching initial research data and performing limit checks.
- Constructing the full research topic from user inputs.
- Conceptually updating the database to mark research as started.
- Invoking the main `DeepResearchOrchestratorAgent` to carry out the research.
"""
import asyncio
import time
import uuid
from typing import Optional, Dict, Any

from adk.agents import BaseAgent, InvocationContext
from adk.events import Event

# Import the main orchestrator to be invoked
from .main_agent import DeepResearchOrchestratorAgent # Assuming DeepResearchOrchestratorAgent is in main_agent.py

# --- Conceptual Database Interaction Stubs ---
# These functions simulate interactions that would typically occur with a database.
# In a real application, these would involve actual database client calls.

async def db_get_research_data_for_init(chat_id: str) -> Optional[Dict[str, Any]]:
    """
    Stub function to simulate fetching initial research data.
    Mimics `getResearch(chatId)` from the original `startResearch.ts`.
    """
    print(f"PYTHON DB STUB: Getting research data for chatId: {chat_id}")
    # This should return a dictionary matching the structure used in startResearch.ts
    # For example: { id, clerkUserId, initialUserMessage, questions, answers, status }
    # Returning a mock that allows processing to continue:
    return {
        "id": chat_id,
        "clerkUserId": f"stub_user_{chat_id}",
        "initialUserMessage": f"Initial topic for {chat_id} from Python stub",
        "questions": ["Is this a stub question?"], # Example data
        "answers": ["Yes, it is."],               # Example data
        "status": "pending"                     # Original status before processing
    }

async def db_limit_research_check(clerk_user_id: str, is_bringing_key: bool) -> bool:
    """
    Stub function to simulate the `limitResearch` check.
    """
    print(f"PYTHON DB STUB: Checking research limit for clerkUserId: {clerk_user_id}, isBringingKey: {is_bringing_key}")
    return True # Assume check always passes for this stub

async def db_update_research_for_initiation(chat_id: str, research_topic: str) -> Dict[str, Any]:
    """
    Stub function to simulate updating the research record at the start.
    Mimics the DB update in `startResearch.ts` that sets topic, startTime, and status.
    """
    current_timestamp_ms = int(time.time() * 1000)
    print(f"PYTHON DB STUB: Updating research {chat_id} with topic: '{research_topic}', status: processing, researchStartedAt: {current_timestamp_ms}")
    # Return data similar to what `updatedResearch[0]` would be in `startResearch.ts`
    return {
        "id": chat_id,
        "status": "processing",
        "createdAt": current_timestamp_ms - 10000, # Mock a past creation time
        "researchStartedAt": current_timestamp_ms,
        "researchTopic": research_topic
    }

# --- Research Initiator Agent ---

class ResearchInitiatorAgent(BaseAgent):
    """
    An ADK Agent that encapsulates the logic for initiating a deep research task.
    It prepares the necessary data (fetching from DB stubs, constructing topic)
    and then triggers the main `DeepResearchOrchestratorAgent`.

    This agent acts as a Python-native entry point to the research process,
    similar to how `startResearch.ts` functioned in the original implementation.

    Input: Expects `chatId` and optional `personalTogetherApiKey` in `context.user_content`
           or `context.state`.
    Output: An ADK Event containing metadata about the initiated research and the
            final status from the invoked orchestrator.
    """
    def __init__(self, **kwargs):
        super().__init__(
            name="ResearchInitiatorAgent",
            description="Initiates the deep research process by setting up data and invoking the main orchestrator.",
            **kwargs
        )
        # No sub-agents are defined here as _run_async_impl handles the logic.

    async def _run_async_impl(self, context: InvocationContext, **kwargs) -> Event:
        """
        The main execution logic for the ResearchInitiatorAgent.

        This method performs the following steps:
        1. Retrieves `chatId` and `personalTogetherApiKey` from the context.
        2. Calls stubbed DB functions to get initial research data and check limits.
        3. Constructs the full `researchTopic`.
        4. Calls a stubbed DB function to update the research status to 'processing'.
        5. Instantiates and runs the `DeepResearchOrchestratorAgent`, passing necessary
           parameters and sharing the session context.
        6. Returns an event with the initial research metadata and orchestration status.

        Args:
            context: The ADK InvocationContext for this agent run.
                     Expected to contain `chatId` and optionally `personalTogetherApiKey`
                     in `user_content` or `state`.

        Returns:
            An ADK Event summarizing the initiation outcome.
        """
        chat_id = context.state.get("chatId") or context.user_content.get("chatId")
        personal_together_api_key = context.state.get("personalTogetherApiKey") or \
                                    context.user_content.get("personalTogetherApiKey")

        if not chat_id:
            return Event(self.name, content={"error": "chatId is required for ResearchInitiatorAgent"}, event_type="error")

        print(f"ResearchInitiatorAgent started for chatId: {chat_id}")

        # 1. Get Research Data
        research_data = await db_get_research_data_for_init(chat_id)
        if not research_data or not research_data.get("clerkUserId"):
            msg = f"Research data or clerkUserId not found for chatId {chat_id} (DB stub)."
            print(msg)
            return Event(self.name, content={"error": msg}, event_type="error")

        # 2. Limit Check
        limit_ok = await db_limit_research_check(
            research_data["clerkUserId"],
            bool(personal_together_api_key)
        )
        if not limit_ok:
            msg = f"Research limit check failed for user {research_data['clerkUserId']} (DB stub)."
            print(msg)
            return Event(self.name, content={"error": msg}, event_type="error")

        # 3. Construct Full Research Topic
        initial_user_message = research_data.get("initialUserMessage", "")
        questions = research_data.get("questions", [])
        answers = research_data.get("answers", [])

        topic_parts = [initial_user_message]
        if answers and questions and len(answers) > 0: # Ensure questions also exist
            for i, question_text in enumerate(questions):
                if i < len(answers) and answers[i]: # Check if answer exists for the question
                    topic_parts.append(f"{i+1}. {question_text} {answers[i]}")
        research_topic = " ".join(filter(None, topic_parts)).strip()

        if not research_topic:
            msg = f"Constructed research topic is empty for chatId {chat_id}."
            print(msg)
            # Depending on requirements, this might be an error or a default topic could be used.
            return Event(self.name, content={"error": msg}, event_type="error")


        # 4. Update DB to mark research as started/processing
        updated_research_db_data = await db_update_research_for_initiation(chat_id, research_topic)

        # Store essential info from this step for the return event, if needed.
        # context.state["initial_research_metadata"] = updated_research_db_data

        print(f"Research topic for chatId {chat_id}: \"{research_topic}\"")

        # 5. Trigger the main DeepResearchOrchestratorAgent
        orchestrator = DeepResearchOrchestratorAgent(
            session_id=chat_id,
            initial_topic=research_topic,
            together_api_key=personal_together_api_key # Pass the user-provided key if any
        )

        # Create a new InvocationContext for the orchestrator.
        # It's important to manage context state carefully if sharing the same context object.
        # Here, we use the same session (and thus its state can be shared and evolved),
        # but the agent and invocation ID are specific to the orchestrator's run.
        orchestrator_context = InvocationContext(
            invocation_id=f"{context.invocation_id}_orchestrator_{uuid.uuid4()}",
            agent=orchestrator,
            session=context.session, # Share the same session object
            user_content={"topic": research_topic} # Initial user_content for the orchestrator
            # services from parent context could be passed if ADK runtime manages them
        )

        final_orchestration_event_content = None
        try:
            print(f"Invoking DeepResearchOrchestratorAgent for {chat_id}...")
            # The actual research process happens here. This will block until completion.
            orchestration_result_event = await orchestrator.run(orchestrator_context)
            final_orchestration_event_content = orchestration_result_event.content
            print(f"DeepResearchOrchestratorAgent for {chat_id} completed.")
        except Exception as e:
            print(f"Error during DeepResearchOrchestratorAgent execution: {e}")
            # Log detailed error, potentially update DB to error status for researchId
            import traceback
            traceback.print_exc()
            return Event(self.name, content={"error": f"Main research orchestration failed: {str(e)}"}, event_type="error")

        # 6. Return information similar to what startResearch.ts returned
        return_content = {
            "message": "Research initiation complete, main orchestration invoked.",
            "researchId": updated_research_db_data.get("id"),
            "status": updated_research_db_data.get("status"), # Should be 'processing'
            "createdAt": updated_research_db_data.get("createdAt"),
            "researchTopic": research_topic,
            "orchestrator_final_status": final_orchestration_event_content.get("status") if final_orchestration_event_content else "unknown"
        }
        return Event(self.name, content=return_content)

# --- Example Main Block for Direct Testing ---
async def _test_initiator_agent():
    """For testing the ResearchInitiatorAgent directly."""
    test_chat_id = f"test_init_{int(time.time())}"
    test_api_key = "sk-fakekey123" # Example API key

    initiator_agent = ResearchInitiatorAgent()

    # ADK sessions are typically managed by a SessionService.
    # For a direct test, we create a dictionary that mimics a session structure.
    # The state within this session_data can be modified by agents.
    session_data = {"id": test_chat_id, "state": {}, "events": []}

    test_context = InvocationContext(
        invocation_id=f"initiator_test_run_{uuid.uuid4()}",
        agent=initiator_agent,
        session=session_data,
        user_content={ # This is what the initiator agent expects as input
            "chatId": test_chat_id,
            "personalTogetherApiKey": test_api_key
        }
    )

    print(f"\n--- Running ResearchInitiatorAgent Test for chatId: {test_chat_id} ---")
    result_event = await initiator_agent.run(test_context)

    print("\n--- ResearchInitiatorAgent Final Event Content ---")
    import json
    print(json.dumps(result_event.content, indent=2))

    print("\n--- Final Session State (after full run) ---")
    print(json.dumps(session_data["state"], indent=2))


if __name__ == "__main__":
    # This example assumes that the necessary API keys (TOGETHER_API_KEY, etc.) are
    # available in config.py or as environment variables for LiteLLM/Tools to pick up,
    # as DeepResearchOrchestratorAgent and its children will use them.
    # The `personalTogetherApiKey` is an override passed through.

    # A crucial part for this test to fully run is that TOGETHER_API_KEY in config.py
    # must be a valid key if `personalTogetherApiKey` is not overriding it,
    # or if sub-agents/tools default to it.
    # For this test, we pass one explicitly.

    # Also, REDIS_URL and REDIS_TOKEN in config.py must be valid for AdkEventService to work.
    # If Redis is not available, AdkEventService will raise an error.
    # Consider mocking AdkEventService for tests not needing Redis.

    print("Starting ResearchInitiatorAgent test run...")
    print("NOTE: This test will attempt to run the full DeepResearchOrchestratorAgent.")
    print("Ensure all necessary API keys and service configurations (Redis, etc.) are set.")
    asyncio.run(_test_initiator_agent())
